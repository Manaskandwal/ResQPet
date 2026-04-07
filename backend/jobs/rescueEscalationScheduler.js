const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Donation = require('../models/Donation');
const { SERVICE_FEE } = require('../config/constants');
const { emitRescueUpdate } = require('../config/socket');

// In-memory map: rescueId → { t20: Timeout, t45: Timeout }
const pendingTimers = new Map();

const TWENTY_MINUTES = 20 * 60 * 1000;
const FORTY_FIVE_MINUTES = 45 * 60 * 1000;
const MIN_PLATFORM_FUND = 20000;

const mark20MinTimerCompleted = (rescueId) => {
    const key = rescueId.toString();
    const entry = pendingTimers.get(key);
    if (!entry) return;

    entry.t20 = null;
    if (!entry.t45) {
        pendingTimers.delete(key);
        return;
    }

    pendingTimers.set(key, entry);
};

// ─── Refund Helper (same logic as the old cron) ─────────────────────────────
const maybeRefundUnresolvedFee = async (rescue) => {
    if (!rescue.depositDeducted || rescue.depositRefunded || rescue.workStartedAt) {
        return;
    }

    const updatedRescue = await RescueRequest.findOneAndUpdate(
        { _id: rescue._id, depositDeducted: true, depositRefunded: false },
        { $set: { depositRefunded: true } },
        { new: true }
    );

    if (!updatedRescue) return;

    const user = await User.findById(rescue.user);
    if (!user) return;

    const refundAmount = Number(rescue.depositAmount || SERVICE_FEE);
    if (isNaN(refundAmount) || refundAmount <= 0) return;

    user.walletBalance += refundAmount;
    await user.save();

    await WalletTransaction.create({
        user: user._id,
        amount: refundAmount,
        type: 'refund',
        description: `Rs ${refundAmount} service fee refunded for unresolved rescue #${rescue._id}`,
        rescueRequest: rescue._id,
        balanceAfter: user.walletBalance,
    });
};

