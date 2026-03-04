const express = require('express');
const router = express.Router();
const { submitRescue, getMyRescues, getRescueById, cancelRescue, makeFundraiser } = require('../controllers/rescueController');
const { acceptCase, rejectCase, resolveOnSpot, escalateToHospital, updateNGOStatus } = require('../controllers/ngoController');
const { assignAmbulance } = require('../controllers/hospitalController');
const { updateStatus } = require('../controllers/ambulanceController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');
const { upload } = require('../middleware/upload');

// @route  POST /api/rescue
// Accept up to 5 images (field: images) and 1 video (field: video)
router.post(
    '/',
    protect,
    allowRoles('user'),
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'video', maxCount: 1 },
    ]),
    submitRescue
);

// @route  GET /api/rescue/mine
router.get('/mine', protect, allowRoles('user'), getMyRescues);

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
router.put('/:id/ngo-status', protect, allowRoles('ngo'), upload.array('media', 7), updateNGOStatus);

// @route  PUT /api/rescue/:id/assign-ambulance
router.put('/:id/assign-ambulance', protect, allowRoles('hospital'), assignAmbulance);

// @route  PUT /api/rescue/:id/status  (ambulance status update)
router.put('/:id/status', protect, allowRoles('ambulance'), updateStatus);

// @route  PUT /api/rescue/:id/fundraiser
router.put('/:id/fundraiser', protect, allowRoles('user'), makeFundraiser);

module.exports = router;
