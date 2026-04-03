require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const http = require('http'); // <-- Added for Socket.io
const connectDB = require('./config/db');
const { connectCloudinary } = require('./config/cloudinary');
const { errorHandler } = require('./middleware/errorHandler');
const { startEscalationCron } = require('./jobs/escalationCron');
const { startAmbulanceDispatchCron } = require('./jobs/ambulanceDispatchCron');
const { startRecurringEmergencyDeduction } = require('./jobs/recurringJobs');
const { initSocket } = require('./config/socket'); // <-- Socket.io config

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const rescueRoutes = require('./routes/rescueRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donationRoutes = require('./routes/donationRoutes');

// ─── App Initialization ───────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app); // <-- Wrap app in HTTP server
// Initialize Socket.io
initSocket(server);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In development: allow ANY localhost port (Vite may pick 5173, 5174, etc.)
// In production:  allow only CLIENT_URL env var
const isDev = (process.env.NODE_ENV || 'development') !== 'production';
const productionOrigin = process.env.CLIENT_URL;

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow no-origin requests (Postman, curl, mobile apps)
            if (!origin) return callback(null, true);

            // Dev: allow any localhost or 127.0.0.1 on any port
            if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                return callback(null, true);
            }

            // Prod: only the explicit CLIENT_URL
            if (productionOrigin && origin === productionOrigin) {
                return callback(null, true);
            }

            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            callback(new Error(`CORS: Origin ${origin} not allowed.`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ─── Environment Validation ──────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('[Server] Critical Config Error: JWT_SECRET must be at least 32 characters long.');
    process.exit(1);
}

const isProd = (process.env.NODE_ENV || 'development') === 'production';
if (isProd) {
    if (!process.env.CLIENT_URL || process.env.CLIENT_URL === '*') {
        console.error('[Server] Critical Config Error: CLIENT_URL must be set to a valid origin in production and cannot be "*".');
        process.exit(1);
    }
}

const PORT = process.env.PORT || 5000;

console.log('[Server] Initializing VetsCue Backend...');

// ─── Security Middlewares ─────────────────────────────────────────────────────
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(xss()); // Data sanitization against XSS

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', globalLimiter);

// Specific Rate Limiting for Auth & Payment
const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: 'Too many login attempts, please try again after a minute'
});
app.use('/api/auth/login', loginLimiter);

const paymentVerifyLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many payment verification attempts, please try again after a minute'
});
app.use('/api/payment/verify', paymentVerifyLimiter);

// ─── Connect to Services ──────────────────────────────────────────────────────
(async () => {
    try {
        await connectDB();
        connectCloudinary();
        console.log('[Server] All services connected successfully.');
    } catch (error) {
        console.error('[Server] Critical startup error:', error.message);
        process.exit(1);
    }
})();


// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logger ───────────────────────────────────────────────────────────
if (isDev) {
    app.use(morgan('dev')); // Colorized logs for development
} else {
    app.use(morgan('combined')); // Detailed logs for production
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'VetsCue API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/rescue', rescueRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donation', donationRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    console.warn(`[Server] 404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
// Use server.listen instead of app.listen for Socket.io
server.listen(PORT, () => {
    console.log('');
    console.log('============================================');
    console.log(`  VetsCue API Server`);
    console.log(`  Port    : ${PORT}`);
    console.log(`  Mode    : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Health  : http://localhost:${PORT}/health`);
    console.log('============================================');
    console.log('');

    // Start the escalation cron job
    startEscalationCron();
    // Start ambulance sequential dispatch cron job
    startAmbulanceDispatchCron();
    // Start recurring emergency fund deductions
    startRecurringEmergencyDeduction();
});

process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught exception:', error);
});

module.exports = { app, server };
