/**
 * Central error handler middleware.
 * Must be registered LAST in Express middleware chain (after all routes).
 *
 * Catches:
 * - Mongoose validation errors
 * - Mongoose duplicate key errors (e.g. duplicate email)
 * - Mongoose CastError (invalid ObjectId)
 * - JWT errors
 * - Generic server errors
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    console.error(`[ErrorHandler] ${req.method} ${req.path} → ${statusCode}: ${message}`);
    if (process.env.NODE_ENV === 'development') {
        console.error('[ErrorHandler] Stack:', err.stack);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const errors = Object.values(err.errors).map((e) => e.message);
        message = errors.join(', ');
        console.warn('[ErrorHandler] Mongoose ValidationError:', message);
    }

    // Mongoose duplicate key (e.g., duplicate email)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
        console.warn('[ErrorHandler] Duplicate key error on field:', field);
    }

    // Mongoose invalid ObjectId
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid value for field: ${err.path}`;
        console.warn('[ErrorHandler] CastError on path:', err.path);
    }

    // JWT errors (should be caught in auth.js but catch here too)
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired. Please log in again.';
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

/**
 * Async handler wrapper — eliminates repetitive try-catch in controllers.
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        console.error('[AsyncHandler] Caught error:', error.message);
        next(error);
    });
};

module.exports = { errorHandler, asyncHandler };
