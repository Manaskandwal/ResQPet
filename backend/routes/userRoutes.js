const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getWallet } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// @route  GET  /api/user/profile
router.get('/profile', protect, getProfile);

// @route  PUT  /api/user/profile
router.put('/profile', protect, updateProfile);

// @route  GET  /api/user/wallet
router.get('/wallet', protect, getWallet);

module.exports = router;