// ─── 20-Minute Escalation Check ──────────────────────────────────────────────
const execute20MinCheck = async (rescueId) => {
    mark20MinTimerCompleted(rescueId);
    try {
        const rescue = await RescueRequest.findById(rescueId);
        if (!rescue) return;
        if (rescue.status !== 'pending') return;

        rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];

        if (!rescue.willingToGo) {
            rescue.status = 'closed_unresolved';
            rescue.closedAt = new Date();
            rescue.outcome = 'closed_unresolved';
            rescue.statusLogs.push({
                status: 'closed_unresolved',
                message: 'No NGO responded in time. Case closed because no one was available to coordinate transport.',
            });
            await maybeRefundUnresolvedFee(rescue);
            emitRescueUpdate(rescue._id, rescue.status, { message: 'Case closed. No one available to coordinate.' });
        } else if (rescue.willingToPay) {
            rescue.status = 'hospital_broadcasted';
            rescue.escalatedAt = new Date();
            rescue.fundSource = 'user';
            rescue.statusLogs.push({
                status: 'hospital_broadcasted',
                message: 'No NGO responded in time. Case escalated to hospitals (User willing to pay).',
            });
            emitRescueUpdate(rescue._id, rescue.status, { message: 'No NGO responded. Case escalated to hospitals.' });
        } else {
            const platformFundsAgg = await Donation.aggregate([
                { $match: { isGeneral: true, status: { $in: ['successful', 'active'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalPlatformFunds = platformFundsAgg[0]?.total || 0;

            if (totalPlatformFunds >= MIN_PLATFORM_FUND) {
                rescue.status = 'hospital_broadcasted';
                rescue.escalatedAt = new Date();
                rescue.fundSource = 'platform';
                rescue.statusLogs.push({
                    status: 'hospital_broadcasted',
                    message: 'No NGO responded in time. Case escalated to hospitals (Platform funded).',
                });
                emitRescueUpdate(rescue._id, rescue.status, { message: 'No NGO responded. Case escalated to hospitals.' });
            } else {
                rescue.status = 'closed_unresolved';
                rescue.closedAt = new Date();
                rescue.outcome = 'closed_unresolved';
                rescue.statusLogs.push({
                    status: 'closed_unresolved',
                    message: 'No NGO responded in time. Case closed due to insufficient platform funds and user not paying.',
                });
                await maybeRefundUnresolvedFee(rescue);
                emitRescueUpdate(rescue._id, rescue.status, { message: 'Case closed. Insufficient funds to escalate.' });
            }
        }

        await rescue.save();
        console.log(`[EscalationScheduler] 20-min check completed for rescue ${rescueId}`);
    } catch (error) {
        console.error(`[EscalationScheduler] Error in 20-min check for rescue ${rescueId}:`, error.message);
    }
};

// ─── 45-Minute Hard Close ────────────────────────────────────────────────────
const execute45MinClose = async (rescueId) => {
    pendingTimers.delete(rescueId.toString());
    try {
        const rescue = await RescueRequest.findById(rescueId);
        if (!rescue) return;
        if (['closed_unresolved', 'completed', 'cancelled'].includes(rescue.status)) return;

        rescue.status = 'closed_unresolved';
        rescue.closedAt = new Date();
        rescue.outcome = 'closed_unresolved';
        rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
        rescue.statusLogs.push({
            status: 'closed_unresolved',
            message: 'No responder accepted the case within 45 minutes. Case closed unresolved.',
        });
        await maybeRefundUnresolvedFee(rescue);
        emitRescueUpdate(rescue._id, rescue.status, { message: 'Case closed unresolved after 45 minutes.' });
        await rescue.save();
        console.log(`[EscalationScheduler] 45-min close completed for rescue ${rescueId}`);
    } catch (error) {
        console.error(`[EscalationScheduler] Error in 45-min close for rescue ${rescueId}:`, error.message);
    }
};

// ─── Public: Schedule timers for a new rescue ────────────────────────────────
const scheduleRescueEscalation = (rescueId, rescueCreatedAt) => {
    const now = Date.now();
    const createdAt = new Date(rescueCreatedAt).getTime();
    const delay20 = TWENTY_MINUTES - (now - createdAt);
    const delay45 = FORTY_FIVE_MINUTES - (now - createdAt);

    // Cancel any existing timers for this rescue (safety net)
    cancelRescueEscalation(rescueId);

    const entry = { t20: null, t45: null };

    if (delay20 <= 0) {
        // Already past 20 min — fire immediately
        setImmediate(() => execute20MinCheck(rescueId));
        console.log(`[EscalationScheduler] 20-min check firing immediately for rescue ${rescueId} (overdue by ${Math.abs(delay20) / 1000}s)`);
    } else {
        entry.t20 = setTimeout(() => execute20MinCheck(rescueId), delay20);
        console.log(`[EscalationScheduler] 20-min timer scheduled for rescue ${rescueId} (fires in ${delay20 / 1000}s)`);
    }

    if (delay45 <= 0) {
        // Already past 45 min — fire immediately
        setImmediate(() => execute45MinClose(rescueId));
        console.log(`[EscalationScheduler] 45-min close firing immediately for rescue ${rescueId} (overdue by ${Math.abs(delay45) / 1000}s)`);
    } else {
        entry.t45 = setTimeout(() => execute45MinClose(rescueId), delay45);
        console.log(`[EscalationScheduler] 45-min timer scheduled for rescue ${rescueId} (fires in ${delay45 / 1000}s)`);
    }

    if (entry.t20 || entry.t45) {
        pendingTimers.set(rescueId.toString(), entry);
    }
};

// ─── Public: Cancel timers when rescue is no longer pending ──────────────────
const cancelRescueEscalation = (rescueId) => {
    const key = rescueId.toString();
    const entry = pendingTimers.get(key);
    if (entry) {
        if (entry.t20) clearTimeout(entry.t20);
        if (entry.t45) clearTimeout(entry.t45);
        pendingTimers.delete(key);
        console.log(`[EscalationScheduler] Cancelled timers for rescue ${key}`);
    }
};

// ─── Public: Rehydrate on server startup ─────────────────────────────────────
const rehydrateEscalationJobs = async () => {
    try {
        const pendingRescues = await RescueRequest.find({ 
            status: { $in: ['pending', 'hospital_broadcasted'] } 
        }).select('_id createdAt status');
        let processed = 0;
        let rescheduled = 0;

        for (const rescue of pendingRescues) {
            const now = Date.now();
            const createdAt = rescue.createdAt.getTime();
            const age = now - createdAt;

            if (age >= FORTY_FIVE_MINUTES) {
                // Already past 45 min — close immediately
                await execute45MinClose(rescue._id);
                processed++;
            } else if (age >= TWENTY_MINUTES) {
                // Past 20 min but not 45
                // If still pending, run escalation now; if already broadcasted, keep current state.
                if (rescue.status === 'pending') {
                    await execute20MinCheck(rescue._id);
                }

                // Re-fetch and keep 45-min hard close active for non-terminal states.
                const current = await RescueRequest.findById(rescue._id).select('_id status');
                if (current && ['pending', 'hospital_broadcasted'].includes(current.status)) {
                    const remaining45 = FORTY_FIVE_MINUTES - age;
                    if (remaining45 > 0) {
                        const entry = { t20: null, t45: setTimeout(() => execute45MinClose(rescue._id), remaining45) };
                        pendingTimers.set(rescue._id.toString(), entry);
                        console.log(`[EscalationScheduler] 45-min timer rescheduled for rescue ${rescue._id} (fires in ${remaining45 / 1000}s)`);
                    }
                }
                processed++;
            } else {
                // Still within window — reschedule both timers
                scheduleRescueEscalation(rescue._id, rescue.createdAt);
                rescheduled++;
            }
        }

        console.log(`[EscalationScheduler] Rehydration complete: ${processed} processed immediately, ${rescheduled} rescheduled, ${pendingTimers.size} active timers`);
    } catch (error) {
        console.error('[EscalationScheduler] Rehydration error:', error.message);
    }
};

module.exports = { scheduleRescueEscalation, cancelRescueEscalation, rehydrateEscalationJobs };
