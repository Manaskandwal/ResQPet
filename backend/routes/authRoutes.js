const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, impersonateUser, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route  POST /api/auth/register
router.post('/register', register);

// @route  POST /api/auth/login
router.post('/login', login);

// @route  POST /api/auth/logout
router.post('/logout', protect, logout);

// @route  POST /api/auth/google
router.post('/google', googleLogin);

// @route  GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

// @route  POST /api/auth/impersonate (protected, isAdmin only)
router.post('/impersonate', protect, impersonateUser);
// Alias for frontend compatibility
router.post('/impersonate-start', protect, impersonateUser);

module.exports = router;
