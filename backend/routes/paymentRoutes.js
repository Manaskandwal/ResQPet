const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');

// @route  POST /api/payment/create-order
router.post('/create-order', protect, allowRoles('user'), createOrder);

// @route  POST /api/payment/verify
router.post('/verify', protect, allowRoles('user'), verifyPayment);

module.exports = router;
