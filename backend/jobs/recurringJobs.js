const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Donation = require('../models/Donation');
const WalletTransaction = require('../models/WalletTransaction');

const addOneMonth = (dateLike) => {
    const base = dateLike ? new Date(dateLike) : new Date();
    const next = new Date(base);
    next.setMonth(next.getMonth() + 1);
    return next;
};

/**
 * Job: recurringEmergencyDeduction
 * Runs every minute for testing.
 * Collects recurring contributions from the user's wallet in test mode.
 */
const startRecurringEmergencyDeduction = () => {
    cron.schedule('* * * * *', async () => {
        try {
            console.log('[Recurring Job] Checking for emergency fund deductions...');

            const subscribers = await User.find({
                'monthlySubscription.isSubscribed': true,
                'monthlySubscription.status': { $in: ['active', 'paused'] },
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
                        message: `Your wallet balance is too low for the next ₹${subscription.amount} emergency contribution. Please top up your wallet.`,
                        type: 'warning',
                    });
                    continue;
                }

                user.walletBalance -= subscription.amount;
                subscription.lastDeductedAt = now;
                subscription.nextPaymentDate = addOneMonth(now);
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
                    message: `Thank you for your recurring support. ₹${subscription.amount} was deducted from your wallet in test mode for the emergency fund.`,
                    type: 'success',
                });
            }
        } catch (error) {
            console.error('[Recurring Job] Emergency deduction error:', error.message);
        }
    });
};

module.exports = { startRecurringEmergencyDeduction };
