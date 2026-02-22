const cloudinary = require('cloudinary').v2;

/**
 * Configures Cloudinary with credentials from environment variables.
 * Called once at startup from server.js.
 */
const connectCloudinary = () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        console.log('[Cloudinary] Configuration loaded successfully.');
    } catch (error) {
        console.error('[Cloudinary] Configuration error:', error.message);
        throw error;
    }
};

module.exports = { cloudinary, connectCloudinary };
