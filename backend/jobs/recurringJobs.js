const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Job: recurringEmergencyDeduction
 * Runs every minute for testing.
 * Simulates a recurring payment for emergency fund subscribers.
 */
const startRecurringEmergencyDeduction = () => {
    // Cron schedule: every minute
    cron.schedule('* * * * *', async () => {
        try {
            console.log('[Recurring Job] Checking for emergency fund deductions...');

            const subscribers = await User.find({
                'monthlySubscription.isSubscribed': true,
                role: 'user'
            });

            for (const user of subscribers) {
                // For simulation purposes, we just log the deduction and update a timestamp
                // In reality, we would call a payment gateway API here
                console.log(`[Recurring Job] Simulating deduction of ₹${user.monthlySubscription.amount} from user: ${user.email}`);

                user.monthlySubscription.lastDeductedAt = new Date();
                await user.save();

                // Notify User
                await Notification.create({
                    user: user._id,
                    title: 'Emergency Fund Contribution',
                    message: `Thank you for your recurring support! ₹${user.monthlySubscription.amount} has been successfully contributed to the emergency fund. Your kindness is saving lives! ❤️`,
                    type: 'success',
                });
            }
        } catch (error) {
            console.error('[Recurring Job] Emergency deduction error:', error.message);
        }
    });
};

module.exports = { startRecurringEmergencyDeduction };
