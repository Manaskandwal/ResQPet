const mongoose = require('mongoose');

/**
 * WalletTransaction Schema
 * Records every credit and debit operation on a user's wallet.
 * Maintains a full audit trail for compliance and debugging.
 */
const walletTransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Amount must be positive'],
        },
        type: {
            type: String,
            enum: ['credit', 'debit', 'refund'],
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        // Razorpay payment details (only for 'credit' transactions)
        razorpayOrderId: {
            type: String,
            default: null,
        },
        razorpayPaymentId: {
            type: String,
            default: null,
        },
        // Linked rescue request (for debit/refund transactions)
        rescueRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RescueRequest',
            default: null,
        },
        // Wallet balance AFTER this transaction (for easy auditing)
        balanceAfter: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient user-specific queries
walletTransactionSchema.index({ user: 1, createdAt: -1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
module.exports = WalletTransaction;
