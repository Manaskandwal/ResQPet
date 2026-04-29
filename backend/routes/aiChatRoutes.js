const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { handleChat, getChatHistory, clearChatHistory } = require('../controllers/aiChatController');

// ─── Rate Limiting Configuration ──────────────────────────────────────────────

// Parse env variables with fallbacks
const DAILY_LIMIT = parseInt(process.env.AI_CHAT_DAILY_LIMIT, 10) || 5;
const MINUTE_LIMIT = parseInt(process.env.AI_CHAT_MINUTE_LIMIT, 10) || 2;

// 1. Minute Limit: max N questions per minute
const minuteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: MINUTE_LIMIT,
    message: { 
        success: false, 
        message: `Too many questions in a minute. Please wait and try again. (Max ${MINUTE_LIMIT}/min)` 
    },
    // Use user id since route is protected
    keyGenerator: (req) => req.user._id.toString()
});

// 2. Daily Limit: max N questions per 24 hours
const dailyLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: DAILY_LIMIT,
    message: { 
        success: false, 
        message: `You have reached your daily limit for AI assistance. Please come back tomorrow. (Max ${DAILY_LIMIT}/day)` 
    },
    keyGenerator: (req) => req.user._id.toString()
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Get chat history
router.get('/history', protect, getChatHistory);

// Clear chat history
router.delete('/history', protect, clearChatHistory);

// Protected route: user must be authenticated.
// Applied both rate limiters.
router.post('/', protect, dailyLimiter, minuteLimiter, handleChat);

module.exports = router;
