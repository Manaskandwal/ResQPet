const express = require('express');
const router = express.Router();
const { register, login, getMe, impersonateUser, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route  POST /api/auth/register
router.post('/register', register);

// @route  POST /api/auth/login
router.post('/login', login);

// @route  POST /api/auth/google
router.post('/google', googleLogin);

// @route  GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

// @route  POST /api/auth/impersonate (protected, isAdmin only)
router.post('/impersonate', protect, impersonateUser);

module.exports = router;
