const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for the given user.
 * @param {Object} user - Mongoose user document
 * @returns {string} Signed JWT string
 */
const generateToken = (user) => {
    try {
        const payload = {
            id: user._id,
            role: user.role,
            email: user.email,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '7d',
        });
        console.log(`[JWT] Token generated for userId: ${user._id}, role: ${user.role}`);
        return token;
    } catch (error) {
        console.error('[JWT] Token generation error:', error.message);
        throw error;
    }
};

module.exports = { generateToken };
