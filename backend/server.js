require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectCloudinary } = require('./config/cloudinary');
const { errorHandler } = require('./middleware/errorHandler');
const { startEscalationCron } = require('./jobs/escalationCron');

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const rescueRoutes = require('./routes/rescueRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ─── App Initialization ───────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

console.log('[Server] Initializing PawSaarthi Backend...');

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

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logger (dev mode) ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[Request] ${req.method} ${req.path}`);
        next();
    });
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'PawSaarthi API is running!',
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

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    console.warn(`[Server] 404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('============================================');
    console.log(`  PawSaarthi API Server`);
    console.log(`  Port    : ${PORT}`);
    console.log(`  Mode    : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Health  : http://localhost:${PORT}/health`);
    console.log('============================================');
    console.log('');

    // Start the escalation cron job
    startEscalationCron();
});

module.exports = app;
