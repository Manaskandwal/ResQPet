const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Donation = require('../models/Donation');
const WalletTransaction = require('../models/WalletTransaction');

const addBillingMonth = (dateLike) => {
    const base = dateLike ? new Date(dateLike) : new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const day = base.getDate();
    const targetMonth = month + 1;
    const targetYear = year + Math.floor(targetMonth / 12);
    const normalizedMonth = targetMonth % 12;
    const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();

    return new Date(
        targetYear,
        normalizedMonth,
        Math.min(day, lastDay),
        base.getHours(),
        base.getMinutes(),
        base.getSeconds(),
        base.getMilliseconds()
    );
};

const startRecurringEmergencyDeduction = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const subscribers = await User.find({
                'monthlySubscription.isSubscribed': true,
                role: 'user',
            });

            for (const user of subscribers) {
                const subscription = user.monthlySubscription || {};
                const now = new Date();

                if (subscription.status === 'paused' && subscription.pausedUntil && new Date(subscription.pausedUntil) > now) {
                    continue;
                }

                if (subscription.status === 'paused' && subscription.pausedUntil && new Date(subscription.pausedUntil) <= now) {
                    subscription.status = 'active';
                    subscription.pausedUntil = null;
                }

                if (!subscription.nextPaymentDate || new Date(subscription.nextPaymentDate) > now) {
                    user.monthlySubscription = subscription;
                    await user.save();
                    continue;
                }

                if (user.walletBalance < subscription.amount) {
                    await Notification.create({
                        user: user._id,
                        title: 'Recurring Contribution Skipped',
                        message: `Your wallet balance is too low for the next Rs ${subscription.amount} emergency contribution. Please top up your wallet.`,
                        type: 'warning',
                    });
                    continue;
                }

                user.walletBalance -= subscription.amount;
                subscription.lastDeductedAt = now;
                subscription.nextPaymentDate = addBillingMonth(now);
                subscription.status = 'active';
                user.monthlySubscription = subscription;
                await user.save();

                await WalletTransaction.create({
                    user: user._id,
                    amount: subscription.amount,
                    type: 'debit',
                    description: 'Recurring emergency fund contribution deducted from wallet (test mode)',
                    balanceAfter: user.walletBalance,
                });

                await Donation.create({
                    user: user._id,
                    amount: subscription.amount,
                    type: 'subscription',
                    status: 'successful',
                    paymentMethod: 'wallet',
                    paymentSource: 'wallet_test',
                    isGeneral: true,
                    subscriptionStartedAt: subscription.startedAt,
                    nextPaymentDate: subscription.nextPaymentDate,
                    note: 'Recurring contribution processed from wallet in test mode.',
                });

                await Notification.create({
                    user: user._id,
                    title: 'Emergency Fund Contribution',
                    message: `Thank you for your recurring support. Rs ${subscription.amount} was deducted from your wallet in test mode for the emergency fund.`,
                    type: 'success',
                });
            }
        } catch (error) {
            console.error('[Recurring Job] Emergency deduction error:', error.message);
        }
    });
};

module.exports = { startRecurringEmergencyDeduction };
