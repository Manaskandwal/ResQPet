const express = require('express');
const router = express.Router();
const { getNearbyCases, getMyCases } = require('../controllers/ngoController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');

// @route  GET /api/ngo/nearby
router.get('/nearby', protect, allowRoles('ngo'), getNearbyCases);

// @route  GET /api/ngo/my-cases
router.get('/my-cases', protect, allowRoles('ngo'), getMyCases);

module.exports = router;
