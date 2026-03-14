const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getWallet,
    getNgos,
    subscribeEmergency,
    getPaymentHistory,
    pauseSubscription,
    cancelSubscription,
    updateSubscriptionAmount,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// @route  GET  /api/user/profile
router.get('/profile', protect, getProfile);

// @route  PUT  /api/user/profile
router.put('/profile', protect, updateProfile);

// @route  GET  /api/user/wallet
router.get('/wallet', protect, getWallet);

// @route  GET  /api/user/ngos
router.get('/ngos', protect, getNgos);

// @route  POST /api/user/subscribe-emergency
router.post('/subscribe-emergency', protect, subscribeEmergency);

// @route  GET /api/user/payment-history
router.get('/payment-history', protect, getPaymentHistory);

// @route  POST /api/user/subscription/pause
router.post('/subscription/pause', protect, pauseSubscription);

// @route  POST /api/user/subscription/cancel
router.post('/subscription/cancel', protect, cancelSubscription);

// @route  PUT /api/user/subscription/amount
router.put('/subscription/amount', protect, updateSubscriptionAmount);

module.exports = router;
