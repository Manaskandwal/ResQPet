const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const { haversineDistance } = require('../utils/haversine');

/**
 * @route   GET /api/hospital/escalated
 * @desc    Get rescue requests escalated to hospital status within 10km
 * @access  Private (hospital only)
 */
const getEscalatedCases = async (req, res) => {
    try {
        console.log(`[Hospital Controller] getEscalatedCases for hospitalId: ${req.user._id}`);

        const { lat, lng } = req.user.location || {};
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Please update your hospital location in your profile.',
            });
        }

        const escalatedCases = await RescueRequest.find({ status: 'hospital_escalated' })
            .populate('user', 'name phone email')
            .sort({ escalatedAt: 1 }); // oldest escalated first (most urgent)

        console.log(`[Hospital Controller] Total escalated (pre-filter): ${escalatedCases.length}`);

        const nearbyCases = escalatedCases
            .map((rescue) => {
                const distance = haversineDistance(lat, lng, rescue.location.lat, rescue.location.lng);
                return { ...rescue.toObject(), distance };
            })
            .filter((rescue) => rescue.distance <= 10)
            .sort((a, b) => a.distance - b.distance);

        console.log(`[Hospital Controller] Escalated within 10km: ${nearbyCases.length}`);
        res.status(200).json({ success: true, count: nearbyCases.length, cases: nearbyCases });
    } catch (error) {
        console.error('[Hospital Controller] getEscalatedCases error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/rescue/:id/assign-ambulance
 * @desc    Hospital assigns an available ambulance to an escalated rescue request
 * @access  Private (hospital only)
 */
const assignAmbulance = async (req, res) => {
    try {
        console.log(`[Hospital Controller] assignAmbulance: rescueId=${req.params.id}, hospitalId=${req.user._id}`);
        const { ambulanceId } = req.body;

        if (!ambulanceId) {
            return res.status(400).json({ success: false, message: 'Please provide an ambulanceId.' });
        }

        // Verify the ambulance exists and belongs to this hospital
        const ambulance = await User.findOne({
            _id: ambulanceId,
            role: 'ambulance',
            linkedHospital: req.user._id,
            isAvailable: true,
            isApproved: true,
        });

        if (!ambulance) {
            console.warn(`[Hospital Controller] Ambulance not found/available: ${ambulanceId}`);
            return res.status(404).json({
                success: false,
                message: 'Ambulance not found, not available, or not linked to your hospital.',
            });
        }

        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        if (rescue.status !== 'hospital_escalated') {
            return res.status(400).json({ success: false, message: `Cannot assign: status is '${rescue.status}'.` });
        }

        // Assign hospital and ambulance
        rescue.status = 'ambulance_assigned';
        rescue.assignedHospital = req.user._id;
        rescue.assignedAmbulance = ambulanceId;
        rescue.ambulanceAssignedAt = new Date();
        await rescue.save();

        // Mark ambulance as unavailable
        ambulance.isAvailable = false;
        await ambulance.save();

        console.log(`[Hospital Controller] Ambulance ${ambulanceId} assigned to rescue ${rescue._id}`);
        res.status(200).json({ success: true, message: 'Ambulance assigned successfully!', rescue });
    } catch (error) {
        console.error('[Hospital Controller] assignAmbulance error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/hospital/ambulances
 * @desc    Get all ambulances linked to this hospital
 * @access  Private (hospital only)
 */
const getLinkedAmbulances = async (req, res) => {
    try {
        console.log(`[Hospital Controller] getLinkedAmbulances for hospitalId: ${req.user._id}`);
        const ambulances = await User.find({
            role: 'ambulance',
            linkedHospital: req.user._id,
            isApproved: true,
        }).select('-password');

        console.log(`[Hospital Controller] Found ${ambulances.length} ambulances`);
        res.status(200).json({ success: true, count: ambulances.length, ambulances });
    } catch (error) {
        console.error('[Hospital Controller] getLinkedAmbulances error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/hospital/my-cases
 * @desc    Get all cases assigned to this hospital
 * @access  Private (hospital only)
 */
const getMyCases = async (req, res) => {
    try {
        console.log(`[Hospital Controller] getMyCases for hospitalId: ${req.user._id}`);
        const cases = await RescueRequest.find({ assignedHospital: req.user._id })
            .populate('user', 'name phone')
            .populate('assignedAmbulance', 'name vehicleNumber phone')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: cases.length, cases });
    } catch (error) {
        console.error('[Hospital Controller] getMyCases error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getEscalatedCases, assignAmbulance, getLinkedAmbulances, getMyCases };
