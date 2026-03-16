const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Donation = require('../models/Donation');

const addBillingMonth = (dateLike) => {
    const base = dateLike ? new Date(dateLike) : new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const day = base.getDate();
    const targetMonth = month + 1;
    const targetYear = year + Math.floor(targetMonth / 12);
    const normalizedMonth = targetMonth % 12;
    const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();

    return new Date(
        targetYear,
        normalizedMonth,
        Math.min(day, lastDay),
        base.getHours(),
        base.getMinutes(),
        base.getSeconds(),
        base.getMilliseconds()
    );
};

const normalizeMonthlySubscription = (user) => {
    const current = user.monthlySubscription || {};
    const normalized = {
        isSubscribed: !!current.isSubscribed,
        amount: Number(current.amount || 0),
        startedAt: current.startedAt || current.lastDeductedAt || null,
        lastDeductedAt: current.lastDeductedAt || null,
        nextPaymentDate: current.nextPaymentDate || (current.lastDeductedAt ? addBillingMonth(current.lastDeductedAt) : null),
        status: current.isSubscribed ? (current.status && current.status !== 'inactive' ? current.status : 'active') : 'inactive',
        pausedUntil: current.pausedUntil || null,
        cancelledAt: current.cancelledAt || null,
        paymentSource: current.paymentSource || 'wallet_test',
    };

    user.monthlySubscription = normalized;
    return normalized;
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        normalizeMonthlySubscription(user);
        await user.save();
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('[User Controller] getProfile error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
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

        res.status(200).json({ success: true, message: 'Profile updated successfully.', user });
    } catch (error) {
        console.error('[User Controller] updateProfile error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getWallet = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('walletBalance');
        const transactions = await WalletTransaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('rescueRequest', 'description status');

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

const getNgos = async (req, res) => {
    try {
        const ngos = await User.find({ role: 'ngo', isApproved: true }).select('orgName address paymentDetails');
        res.status(200).json({ success: true, ngos });
    } catch (error) {
        console.error('[User Controller] getNgos error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const subscribeEmergency = async (req, res) => {
    try {
        const contributionAmount = Number(req.body.amount);
        const user = await User.findById(req.user._id);
        const current = normalizeMonthlySubscription(user);

        if (!Number.isFinite(contributionAmount) || contributionAmount < 10) {
            return res.status(400).json({ success: false, message: 'Minimum monthly contribution is Rs 10.' });
        }
        if (user.walletBalance < contributionAmount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance for the first monthly contribution. Please top up your wallet and try again.',
            });
        }

        const startedAt = new Date();
        const nextPaymentDate = addBillingMonth(startedAt);

        user.walletBalance -= contributionAmount;
        user.monthlySubscription = {
            ...current,
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
            description: 'Monthly emergency support started from wallet (test mode)',
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

const updateSubscriptionAmount = async (req, res) => {
    try {
        const amount = Number(req.body.amount);
        if (!Number.isFinite(amount) || amount < 10) {
            return res.status(400).json({ success: false, message: 'Minimum monthly support amount is Rs 10.' });
        }

        const user = await User.findById(req.user._id);
        const normalized = normalizeMonthlySubscription(user);

        user.monthlySubscription = {
            ...normalized,
            amount,
        };
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Monthly support amount updated.',
            monthlySubscription: user.monthlySubscription,
        });
    } catch (error) {
        console.error('[User Controller] updateSubscriptionAmount error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPaymentHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('walletBalance monthlySubscription');
        const monthlySubscription = normalizeMonthlySubscription(user);
        await user.save();

        const [subscriptionPayments, walletTransactions] = await Promise.all([
            Donation.find({ user: req.user._id, type: 'subscription' }).sort({ createdAt: -1 }).limit(50),
            WalletTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50),
        ]);

        res.status(200).json({
            success: true,
            walletBalance: user.walletBalance,
            monthlySubscription,
            subscriptionPayments,
            walletTransactions,
            paymentModeMessage: monthlySubscription.isSubscribed
                ? 'Recurring support currently deducts from wallet balance in test mode. This can later be replaced with UPI autopay.'
                : 'Recurring support is not active. Wallet top-up works now; UPI autopay can be added later.',
        });
    } catch (error) {
        console.error('[User Controller] getPaymentHistory error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const pauseSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const subscription = normalizeMonthlySubscription(user);

        if (!subscription.isSubscribed || subscription.status !== 'active') {
            return res.status(400).json({ success: false, message: 'No active subscription found to pause.' });
        }

        const pausedUntil = addBillingMonth(subscription.nextPaymentDate || new Date());
        user.monthlySubscription = {
            ...subscription,
            status: 'paused',
            pausedUntil,
            nextPaymentDate: pausedUntil,
        };
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

const resumeSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const subscription = normalizeMonthlySubscription(user);

        if (!subscription.isSubscribed || subscription.status !== 'paused') {
            return res.status(400).json({ success: false, message: 'No paused subscription found to resume.' });
        }

        user.monthlySubscription = {
            ...subscription,
            status: 'active',
            pausedUntil: null,
        };
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Subscription resumed. Your existing billing schedule is unchanged.',
            monthlySubscription: user.monthlySubscription,
        });
    } catch (error) {
        console.error('[User Controller] resumeSubscription error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const cancelSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const previous = normalizeMonthlySubscription(user);

        if (!previous.isSubscribed) {
            return res.status(400).json({ success: false, message: 'No active subscription found to cancel.' });
        }

        user.monthlySubscription = {
            ...previous,
            isSubscribed: false,
            status: 'inactive',
            cancelledAt: new Date(),
        };
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
    resumeSubscription,
    cancelSubscription,
    updateSubscriptionAmount,
};
