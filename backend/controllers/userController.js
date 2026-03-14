const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Donation = require('../models/Donation');

const addOneMonth = (dateLike) => {
    const base = dateLike ? new Date(dateLike) : new Date();
    const next = new Date(base);
    next.setMonth(next.getMonth() + 1);
    return next;
};

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
 * @desc    Subscribe to monthly emergency funds in test wallet mode
 * @access  Private
 */
const subscribeEmergency = async (req, res) => {
    try {
        const contributionAmount = Number(req.body.amount) || 50;
        const user = await User.findById(req.user._id);

        if (contributionAmount < 10) {
            return res.status(400).json({ success: false, message: 'Minimum monthly contribution is ₹10.' });
        }

        if (user.walletBalance < contributionAmount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance for the first monthly contribution. Please top up your wallet and try again.',
            });
        }

        const startedAt = new Date();
        const nextPaymentDate = addOneMonth(startedAt);

        user.walletBalance -= contributionAmount;
        user.monthlySubscription = {
            isSubscribed: true,
            amount: contributionAmount,
            startedAt,
            lastDeductedAt: startedAt,
            nextPaymentDate,
            status: 'active',
            pausedUntil: null,
            cancelledAt: null,
            paymentSource: 'wallet_test',
        };
        await user.save();

        await WalletTransaction.create({
            user: user._id,
            amount: contributionAmount,
            type: 'debit',
            description: 'Monthly emergency fund contribution activated from wallet (test mode)',
            balanceAfter: user.walletBalance,
        });

        const payment = await Donation.create({
            user: user._id,
            amount: contributionAmount,
            type: 'subscription',
            status: 'active',
            paymentMethod: 'wallet',
            paymentSource: 'wallet_test',
            isGeneral: true,
            subscriptionStartedAt: startedAt,
            nextPaymentDate,
            note: 'First recurring contribution collected from wallet in test mode.',
        });

        res.status(200).json({
            success: true,
            message: 'Monthly emergency contribution started in test wallet mode.',
            monthlySubscription: user.monthlySubscription,
            walletBalance: user.walletBalance,
            payment,
        });
    } catch (error) {
        console.error('[User Controller] subscribeEmergency error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/user/payment-history
 * @desc    Get recurring payment history and wallet activity
 * @access  Private
 */
const getPaymentHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('walletBalance monthlySubscription');
        const [subscriptionPayments, walletTransactions] = await Promise.all([
            Donation.find({ user: req.user._id, type: 'subscription' }).sort({ createdAt: -1 }).limit(50),
            WalletTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50),
        ]);

        res.status(200).json({
            success: true,
            walletBalance: user.walletBalance,
            monthlySubscription: user.monthlySubscription,
            subscriptionPayments,
            walletTransactions,
            paymentModeMessage: user.monthlySubscription?.isSubscribed
                ? 'Recurring contributions are currently collected from wallet balance in test mode. UPI autopay can replace this later.'
                : 'Recurring contributions are currently disabled. Wallet top-up works now; UPI autopay can be added later.',
        });
    } catch (error) {
        console.error('[User Controller] getPaymentHistory error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/user/subscription/pause
 * @desc    Pause recurring support for one billing cycle
 * @access  Private
 */
const pauseSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const subscription = user?.monthlySubscription;

        if (!subscription?.isSubscribed || subscription.status !== 'active') {
            return res.status(400).json({ success: false, message: 'No active subscription found to pause.' });
        }

        const pausedUntil = addOneMonth(subscription.nextPaymentDate || new Date());
        subscription.status = 'paused';
        subscription.pausedUntil = pausedUntil;
        subscription.nextPaymentDate = pausedUntil;
        user.monthlySubscription = subscription;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Subscription paused for one billing cycle.',
            monthlySubscription: user.monthlySubscription,
        });
    } catch (error) {
        console.error('[User Controller] pauseSubscription error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/user/subscription/cancel
 * @desc    Cancel recurring support
 * @access  Private
 */
const cancelSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const previous = { ...user.monthlySubscription.toObject?.() };

        if (!previous?.isSubscribed) {
            return res.status(400).json({ success: false, message: 'No active subscription found to cancel.' });
        }

        user.monthlySubscription.isSubscribed = false;
        user.monthlySubscription.status = 'cancelled';
        user.monthlySubscription.cancelledAt = new Date();
        await user.save();

        await Donation.create({
            user: user._id,
            amount: previous.amount || 0,
            type: 'subscription',
            status: 'cancelled',
            paymentMethod: 'wallet',
            paymentSource: 'wallet_test',
            isGeneral: true,
            subscriptionStartedAt: previous.startedAt || null,
            nextPaymentDate: previous.nextPaymentDate || null,
            note: 'Recurring contribution cancelled by user.',
        });

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully.',
            monthlySubscription: user.monthlySubscription,
        });
    } catch (error) {
        console.error('[User Controller] cancelSubscription error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getWallet,
    getNgos,
    subscribeEmergency,
    getPaymentHistory,
    pauseSubscription,
    cancelSubscription,
};
