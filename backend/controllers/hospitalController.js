const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const { haversineDistance } = require('../utils/haversine');
const { emitRescueUpdate } = require('../config/socket');

const pushStatusLog = (rescue, status, message) => {
    rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
    rescue.statusLogs.push({ status, message });
};

const getEscalatedCases = async (req, res) => {
    try {
        const { lat, lng } = req.user.location || {};
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Please update your hospital location in your profile.',
            });
        }

        const broadcastCases = await RescueRequest.find({
            status: 'hospital_broadcasted',
            rejectedHospitals: { $ne: req.user._id },
        })
            .populate('user', 'name phone email')
            .sort({ escalatedAt: 1 });

        const fiveMinutesMs = 5 * 60 * 1000;
        const now = Date.now();
        const isGovt = req.user.isGovernment === true;

        const visibleCases = broadcastCases.filter((rescue) => {
            const timeSinceEscalation = now - new Date(rescue.escalatedAt).getTime();
            if (isGovt) return true;
            return timeSinceEscalation > fiveMinutesMs;
        });

        const nearbyCases = visibleCases
            .map((rescue) => ({ ...rescue.toObject(), distance: haversineDistance(lat, lng, rescue.location.lat, rescue.location.lng) }))
            .filter((rescue) => rescue.distance <= 10)
            .sort((a, b) => a.distance - b.distance);

        res.status(200).json({ success: true, count: nearbyCases.length, cases: nearbyCases });
    } catch (error) {
        console.error('[Hospital Controller] getEscalatedCases error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const assignAmbulance = async (req, res) => {
    try {
        const { ambulanceId } = req.body;
        if (!ambulanceId) {
            return res.status(400).json({ success: false, message: 'Please provide an ambulanceId.' });
        }

        const ambulance = await User.findOne({
            _id: ambulanceId,
            role: 'ambulance',
            linkedHospital: req.user._id,
            isAvailable: true,
            isApproved: true,
        });

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                message: 'Ambulance not found, not available, or not linked to your hospital.',
            });
        }

        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        if (!['hospital_broadcasted', 'ambulance_pinged'].includes(rescue.status)) {
            return res.status(400).json({ success: false, message: `Cannot assign: status is '${rescue.status}'.` });
        }

        rescue.status = 'ambulance_assigned';
        rescue.assignedHospital = req.user._id;
        rescue.assignedAmbulance = ambulanceId;
        rescue.ambulanceAssignedAt = new Date();
        rescue.workStartedAt = rescue.workStartedAt || new Date();
        pushStatusLog(rescue, 'ambulance_assigned', 'Hospital assigned an ambulance for transport.');
        emitRescueUpdate(rescue._id, rescue.status, { message: 'Hospital assigned an ambulance for transport.' });
        await rescue.save();

        ambulance.isAvailable = false;
        await ambulance.save();

        res.status(200).json({ success: true, message: 'Ambulance assigned successfully.', rescue });
    } catch (error) {
        console.error('[Hospital Controller] assignAmbulance error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLinkedAmbulances = async (req, res) => {
    try {
        const ambulances = await User.find({
            role: 'ambulance',
            linkedHospital: req.user._id,
            isApproved: true,
        }).select('-password');

        res.status(200).json({ success: true, count: ambulances.length, ambulances });
    } catch (error) {
        console.error('[Hospital Controller] getLinkedAmbulances error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMyCases = async (req, res) => {
    try {
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

const acceptBroadcastedCase = async (req, res) => {
    try {
        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        if (rescue.status !== 'hospital_broadcasted') {
            return res.status(400).json({ success: false, message: `Cannot accept: status is '${rescue.status}'. Another hospital may have already claimed it.` });
        }

        rescue.assignedHospital = req.user._id;
        rescue.workStartedAt = rescue.workStartedAt || new Date();
        pushStatusLog(rescue, 'hospital_accepted', `${req.user.orgName || req.user.name} accepted the escalated rescue.`);

        const availableAmbulances = await User.find({
            role: 'ambulance',
            linkedHospital: req.user._id,
            isAvailable: true,
            isApproved: true,
        });

        rescue.status = 'ambulance_pinged';
        rescue.activeAmbulancePings = availableAmbulances.map((amb) => ({
            ambulanceId: amb._id,
            pingedAt: new Date(),
        }));
        rescue.pingRejectors = [];
        pushStatusLog(rescue, 'ambulance_pinged', 'Hospital started ambulance dispatch for this case.');
        emitRescueUpdate(rescue._id, rescue.status, { message: 'Hospital accepted the case and started ambulance dispatch.' });
        await rescue.save();

        res.status(200).json({ success: true, message: 'Case claimed successfully. Ambulance dispatch has started.', rescue });
    } catch (error) {
        console.error('[Hospital Controller] acceptBroadcastedCase error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const rejectBroadcastedCase = async (req, res) => {
    try {
        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        if (rescue.status !== 'hospital_broadcasted') {
            return res.status(400).json({ success: false, message: `Cannot reject: status is '${rescue.status}'.` });
        }

        rescue.rejectedHospitals = Array.isArray(rescue.rejectedHospitals) ? rescue.rejectedHospitals : [];
        if (!rescue.rejectedHospitals.some((id) => id.toString() === req.user._id.toString())) {
            rescue.rejectedHospitals.push(req.user._id);
        }

        const hospitals = await User.find({ role: 'hospital', isApproved: true });
        let nearbyHospitalCount = 0;
        hospitals.forEach((hospital) => {
            if (Number.isFinite(hospital.location?.lat) && Number.isFinite(hospital.location?.lng)) {
                const dist = haversineDistance(rescue.location.lat, rescue.location.lng, hospital.location.lat, hospital.location.lng);
                if (dist <= 10) nearbyHospitalCount += 1;
            }
        });

        if (nearbyHospitalCount > 0 && rescue.rejectedHospitals.length >= nearbyHospitalCount) {
            rescue.status = 'closed_unresolved';
            rescue.closedAt = new Date();
            rescue.outcome = 'closed_unresolved';
            pushStatusLog(rescue, 'closed_unresolved', 'All nearby hospitals rejected the case. Case closed unresolved.');
            emitRescueUpdate(rescue._id, rescue.status, { message: 'All nearby hospitals rejected the case. Case closed unresolved.' });
        }

        await rescue.save();
        res.status(200).json({ success: true, message: 'Case rejected successfully.', rescue });
    } catch (error) {
        console.error('[Hospital Controller] rejectBroadcastedCase error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getEscalatedCases,
    assignAmbulance,
    getLinkedAmbulances,
    getMyCases,
    acceptBroadcastedCase,
    rejectBroadcastedCase,
};
