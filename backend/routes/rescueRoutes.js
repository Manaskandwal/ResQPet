const express = require('express');
const router = express.Router();
const {
    submitRescue,
    getMyRescues,
    getRescueById,
    cancelRescue,
    makeFundraiser,
    getImpactFeed,
    toggleImpactLike,
    addImpactComment,
} = require('../controllers/rescueController');
const { acceptCase, rejectCase, resolveOnSpot, escalateToHospital, updateNGOStatus, completeCase, addFollowUp } = require('../controllers/ngoController');
const { assignAmbulance } = require('../controllers/hospitalController');
const { updateStatus } = require('../controllers/ambulanceController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');
const { upload } = require('../middleware/upload');
const { validateMedia } = require('../middleware/validateMedia');

// @route  POST /api/rescue
// Accept mixed media (up to 5 images and 1 video) in a single field
router.post(
    '/',
    protect,
    allowRoles('user'),
    upload.array('media', 6),
    validateMedia,
    submitRescue
);

// @route  GET /api/rescue/mine
router.get('/mine', protect, allowRoles('user'), getMyRescues);

// @route  GET /api/rescue/impact/feed
router.get('/impact/feed', protect, getImpactFeed);

// @route  GET /api/rescue/:id
router.get('/:id', protect, getRescueById);

// @route  PUT /api/rescue/:id/cancel
router.put('/:id/cancel', protect, allowRoles('user', 'admin'), cancelRescue);

// @route  PUT /api/rescue/:id/accept-ngo
router.put('/:id/accept-ngo', protect, allowRoles('ngo'), acceptCase);

// @route  PUT /api/rescue/:id/reject-ngo
router.put('/:id/reject-ngo', protect, allowRoles('ngo'), rejectCase);

// @route  PUT /api/rescue/:id/resolve-ngo
router.put('/:id/resolve-ngo', protect, allowRoles('ngo'), resolveOnSpot);

// @route  PUT /api/rescue/:id/escalate-ngo
router.put('/:id/escalate-ngo', protect, allowRoles('ngo'), escalateToHospital);

// @route  PUT /api/rescue/:id/ngo-status
router.put('/:id/ngo-status', protect, allowRoles('ngo'), upload.array('media', 7), validateMedia, updateNGOStatus);

// @route  PUT /api/rescue/:id/complete-ngo
router.put('/:id/complete-ngo', protect, allowRoles('ngo'), completeCase);

// @route  POST /api/rescue/:id/followup
router.post('/:id/followup', protect, allowRoles('ngo'), addFollowUp);

// @route  PUT /api/rescue/:id/assign-ambulance
router.put('/:id/assign-ambulance', protect, allowRoles('hospital'), assignAmbulance);

// @route  PUT /api/rescue/:id/status  (ambulance status update)
router.put('/:id/status', protect, allowRoles('ambulance'), updateStatus);

// @route  PUT /api/rescue/:id/fundraiser
router.put('/:id/fundraiser', protect, allowRoles('user'), makeFundraiser);

// @route  POST /api/rescue/:id/impact/like
router.post('/:id/impact/like', protect, toggleImpactLike);

// @route  POST /api/rescue/:id/impact/comment
router.post('/:id/impact/comment', protect, addImpactComment);

module.exports = router;
