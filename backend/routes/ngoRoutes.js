const express = require('express');
const router = express.Router();
const { 
    getNearbyCases, 
    getMyCases, 
    getAnalytics, 
    completeCase, 
    addFollowUp, 
    requestFundraiser,
    editFundraiserGoal,
    addFundraiserMedia,
    togglePauseFundraiser,
    cancelFundraiser
} = require('../controllers/ngoController');
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
router.post('/rescue/:id/fundraiser', protect, allowRoles('ngo'), upload.fields([{ name: 'billImage', maxCount: 1 }, { name: 'media', maxCount: 10 }]), requestFundraiser);

// Fundraiser management routes
// @route  PUT /api/ngo/rescue/:id/fundraiser/edit-goal
router.put('/rescue/:id/fundraiser/edit-goal', protect, allowRoles('ngo'), editFundraiserGoal);

// @route  POST /api/ngo/rescue/:id/fundraiser/add-media
router.post('/rescue/:id/fundraiser/add-media', protect, allowRoles('ngo'), upload.array('media', 10), addFundraiserMedia);

// @route  PUT /api/ngo/rescue/:id/fundraiser/toggle-pause
router.put('/rescue/:id/fundraiser/toggle-pause', protect, allowRoles('ngo'), togglePauseFundraiser);

// @route  PUT /api/ngo/rescue/:id/fundraiser/cancel
router.put('/rescue/:id/fundraiser/cancel', protect, allowRoles('ngo'), cancelFundraiser);

module.exports = router;
