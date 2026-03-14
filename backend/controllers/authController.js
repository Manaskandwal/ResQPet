const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, orgName, regNumber, address, vehicleNumber } = req.body;

    // Robust validation
    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'Missing required fields: name, email, password, or role.' });
    }

    if (role === 'admin') {
        console.warn(`[Auth] Blocked self-registration attempt as admin: ${email}`);
        return res.status(403).json({ success: false, message: 'System admins cannot be self-registered.' });
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
    });

    await newUser.save();
    const token = generateToken(newUser);

    console.log(`[Auth] New user registered: ${newUser.email} as ${newUser.role}`);

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

    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'No target user ID provided.' });
    }

    const target = await User.findById(userId).select('-password');
    if (!target) {
        return res.status(404).json({ success: false, message: 'Target user not found in database.' });
    }

    const token = generateToken({
        _id: req.user._id,
        email: req.user.email,
        role: target.role,
        isAdmin: true,
        impersonating: {
            userId: target._id,
            name: target.name,
            email: target.email,
            role: target.role,
        },
    });

    console.log(`[Auth] Admin ${req.user.email} started impersonating: ${target.email} (${target.role})`);

    res.status(200).json({
        success: true,
        message: `Account switched to ${target.name} (${target.role})`,
        token,
        user: {
            _id: req.user._id, name: req.user.name, email: req.user.email,
            role: target.role, isAdmin: true, isApproved: true,
            walletBalance: req.user.walletBalance,
            orgName: target.orgName, phone: target.phone, location: target.location,
            impersonating: {
                userId: target._id, name: target.name,
                email: target.email, role: target.role,
            },
        },
    });
});


module.exports = { register, login, getMe, impersonateUser };
