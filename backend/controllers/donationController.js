const Donation = require('../models/Donation');
const User = require('../models/User');
const RescueRequest = require('../models/RescueRequest');
const WalletTransaction = require('../models/WalletTransaction');
const { getRazorpay } = require('../config/razorpay');
const crypto = require('crypto');

const handleFundraiserGoalAchieved = async (rescue) => {
    try {
        console.log(`[Donation Controller] Fundraiser goal met for rescue ${rescue._id}. Pushing to ambulance dispatch.`);
        
        // 1. Update fundraiser status to completed
        rescue.fundraiser.status = 'completed';
        rescue.status = 'ambulance_pinged';
        
        rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
        rescue.statusLogs.push({
            status: rescue.status,
            message: `Fundraiser goal achieved (Raised ₹${rescue.amountRaised} of ₹${rescue.fundraiser.requestedGoal || rescue.estimatedCost}). Pushing case back to queue for ambulance assignment.`,
            timestamp: new Date()
        });
        
        await rescue.save();

        // 2. Fetch distinct successful donors for this rescue request
        const donorIds = await Donation.find({ 
            rescueRequest: rescue._id, 
            status: 'successful' 
        }).distinct('user');

        // 3. Create thank you notifications for all donors
        const Notification = require('../models/Notification');
        for (const donorId of donorIds) {
            try {
                await Notification.create({
                    recipient: donorId,
                    title: 'Fundraiser Success! Thank You ❤️',
                    message: `The fundraiser campaign for case #${rescue._id.toString().slice(-6).toUpperCase()} ("${rescue.description || 'Rescue Case'}") was successful, raising ₹${rescue.amountRaised}. Thank you so much for your donation!`,
                    type: 'system',
                    rescueRequest: rescue._id
                });
            } catch (notifErr) {
                console.error(`[Donation Controller] Failed to notify donor ${donorId}:`, notifErr.message);
            }
        }

        // 4. Trigger ambulance dispatch
        const { onRescueNeedsAmbulance } = require('../services/ambulanceDispatchService');
        onRescueNeedsAmbulance(rescue._id).catch(err =>
            console.error(`[Donation Controller] Failed to start ambulance dispatch: ${err.message}`)
        );

    } catch (err) {
        console.error('[Donation Controller] handleFundraiserGoalAchieved error:', err.message);
    }
};

/**
 * @route   POST /api/donation/create-order
 * @desc    Create a Razorpay order for a one-time donation
 * @access  Private
 */
const createDonationOrder = async (req, res) => {
    try {
        const { amount, rescueRequestId, isGeneral, message } = req.body;

        if (!amount || Number(amount) < 1) {
            return res.status(400).json({ success: false, message: 'Minimum donation is ₹1.' });
        }

        const razorpay = getRazorpay();

        const options = {
            amount: Math.round(Number(amount) * 100), // paise
            currency: 'INR',
            receipt: `don_${req.user._id}_${Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                rescueRequestId: rescueRequestId || '',
                isGeneral: isGeneral ? 'true' : 'false',
            },
        };

        const order = await razorpay.orders.create(options);

        // Pre-create the donation record as pending
        const donation = await Donation.create({
            user: req.user._id,
            rescueRequest: rescueRequestId || null,
            amount: Number(amount),
            type: 'one-time',
            status: 'pending',
            razorpayOrderId: order.id,
            message: message || '',
            isGeneral: !!isGeneral,
        });

        res.status(200).json({
            success: true,
            order,
            donationId: donation._id,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error('[Donation Controller] createDonationOrder error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create donation order.' });
    }
};

/**
 * @route   POST /api/donation/verify
 * @desc    Verify one-time donation payment
 * @access  Private
 */
const verifyDonation = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donationId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !donationId) {
            return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid signature.' });
        }

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation record not found.' });
        }

        donation.status = 'successful';
        donation.razorpayPaymentId = razorpay_payment_id;
        await donation.save();

        // If this was for a specific rescue case fundraiser, update the case
        if (donation.rescueRequest && !donation.isGeneral) {
            const rescue = await RescueRequest.findById(donation.rescueRequest);
            if (rescue && rescue.isFundraiser) {
                rescue.amountRaised += donation.amount;

                // Credit the NGO's wallet who is assigned to the case
                if (rescue.assignedNGO) {
                    const ngo = await User.findById(rescue.assignedNGO);
                    if (ngo) {
                        ngo.walletBalance = (ngo.walletBalance || 0) + donation.amount;
                        ngo.paymentHistory = ngo.paymentHistory || [];
                        ngo.paymentHistory.push({
                            amount: donation.amount,
                            type: 'credit',
                            description: `Donation received for Case #${rescue._id.toString().slice(-6).toUpperCase()}`,
                            timestamp: new Date()
                        });
                        await ngo.save();

                        // Record transaction for the NGO
                        await WalletTransaction.create({
                            user: ngo._id,
                            amount: donation.amount,
                            type: 'credit',
                            description: `Donation received for Case #${rescue._id.toString().slice(-6).toUpperCase()}`,
                            balanceAfter: ngo.walletBalance,
                        });
                        console.log(`[Donation] Credited ₹${donation.amount} to NGO ${ngo.orgName || ngo.name}. New balance: ₹${ngo.walletBalance}`);
                    }
                }

                // If goal is met, move it out of fundraiser state into ambulance pinging
                if (rescue.amountRaised >= (rescue.fundraiser.requestedGoal || rescue.estimatedCost)) {
                    await handleFundraiserGoalAchieved(rescue);
                } else {
                    await rescue.save();
                }
            }
        }

        res.status(200).json({ success: true, message: 'Donation successful!', donation });
    } catch (error) {
        console.error('[Donation Controller] verifyDonation error:', error.message);
        res.status(500).json({ success: false, message: 'Payment verification failed.' });
    }
};

