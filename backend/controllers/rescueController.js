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

/**
 * @route   PUT /api/rescue/:id/cancel
 * @desc    Cancel a rescue request and refund the deposit (if applicable)
 * @access  Private (user only)
 */
const cancelRescue = async (req, res) => {
    try {
        console.log(`[Rescue Controller] cancelRescue: ${req.params.id} by userId: ${req.user._id}`);
        const rescue = await RescueRequest.findById(req.params.id);

        if (!rescue) {
            return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        }

        if (rescue.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        if (['completed', 'cancelled', 'resolved_on_spot', 'delivered'].includes(rescue.status)) {
            return res.status(400).json({ success: false, message: `Cannot cancel: status is '${rescue.status}'.` });
        }

        rescue.status = 'cancelled';

        // Refund the deposit if it was deducted and not yet refunded
        if (rescue.depositDeducted && !rescue.depositRefunded) {
            const user = await User.findById(rescue.user);
            user.walletBalance += DEPOSIT_AMOUNT;
            await user.save();

            rescue.depositRefunded = true;

            await WalletTransaction.create({
                user: user._id,
                amount: DEPOSIT_AMOUNT,
                type: 'credit',
                description: `₹${DEPOSIT_AMOUNT} deposit refunded for cancelled rescue request #${rescue._id}`,
                rescueRequest: rescue._id,
                balanceAfter: user.walletBalance,
            });
            console.log(`[Rescue Controller] Refunded ₹${DEPOSIT_AMOUNT} deposit to user ${user._id}`);
        }

        await rescue.save();

        res.status(200).json({ success: true, message: 'Rescue request cancelled successfully.', rescue });
    } catch (error) {
        console.error('[Rescue Controller] cancelRescue error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/rescue/:id/fundraiser
 * @desc    Convert an existing user rescue request into a public fundraiser
 * @access  Private (user only)
 */
const makeFundraiser = async (req, res) => {
    try {
        console.log(`[Rescue Controller] makeFundraiser: ${req.params.id} by userId: ${req.user._id}`);
        const { estimatedCost } = req.body;

        if (!estimatedCost || estimatedCost <= 0) {
            return res.status(400).json({ success: false, message: 'Please provide a valid estimated cost.' });
        }

        const rescue = await RescueRequest.findById(req.params.id);

        if (!rescue) {
            return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        }

        if (rescue.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied. You can only make your own cases a fundraiser.' });
        }

        if (rescue.isFundraiser) {
            return res.status(400).json({ success: false, message: 'This case is already a fundraiser.' });
        }

        rescue.isFundraiser = true;
        rescue.estimatedCost = estimatedCost;

        // Optionally, if we wanted to halt the flow until funds arrive, we'd change status here.
        // For now, we just tag it as a fundraiser so it appears on the public page.

        await rescue.save();
        console.log(`[Rescue Controller] Rescue ${rescue._id} is now a public fundraiser for ₹${estimatedCost}`);

        res.status(200).json({ success: true, message: 'Your case is now public for fundraising!', rescue });
    } catch (error) {
        console.error('[Rescue Controller] makeFundraiser error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/rescue/impact/feed
 * @desc    Get completed rescue stories for the impact page
 * @access  Private
 */
const getImpactFeed = async (req, res) => {
    try {
        const rescues = await RescueRequest.find({
            status: { $in: ['completed', 'resolved_on_spot'] },
        })
            .populate('user', 'name')
            .populate('assignedNGO', 'name orgName')
            .sort({ completedAt: -1, updatedAt: -1 })
            .limit(30);

        const feed = rescues.map((rescue) => {
            const beforeImage = rescue.images?.[0] || null;
            const statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
            const afterLog = [...statusLogs].reverse().find((log) => (log.images && log.images.length) || log.video);
            const afterImage = afterLog?.images?.[0] || rescue.images?.[rescue.images.length - 1] || null;

            return {
                _id: rescue._id,
                description: rescue.description,
                status: rescue.status,
                location: rescue.location,
                createdAt: rescue.createdAt,
                completedAt: rescue.completedAt,
                beforeImage,
                afterImage,
                beforeCount: rescue.images?.length || 0,
                afterSummary: afterLog?.message || (rescue.status === 'resolved_on_spot' ? 'Resolved on the spot by the NGO team.' : 'Reached safe completion after rescue and transport.'),
                helperName: rescue.assignedNGO?.orgName || rescue.assignedNGO?.name || rescue.user?.name || 'ResQPet team',
                likesCount: rescue.impact?.likes?.length || 0,
                liked: (rescue.impact?.likes || []).some((likeId) => likeId.toString() === req.user._id.toString()),
                commentsCount: rescue.impact?.comments?.length || 0,
                comments: (rescue.impact?.comments || []).slice(-3).reverse(),
            };
        });

        res.status(200).json({ success: true, feed });
    } catch (error) {
        console.error('[Rescue Controller] getImpactFeed error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/rescue/:id/impact/like
 * @desc    Toggle like on a completed rescue story
 * @access  Private
 */
const toggleImpactLike = async (req, res) => {
    try {
        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        if (!['completed', 'resolved_on_spot'].includes(rescue.status)) {
            return res.status(400).json({ success: false, message: 'Only completed rescue stories can be liked.' });
        }

        const likes = Array.isArray(rescue.impact?.likes) ? rescue.impact.likes.map((id) => id.toString()) : [];
        const userId = req.user._id.toString();
        const hasLiked = likes.includes(userId);

        rescue.impact = rescue.impact || { likes: [], comments: [] };
        rescue.impact.likes = hasLiked
            ? rescue.impact.likes.filter((id) => id.toString() !== userId)
            : [...rescue.impact.likes, req.user._id];

        await rescue.save();

        res.status(200).json({
            success: true,
            liked: !hasLiked,
            likesCount: rescue.impact.likes.length,
        });
    } catch (error) {
        console.error('[Rescue Controller] toggleImpactLike error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/rescue/:id/impact/comment
 * @desc    Add a comment to a completed rescue story
 * @access  Private
 */
const addImpactComment = async (req, res) => {
    try {
        const message = String(req.body.message || '').trim();
        if (!message) {
            return res.status(400).json({ success: false, message: 'Comment message is required.' });
        }

        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        if (!['completed', 'resolved_on_spot'].includes(rescue.status)) {
            return res.status(400).json({ success: false, message: 'Only completed rescue stories can receive comments.' });
        }

        rescue.impact = rescue.impact || { likes: [], comments: [] };
        rescue.impact.comments.push({
            user: req.user._id,
            name: req.user.name,
            message,
        });
        await rescue.save();

        const comments = rescue.impact.comments.slice(-5).reverse();
        res.status(200).json({
            success: true,
            commentsCount: rescue.impact.comments.length,
            comments,
        });
    } catch (error) {
        console.error('[Rescue Controller] addImpactComment error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    submitRescue,
    getMyRescues,
    getRescueById,
    cancelRescue,
    makeFundraiser,
    getImpactFeed,
    toggleImpactLike,
    addImpactComment,
};
