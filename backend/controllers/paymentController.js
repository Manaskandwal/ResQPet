const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { getRazorpay } = require('../config/razorpay');
const crypto = require('crypto');

/**
 * @route   POST /api/payment/create-order
 * @desc    Create a Razorpay order for wallet top-up
 * @access  Private (user only)
 */
const createOrder = async (req, res) => {
    try {
        console.log(`[Payment] Create order request from userId: ${req.user._id}`);
        const { amount } = req.body; // amount in INR (e.g., 100)

        if (!amount || isNaN(amount) || Number(amount) < 10) {
            return res.status(400).json({ success: false, message: 'Minimum top-up amount is ₹10.' });
        }

        const razorpay = getRazorpay();

        const options = {
            amount: Math.round(Number(amount) * 100), // Razorpay expects paise
            currency: 'INR',
            receipt: `wallet_topup_${req.user._id}_${Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                purpose: 'PawSaarthi Wallet Top-up',
            },
        };

        console.log('[Payment] Creating Razorpay order with options:', options);
        const order = await razorpay.orders.create(options);
        console.log(`[Payment] Razorpay order created: ${order.id}`);

        res.status(200).json({
            success: true,
            order,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error('[Payment] createOrder error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Failed to create payment order.' });
    }
};

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay signature and credit user wallet
 * @access  Private (user only)
 *
 * Security: HMAC-SHA256 signature verification using Razorpay secret.
 * Wallet is ONLY credited after successful verification.
 */
const verifyPayment = async (req, res) => {
    try {
        console.log(`[Payment] Verify payment request from userId: ${req.user._id}`);
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
            return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });
        }

        // ── HMAC-SHA256 Signature Verification ───────────────────────────────────
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error('[Payment] Signature mismatch! Possible tampered request.');
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }

        console.log(`[Payment] Signature verified for orderId: ${razorpay_order_id}`);

        // ── Credit Wallet ─────────────────────────────────────────────────────────
        const creditAmount = Number(amount); // amount in INR
        const user = await User.findById(req.user._id);
        user.walletBalance += creditAmount;
        await user.save();

        // ── Record Transaction ────────────────────────────────────────────────────
        const txn = await WalletTransaction.create({
            user: user._id,
            amount: creditAmount,
            type: 'credit',
            description: `Wallet top-up via Razorpay`,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            balanceAfter: user.walletBalance,
        });
        console.log(`[Payment] Wallet credited ₹${creditAmount} for userId: ${user._id}. New balance: ₹${user.walletBalance}`);

        res.status(200).json({
            success: true,
            message: `₹${creditAmount} added to your wallet successfully!`,
            walletBalance: user.walletBalance,
            transaction: txn,
        });
    } catch (error) {
        console.error('[Payment] verifyPayment error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Payment verification failed.' });
    }
};

module.exports = { createOrder, verifyPayment };