/**
 * @route   POST /api/donation/subscribe
 * @desc    Create a Razorpay Subscription for Autopay donations
 * @access  Private
 */
const createSubscription = async (req, res) => {
    try {
        const { planId, totalCount } = req.body;
        // Requires a pre-created Plan ID on Razorpay dashboard
        if (!planId) {
            return res.status(400).json({ success: false, message: 'Plan ID from Razorpay is required for Autopay.' });
        }

        const razorpay = getRazorpay();

        const subscriptionOptions = {
            plan_id: planId,
            customer_notify: 1,
            total_count: totalCount || 12, // Default 1 year of monthly payments
            notes: {
                userId: req.user._id.toString()
            }
        };

        const subscription = await razorpay.subscriptions.create(subscriptionOptions);

        // Record as pending subscription
        const donation = await Donation.create({
            user: req.user._id,
            amount: 0, // Determined by the plan later
            type: 'subscription',
            status: 'pending',
            razorpaySubscriptionId: subscription.id,
            isGeneral: true,
        });

        res.status(200).json({
            success: true,
            subscription,
            donationId: donation._id,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error('[Donation Controller] createSubscription error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create subscription.' });
    }
};

/**
 * @route   POST /api/donation/verify-subscription
 * @desc    Verify Autopay subscription initiation
 * @access  Private
 */
const verifySubscription = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, donationId } = req.body;

        const body = razorpay_payment_id + '|' + razorpay_subscription_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid signature.' });
        }

        const donation = await Donation.findById(donationId);
        if (donation) {
            donation.status = 'active';
            donation.razorpayPaymentId = razorpay_payment_id;
            await donation.save();
        }

        res.status(200).json({ success: true, message: 'Autopay subscription active!', donation });
    } catch (error) {
        console.error('[Donation Controller] verifySubscription error:', error.message);
        res.status(500).json({ success: false, message: 'Subscription verification failed.' });
    }
};

/**
 * @route   GET /api/donation/fundraisers
 * @desc    Get all active public fundraisers
 * @access  Public
 */
const getPublicFundraisers = async (req, res) => {
    try {
        const fundraisers = await RescueRequest.find({
            isFundraiser: true,
            'fundraiser.status': 'approved'
        })
            .populate('user', 'name')
            .populate('assignedNGO', 'orgName name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: fundraisers.length, fundraisers });
    } catch (error) {
        console.error('[Donation Controller] getPublicFundraisers error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch fundraisers.' });
    }
};

/**
 * @route   POST /api/donation/donate-wallet
 * @desc    Donate to a fundraiser using wallet
 * @access  Private
 */
const donateWithWallet = async (req, res) => {
    try {
        const { rescueId, amount } = req.body;
        
        if (!amount || amount < 10) {
            return res.status(400).json({ success: false, message: 'Minimum donation is ₹10.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        if (user.walletBalance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
        }

        const rescue = await RescueRequest.findById(rescueId);
        if (!rescue || !rescue.isFundraiser || rescue.fundraiser.status !== 'approved') {
            return res.status(404).json({ success: false, message: 'Active fundraiser not found.' });
        }

        // Atomic deduction and logging
        user.walletBalance -= amount;
        user.paymentHistory.push({
            amount: amount,
            type: 'deduction',
            description: `Donation to Case #${rescue._id.toString().slice(-6).toUpperCase()}`,
            timestamp: new Date()
        });
        await user.save();

        // Create successful Donation document
        await Donation.create({
            user: user._id,
            rescueRequest: rescue._id,
            amount: amount,
            status: 'successful',
            paymentMethod: 'wallet',
            paymentSource: 'wallet',
        });

        rescue.amountRaised += amount;

        // Credit the NGO's wallet who is assigned to the case
        if (rescue.assignedNGO) {
            const ngo = await User.findById(rescue.assignedNGO);
            if (ngo) {
                ngo.walletBalance = (ngo.walletBalance || 0) + amount;
                ngo.paymentHistory = ngo.paymentHistory || [];
                ngo.paymentHistory.push({
                    amount: amount,
                    type: 'credit',
                    description: `Donation received for Case #${rescue._id.toString().slice(-6).toUpperCase()}`,
                    timestamp: new Date()
                });
                await ngo.save();

                // Record transaction for the NGO
                await WalletTransaction.create({
                    user: ngo._id,
                    amount: amount,
                    type: 'credit',
                    description: `Donation received for Case #${rescue._id.toString().slice(-6).toUpperCase()}`,
                    balanceAfter: ngo.walletBalance,
                });
                console.log(`[Donation] Credited ₹${amount} to NGO ${ngo.orgName || ngo.name}. New balance: ₹${ngo.walletBalance}`);
            }
        }
        
        rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
        
        // If goal met
        if (rescue.amountRaised >= (rescue.fundraiser.requestedGoal || rescue.estimatedCost)) {
            await handleFundraiserGoalAchieved(rescue);
        } else {
            await rescue.save();
        }

        res.status(200).json({ 
            success: true, 
            message: `Successfully donated ₹${amount}!`,
            walletBalance: user.walletBalance,
            amountRaised: rescue.amountRaised
        });

    } catch (error) {
        console.error('[Donation Controller] donateWithWallet error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to process donation.' });
    }
};

module.exports = { createDonationOrder, verifyDonation, createSubscription, verifySubscription, getPublicFundraisers, donateWithWallet };
