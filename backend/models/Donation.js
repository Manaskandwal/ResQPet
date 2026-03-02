const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // If linked to a specific rescue case (fundraiser)
        rescueRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RescueRequest',
            default: null,
        },
        amount: {
            type: Number,
            required: true,
            min: [1, 'Amount must be at least ₹1'],
        },
        currency: {
            type: String,
            default: 'INR',
        },
        // 'one-time' or 'subscription' (autopay)
        type: {
            type: String,
            enum: ['one-time', 'subscription'],
            default: 'one-time',
        },
        status: {
            type: String,
            enum: ['pending', 'successful', 'failed', 'refunded', 'active', 'cancelled'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            default: 'razorpay',
        },
        // Razorpay specifics
        razorpayOrderId: {
            type: String,
            default: null,
        },
        razorpayPaymentId: {
            type: String,
            default: null,
        },
        razorpaySubscriptionId: {
            type: String,
            default: null,
        },
        // Optional message from donor
        message: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },
        // For general donations not tied to a specific case
        isGeneral: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

// Indexes for faster lookups based on use cases (e.g., all donations for a case, all subs for a user)
donationSchema.index({ user: 1, type: 1 });
donationSchema.index({ rescueRequest: 1, status: 1 });
donationSchema.index({ isGeneral: 1, status: 1 });

const Donation = mongoose.model('Donation', donationSchema);
module.exports = Donation;
