const express = require('express');
const router = express.Router();
const { getAssignedTask, getHistory } = require('../controllers/ambulanceController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');

// @route  GET /api/ambulance/assigned
router.get('/assigned', protect, allowRoles('ambulance'), getAssignedTask);

// @route  GET /api/ambulance/history
router.get('/history', protect, allowRoles('ambulance'), getHistory);

module.exports = router;
