const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const { haversineDistance } = require('../utils/haversine');
const { emitRescueUpdate, emitAmbulanceDispatch } = require('../config/socket');

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

        // Removed the 5-minute delay for private hospitals. 
        // When an NGO escalates, the case should be visible to all nearby hospitals immediately.
        const nearbyCases = broadcastCases
            .map((rescue) => ({ ...rescue.toObject(), distance: haversineDistance(lat, lng, rescue.location.lat, rescue.location.lng) }))
            .filter((rescue) => rescue.distance <= 50) 
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
        const checkRescue = await RescueRequest.findById(req.params.id);
        if (!checkRescue || checkRescue.status !== 'hospital_broadcasted') {
            return res.status(400).json({ 
                success: false, 
                message: 'Could not claim case. It may have already been accepted or its status changed.' 
            });
        }

        const isNgoSelfTransport = checkRescue.ngoTransporting === true;
        const newStatus = isNgoSelfTransport ? 'hospital_accepted' : 'ambulance_pinged';

        // Atomic update
        const rescue = await RescueRequest.findOneAndUpdate(
            { _id: req.params.id, status: 'hospital_broadcasted' },
            { 
                $set: { 
                    assignedHospital: req.user._id,
                    status: newStatus,
                    workStartedAt: new Date()
                }
            },
            { new: true }
        );

        if (!rescue) {
            return res.status(400).json({ success: false, message: 'Failed to claim case.' });
        }

        pushStatusLog(rescue, newStatus, `${req.user.orgName || req.user.name} accepted the escalated rescue.`);

        if (isNgoSelfTransport) {
            pushStatusLog(rescue, 'hospital_accepted', 'NGO is transporting the animal themselves. Hospital is ready for arrival.');
            emitRescueUpdate(rescue._id, 'hospital_accepted', { message: 'Hospital accepted the case. NGO is bringing the animal themselves.' });
        } else {
            // Ping logic: Hospital Fleet + Independent Drivers in range
            const hospitalFleet = await User.find({
                role: 'ambulance',
                linkedHospital: req.user._id,
                isAvailable: true,
                isApproved: true,
            });

            // Independent ambulances within 20km of the rescue
            const allIndependent = await User.find({
                role: 'ambulance',
                ambulanceType: 'independent',
                isAvailable: true,
                isApproved: true,
            });

            const nearbyIndependent = allIndependent.filter(amb => {
                if (!amb.location?.lat || !amb.location?.lng) return false;
                const dist = haversineDistance(rescue.location.lat, rescue.location.lng, amb.location.lat, amb.location.lng);
                return dist <= 20; // 20km radius for independent drivers
            });

            const targetAmbulances = [...hospitalFleet, ...nearbyIndependent];

            rescue.activeAmbulancePings = targetAmbulances.map((amb) => ({
                ambulanceId: amb._id,
                pingedAt: new Date(),
            }));
            rescue.pingRejectors = [];
            pushStatusLog(rescue, 'ambulance_pinged', `Hospital started dispatch. Notified ${hospitalFleet.length} fleet and ${nearbyIndependent.length} independent ambulances.`);
            emitRescueUpdate(rescue._id, 'ambulance_pinged', { 
                message: 'Hospital accepted the case and started ambulance dispatch.',
                notifiedFleet: hospitalFleet.length,
                notifiedIndependent: nearbyIndependent.length
            });

            // Emit the actual dispatch alert to the targeted ambulances
            const targetIds = targetAmbulances.map(a => a._id);
            emitAmbulanceDispatch(rescue, targetIds);
        }
        
        await rescue.save();
        res.status(200).json({ success: true, message: isNgoSelfTransport ? 'Case claimed. NGO is bringing the animal.' : 'Case claimed. Ambulance dispatch started.', rescue });
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

const onboardAmbulance = async (req, res) => {
    try {
        const { name, email, password, vehicleNumber, phone } = req.body;

        if (!name || !email || !password || !vehicleNumber || !phone) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        const ambulance = await User.create({
            name,
            email,
            password,
            vehicleNumber,
            phone,
            role: 'ambulance',
            ambulanceType: 'linked',
            linkedHospital: req.user._id,
            isApproved: true, // Auto-approved since onboarded by hospital
            isAvailable: true,
        });

        console.log(`[Hospital Controller] Hospital ${req.user.name} onboarded linked ambulance: ${ambulance.email}`);

        res.status(201).json({
            success: true,
            message: 'Ambulance onboarded and linked to your hospital successfully.',
            ambulance: {
                _id: ambulance._id,
                name: ambulance.name,
                email: ambulance.email,
                vehicleNumber: ambulance.vehicleNumber,
            },
        });
    } catch (error) {
        console.error('[Hospital Controller] onboardAmbulance error:', error.message);
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
    onboardAmbulance,
};
