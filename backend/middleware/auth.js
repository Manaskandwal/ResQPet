const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');

const attachUserFromToken = async (token) => {
    // ── Check Blacklist ──────────────────────────────────────────────────────
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) {
        const error = new Error('Token has been revoked.');
        error.statusCode = 401;
        throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[Auth] Token verified for userId: ${decoded.id}, role: ${decoded.role}, isAdmin: ${decoded.isAdmin}`);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
        const error = new Error('User no longer exists.');
        error.statusCode = 401;
        throw error;
    }

    return {
        ...user.toObject(),
        role: decoded.role,
        isAdmin: decoded.isAdmin || user.isAdmin || false,
        impersonating: decoded.impersonating || null,
    };
};

/**
 * Middleware: Protect routes — verify JWT and attach user to req
 * Expects: Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Extract token from Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            console.warn('[Auth] No token provided for protected route:', req.path);
            return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
        }

        try {
            req.user = await attachUserFromToken(token);
        } catch (jwtError) {
            const isJwtError = jwtError.name === 'JsonWebTokenError' || jwtError.name === 'TokenExpiredError';
            const status = jwtError.statusCode || (isJwtError ? 401 : 500);
            console.error('[Auth] Token/user attach failed:', jwtError.message);
            return res.status(status).json({
                success: false,
                message: isJwtError ? (jwtError.message || 'Token invalid or expired.') : 'Authentication service unavailable. Please try again.',
            });
        }
        next();
    } catch (error) {
        console.error('[Auth] Unexpected error in protect middleware:', error.message);
        res.status(500).json({ success: false, message: 'Server error during authentication.' });
    }
};

module.exports = { protect };
