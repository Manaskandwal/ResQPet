const cron = require('node-cron');
const RescueRequest = require('../models/RescueRequest');

/**
 * Escalation Cron Job
 *
 * Runs every minute.
 * Finds all rescue requests still in 'pending' status where
 * the animal has been waiting for more than 5 minutes without
 * any NGO accepting.
 *
 * Action: Updates status to 'hospital_escalated' so
 *         nearby hospitals can see and respond.
 */
const startEscalationCron = () => {
    console.log('[Cron] Starting escalation cron job (every minute check)...');

    cron.schedule('* * * * *', async () => {
        try {
            console.log('[Cron] Running escalation check at:', new Date().toISOString());

            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            // Find all pending rescues older than 5 minutes
            const stalePending = await RescueRequest.find({
                status: 'pending',
                createdAt: { $lte: fiveMinutesAgo },
            });

            if (stalePending.length === 0) {
                console.log('[Cron] No stale pending requests found.');
                return;
            }

            console.log(`[Cron] Found ${stalePending.length} request(s) to escalate to hospitals.`);

            // Escalate each stale request
            const escalationPromises = stalePending.map(async (rescue) => {
                try {
                    rescue.status = 'hospital_escalated';
                    rescue.escalatedAt = new Date();
                    await rescue.save();
                    console.log(`[Cron] Escalated rescue: ${rescue._id} (originally created at ${rescue.createdAt.toISOString()})`);
                } catch (saveError) {
                    console.error(`[Cron] Failed to escalate rescue ${rescue._id}:`, saveError.message);
                }
            });

            await Promise.all(escalationPromises);
            console.log(`[Cron] Escalation complete for ${stalePending.length} request(s).`);
        } catch (error) {
            console.error('[Cron] Escalation cron job encountered an error:', error.message);
        }
    });

    console.log('[Cron] Escalation cron job scheduled successfully.');
};

module.exports = { startEscalationCron };
