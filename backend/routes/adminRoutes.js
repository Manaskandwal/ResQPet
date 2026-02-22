const express = require('express');
const router = express.Router();
const {
    getAnalytics,
    getAllUsers,
    getPendingApprovals,
    approveUser,
    deleteUser,
    getAllRescues,
    overrideRescueStatus,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleGuard');

// All admin routes require authentication + admin role
router.use(protect, allowRoles('admin'));

// @route  GET  /api/admin/analytics
router.get('/analytics', getAnalytics);

// @route  GET  /api/admin/users
router.get('/users', getAllUsers);

// @route  GET  /api/admin/pending-approvals
router.get('/pending-approvals', getPendingApprovals);

// @route  PUT  /api/admin/approve/:userId
router.put('/approve/:userId', approveUser);

// @route  DELETE /api/admin/user/:userId
router.delete('/user/:userId', deleteUser);

// @route  GET  /api/admin/rescue-requests
router.get('/rescue-requests', getAllRescues);

// @route  PUT  /api/admin/rescue/:id/override
router.put('/rescue/:id/override', overrideRescueStatus);

module.exports = router;
