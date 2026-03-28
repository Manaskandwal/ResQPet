const cron = require('node-cron');
const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
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

    cron.schedule('* * * * *', async () => {
        try {
            const now = Date.now();
            const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
            const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);

            const stalePending = await RescueRequest.find({
                status: 'pending',
                createdAt: { $lte: fiveMinutesAgo },
            });

            await Promise.all(stalePending.map(async (rescue) => {
                rescue.status = 'hospital_broadcasted';
                rescue.escalatedAt = new Date();
                rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
                rescue.statusLogs.push({
                    status: 'hospital_broadcasted',
                    message: 'No NGO responded in time. Case escalated to hospitals.',
                });
                emitRescueUpdate(rescue._id, rescue.status, { message: 'No NGO responded in time. Case escalated to hospitals.' });
                await rescue.save();
            }));

            const staleUnresolved = await RescueRequest.find({
                status: { $in: ['pending', 'hospital_broadcasted'] },
                createdAt: { $lte: thirtyMinutesAgo },
            });

            await Promise.all(staleUnresolved.map(async (rescue) => {
                rescue.status = 'closed_unresolved';
                rescue.closedAt = new Date();
                rescue.outcome = 'closed_unresolved';
                rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
                rescue.statusLogs.push({
                    status: 'closed_unresolved',
                    message: 'No responder accepted the case within 30 minutes. Case closed unresolved.',
                });
                await maybeRefundUnresolvedFee(rescue);
                emitRescueUpdate(rescue._id, rescue.status, { message: 'No responder accepted the case within 30 minutes. Case closed unresolved.' });
                await rescue.save();
            }));
        } catch (error) {
            console.error('[Cron] Escalation cron job encountered an error:', error.message);
        }
    });

    console.log('[Cron] Escalation cron job scheduled successfully.');
};

module.exports = { startEscalationCron };
