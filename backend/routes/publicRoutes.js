const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RescueRequest = require('../models/RescueRequest');

/**
 * @route   GET /api/public/stats
 * @desc    Get public statistics for landing page
 * @access  Public
 */
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            totalRequests,
            totalNGOs,
            completedRequests
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            RescueRequest.countDocuments(),
            User.countDocuments({ role: 'ngo' }),
            RescueRequest.countDocuments({ status: 'completed' })
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalRequests,
                totalNGOs,
                completedRequests
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
