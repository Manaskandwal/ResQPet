const express = require('express');
const router = express.Router();
const { getEscalatedCases, getLinkedAmbulances, getMyCases } = require('../controllers/hospitalController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');

// @route  GET /api/hospital/escalated
router.get('/escalated', protect, allowRoles('hospital'), getEscalatedCases);

// @route  GET /api/hospital/ambulances
router.get('/ambulances', protect, allowRoles('hospital'), getLinkedAmbulances);

// @route  GET /api/hospital/my-cases
router.get('/my-cases', protect, allowRoles('hospital'), getMyCases);

module.exports = router;
