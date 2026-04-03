const cron = require('node-cron');
const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Notification = require('../models/Notification');
const { getIo, emitRescueUpdate } = require('../config/socket');
const { SERVICE_FEE } = require('../config/constants');

// Helper to calculate distance in meters (haversine formula simplified for testing or use GeoJSON)
// MongoDB provides a proper geo-spatial query: $near. We will use that in the actual query.

const startAmbulanceDispatchCron = () => {
    console.log('[Cron] Starting ambulance dispatch cron job (every minute check)...');

    cron.schedule('* * * * *', async () => {
        try {
            console.log('[Cron] Running ambulance dispatch check at:', new Date().toISOString());

            const now = new Date();
            const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
            const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);

            // Find all requests waiting for ambulance acceptance
            const pendingRequests = await RescueRequest.find({
                status: 'ambulance_pinged'
            });

            if (pendingRequests.length === 0) {
                return;
            }

            console.log(`[Cron] Checking ${pendingRequests.length} requests in 'ambulance_pinged' state.`);

            for (let rescue of pendingRequests) {
                let isModified = false;

                // 1. Check for expired pings (older than 20 minutes)
                const expiredPings = rescue.activeAmbulancePings.filter(ping => ping.pingedAt <= twentyMinutesAgo);

                if (expiredPings.length > 0) {
                    expiredPings.forEach(expiredPing => {
                        // Move to rejected list
                        if (!rescue.pingRejectors.includes(expiredPing.ambulanceId)) {
                            rescue.pingRejectors.push(expiredPing.ambulanceId);
                        }
                    });

                    // Remove expired from active
                    rescue.activeAmbulancePings = rescue.activeAmbulancePings.filter(ping => ping.pingedAt > twentyMinutesAgo);
                    isModified = true;
                    console.log(`[Cron] Expired ${expiredPings.length} pings for rescue ${rescue._id} (20 min passed)`);
                }

                // --- 1.5 Timeout / Scenario 4B Fallback / Refund Logic ---
                const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
                if (rescue.pingRejectors.length >= 3 || rescue.createdAt <= thirtyMinutesAgo) {
                    console.log(`[Cron] Rescue ${rescue._id} stalled (3+ rejects or 30min passed). Checking for Manual Fallback.`);
                    
                    // Refund the deposit if not already refunded - ATOMIC IDEMPOTENCY GUARD
                    // (Note: If moving to manual_transport, we still refund the search fee if applicable, 
                    // or keep it if it was a booking fee. In Phase 1, it's a deposit that we refund on success. 
                    // If no ambulance found, we keep the case open but inform user/NGO).
                    
                    // Check if a hospital is already assigned (Scenario 4B)
                    if (rescue.assignedHospital) {
                        console.log(`[Cron] Hospital ${rescue.assignedHospital} is assigned. Falling back to Manual Transport.`);
                        
                        rescue.status = 'manual_transport_accepted';
                        rescue.adminNotes = (rescue.adminNotes || '') + '\n[System] Automatically changed to Manual Transport: No ambulance responded.';
                        
                        rescue.statusLogs.push({
                            status: 'manual_transport_accepted',
                            message: 'No ambulance available. Hospital has already accepted the case. Please arrange manual transport to the hospital.',
                            timestamp: new Date()
                        });

                        await rescue.save();
                        emitRescueUpdate(rescue._id, 'manual_transport_accepted', { 
                            message: 'No ambulance available. Please arrange manual transport to the assigned hospital.' 
                        });

                        // Create notification for NGO/User
                        const targetUser = rescue.assignedNGO || rescue.user;
                        await Notification.create({
                            recipient: targetUser,
                            title: 'Manual Transport Required',
                            message: `No ambulance was found for your rescue. Please transport the animal manually to the assigned hospital.`,
                            type: 'status_update',
                            rescueRequest: rescue._id
                        });

                        continue;
                    }

                    // Otherwise, if no hospital either or coordination refused, close it (Scenario 4C)
                    console.log(`[Cron] No hospital or no transport available. Closing case ${rescue._id}.`);

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
                                        message: `We couldn't find an available ambulance. A refund of ₹${refundAmount} has been credited to your wallet.`,
                                        type: 'wallet_refund',
                                        rescueRequest: rescue._id
                                    });
                                }
                            }
                        }
                    }

                    rescue.status = 'closed_unresolved';
                    rescue.outcome = 'closed_unresolved';
                    rescue.closedAt = new Date();
                    rescue.adminNotes = (rescue.adminNotes || '') + '\n[System] Automatically closed: No ambulance responded.';
                    
                    rescue.statusLogs.push({
                        status: 'closed_unresolved',
                        message: 'System timeout: No ambulance accepted the request within the SLA period.',
                        timestamp: new Date()
                    });

                    await rescue.save();
                    emitRescueUpdate(rescue._id, 'closed_unresolved', { message: 'System timeout: No ambulance accepted the request.' });
                    continue; 
                }

                // 2. Decide if we need to ping a NEW ambulance
                // We ping a new ambulance if there are NO active pings, OR if the MOST RECENT ping is > 10 mins old
                let currentActivePings = rescue.activeAmbulancePings;

                let needsNewPing = false;
                if (currentActivePings.length === 0) {
                    needsNewPing = true;
                } else {
                    // Sort active pings by descending date (newest first)
                    const newestPing = currentActivePings.sort((a, b) => b.pingedAt - a.pingedAt)[0];
                    if (newestPing && newestPing.pingedAt <= tenMinutesAgo) {
                        needsNewPing = true;
                        console.log(`[Cron] Most recent ping for rescue ${rescue._id} is > 10 min old. Staggering next dispatch.`);
                    }
                }

                if (needsNewPing) {
                    // 3. Find nearest available private ambulance that hasn't rejected or isn't already active
                    const excludeIds = [
                        ...rescue.pingRejectors,
                        ...currentActivePings.map(p => p.ambulanceId)
                    ];

                    const nearestAmbulance = await User.findOne({
                        role: 'ambulance',
                        isGovernment: false,
                        isAvailable: true,
                        _id: { $nin: excludeIds }
                    }); // Note: Phase 2 should use Geo-spatial query: { location: { $near: ... } }

                    if (nearestAmbulance) {
                        console.log(`[Cron] Found next nearest ambulance (${nearestAmbulance._id}) for rescue ${rescue._id}`);

                        rescue.activeAmbulancePings.push({
                            ambulanceId: nearestAmbulance._id,
                            pingedAt: new Date()
                        });
                        isModified = true;

                        // Emit Socket event to this specific ambulance room
                        try {
                            const io = getIo();
                            io.to(nearestAmbulance._id.toString()).emit('new_rescue_ping', {
                                rescueRequestId: rescue._id,
                                lat: rescue.location.lat,
                                lng: rescue.location.lng,
                                message: "New Emergency Pickup Request Nearby!"
                            });
                        } catch (socketErr) {
                            console.error('[Cron] Socket error emitting new ping:', socketErr.message);
                        }
                    } else {
                        console.log(`[Cron] No available ambulances found to ping for rescue ${rescue._id}. Waiting for next cycle.`);
                    }
                }

                if (isModified) {
                    await rescue.save();
                }
            }

        } catch (error) {
            console.error('[Cron] Ambulance dispatch cron job encountered an error:', error.message);
        }
    });

    console.log('[Cron] Ambulance dispatch cron job scheduled successfully.');
};

module.exports = { startAmbulanceDispatchCron };
