const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);
const TokenBlacklist = require('../models/TokenBlacklist');
const jwt = require('jsonwebtoken');

/**
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        // Decode token to find expiration
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
            await TokenBlacklist.create({
                token,
                expiresAt: new Date(decoded.exp * 1000)
            });
        }
        
        // Log impersonation end if applicable
        if (req.user && req.user.impersonating) {
            await AuditLog.create({
                adminId: req.user.impersonating.adminId || req.user._id,
                targetId: req.user.impersonating.userId,
                action: 'impersonation_stop',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                details: { targetEmail: req.user.impersonating.email }
            });
            console.log(`[Auth] Admin ${req.user.impersonating.adminEmail || req.user.email} stopped impersonating: ${req.user.impersonating.email}`);
        }
    }

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, orgName, regNumber, address, vehicleNumber, hospitalType } = req.body;

    // Robust validation
    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'Missing required fields: name, email, password, or role.' });
    }

    if (role === 'admin') {
        console.warn(`[Auth] Blocked self-registration attempt as admin: ${email}`);
        return res.status(403).json({ success: false, message: 'System admins cannot be self-registered.' });
    }

    if (role === 'hospital' && !hospitalType) {
        return res.status(400).json({ success: false, message: 'Please specify whether this is a Government or Private hospital.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        console.warn(`[Auth] Registration failed: Email ${email} already in use.`);
        return res.status(400).json({ success: false, message: 'This email is already associated with an account.' });
    }

    const newUser = new User({
        name, email: email.toLowerCase().trim(), password, role,
        phone: phone || '', orgName: orgName || '',
        regNumber: regNumber || '', address: address || '',
        vehicleNumber: vehicleNumber || '',
        ambulanceType: role === 'ambulance' ? 'independent' : 'na',
        // Set isGovernment:
        // 1. Hospital: based on selected hospitalType
        // 2. NGO: always false (private)
        // 3. Independent Ambulance: always false (private)
        isGovernment: role === 'hospital' ? hospitalType === 'government' : false,
    });

    await newUser.save();
    const token = generateToken(newUser);

    console.log(`[Auth] New user registered: ${newUser.email} as ${newUser.role}`);

    // Notify admins of new partner registration requiring approval
    if (['ngo', 'hospital', 'ambulance'].includes(role)) {
        const admins = await User.find({ role: 'admin' });
        const notifications = admins.map(admin => ({
            recipient: admin._id,
            title: 'New Partner Registration',
            message: `${orgName || name} has registered as a ${role} and is awaiting your approval.`,
            type: 'system'
        }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    }

    res.status(201).json({
        success: true,
        message: role === 'user' ? 'Successfully registered!' : 'Registration successful! Your account is pending admin approval.',
        token,
        user: {
            _id: newUser._id, name: newUser.name, email: newUser.email,
            role: newUser.role, isAdmin: newUser.isAdmin,
            isApproved: newUser.isApproved, walletBalance: newUser.walletBalance,
        },
    });
});

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    if (!user) {
        console.warn(`[Auth] Login attempt failed: User not found (${email})`);
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        console.warn(`[Auth] Login attempt failed: Incorrect password for ${email}`);
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    console.log(`[Auth] User logged in: ${user.email} (${user.role}${user.isAdmin ? ' + admin' : ''})`);

    res.status(200).json({
        success: true,
        message: 'Welcome back!',
        token,
        user: {
            _id: user._id, name: user.name, email: user.email,
            role: user.role, isAdmin: user.isAdmin,
            isApproved: user.isApproved, walletBalance: user.walletBalance,
            orgName: user.orgName, phone: user.phone, location: user.location,
        },
    });
});

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    res.status(200).json({
        success: true,
        user: {
            ...user.toObject(),
            role: req.user.role,           // may be impersonated role from JWT
            isAdmin: req.user.isAdmin,
            impersonating: req.user.impersonating || null,
        },
    });
});

/**
 * @route   POST /api/auth/impersonate
 * @access  Private — isAdmin required
 */
