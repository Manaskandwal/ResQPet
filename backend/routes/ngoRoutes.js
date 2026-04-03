const express = require('express');
const router = express.Router();
const { getNearbyCases, getMyCases, getAnalytics, completeCase, addFollowUp, requestFundraiser } = require('../controllers/ngoController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');
const { upload } = require('../middleware/upload');

// @route  GET /api/ngo/analytics
router.get('/analytics', protect, allowRoles('ngo'), getAnalytics);

// @route  GET /api/ngo/nearby
router.get('/nearby', protect, allowRoles('ngo'), getNearbyCases);

// @route  GET /api/ngo/my-cases
router.get('/my-cases', protect, allowRoles('ngo'), getMyCases);

// @route  POST /api/ngo/rescue/:id/fundraiser
router.post('/rescue/:id/fundraiser', protect, allowRoles('ngo'), upload.array('media', 1), requestFundraiser);

module.exports = router;
