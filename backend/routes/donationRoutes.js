const express = require('express');
const router = express.Router();
const { createDonationOrder, verifyDonation, createSubscription, verifySubscription, getPublicFundraisers } = require('../controllers/donationController');
const { protect } = require('../middleware/auth');

// Public endpoints
router.get('/fundraisers', getPublicFundraisers);

// All donation routes require an authenticated user
router.post('/create-order', protect, createDonationOrder);
router.post('/verify', protect, verifyDonation);

router.post('/subscribe', protect, createSubscription);
router.post('/verify-subscription', protect, verifySubscription);

module.exports = router;
