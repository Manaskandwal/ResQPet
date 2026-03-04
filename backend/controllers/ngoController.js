const RescueRequest = require('../models/RescueRequest');
const { haversineDistance } = require('../utils/haversine');

/**
 * @route   GET /api/ngo/nearby
 * @desc    Get pending rescue requests within 50km of the NGO's registered location
 * @access  Private (ngo only)
 */
const getNearbyCases = async (req, res) => {
    try {
        console.log(`[NGO Controller] getNearbyCases for NGO: ${req.user._id}`);

        const { lat, lng } = req.user.location || {};
        const hasLocation = !!(lat && lng);

        // Fetch all pending cases not already rejected by this NGO
        const pendingCases = await RescueRequest.find({
            status: 'pending',
            rejectedBy: { $ne: req.user._id },
        })
            .populate('user', 'name phone')
            .sort({ createdAt: 1 }); // oldest first (most urgent)

        console.log(`[NGO Controller] Pending cases (pre-filter): ${pendingCases.length}, hasLocation: ${hasLocation}`);

        let resultCases;

        if (hasLocation) {
            // Filter within 10km radius using Haversine formula
            resultCases = pendingCases
                .map((rescue) => {
                    const distance = haversineDistance(lat, lng, rescue.location.lat, rescue.location.lng);
                    return { ...rescue.toObject(), distance };
                })
                .filter((rescue) => rescue.distance <= 50)
                .sort((a, b) => a.distance - b.distance);

            console.log(`[NGO Controller] Cases within 50km: ${resultCases.length}`);
        } else {
            // No location set — return all pending cases unfiltered, distance = null
            resultCases = pendingCases.map((rescue) => ({
                ...rescue.toObject(),
                distance: null,
            }));
            console.log(`[NGO Controller] No location set — returning all ${resultCases.length} pending cases`);
        }

        res.status(200).json({
            success: true,
            count: resultCases.length,
            cases: resultCases,
            locationSet: hasLocation,
        });
    } catch (error) {
        console.error('[NGO Controller] getNearbyCases error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/rescue/:id/accept-ngo
 * @desc    NGO accepts a pending rescue request
 * @access  Private (ngo only)
 */
const acceptCase = async (req, res) => {
    try {
        const { type, scheduleDate } = req.body; // type: 'immediate' or 'schedule'
        console.log(`[NGO Controller] acceptCase: id=${req.params.id}, type=${type}`);

        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        if (rescue.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Case already accepted or cancelled.' });
        }

        rescue.assignedNGO = req.user._id;
        rescue.acceptedAt = new Date();

        if (type === 'schedule') {
            rescue.status = 'scheduled';
            rescue.scheduleDate = scheduleDate;
            rescue.statusLogs.push({
                status: 'scheduled',
                message: `NGO scheduled the rescue for ${new Date(scheduleDate).toLocaleString()}`,
            });
        } else {
            rescue.status = 'accepted';
            rescue.statusLogs.push({
                status: 'accepted',
                message: 'NGO accepted for immediate rescue.',
            });
        }

        await rescue.save();
        res.status(200).json({ success: true, message: 'Case accepted successfully!', rescue });
    } catch (error) {
        console.error('[NGO Controller] acceptCase error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/ngo/rescue/:id/status
 * @desc    Update rescue status (left, reached, treating, etc.)
 * @access  Private (ngo only)
 */
const updateNGOStatus = async (req, res) => {
    try {
        const { status, message, lat, lng } = req.body;
        const rescue = await RescueRequest.findOne({ _id: req.params.id, assignedNGO: req.user._id });

        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue not found or not assigned to you.' });

        let finalStatus = status;

        // Auto-check distance if location is provided
        if (lat && lng && status === 'on_the_way') {
            const distance = haversineDistance(lat, lng, rescue.location.lat, rescue.location.lng);
            if (distance <= 0.1) { // 100 meters
                finalStatus = 'reached';
            }
        }

        // Handle Media Uploads
        const imageUrls = [];
        let videoUrl = null;

        if (req.files && req.files.length > 0) {
            const { uploadBufferToCloudinary } = require('../middleware/upload');
            for (const file of req.files) {
                try {
                    const isVideo = file.mimetype.startsWith('video/');
                    const result = await uploadBufferToCloudinary(file.buffer, {
                        folder: `pawsaarthi/rescue/${rescue._id}`,
                        resource_type: isVideo ? 'video' : 'image',
                    });
                    if (isVideo) videoUrl = result.secure_url;
                    else imageUrls.push(result.secure_url);
                } catch (err) {
                    console.error('[NGO Status Update] Upload error:', err.message);
                }
            }
        }

        rescue.status = finalStatus;
        rescue.statusLogs.push({
            status: finalStatus,
            message: message || `Status updated to ${finalStatus}`,
            images: imageUrls,
            video: videoUrl,
        });

        // Optionally add to main images array if it's a significant update
        if (imageUrls.length > 0) {
            rescue.images = [...rescue.images, ...imageUrls].slice(-10); // keep last 10
        }
        if (videoUrl) rescue.video = videoUrl;

        if (finalStatus === 'completed') {
            rescue.completedAt = new Date();
        }

        await rescue.save();
        res.status(200).json({ success: true, message: `Status updated to ${finalStatus}`, rescue });
    } catch (error) {
        console.error('[NGO Controller] updateNGOStatus error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/rescue/:id/reject-ngo
 * @desc    NGO rejects a pending rescue request (won't see it again)
 * @access  Private (ngo only)
 */
const rejectCase = async (req, res) => {
    try {
        console.log(`[NGO Controller] rejectCase: rescueId=${req.params.id}, ngoId=${req.user._id}`);

        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        if (rescue.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Cannot reject: status is '${rescue.status}'.` });
        }

        // Add to rejectedBy array so this NGO won't see it again
        if (!rescue.rejectedBy.includes(req.user._id)) {
            rescue.rejectedBy.push(req.user._id);
            await rescue.save();
        }

        console.log(`[NGO Controller] Rescue ${rescue._id} rejected by NGO ${req.user._id}`);

        // --- Auto-Escalation Logic ---
        // Check if all active NGOs within 50km have rejected this case.
        const User = require('../models/User');
        const { haversineDistance } = require('../utils/haversine');
        const allNGOs = await User.find({ role: 'ngo', isApproved: true });

        // Count NGOs within 50km
        let nearbyNgoCount = 0;
        allNGOs.forEach(n => {
            if (n.location && n.location.lat && n.location.lng) {
                const dist = haversineDistance(rescue.location.lat, rescue.location.lng, n.location.lat, n.location.lng);
                if (dist <= 50) nearbyNgoCount++;
            }
        });

        // If the number of rejections >= nearby NGOs, immediately escalate to Hospital Broadcast
        if (rescue.rejectedBy.length >= nearbyNgoCount && rescue.status === 'pending') {
            rescue.status = 'hospital_broadcasted';
            rescue.escalatedAt = new Date();
            await rescue.save();

            console.log(`[Escalation] All ${nearbyNgoCount} nearby NGOs rejected Case ${rescue._id}. Escalating to Hospitals.`);

            const { getIo } = require('../config/socket');
            try {
                const io = getIo();
                io.to('role_hospital').emit('new_hospital_broadcast', {
                    rescueRequestId: rescue._id,
                    message: "New Emergency Escalted from NGOs!"
                });
            } catch (socketErr) {
                console.error('[NGO Controller] Socket error emitting broadcast:', socketErr.message);
            }
        }

        res.status(200).json({ success: true, message: 'Case rejected. You will not see this case again.', rescue });
    } catch (error) {
        console.error('[NGO Controller] rejectCase error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/ngo/my-cases
 * @desc    Get all cases accepted by this NGO
 * @access  Private (ngo only)
 */
const getMyCases = async (req, res) => {
    try {
        console.log(`[NGO Controller] getMyCases for NGO: ${req.user._id}`);
        const cases = await RescueRequest.find({ assignedNGO: req.user._id })
            .populate('user', 'name phone email')
            .populate('assignedAmbulance', 'name vehicleNumber')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: cases.length, cases });
    } catch (error) {
        console.error('[NGO Controller] getMyCases error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/ngo/analytics
 * @desc    Get operational analytics for a specific NGO
 * @access  Private (ngo only)
 */
const getAnalytics = async (req, res) => {
    try {
        console.log(`[NGO Controller] getAnalytics for NGO: ${req.user._id}`);
        const ngoId = req.user._id;

        const [accepted, completed, rejected, nearbyPending] = await Promise.all([
            RescueRequest.countDocuments({ assignedNGO: ngoId }),
            RescueRequest.countDocuments({ assignedNGO: ngoId, status: 'completed' }),
            RescueRequest.countDocuments({ rejectedBy: ngoId }),
            RescueRequest.countDocuments({ status: 'pending', rejectedBy: { $ne: ngoId } })
        ]);

        const totalHandled = accepted + rejected;
        const acceptanceRate = totalHandled > 0 ? ((accepted / totalHandled) * 100).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            analytics: {
                accepted_count: accepted,
                completed_count: completed,
                rejected_count: rejected,
                nearby_pending: nearbyPending,
                acceptance_rate: acceptanceRate
            }
        });
    } catch (error) {
        console.error('[NGO Controller] getAnalytics error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/ngo/rescue/:id/resolve
 * @desc    NGO resolves the case on the spot
 * @access  Private (ngo only)
 */
const resolveOnSpot = async (req, res) => {
    try {
        const rescue = await RescueRequest.findOne({ _id: req.params.id, assignedNGO: req.user._id });
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found or not assigned to you.' });

        if (rescue.status !== 'ngo_accepted') {
            return res.status(400).json({ success: false, message: `Cannot resolve. Current status depends on: ${rescue.status}` });
        }

        rescue.status = 'resolved_on_spot';
        rescue.completedAt = new Date();
        await rescue.save();

        res.status(200).json({ success: true, message: 'Case resolved on spot successfully!', rescue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/ngo/rescue/:id/escalate
 * @desc    NGO escalates the case to hospitals
 * @access  Private (ngo only)
 */
const escalateToHospital = async (req, res) => {
    try {
        const rescue = await RescueRequest.findOne({ _id: req.params.id, assignedNGO: req.user._id });
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found or not assigned to you.' });

        if (rescue.status !== 'ngo_accepted') {
            return res.status(400).json({ success: false, message: `Cannot escalate. Current status depends on: ${rescue.status}` });
        }

        rescue.status = 'hospital_broadcasted';
        rescue.escalatedAt = new Date();
        await rescue.save();

        // At this point, the system will broadcast to Govt hospitals (or Pvt if none).
        // This can be triggered via a helper function or picked up by another cron.
        // For real-time, we would emit a socket event here directly.
        const { getIo } = require('../config/socket');
        try {
            const io = getIo();
            // Emit to a specific "Govt Hospitals" room or handle in frontend based on user properties
            io.to('role_hospital').emit('new_hospital_broadcast', {
                rescueRequestId: rescue._id,
                message: "New Emergency Escalted!"
            });
        } catch (socketErr) {
            console.error('[NGO Controller] Socket error emitting broadcast:', socketErr.message);
        }

        res.status(200).json({ success: true, message: 'Case escalated to hospitals.', rescue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getNearbyCases,
    acceptCase,
    rejectCase,
    getMyCases,
    getAnalytics,
    resolveOnSpot,
    escalateToHospital,
    updateNGOStatus
};
