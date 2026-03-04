const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * @route   GET /api/user/profile
 * @desc    Get current user profile
 * @access  Private
 */
const getProfile = async (req, res) => {
    try {
        console.log(`[User Controller] getProfile for userId: ${req.user._id}`);
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('[User Controller] getProfile error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile (name, phone, location, orgName, address)
 * @access  Private
 */
const updateProfile = async (req, res) => {
    try {
        console.log(`[User Controller] updateProfile for userId: ${req.user._id}`);
        const { name, phone, location, orgName, address, vehicleNumber, capacity } = req.body;

        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (phone !== undefined) updatedFields.phone = phone;
        if (location?.lat !== undefined && location?.lng !== undefined) updatedFields.location = location;
        if (orgName !== undefined) updatedFields.orgName = orgName;
        if (address !== undefined) updatedFields.address = address;
        if (vehicleNumber !== undefined) updatedFields.vehicleNumber = vehicleNumber;
        if (capacity !== undefined) updatedFields.capacity = capacity;

        const user = await User.findByIdAndUpdate(req.user._id, updatedFields, {
            new: true,
            runValidators: true,
        }).select('-password');

        console.log(`[User Controller] Profile updated for: ${user.email}`);
        res.status(200).json({ success: true, message: 'Profile updated successfully.', user });
    } catch (error) {
        console.error('[User Controller] updateProfile error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/user/wallet
 * @desc    Get wallet balance and transaction history
 * @access  Private (user role only)
 */
const getWallet = async (req, res) => {
    try {
        console.log(`[User Controller] getWallet for userId: ${req.user._id}`);
        const user = await User.findById(req.user._id).select('walletBalance name email');

        const transactions = await WalletTransaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('rescueRequest', 'description status');

        console.log(`[User Controller] Fetched ${transactions.length} transactions for userId: ${req.user._id}`);
        res.status(200).json({
            success: true,
            walletBalance: user.walletBalance,
            transactions,
        });
    } catch (error) {
        console.error('[User Controller] getWallet error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/user/ngos
 * @desc    Get all active NGOs with payment details
 * @access  Private
 */
const getNgos = async (req, res) => {
    try {
        const ngos = await User.find({ role: 'ngo', isApproved: true })
            .select('orgName address paymentDetails');
        res.status(200).json({ success: true, ngos });
    } catch (error) {
        console.error('[User Controller] getNgos error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/user/subscribe-emergency
 * @desc    Subscribe to monthly emergency funds
 * @access  Private
 */
const subscribeEmergency = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.user._id);

        user.monthlySubscription = {
            isSubscribed: true,
            amount: amount || 50,
            lastDeductedAt: new Date(),
        };

        await user.save();
        res.status(200).json({ success: true, message: 'Subscribed to Emergency Fund' });
    } catch (error) {
        console.error('[User Controller] subscribeEmergency error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getProfile, updateProfile, getWallet, getNgos, subscribeEmergency };
