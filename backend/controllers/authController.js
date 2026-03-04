const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { name, email, password, role, phone, orgName, regNumber, address, vehicleNumber } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role.' });
        }

        if (role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admin accounts cannot be self-registered.' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        }

        const newUser = new User({
            name, email, password, role,
            phone: phone || '', orgName: orgName || '',
            regNumber: regNumber || '', address: address || '',
            vehicleNumber: vehicleNumber || '',
        });

        await newUser.save();
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: role === 'user' ? 'Registration successful!' : 'Registration successful! Awaiting admin approval.',
            token,
            user: {
                _id: newUser._id, name: newUser.name, email: newUser.email,
                role: newUser.role, isAdmin: newUser.isAdmin,
                isApproved: newUser.isApproved, walletBalance: newUser.walletBalance,
            },
        });
    } catch (error) {
        console.error('[Auth] Register error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
    }
};

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken(user);
        console.log(`[Auth] Login: ${user.email} (role: ${user.role}, isAdmin: ${user.isAdmin})`);

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                _id: user._id, name: user.name, email: user.email,
                role: user.role, isAdmin: user.isAdmin,
                isApproved: user.isApproved, walletBalance: user.walletBalance,
                orgName: user.orgName, phone: user.phone, location: user.location,
            },
        });
    } catch (error) {
        console.error('[Auth] Login error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Login failed.' });
    }
};

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.status(200).json({
            success: true,
            user: {
                ...user.toObject(),
                role: req.user.role,           // may be impersonated role from JWT
                isAdmin: req.user.isAdmin,
                impersonating: req.user.impersonating || null,
            },
        });
    } catch (error) {
        console.error('[Auth] getMe error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/auth/impersonate
 * @desc    Admin views the app as a specific user (JWT role injection).
 *          isAdmin: true is preserved so switching can continue.
 * @access  Private — isAdmin required
 */
const impersonateUser = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Only admins can switch accounts.' });
        }

        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Please provide a userId to impersonate.' });
        }

        const target = await User.findById(userId).select('-password');
        if (!target) {
            return res.status(404).json({ success: false, message: 'Target user not found.' });
        }

        // Token: real admin _id, but target's role, + isAdmin true so switching can continue
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

        console.log(`[Auth] Admin ${req.user.email} impersonating: ${target.email} (${target.role})`);

        res.status(200).json({
            success: true,
            message: `Now viewing as ${target.name} (${target.role})`,
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
    } catch (error) {
        console.error('[Auth] Impersonate error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Impersonation failed.' });
    }
};

module.exports = { register, login, getMe, impersonateUser };
