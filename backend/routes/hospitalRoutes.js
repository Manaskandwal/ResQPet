const express = require('express');
const router = express.Router();
const { getEscalatedCases, getLinkedAmbulances, getMyCases, acceptBroadcastedCase, rejectBroadcastedCase } = require('../controllers/hospitalController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');

// @route  GET /api/hospital/escalated
router.get('/escalated', protect, allowRoles('hospital'), getEscalatedCases);

// @route  GET /api/hospital/ambulances
router.get('/ambulances', protect, allowRoles('hospital'), getLinkedAmbulances);

// @route  GET /api/hospital/my-cases
// @route  GET /api/hospital/my-cases
router.get('/my-cases', protect, allowRoles('hospital'), getMyCases);

// @route  PUT /api/hospital/rescue/:id/accept-broadcast
router.put('/rescue/:id/accept-broadcast', protect, allowRoles('hospital'), acceptBroadcastedCase);

// @route  PUT /api/hospital/rescue/:id/reject-broadcast
router.put('/rescue/:id/reject-broadcast', protect, allowRoles('hospital'), rejectBroadcastedCase);

module.exports = router;
