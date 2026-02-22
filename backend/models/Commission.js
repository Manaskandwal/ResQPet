const mongoose = require('mongoose');

/**
 * Commission Schema — Future-ready. Inactive in Phase 1.
 * Tracks platform revenue per service transaction.
 *
 * Activated in Phase 2 when paid ambulance / consultation / marketplace goes live.
 */
const commissionSchema = new mongoose.Schema(
    {
        serviceProvider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Phase 2: expanded to ambulance, consultation, marketplace
        serviceType: {
            type: String,
            enum: ['rescue', 'ambulance', 'consultation', 'marketplace'],
            default: 'rescue',
        },

        // Gross amount charged to the end user (₹)
        grossAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        // ResQPaws platform commission rate (0–1 decimal, e.g., 0.10 = 10%)
        commissionRate: {
            type: Number,
            required: true,
            default: 0.10, // 10% default — editable per agreement
            min: 0,
            max: 1,
        },

        // Calculated: grossAmount * commissionRate
        commissionAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        // Net amount paid out to service provider
        netAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: ['pending', 'settled', 'disputed'],
            default: 'pending',
        },

        // Linked records
        rescueRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RescueRequest',
        },

        // Razorpay payout reference (Phase 2)
        payoutReference: {
            type: String,
            default: null,
        },

        notes: {
            type: String,
            maxlength: 500,
        },

        settledAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Index for revenue analytics
commissionSchema.index({ serviceProvider: 1, status: 1 });
commissionSchema.index({ serviceType: 1, createdAt: -1 });

module.exports = mongoose.model('Commission', commissionSchema);