const impersonateUser = asyncHandler(async (req, res) => {
    if (!req.user.isAdmin) {
        console.warn(`[Auth] Unauthorized impersonation attempt by ${req.user.email}`);
        return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    }

    const { userId, password } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'Target user ID is required.' });
    }

    // Optional password verification (backward compatible)
    if (password) {
        const admin = await User.findById(req.user._id).select('+password');
        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            console.warn(`[Auth] Impersonation failed: Incorrect admin password for ${req.user.email}`);
            return res.status(401).json({ success: false, message: 'Invalid administrator password.' });
        }
    }

    const target = await User.findById(userId).select('-password');
    if (!target) {
        return res.status(404).json({ success: false, message: 'Target user not found in database.' });
    }

    // Build a token where the _id is the TARGET user's ID so backend queries
    // (assignedNGO, wallet, etc.) resolve correctly for the impersonated account.
    // The admin's identity is preserved via the impersonating field for audit.
    const tokenPayload = {
        _id: target._id,
        id: target._id,
        email: target.email,
        name: target.name,
        role: target.role,
        isAdmin: req.user.isAdmin,
        impersonating: {
            adminId: req.user._id,
            adminEmail: req.user.email,
            userId: target._id,
            name: target.name,
            email: target.email,
            role: target.role,
        },
    };

    const token = generateToken(tokenPayload);

    // Log the audit event
    await AuditLog.create({
        adminId: req.user._id,
        targetId: target._id,
        action: 'impersonation_start',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { targetEmail: target.email, targetRole: target.role }
    });

    console.log(`[Auth] Admin ${req.user.email} started impersonating: ${target.email} (${target.role})`);

    res.status(200).json({
        success: true,
        message: `Account switched to ${target.name} (${target.role})`,
        token,
        user: {
            _id: target._id, name: target.name, email: target.email,
            role: target.role, isAdmin: req.user.isAdmin, isApproved: target.isApproved,
            walletBalance: target.walletBalance,
            orgName: target.orgName, phone: target.phone, location: target.location,
            impersonating: {
                adminId: req.user._id,
                userId: target._id, name: target.name,
                email: target.email, role: target.role,
            },
        },
    });
});


/**
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = asyncHandler(async (req, res) => {
    let { credential, role = 'user' } = req.body;

    // SECURITY: Prevent role escalation via Google Login
    // Only allow 'user' role via Google. NGO/Hospital/Ambulance must register manually for approval.
    if (role !== 'user') {
        console.warn(`[Google Auth] Blocked attempt to register as ${role} via Google: ${req.body.email}`);
        role = 'user'; 
    }

    if (!credential) {
        return res.status(400).json({ success: false, message: 'Missing credential' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_WEB_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        // Find or create user
        let user = await User.findOne({ 
            $or: [
                { googleId: sub },
                { email: email.toLowerCase() }
            ]
        });

        if (!user) {
            // New Google account - default to role 'user' (Citizen)
            user = new User({
                googleId: sub,
                name,
                email: email.toLowerCase(),
                role: role, // Use selected role or default to 'user'
                profileImage: picture,
                isApproved: role === 'user', // Auto-approve citizens
                password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10), // dummy for schema if needed, but schema now allows null with googleId
            });
            await user.save();
            console.log(`[Google Auth] New user registered: ${user.email}`);
        } else if (!user.googleId) {
            // Merge existing local user with Google account
            user.googleId = sub;
            if (!user.profileImage) user.profileImage = picture;
            await user.save();
            console.log(`[Google Auth] Linked existing user to Google: ${user.email}`);
        }

        const token = generateToken(user);
        res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id, name: user.name, email: user.email,
                role: user.role, isAdmin: user.isAdmin,
                isApproved: user.isApproved, walletBalance: user.walletBalance,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('[Google Auth] Error:', error);
        res.status(401).json({ success: false, message: 'Google authentication failed' });
    }
});

module.exports = { register, login, logout, getMe, impersonateUser, googleLogin };
