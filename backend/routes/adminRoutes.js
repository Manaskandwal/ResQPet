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
    setUserLocation,
    getAuditLogs,
    updateUserMeta,
    getFundraisers,
    reviewFundraiser
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

// @route  PUT  /api/admin/users/:userId/location
router.put('/users/:userId/location', setUserLocation);

// @route  GET  /api/admin/audit-logs
router.get('/audit-logs', getAuditLogs);

// @route  PATCH /api/admin/users/:userId/meta  — admin updates isGovernment, isAvailable
router.patch('/users/:userId/meta', updateUserMeta);

// @route  GET /api/admin/fundraisers
router.get('/fundraisers', getFundraisers);

// @route  PUT /api/admin/rescue/:id/fundraiser/review
router.put('/rescue/:id/fundraiser/review', reviewFundraiser);

module.exports = router;
