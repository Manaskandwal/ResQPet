const User = require('../models/User');
const RescueRequest = require('../models/RescueRequest');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * @route   GET /api/admin/analytics
 * @desc    Get platform analytics (counts, breakdowns)
 * @access  Private (admin only)
 */
const getAnalytics = async (req, res) => {
    try {
        console.log('[Admin Controller] getAnalytics requested');

        const [
            totalUsers,
            totalRequests,
            pendingRequests,
            completedRequests,
            pendingApprovals,
            totalNGOs,
            totalHospitals,
            totalAmbulances,
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            RescueRequest.countDocuments(),
            RescueRequest.countDocuments({ status: 'pending' }),
            RescueRequest.countDocuments({ status: 'completed' }),
            User.countDocuments({ isApproved: false, role: { $in: ['ngo', 'hospital', 'ambulance'] } }),
            User.countDocuments({ role: 'ngo' }),
            User.countDocuments({ role: 'hospital' }),
            User.countDocuments({ role: 'ambulance' }),
        ]);

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentRequests = await RescueRequest.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        console.log('[Admin Controller] Analytics fetched successfully');
        res.status(200).json({
            success: true,
            analytics: {
                totalUsers,
                totalRequests,
                pendingRequests,
                completedRequests,
                pendingApprovals,
                totalNGOs,
                totalHospitals,
                totalAmbulances,
                recentRequests,
                recentUsers,
            },
        });
    } catch (error) {
        console.error('[Admin Controller] getAnalytics error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (paginated)
 * @access  Private (admin only)
 */
const getAllUsers = async (req, res) => {
    try {
        console.log('[Admin Controller] getAllUsers requested');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const role = req.query.role; // optional filter by role
        const search = req.query.search;

        const query = {};
        if (role) query.role = role;
        if (search) query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { orgName: { $regex: search, $options: 'i' } },
        ];

        const [users, total] = await Promise.all([
            User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments(query),
        ]);

        console.log(`[Admin Controller] Fetched ${users.length} users (page ${page}, total: ${total})`);
        res.status(200).json({
            success: true,
            users,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('[Admin Controller] getAllUsers error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/admin/pending-approvals
 * @desc    Get all accounts pending admin approval
 * @access  Private (admin only)
 */
const getPendingApprovals = async (req, res) => {
    try {
        console.log('[Admin Controller] getPendingApprovals requested');
        const pending = await User.find({
            isApproved: false,
            role: { $in: ['ngo', 'hospital', 'ambulance'] },
        }).select('-password').sort({ createdAt: 1 });

        console.log(`[Admin Controller] ${pending.length} pending approvals`);
        res.status(200).json({ success: true, count: pending.length, users: pending });
    } catch (error) {
        console.error('[Admin Controller] getPendingApprovals error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/admin/approve/:userId
 * @desc    Approve or revoke an organisation account
 * @access  Private (admin only)
 */
const approveUser = async (req, res) => {
    try {
        console.log(`[Admin Controller] approveUser: userId=${req.params.userId}`);
        const { approve } = req.body; // true = approve, false = revoke

        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        if (!['ngo', 'hospital', 'ambulance'].includes(user.role)) {
            return res.status(400).json({ success: false, message: 'Only NGO, hospital, and ambulance accounts require approval.' });
        }

        user.isApproved = approve !== false; // default to approve if not specified
        await user.save();

        console.log(`[Admin Controller] User ${user.email} isApproved set to ${user.isApproved}`);
        res.status(200).json({
            success: true,
            message: user.isApproved ? `${user.orgName || user.name} approved!` : `${user.orgName || user.name} approval revoked.`,
            user,
        });
    } catch (error) {
        console.error('[Admin Controller] approveUser error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   DELETE /api/admin/user/:userId
 * @desc    Delete a user account (admin override)
 * @access  Private (admin only)
 */
const deleteUser = async (req, res) => {
    try {
        console.log(`[Admin Controller] deleteUser: userId=${req.params.userId}`);
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        console.log(`[Admin Controller] User deleted: ${user.email}`);
        res.status(200).json({ success: true, message: `User ${user.email} deleted successfully.` });
    } catch (error) {
        console.error('[Admin Controller] deleteUser error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/admin/rescue-requests
 * @desc    Get all rescue requests with full details
 * @access  Private (admin only)
 */
const getAllRescues = async (req, res) => {
    try {
        console.log('[Admin Controller] getAllRescues requested');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        const query = status ? { status } : {};
        const [rescues, total] = await Promise.all([
            RescueRequest.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'name email phone')
                .populate('assignedNGO', 'name orgName')
                .populate('assignedHospital', 'name orgName')
                .populate('assignedAmbulance', 'name vehicleNumber'),
            RescueRequest.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            rescues,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('[Admin Controller] getAllRescues error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/admin/rescue/:id/override
 * @desc    Admin manually overrides a rescue request status
 * @access  Private (admin only)
 */
const overrideRescueStatus = async (req, res) => {
    try {
        console.log(`[Admin Controller] overrideRescueStatus: rescueId=${req.params.id}`);
        const { status, adminNotes } = req.body;

        const rescue = await RescueRequest.findByIdAndUpdate(
            req.params.id,
            { status, adminNotes: adminNotes || '' },
            { new: true, runValidators: true }
        );

        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        console.log(`[Admin Controller] Rescue ${rescue._id} status overridden to: ${status}`);
        res.status(200).json({ success: true, message: `Rescue status updated to '${status}'.`, rescue });
    } catch (error) {
        console.error('[Admin Controller] overrideRescueStatus error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAnalytics, getAllUsers, getPendingApprovals, approveUser, deleteUser, getAllRescues, overrideRescueStatus };
