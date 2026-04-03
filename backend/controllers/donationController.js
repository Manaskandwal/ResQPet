const Donation = require('../models/Donation');
const RescueRequest = require('../models/RescueRequest');
const { getRazorpay } = require('../config/razorpay');
const crypto = require('crypto');

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

                // If goal is met, move it out of fundraiser state into ambulance pinging
                if (rescue.status === 'fundraiser_active' && rescue.amountRaised >= rescue.estimatedCost) {
                    rescue.status = 'ambulance_pinged';
                    console.log(`[Donation Controller] Fundraiser goal met for rescue ${rescue._id}. Pushing to ambulance dispatch.`);

                    // Start event-driven dispatch service
                    const { onRescueNeedsAmbulance } = require('../services/ambulanceDispatchService');
                    onRescueNeedsAmbulance(rescue._id).catch(err =>
                        console.error(`[Donation Controller] Failed to start ambulance dispatch: ${err.message}`)
                    );
                }

                await rescue.save();
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
            'fundraiser.status': 'approved',
            status: { $ne: 'completed' } 
        })
            .populate('user', 'name')
            .populate('assignedNGO', 'orgName name')
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

        const user = req.user;
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

        rescue.amountRaised += amount;
        
        // If goal met
        if (rescue.amountRaised >= rescue.fundraiser.requestedGoal) {
            rescue.statusLogs.push({
                status: rescue.status,
                message: `Fundraiser goal achieved! Pushing case back to queue for ambulance assignment.`,
                timestamp: new Date()
            });
            // Update the system to trigger dispatch
            rescue.fundraiser.status = 'none';
        }
        
        await rescue.save();

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
