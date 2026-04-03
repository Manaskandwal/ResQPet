const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Notification = require('../models/Notification');
const { getIo, emitRescueUpdate } = require('../config/socket');
const { SERVICE_FEE } = require('../config/constants');

// Active timeout trackers
const activeTimeouts = new Map(); // rescueId -> { interval, startedAt }

const PING_EXPIRY_MS = 20 * 60 * 1000;        // 20 min
const STALE_TIMEOUT_MS = 30 * 60 * 1000;       // 30 min
const PING_INTERVAL_MS = 10 * 60 * 1000;       // 10 min between pings

/**
 * Start the dispatch lifecycle for a rescue that needs an ambulance.
 * This replaces the cron-based polling with precise per-rescue timeouts.
 */
const startAmbulanceDispatch = async (rescueId) => {
    const rescue = await RescueRequest.findById(rescueId);
    if (!rescue || rescue.status !== 'ambulance_pinged') {
        console.log(`[AmbulanceDispatch] Rescue ${rescueId} is no longer in ambulance_pinged state. Skipping.`);
        return;
    }

    console.log(`[AmbulanceDispatch] Starting dispatch lifecycle for rescue ${rescueId}`);

    const hasActivePings = Array.isArray(rescue.activeAmbulancePings) && rescue.activeAmbulancePings.length > 0;

    // Ping the first available ambulance immediately when the rescue has no active pings.
    if (!hasActivePings) {
        const didQueuePing = await pingNearestAmbulance(rescue);
        if (didQueuePing) {
            await rescue.save();
        }
    }

    // Schedule recurring checks for this specific rescue
    scheduleRescueChecks(rescueId);
};

/**
 * Schedule periodic checks for a specific rescue (replaces cron polling).
 * Checks every 60s for expiry/stale conditions.
 */
const scheduleRescueChecks = (rescueId) => {
    stopRescueChecks(rescueId);

    const checkInterval = setInterval(async () => {
        try {
            const rescue = await RescueRequest.findById(rescueId);
            if (!rescue) {
                console.log(`[AmbulanceDispatch] Rescue ${rescueId} deleted. Stopping checks.`);
                stopRescueChecks(rescueId);
                return;
            }

            // If rescue is no longer in ambulance_pinged, stop checking
            if (rescue.status !== 'ambulance_pinged') {
                console.log(`[AmbulanceDispatch] Rescue ${rescueId} status changed to ${rescue.status}. Stopping checks.`);
                stopRescueChecks(rescueId);
                return;
            }

            const now = new Date();
            const twentyMinutesAgo = new Date(now.getTime() - PING_EXPIRY_MS);
            const tenMinutesAgo = new Date(now.getTime() - PING_INTERVAL_MS);
            const thirtyMinutesAgo = new Date(now.getTime() - STALE_TIMEOUT_MS);

            let isModified = false;

            // 1. Expire old pings
            const expiredPings = rescue.activeAmbulancePings.filter(ping => ping.pingedAt <= twentyMinutesAgo);
            if (expiredPings.length > 0) {
                expiredPings.forEach(expiredPing => {
                    if (!rescue.pingRejectors.includes(expiredPing.ambulanceId)) {
                        rescue.pingRejectors.push(expiredPing.ambulanceId);
                    }
                });
                rescue.activeAmbulancePings = rescue.activeAmbulancePings.filter(ping => ping.pingedAt > twentyMinutesAgo);
                isModified = true;
                console.log(`[AmbulanceDispatch] Expired ${expiredPings.length} pings for rescue ${rescueId}`);
            }

            // 2. Check for total timeout (30 min or 3+ rejects)
            if (rescue.pingRejectors.length >= 3 || rescue.createdAt <= thirtyMinutesAgo) {
                console.log(`[AmbulanceDispatch] Rescue ${rescueId} stalled. Handling fallback.`);
                await handleStalledRescue(rescue);
                stopRescueChecks(rescueId);
                return;
            }

            // 3. Ping new ambulance if needed
            const currentActivePings = rescue.activeAmbulancePings;
            let needsNewPing = false;

            if (currentActivePings.length === 0) {
                needsNewPing = true;
            } else {
                const newestPing = [...currentActivePings].sort((a, b) => b.pingedAt - a.pingedAt)[0];
                if (newestPing && newestPing.pingedAt <= tenMinutesAgo) {
                    needsNewPing = true;
                    console.log(`[AmbulanceDispatch] Most recent ping for rescue ${rescueId} is >10 min old. Pinging next ambulance.`);
                }
            }

            if (needsNewPing) {
                const didQueuePing = await pingNearestAmbulance(rescue);
                isModified = didQueuePing || isModified;
            }

            if (isModified) {
                await rescue.save();
            }
        } catch (error) {
            console.error(`[AmbulanceDispatch] Error checking rescue ${rescueId}:`, error.message);
        }
    }, 60 * 1000); // Check every 60 seconds

    activeTimeouts.set(rescueId, { interval: checkInterval, startedAt: new Date() });
    console.log(`[AmbulanceDispatch] Scheduled checks for rescue ${rescueId}`);
};

/**
 * Stop periodic checks for a rescue.
 */
const stopRescueChecks = (rescueId) => {
    if (activeTimeouts.has(rescueId)) {
        clearInterval(activeTimeouts.get(rescueId).interval);
        activeTimeouts.delete(rescueId);
        console.log(`[AmbulanceDispatch] Stopped checks for rescue ${rescueId}`);
    }
};

/**
 * Find and ping the nearest available ambulance.
 */
