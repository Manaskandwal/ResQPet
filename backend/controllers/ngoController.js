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
        console.log(`[NGO Controller] acceptCase: rescueId=${req.params.id}, ngoId=${req.user._id}`);

        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        if (rescue.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot accept: rescue is already in '${rescue.status}' status.`,
            });
        }

        rescue.status = 'ngo_accepted';
        rescue.assignedNGO = req.user._id;
        rescue.acceptedAt = new Date();
        await rescue.save();

        console.log(`[NGO Controller] Rescue ${rescue._id} accepted by NGO ${req.user._id}`);
        res.status(200).json({ success: true, message: 'Rescue case accepted!', rescue });
    } catch (error) {
        console.error('[NGO Controller] acceptCase error:', error.message);
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
        res.status(200).json({ success: true, message: 'Case rejected. You will not see this case again.' });
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

module.exports = { getNearbyCases, acceptCase, rejectCase, getMyCases };
