const express = require('express');
const router = express.Router();
const { getAssignedTask, updateStatus, getHistory, getPingedTasks, acceptPing, rejectPing, updateLocation } = require('../controllers/ambulanceController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');

// @route  GET /api/ambulance/assigned
router.get('/assigned', protect, allowRoles('ambulance'), getAssignedTask);

// @route  GET /api/ambulance/history
router.get('/history', protect, allowRoles('ambulance'), getHistory);

// @route  GET /api/ambulance/pinged
router.get('/pinged', protect, allowRoles('ambulance'), getPingedTasks);

// @route  PUT /api/ambulance/rescue/:id/accept-ping
router.put('/rescue/:id/accept-ping', protect, allowRoles('ambulance'), acceptPing);

// @route  PUT /api/ambulance/rescue/:id/reject-ping
router.put('/rescue/:id/reject-ping', protect, allowRoles('ambulance'), rejectPing);

// @route  PUT /api/ambulance/location  — ambulance pings GPS every 2 minutes
router.put('/location', protect, allowRoles('ambulance'), updateLocation);

// @route  PUT /api/ambulance/rescue/:id/status  — ambulance status transition (en_route, picked_up, delivered)
router.put('/rescue/:id/status', protect, allowRoles('ambulance'), updateStatus);

module.exports = router;
