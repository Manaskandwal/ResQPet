const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, mockTopup } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');

// ─── MOCK (Testing without Razorpay keys) ────────────────────────────────────
// @route  POST /api/payment/mock-topup
// Remove or restrict in production!
router.post('/mock-topup', protect, allowRoles('user'), mockTopup);

// ─── REAL Razorpay (enable when you have live keys) ──────────────────────────
// @route  POST /api/payment/create-order
router.post('/create-order', protect, allowRoles('user'), createOrder);

// @route  POST /api/payment/verify
router.post('/verify', protect, allowRoles('user'), verifyPayment);

module.exports = router;
