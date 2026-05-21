const User = require('../models/User');
const RescueRequest = require('../models/RescueRequest');
const WalletTransaction = require('../models/WalletTransaction');
const Donation = require('../models/Donation');
const AuditLog = require('../models/AuditLog');
const { emitRescueUpdate } = require('../config/socket');
const { notifyUsers } = require('../services/notificationService');

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
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentRequests = await RescueRequest.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        // Chart Data Aggregations
        const [dailyCases, monthlyCases, dailyDonations, totalDonationsAgg] = await Promise.all([
            // Daily cases (last 30 days)
            RescueRequest.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }},
                { $sort: { _id: 1 } }
            ]),
            // Monthly cases (overall or last year)
            RescueRequest.aggregate([
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }},
                { $sort: { _id: 1 } }
            ]),
            // Daily donations (last 30 days) successful only
            Donation.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo }, status: 'successful' } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    amount: { $sum: "$amount" }
                }},
                { $sort: { _id: 1 } }
            ]),
            // Total overall successful donations
            Donation.aggregate([
                { $match: { status: 'successful' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
        ]);

        const totalDonations = totalDonationsAgg.length > 0 ? totalDonationsAgg[0].total : 0;

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
                totalDonations,
                chartData: {
                    dailyCases,
                    monthlyCases,
                    dailyDonations
                }
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
        const { approve, isGovernment } = req.body; // allow admin to set/update isGovernment at approval

        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        if (!['ngo', 'hospital', 'ambulance'].includes(user.role)) {
            return res.status(400).json({ success: false, message: 'Only NGO, hospital, and ambulance accounts require approval.' });
        }

        user.isApproved = approve !== false; // default to approve if not specified
        // Admin can override the isGovernment flag during approval
        if (typeof isGovernment === 'boolean' && ['hospital', 'ambulance'].includes(user.role)) {
            user.isGovernment = isGovernment;
            console.log(`[Admin Controller] isGovernment set to ${isGovernment} for ${user.email}`);
        }
        await user.save();
        await notifyUsers(user._id, {
            title: user.isApproved ? 'Account Approved' : 'Approval Revoked',
            message: user.isApproved
                ? 'Your VetsCue partner account has been approved. You can now use your role dashboard.'
                : 'Your VetsCue partner account approval has been revoked.',
            type: 'approval_granted',
        });

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

        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        const oldStatus = rescue.status;
        rescue.status = status;
        if (adminNotes) rescue.adminNotes = adminNotes;

        // If the case is being closed or cancelled, and it had an assigned ambulance, reset their availability
        const isClosing = ['completed', 'cancelled', 'closed_unresolved'].includes(status);
        if (isClosing && rescue.assignedAmbulance) {
            await User.findByIdAndUpdate(rescue.assignedAmbulance, { isAvailable: true });
            console.log(`[Admin Controller] Restored availability for ambulance: ${rescue.assignedAmbulance}`);
        }

        await rescue.save();

        console.log(`[Admin Controller] Rescue ${rescue._id} status overridden from ${oldStatus} to: ${status}`);
        res.status(200).json({ success: true, message: `Rescue status updated to '${status}'.`, rescue });
    } catch (error) {
        console.error('[Admin Controller] overrideRescueStatus error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/admin/users/:userId/location
 * @desc    Admin sets the base location (lat, lng) for an NGO/Hospital/Ambulance
 * @access  Private (admin only)
 */
const setUserLocation = async (req, res) => {
    try {
        const { lat, lng, address } = req.body;

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ success: false, message: 'lat and lng are required.' });
        }

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        if (isNaN(latNum) || isNaN(lngNum)) {
            return res.status(400).json({ success: false, message: 'lat and lng must be valid numbers.' });
        }

        if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
            return res.status(400).json({ success: false, message: 'Invalid coordinates. lat: -90 to 90, lng: -180 to 180.' });
        }

        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        if (!['ngo', 'hospital', 'ambulance'].includes(user.role)) {
            return res.status(400).json({ success: false, message: 'Location can only be set for NGO, Hospital, or Ambulance accounts.' });
        }

        user.location = { lat: latNum, lng: lngNum, address: address || '' };
        await user.save();

        console.log(`[Admin Controller] Location set for ${user.role} ${user.email}: lat=${latNum}, lng=${lngNum}`);
        res.status(200).json({
            success: true,
            message: `Base location updated for ${user.orgName || user.name}.`,
            location: user.location,
        });
    } catch (error) {
        console.error('[Admin Controller] setUserLocation error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get security audit logs (impersonations)
 * @access  Private (admin only)
 */
const getAuditLogs = async (req, res) => {
    try {
        console.log('[Admin Controller] getAuditLogs requested');
        const logs = await AuditLog.find()
            .populate('adminId', 'name email')
            .populate('targetId', 'name email')
            .sort({ timestamp: -1 })
            .limit(100);

        res.status(200).json({ success: true, logs });
    } catch (error) {
        console.error('[Admin Controller] getAuditLogs error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PATCH /api/admin/users/:userId/meta
 * @desc    Admin updates user metadata (isGovernment, isAvailable, etc.)
 * @access  Private (admin only)
 */
const updateUserMeta = async (req, res) => {
    try {
        const { isGovernment, isAvailable } = req.body;
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        if (typeof isGovernment === 'boolean') {
            if (!['hospital', 'ambulance'].includes(user.role)) {
                return res.status(400).json({ success: false, message: 'isGovernment can only be set for hospital or ambulance.' });
            }
            user.isGovernment = isGovernment;
        }
        if (typeof isAvailable === 'boolean') {
            user.isAvailable = isAvailable;
        }
        await user.save();
        console.log(`[Admin Controller] User meta updated: ${user.email}`);
        res.status(200).json({ success: true, message: 'User metadata updated.', user });
    } catch (error) {
        console.error('[Admin Controller] updateUserMeta error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/admin/fundraisers
 * @desc    Get all cases that have a requested or active fundraiser
 * @access  Private (admin only)
 */
const getFundraisers = async (req, res) => {
    try {
        const { status } = req.query; // 'pending', 'approved', 'rejected'
        const query = { 
            'fundraiser.status': { $ne: 'none' } 
        };
        
        if (status) {
            query['fundraiser.status'] = status;
        }

        const fundraisers = await RescueRequest.find(query)
            .sort({ 'fundraiser.requestedAt': -1 })
            .populate('user', 'name email')
            .populate('assignedNGO', 'name orgName');

        res.status(200).json({ success: true, count: fundraisers.length, fundraisers });
    } catch (error) {
        console.error('[Admin Controller] getFundraisers error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/admin/rescue/:id/fundraiser/review
 * @desc    Approve or reject a fundraiser request
 * @access  Private (admin only)
 */
const reviewFundraiser = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, adminNotes } = req.body; // 'approve' or 'reject'

        const rescue = await RescueRequest.findById(id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Case not found' });

        if (rescue.fundraiser.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Fundraiser is currently ${rescue.fundraiser.status}, cannot be reviewed.` });
        }

        if (action === 'approve') {
            rescue.fundraiser.status = 'approved';
            rescue.isFundraiser = true;
            rescue.estimatedCost = rescue.fundraiser.requestedGoal; // Initialize actual tracking goal
            rescue.fundraiser.adminNotes = adminNotes || '';
            
            rescue.statusLogs.push({
                status: rescue.status,
                message: `Fundraiser request for ₹${rescue.fundraiser.requestedGoal} was APPROVED by Admin.`,
                timestamp: new Date()
            });

            await rescue.save();
            await notifyUsers(rescue.user, {
                title: 'Fundraiser Approved',
                message: 'Your fundraiser request is now live for donations.',
                type: 'system',
                rescueRequest: rescue._id,
            });
            emitRescueUpdate(rescue._id, rescue.status, { message: 'Your fundraiser request has been approved and is now live!' });
            res.status(200).json({ success: true, message: 'Fundraiser approved.', rescue });

        } else if (action === 'reject') {
            rescue.fundraiser.status = 'rejected';
            rescue.fundraiser.adminNotes = adminNotes || '';
            
            rescue.statusLogs.push({
                status: rescue.status,
                message: `Fundraiser request was REJECTED by Admin. Reason: ${adminNotes || 'Not provided'}.`,
                timestamp: new Date()
            });

            await rescue.save();
            await notifyUsers(rescue.user, {
                title: 'Fundraiser Rejected',
                message: adminNotes || 'Your fundraiser request was rejected by admin.',
                type: 'system',
                rescueRequest: rescue._id,
            });
            emitRescueUpdate(rescue._id, rescue.status, { message: 'Your fundraiser request was rejected.' });
            res.status(200).json({ success: true, message: 'Fundraiser rejected.', rescue });

        } else {
            return res.status(400).json({ success: false, message: 'Invalid action. Use approve or reject.' });
        }
    } catch (error) {
        console.error('[Admin Controller] reviewFundraiser error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
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
    reviewFundraiser,
};