const pingNearestAmbulance = async (rescue) => {
    const excludeIds = [
        ...rescue.pingRejectors,
        ...rescue.activeAmbulancePings.map(p => p.ambulanceId)
    ];

    const nearestAmbulance = await User.findOne({
        role: 'ambulance',
        isGovernment: false,
        isAvailable: true,
        _id: { $nin: excludeIds }
    });

    if (nearestAmbulance) {
        rescue.activeAmbulancePings.push({
            ambulanceId: nearestAmbulance._id,
            pingedAt: new Date()
        });

        try {
            const io = getIo();
            io.to(nearestAmbulance._id.toString()).emit('new_rescue_ping', {
                rescueRequestId: rescue._id,
                lat: rescue.location.lat,
                lng: rescue.location.lng,
                message: "New Emergency Pickup Request Nearby!"
            });
            console.log(`[AmbulanceDispatch] Pinged ambulance ${nearestAmbulance._id} for rescue ${rescue._id}`);
        } catch (socketErr) {
            console.error('[AmbulanceDispatch] Socket error emitting ping:', socketErr.message);
        }
        return true;
    } else {
        console.log(`[AmbulanceDispatch] No available ambulances to ping for rescue ${rescue._id}`);
    }

    return false;
};

/**
 * Handle a stalled rescue (no ambulance responded in time).
 */
const handleStalledRescue = async (rescue) => {
    const now = new Date();

    // Check if hospital is already assigned (Scenario 4B)
    if (rescue.assignedHospital) {
        console.log(`[AmbulanceDispatch] Hospital ${rescue.assignedHospital} assigned. Falling back to manual transport.`);

        rescue.status = 'manual_transport_accepted';
        rescue.adminNotes = (rescue.adminNotes || '') + '\n[System] Auto-changed to Manual Transport: No ambulance responded.';
        rescue.statusLogs.push({
            status: 'manual_transport_accepted',
            message: 'No ambulance available. Hospital has accepted the case. Please arrange manual transport.',
            timestamp: now
        });

        await rescue.save();
        emitRescueUpdate(rescue._id, 'manual_transport_accepted', {
            message: 'No ambulance available. Please arrange manual transport to the assigned hospital.'
        });

        const targetUser = rescue.assignedNGO || rescue.user;
        await Notification.create({
            recipient: targetUser,
            title: 'Manual Transport Required',
            message: `No ambulance was found for your rescue. Please transport the animal manually to the assigned hospital.`,
            type: 'status_update',
            rescueRequest: rescue._id
        });
        return;
    }

    // No hospital either - close the case (Scenario 4C)
    console.log(`[AmbulanceDispatch] No hospital or transport available. Closing rescue ${rescue._id}.`);

    if (rescue.depositDeducted && !rescue.depositRefunded) {
        const updatedRescue = await RescueRequest.findOneAndUpdate(
            { _id: rescue._id, depositDeducted: true, depositRefunded: false },
            { $set: { depositRefunded: true } },
            { new: true }
        );

        if (updatedRescue) {
            const reporter = await User.findById(rescue.user);
            if (reporter) {
                const refundAmount = Number(rescue.depositAmount || SERVICE_FEE);
                if (!isNaN(refundAmount) && refundAmount > 0) {
                    reporter.walletBalance += refundAmount;
                    await reporter.save();

                    await WalletTransaction.create({
                        user: reporter._id,
                        amount: refundAmount,
                        type: 'refund',
                        description: `Refund: No ambulance available for Case ID: ${rescue._id}`,
                        balanceAfter: reporter.walletBalance,
                        rescueRequest: rescue._id
                    });

                    await Notification.create({
                        recipient: reporter._id,
                        title: 'Ambulance Request Unresolved',
                        message: `No ambulance was available. A refund of ₹${refundAmount} has been credited to your wallet.`,
                        type: 'wallet_refund',
                        rescueRequest: rescue._id
                    });
                }
            }
        }
    }

    rescue.status = 'closed_unresolved';
    rescue.outcome = 'closed_unresolved';
    rescue.closedAt = now;
    rescue.adminNotes = (rescue.adminNotes || '') + '\n[System] Auto-closed: No ambulance responded within SLA.';
    rescue.statusLogs.push({
        status: 'closed_unresolved',
        message: 'System timeout: No ambulance accepted within the SLA period.',
        timestamp: now
    });

    await rescue.save();
    emitRescueUpdate(rescue._id, 'closed_unresolved', { message: 'No ambulance accepted the request within the timeout.' });
};

/**
 * Called when a rescue enters ambulance_pinged status.
 * This is the entry point that replaces the cron scan.
 */
const onRescueNeedsAmbulance = async (rescueId) => {
    console.log(`[AmbulanceDispatch] Rescue ${rescueId} needs an ambulance. Starting event-driven dispatch.`);
    await startAmbulanceDispatch(rescueId);
};

/**
 * Rebuild in-memory dispatch tracking after a server restart.
 */
const initializeActiveDispatches = async () => {
    const rescues = await RescueRequest.find({ status: 'ambulance_pinged' }).select('_id activeAmbulancePings');
    console.log(`[AmbulanceDispatch] Rehydrating ${rescues.length} active dispatches from the database.`);

    for (const rescue of rescues) {
        await startAmbulanceDispatch(rescue._id);
    }
};

/**
 * Cleanup: stop all active checks (called on graceful shutdown).
 */
const cleanup = () => {
    console.log(`[AmbulanceDispatch] Cleaning up ${activeTimeouts.size} active dispatches.`);
    for (const [rescueId, data] of activeTimeouts.entries()) {
        clearInterval(data.interval);
    }
    activeTimeouts.clear();
};

/**
 * Get active dispatch count (for health checks/monitoring).
 */
const getActiveDispatchCount = () => activeTimeouts.size;

module.exports = {
    onRescueNeedsAmbulance,
    initializeActiveDispatches,
    stopRescueChecks,
    cleanup,
    getActiveDispatchCount,
};
