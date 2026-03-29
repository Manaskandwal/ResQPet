const mongoose = require('mongoose');

/**
 * RescueRequest Schema
 *
 * Status flow (Phase 1):
 *   pending
 *     → ngo_accepted       (NGO accepts within 5 min)
 *     → hospital_escalated (cron escalates after 5 min if still pending)
 *       → ambulance_assigned (hospital assigns ambulance)
 *         → en_route → picked_up → delivered → completed (deposit refunded)
 *
 * Future-ready fields:
 *   serviceType  — extended to ambulance / consultation / marketplace in Phase 2
 *   paymentStatus — tracks paid services; rescue deposit uses separate depositDeducted/Refunded
 *   For refund disputes: email VetsCue.support@gmail.com
 *
 * Media: up to 5 images + 1 video (max ~2 min ≈ 200MB cap)
 */
const rescueRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        animalType: {
            type: String,
            enum: ['dog', 'cat', 'other'],
            default: 'dog',
        },
        animalTypeOther: {
            type: String,
            trim: true,
            default: '',
        },
        // Up to 5 image URLs from Cloudinary
        images: {
            type: [String],
            validate: {
                validator: (arr) => arr.length <= 5,
                message: 'Maximum 5 images allowed',
            },
            default: [],
        },
        // Optional video URL from Cloudinary (max 2 min enforced on frontend/multer)
        video: {
            type: String,
            default: null,
        },
        // Geolocation captured from browser
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
            address: { type: String, default: '' }, // reverse geocode label (optional)
        },
        status: {
            type: String,
            enum: [
                'pending',
                'accepted',
                'scheduled',
                'on_the_way',
                'reached',
                'treating',
                'ngo_accepted',
                'hospital_escalated',
                'hospital_broadcasted', // Waiting for any hospital to accept
                'hospital_accepted',
                'ambulance_pinged',     // Waiting for specific ambulance to accept
                'ambulance_assigned',   // Ambulance accepted
                'en_route',
                'picked_up',
                'delivered',
                'resolved_on_spot',     // NGO treated at scene
                'completed',
                'cancelled',
                'closed_unresolved',
                'fundraiser_active',    // Waiting for public donations to meet goal
                'refunded',             // Deposit/payment refunded
            ],
            default: 'pending',
        },
        // ₹20 deposit tracking
        depositDeducted: {
            type: Boolean,
            default: false,
        },
        depositRefunded: {
            type: Boolean,
            default: false,
        },
        depositAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        // Assigned entities
        assignedNGO: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        assignedHospital: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        assignedAmbulance: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        // Timestamps for SLA tracking
        acceptedAt: { type: Date, default: null },
        scheduleDate: { type: Date, default: null },
        escalatedAt: { type: Date, default: null },
        ambulanceAssignedAt: { type: Date, default: null },
        enRouteAt: { type: Date, default: null },
        pickedUpAt: { type: Date, default: null },
        deliveredAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        closedAt: { type: Date, default: null },
        workStartedAt: { type: Date, default: null },
        outcome: {
            type: String,
            enum: ['pending', 'on_spot_treated', 'hospital_treated', 'closed_unresolved'],
            default: 'pending',
        },

        // Admin override notes
        adminNotes: {
            type: String,
            default: '',
        },
        // NGOs or Hospitals that rejected this case
        rejectedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        rejectedHospitals: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        // For Uber-style pinging: track which ambulances declined to avoid re-pinging
        pingRejectors: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        // For Uber-style pinging: track active staggered pings (each has 20 min window)
        activeAmbulancePings: [
            {
                ambulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                pingedAt: { type: Date, default: Date.now }
            }
        ],
        // Transportation choices
        transportType: {
            type: String,
            enum: ['na', 'self', 'ambulance'],
            default: 'na',
        },
        ngoTransporting: {
            type: Boolean,
            default: false,
        },
        // Financial tracking for Fundraisers
        isFundraiser: {
            type: Boolean,
            default: false,
        },
        estimatedCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        amountRaised: {
            type: Number,
            default: 0,
            min: 0,
        },
        followUps: {
            type: [
                {
                    scheduledFor: { type: Date, required: true },
                    notes: { type: String, trim: true, default: '' },
                    status: {
                        type: String,
                        enum: ['scheduled', 'completed', 'cancelled', 'escalated'],
                        default: 'scheduled',
                    },
                    createdAt: { type: Date, default: Date.now },
                    completedAt: { type: Date, default: null },
                },
            ],
            default: [],
        },
        statusLogs: {
            type: [
                {
                    status: { type: String, default: '' },
                    message: { type: String, default: '' },
                    timestamp: { type: Date, default: Date.now },
                    images: { type: [String], default: [] },
                    video: { type: String, default: null },
                },
            ],
            default: [],
        },

        // ─── Future-Ready Fields (Phase 2) ────────────────────────────────────────
        // Service type — extended beyond rescue in Phase 2
        serviceType: {
            type: String,
            enum: ['rescue', 'ambulance', 'consultation', 'marketplace'],
            default: 'rescue',
        },

        // Payment status for paid services (rescue deposit tracked separately above)
        // Refund disputes: VetsCue.support@gmail.com
        paymentStatus: {
            type: String,
            enum: ['na', 'pending', 'paid', 'refunded', 'disputed'],
            default: 'na', // 'na' = not applicable (free rescue in Phase 1)
        },
        impact: {
            likes: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            ],
            comments: [
                {
                    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                    name: { type: String, default: '' },
                    message: { type: String, required: true, trim: true, maxlength: 300 },
                    createdAt: { type: Date, default: Date.now },
                },
            ],
        },

        // Commission record reference (populated when serviceType is paid in Phase 2)
        commission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Commission',
            default: null,
        },

        // ─── Hospital Billing (Phase 1) ───────────────────────────────────────────
        bill: {
            // Line items (private hospitals)
            items: [{
                name: { type: String, default: '' },
                amount: { type: Number, default: 0 },
            }],
            // Government hospitals: upload prescription image + estimated cost
            prescriptionImageUrl: { type: String, default: null },
            // Total billed amount
            totalAmount: { type: Number, default: 0 },
            // Who the bill was sent to
            sentTo: { type: String, enum: ['user', 'ngo', null], default: null },
            // Payment tracking via wallet
            paidStatus: { type: String, enum: ['pending', 'paid', 'waived'], default: 'pending' },
            // WalletTransaction reference when paid
            walletTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction', default: null },
            createdAt: { type: Date, default: null },
        },

        // Hospital treatment status updates
        treatmentStatus: {
            type: String,
            enum: ['not_started', 'admitted', 'under_treatment', 'treatment_complete', 'discharged'],
            default: 'not_started',
        },
        hospitalNote: { type: String, default: '' },
    },
    {
        timestamps: true,
    }
);

// Index for efficient proximity/status queries
rescueRequestSchema.index({ 'location.lat': 1, 'location.lng': 1 });
rescueRequestSchema.index({ status: 1, createdAt: 1 });

// Pre-save hook to cap status logs
rescueRequestSchema.pre('save', function (next) {
    if (this.statusLogs && this.statusLogs.length > 50) {
        this.statusLogs = this.statusLogs.slice(-50);
    }
    next();
});

const RescueRequest = mongoose.model('RescueRequest', rescueRequestSchema);
module.exports = RescueRequest;
