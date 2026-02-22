const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { uploadBufferToCloudinary } = require('../middleware/upload');

const DEPOSIT_AMOUNT = 20; // ₹20 deposit per rescue request

/**
 * @route   POST /api/rescue
 * @desc    Submit a new rescue request (deducts ₹20 deposit from wallet)
 *          Supports up to 5 images + 1 video
 * @access  Private (user only)
 */
const submitRescue = async (req, res) => {
    try {
        console.log(`[Rescue Controller] submitRescue from userId: ${req.user._id}`);
        const { description, lat, lng, address } = req.body;

        if (!description || !lat || !lng) {
            return res.status(400).json({ success: false, message: 'Description and location (lat/lng) are required.' });
        }

        // ── Wallet balance check ──────────────────────────────────────────────────
        const user = await User.findById(req.user._id);
        if (user.walletBalance < DEPOSIT_AMOUNT) {
            return res.status(400).json({
                success: false,
                message: `Insufficient wallet balance. A deposit of ₹${DEPOSIT_AMOUNT} is required to submit a rescue request.`,
            });
        }

        // ── Upload media to Cloudinary ────────────────────────────────────────────
        const imageUrls = [];
        let videoUrl = null;

        if (req.files && req.files.length > 0) {
            console.log(`[Rescue Controller] Uploading ${req.files.length} media files to Cloudinary...`);

            for (const file of req.files) {
                try {
                    const isVideo = file.mimetype.startsWith('video/');
                    const result = await uploadBufferToCloudinary(file.buffer, {
                        folder: 'pawsaarthi/rescue',
                        resource_type: isVideo ? 'video' : 'image',
                        // Limit video duration on Cloudinary side (2 min = 120s)
                        ...(isVideo && { eager: [{ duration: '120' }] }),
                    });

                    if (isVideo) {
                        videoUrl = result.secure_url;
                        console.log(`[Rescue Controller] Video uploaded: ${videoUrl}`);
                    } else {
                        imageUrls.push(result.secure_url);
                        console.log(`[Rescue Controller] Image ${imageUrls.length} uploaded: ${result.secure_url}`);
                    }
                } catch (uploadErr) {
                    console.error(`[Rescue Controller] Failed to upload file ${file.originalname}:`, uploadErr.message);
                    // Continue with other files if one fails
                }
            }
        }

        // ── Deduct deposit from wallet ────────────────────────────────────────────
        user.walletBalance -= DEPOSIT_AMOUNT;
        await user.save();
        console.log(`[Rescue Controller] Deducted ₹${DEPOSIT_AMOUNT} deposit. New balance: ₹${user.walletBalance}`);

        // ── Create rescue request ─────────────────────────────────────────────────
        const rescueRequest = await RescueRequest.create({
            user: user._id,
            description,
            images: imageUrls,
            video: videoUrl,
            location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                address: address || '',
            },
            depositDeducted: true,
        });

        // ── Record wallet transaction ─────────────────────────────────────────────
        await WalletTransaction.create({
            user: user._id,
            amount: DEPOSIT_AMOUNT,
            type: 'debit',
            description: `₹${DEPOSIT_AMOUNT} deposit for rescue request #${rescueRequest._id}`,
            rescueRequest: rescueRequest._id,
            balanceAfter: user.walletBalance,
        });

        console.log(`[Rescue Controller] Rescue request created: ${rescueRequest._id}, status=pending`);

        res.status(201).json({
            success: true,
            message: 'Rescue request submitted! Help is on the way.',
            rescueRequest,
            walletBalance: user.walletBalance,
        });
    } catch (error) {
        console.error('[Rescue Controller] submitRescue error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Failed to submit rescue request.' });
    }
};

/**
 * @route   GET /api/rescue/mine
 * @desc    Get all rescue requests submitted by the current user
 * @access  Private (user only)
 */
const getMyRescues = async (req, res) => {
    try {
        console.log(`[Rescue Controller] getMyRescues for userId: ${req.user._id}`);
        const rescues = await RescueRequest.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('assignedNGO', 'name orgName phone')
            .populate('assignedHospital', 'name orgName phone')
            .populate('assignedAmbulance', 'name vehicleNumber phone');

        console.log(`[Rescue Controller] Found ${rescues.length} rescues for userId: ${req.user._id}`);
        res.status(200).json({ success: true, count: rescues.length, rescues });
    } catch (error) {
        console.error('[Rescue Controller] getMyRescues error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/rescue/:id
 * @desc    Get a single rescue request (user sees own, others see assigned)
 * @access  Private
 */
const getRescueById = async (req, res) => {
    try {
        console.log(`[Rescue Controller] getRescueById: ${req.params.id} by userId: ${req.user._id}`);
        const rescue = await RescueRequest.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('assignedNGO', 'name orgName phone location')
            .populate('assignedHospital', 'name orgName phone location')
            .populate('assignedAmbulance', 'name vehicleNumber phone');

        if (!rescue) {
            return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        }

        // Security: users can only view their own requests
        if (req.user.role === 'user' && rescue.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.status(200).json({ success: true, rescue });
    } catch (error) {
        console.error('[Rescue Controller] getRescueById error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { submitRescue, getMyRescues, getRescueById };
