const express = require('express');
const router = express.Router();
const { 
    getEscalatedCases, 
    getLinkedAmbulances, 
    getMyCases, 
    acceptBroadcastedCase, 
    rejectBroadcastedCase,
    onboardAmbulance,
    submitBill,
    getBill,
    updateTreatmentStatus,
} = require('../controllers/hospitalController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');

// @route  GET /api/hospital/escalated
router.get('/escalated', protect, allowRoles('hospital'), getEscalatedCases);

// @route  GET /api/hospital/ambulances
router.get('/ambulances', protect, allowRoles('hospital'), getLinkedAmbulances);

// @route  POST /api/hospital/onboard-ambulance
router.post('/onboard-ambulance', protect, allowRoles('hospital'), onboardAmbulance);

// @route  GET /api/hospital/my-cases
router.get('/my-cases', protect, allowRoles('hospital'), getMyCases);

// @route  PUT /api/hospital/rescue/:id/accept-broadcast
router.put('/rescue/:id/accept-broadcast', protect, allowRoles('hospital'), acceptBroadcastedCase);

// @route  PUT /api/hospital/rescue/:id/reject-broadcast
router.put('/rescue/:id/reject-broadcast', protect, allowRoles('hospital'), rejectBroadcastedCase);

// @route  POST /api/hospital/rescue/:id/bill   — submit bill
router.post('/rescue/:id/bill', protect, allowRoles('hospital'), submitBill);

// @route  GET /api/hospital/rescue/:id/bill    — get bill for a case
router.get('/rescue/:id/bill', protect, allowRoles('hospital', 'admin'), getBill);

// @route  PUT /api/hospital/rescue/:id/treatment — update treatment status
router.put('/rescue/:id/treatment', protect, allowRoles('hospital'), updateTreatmentStatus);

module.exports = router;
