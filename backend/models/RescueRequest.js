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
 *   For refund disputes: email resqpaws.support@gmail.com
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
                'ngo_accepted',
                'hospital_escalated',
                'ambulance_assigned',
                'en_route',
                'picked_up',
                'delivered',
                'completed',
                'cancelled',
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
        escalatedAt: { type: Date, default: null },
        ambulanceAssignedAt: { type: Date, default: null },
        enRouteAt: { type: Date, default: null },
        pickedUpAt: { type: Date, default: null },
        deliveredAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },

        // Admin override notes
        adminNotes: {
            type: String,
            default: '',
        },
        // NGOs that rejected this case (to avoid showing them the same request again)
        rejectedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],

        // ─── Future-Ready Fields (Phase 2) ────────────────────────────────────────
        // Service type — extended beyond rescue in Phase 2
        serviceType: {
            type: String,
            enum: ['rescue', 'ambulance', 'consultation', 'marketplace'],
            default: 'rescue',
        },

        // Payment status for paid services (rescue deposit tracked separately above)
        // Refund disputes: resqpaws.support@gmail.com
        paymentStatus: {
            type: String,
            enum: ['na', 'pending', 'paid', 'refunded', 'disputed'],
            default: 'na', // 'na' = not applicable (free rescue in Phase 1)
        },

        // Commission record reference (populated when serviceType is paid in Phase 2)
        commission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Commission',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient proximity/status queries
rescueRequestSchema.index({ 'location.lat': 1, 'location.lng': 1 });
rescueRequestSchema.index({ status: 1, createdAt: 1 });

const RescueRequest = mongoose.model('RescueRequest', rescueRequestSchema);
module.exports = RescueRequest;
