/**
 * Haversine Formula
 * Calculates the great-circle distance between two points on Earth.
 *
 * @param {number} lat1 - Latitude of point 1 (in decimal degrees)
 * @param {number} lng1 - Longitude of point 1 (in decimal degrees)
 * @param {number} lat2 - Latitude of point 2 (in decimal degrees)
 * @param {number} lng2 - Longitude of point 2 (in decimal degrees)
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
    try {
        const R = 6371; // Earth's radius in km
        const toRad = (deg) => (deg * Math.PI) / 180;

        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 100) / 100; // round to 2 decimal places
    } catch (error) {
        console.error('[Haversine] Calculation error:', error.message);
        throw error;
    }
};

module.exports = { haversineDistance };
