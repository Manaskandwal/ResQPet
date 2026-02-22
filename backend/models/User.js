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
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // never returned by default
        },
        role: {
            type: String,
            enum: ['user', 'ngo', 'hospital', 'ambulance', 'admin'],
            default: 'user',
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
                // Users and admin are auto-approved; others need admin approval
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
        // For ambulance: vehicle number
        vehicleNumber: {
            type: String,
            trim: true,
            default: '',
        },
        // For ambulance: availability
        isAvailable: {
            type: Boolean,
            default: true,
        },
        // For hospital/ngo: capacity
        capacity: {
            type: Number,
            default: 10,
        },
    },
    {
        timestamps: true,
    }
);

// ─── Pre-save hook: hash password ────────────────────────────────────────────
userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next();
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
