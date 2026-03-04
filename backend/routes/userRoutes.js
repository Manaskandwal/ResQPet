const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getWallet, getNgos, subscribeEmergency } = require('../controllers/userController');
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

module.exports = router;
