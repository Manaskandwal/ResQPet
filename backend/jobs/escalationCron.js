const cron = require('node-cron');
const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Donation = require('../models/Donation');
const { SERVICE_FEE } = require('../config/constants');
const { emitRescueUpdate } = require('../config/socket');

const maybeRefundUnresolvedFee = async (rescue) => {
    if (!rescue.depositDeducted || rescue.depositRefunded || rescue.workStartedAt) {
        return;
    }

    // Atomic idempotency guard
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

const startEscalationCron = () => {
    console.log('[Cron] Starting escalation cron job (every minute check)...');

    let isRunning = false;

    cron.schedule('* * * * *', async () => {
        if (isRunning) {
            console.warn('[Cron] Escalation job skipped - previous instance still running');
            return;
        }

        isRunning = true;
        try {
            const now = Date.now();
            const twentyMinutesAgo = new Date(now - 20 * 60 * 1000);
            const fortyFiveMinutesAgo = new Date(now - 45 * 60 * 1000);

            // Calculate total platform funds
            const platformFundsAgg = await Donation.aggregate([
                { $match: { isGeneral: true, status: { $in: ['successful', 'active'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalPlatformFunds = platformFundsAgg[0]?.total || 0;
            const MIN_PLATFORM_FUND = 20000;

            const stalePending = await RescueRequest.find({
                status: 'pending',
                createdAt: { $lte: twentyMinutesAgo },
            });

            await Promise.all(stalePending.map(async (rescue) => {
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
                } else if (totalPlatformFunds >= MIN_PLATFORM_FUND) {
                    rescue.status = 'hospital_broadcasted';
                    rescue.escalatedAt = new Date();
                    rescue.fundSource = 'platform';
                    rescue.statusLogs.push({
                        status: 'hospital_broadcasted',
                        message: 'No NGO responded in time. Case escalated to hospitals (Platform funded).',
                    });
                    emitRescueUpdate(rescue._id, rescue.status, { message: 'No NGO responded. Case escalated to hospitals.' });
                } else {
                    // willingToGo is true, but willingToPay is false, AND platform funds are insufficient
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

                await rescue.save();
            }));

            const staleUnresolved = await RescueRequest.find({
                status: { $in: ['pending', 'hospital_broadcasted'] },
                createdAt: { $lte: fortyFiveMinutesAgo },
            });

            await Promise.all(staleUnresolved.map(async (rescue) => {
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
            }));
        } catch (error) {
            console.error('[Cron] Escalation cron job encountered an error:', error.message);
        } finally {
            isRunning = false;
        }
    });

    console.log('[Cron] Escalation cron job scheduled successfully.');
};

module.exports = { startEscalationCron };
