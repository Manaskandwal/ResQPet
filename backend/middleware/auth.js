const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(`[Auth] Token verified for userId: ${decoded.id}`);
        } catch (jwtError) {
            console.error('[Auth] JWT verification failed:', jwtError.message);
            return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
        }

        // Fetch user from DB (ensure they still exist and are not deleted)
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            console.warn(`[Auth] User not found in DB for token userId: ${decoded.id}`);
            return res.status(401).json({ success: false, message: 'User no longer exists.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('[Auth] Unexpected error in protect middleware:', error.message);
        res.status(500).json({ success: false, message: 'Server error during authentication.' });
    }
};

module.exports = { protect };
