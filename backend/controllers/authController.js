const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (user, ngo, hospital, or ambulance roles)
 * @access  Public
 */
const register = async (req, res) => {
    try {
        console.log('[Auth Controller] Register attempt:', req.body.email);
        const { name, email, password, role, phone, orgName, regNumber, address, vehicleNumber } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role.' });
        }

        // Prevent admin self-registration
        if (role === 'admin') {
            console.warn('[Auth] Attempted admin self-registration for email:', email);
            return res.status(403).json({ success: false, message: 'Admin accounts cannot be self-registered.' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.warn('[Auth] Registration failed — email already exists:', email);
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        }

        // Build user object
        const newUser = new User({
            name,
            email,
            password,
            role,
            phone: phone || '',
            orgName: orgName || '',
            regNumber: regNumber || '',
            address: address || '',
            vehicleNumber: vehicleNumber || '',
        });

        await newUser.save();
        console.log(`[Auth] New user registered: ${newUser.email} (role: ${newUser.role}, id: ${newUser._id})`);

        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: role === 'user' ? 'Registration successful!' : 'Registration successful! Awaiting admin approval.',
            token,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isApproved: newUser.isApproved,
                walletBalance: newUser.walletBalance,
            },
        });
    } catch (error) {
        console.error('[Auth Controller] Register error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
const login = async (req, res) => {
    try {
        console.log('[Auth Controller] Login attempt:', req.body.email);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        // Fetch user with password (select: false by default, explicitly include it)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            console.warn('[Auth] Login failed — no user with email:', email);
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.warn('[Auth] Login failed — wrong password for:', email);
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken(user);
        console.log(`[Auth] Login success: ${user.email} (role: ${user.role})`);

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                walletBalance: user.walletBalance,
                orgName: user.orgName,
                phone: user.phone,
                location: user.location,
            },
        });
    } catch (error) {
        console.error('[Auth Controller] Login error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Login failed.' });
    }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged-in user's profile
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        console.log(`[Auth Controller] getMe for userId: ${req.user._id}`);
        const user = await User.findById(req.user._id).select('-password');
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('[Auth Controller] getMe error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login, getMe };
