const cron = require('node-cron');
const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const { getIo } = require('../config/socket');

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
