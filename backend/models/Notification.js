const mongoose = require('mongoose');

/**
 * Notification Schema
 * Stores in-app notifications for all users.
 * Phase 1: rescue-related notifications.
 * Phase 2: payment alerts, marketing, system broadcasts.
 */
const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            maxlength: 100,
        },

        message: {
            type: String,
            required: true,
            maxlength: 500,
        },

        type: {
            type: String,
            enum: [
                'rescue_new',        // New rescue submitted nearby
                'rescue_escalated',  // Rescue escalated after 5 min
                'rescue_accepted',   // NGO / hospital accepted
                'rescue_completed',  // Rescue marked completed
                'wallet_credit',     // Wallet topped up
                'wallet_debit',      // Deposit deducted
                'wallet_refund',     // Deposit refunded
                'approval_granted',  // Admin approved account
                'system',            // General system message
            ],
            default: 'system',
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        // Optional link to the related rescue request
        rescueRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RescueRequest',
            default: null,
        },

        // Optional link for payment-related notifications (Phase 2)
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WalletTransaction',
            default: null,
        },
    },
    { timestamps: true }
);

// Compound index for fetching unread notifications for a user
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
