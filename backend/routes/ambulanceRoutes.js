const express = require('express');
const router = express.Router();
const { getAssignedTask, getHistory, getPingedTasks, acceptPing, rejectPing } = require('../controllers/ambulanceController');
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

module.exports = router;
