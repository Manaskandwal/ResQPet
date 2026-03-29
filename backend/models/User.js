const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Covers all 5 roles: user, ngo, hospital, ambulance, admin
 * walletBalance is only meaningful for 'user' role
 */
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: function() { return !this.googleId; }, // Required only if not a Google user
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // never returned by default
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true, // Unique but allows multiple nulls
        },
        role: {
            type: String,
            enum: ['user', 'ngo', 'hospital', 'ambulance', 'admin'],
            default: 'user',
        },
        // True only for admin users — grants account-switching privileges
        isAdmin: {
            type: Boolean,
            default: false,
        },
        // Only for role='user'
        walletBalance: {
            type: Number,
            default: 0,
            min: [0, 'Wallet balance cannot be negative'],
        },
        // Admin approves NGO, hospital, ambulance accounts
        isApproved: {
            type: Boolean,
            default: function () {
                // Users and admins are auto-approved; NGO/hospital/ambulance need admin approval
                return this.role === 'user' || this.role === 'admin';
            },
        },
        // Profile location (for proximity matching)
        location: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        profileImage: {
            type: String,
            default: '',
        },
        // Organisation name for ngo/hospital/ambulance
        orgName: {
            type: String,
            trim: true,
            default: '',
        },
        // Registration/license number for organisations
        regNumber: {
            type: String,
            trim: true,
            default: '',
        },
        // Address for organisations
        address: {
            type: String,
            trim: true,
            default: '',
        },
        // For ambulance: linked hospital
        linkedHospital: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        ambulanceType: {
            type: String,
            enum: ['linked', 'independent', 'na'],
            default: 'na', // 'na' for non-ambulance roles
        },
        // For ambulance: vehicle number
        vehicleNumber: {
            type: String,
            trim: true,
            default: '',
        },
        // For hospital/ngo/ambulance: availability toggle for routing
        isAvailable: {
            type: Boolean,
            default: true,
        },
        // For hospital/ambulance: Govt vs Pvt routing
        isGovernment: {
            type: Boolean,
            default: false,
        },
        // For hospital/ngo: capacity
        capacity: {
            type: Number,
            default: 10,
        },
        // Monthly Recurring Subscription (Emergency Funds)
        monthlySubscription: {
            isSubscribed: { type: Boolean, default: false },
            amount: { type: Number, default: 0 },
            startedAt: { type: Date, default: null },
            lastDeductedAt: { type: Date, default: null },
            nextPaymentDate: { type: Date, default: null },
            status: {
                type: String,
                enum: ['inactive', 'active', 'paused', 'cancelled'],
                default: 'inactive',
            },
            pausedUntil: { type: Date, default: null },
            cancelledAt: { type: Date, default: null },
            paymentSource: {
                type: String,
                enum: ['wallet_test', 'upi_future'],
                default: 'wallet_test',
            },
        },
        // NGO Payment Config (configured by admin or NGO)
        paymentDetails: {
            upiId: { type: String, default: '' },
            accountHolder: { type: String, default: '' },
            accountNumber: { type: String, default: '' },
            bankName: { type: String, default: '' },
            ifsc: { type: String, default: '' },
        },
    },
    {
        timestamps: true,
    }
);

// ─── Pre-save hook: hash password ────────────────────────────────────────────
userSchema.pre('save', async function (next) {
    try {
        if (!this.password || !this.isModified('password')) return next();
        console.log(`[User Model] Hashing password for user: ${this.email}`);
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        console.error('[User Model] Password hashing error:', error.message);
        next(error);
    }
});

// ─── Method: compare entered password with stored hash ───────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        console.error('[User Model] Password comparison error:', error.message);
        throw error;
    }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
