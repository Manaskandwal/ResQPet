const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const { haversineDistance } = require('../utils/haversine');
const { uploadBufferToCloudinary } = require('../middleware/upload');
const { emitRescueUpdate } = require('../config/socket');
const Donation = require('../models/Donation');

const parseCoordinate = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const pushStatusLog = (rescue, status, message, images = [], video = null) => {
    rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
    rescue.statusLogs.push({
        status,
        message,
        images,
        video,
    });
};

const processEscalationFallback = async (rescue, transportType, ngoCannotPay) => {
    let fundSource = 'ngo';
    let finalStatus = 'hospital_broadcasted';
    let updateMessage = transportType === 'self'
        ? 'NGO escalated the case and is bringing the animal to the hospital.'
        : 'NGO escalated the case and requested an ambulance for hospital transport.';

    if (ngoCannotPay) {
        if (rescue.willingToPay) {
            fundSource = 'user';
            updateMessage += ' (Funded by User).';
        } else {
            const platformFundsAgg = await Donation.aggregate([
                { $match: { isGeneral: true, status: { $in: ['successful', 'active'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalPlatformFunds = platformFundsAgg[0]?.total || 0;
            if (totalPlatformFunds >= 20000) {
                fundSource = 'platform';
                updateMessage += ' (Supported by Platform Fund).';
            } else {
                finalStatus = 'closed_unresolved';
                updateMessage = 'NGO escalated but no funds are available (User unable, Platform exhausted). Case closed.';
            }
        }
    }

    rescue.status = finalStatus;
    if (finalStatus === 'hospital_broadcasted') {
        rescue.escalatedAt = new Date();
        rescue.fundSource = fundSource;
        rescue.transportType = transportType || 'ambulance';
        rescue.ngoTransporting = (transportType === 'self');
    } else {
        rescue.closedAt = new Date();
        rescue.outcome = 'closed_unresolved';
    }

    pushStatusLog(rescue, finalStatus, updateMessage);
    return updateMessage;
};

const getNearbyCases = async (req, res) => {
    try {
        const profileLat = parseCoordinate(req.user.location?.lat);
        const profileLng = parseCoordinate(req.user.location?.lng);
        const queryLat = parseCoordinate(req.query.lat);
        const queryLng = parseCoordinate(req.query.lng);

        const activeLat = queryLat ?? profileLat;
        const activeLng = queryLng ?? profileLng;
        const hasLocation = activeLat !== null && activeLng !== null;

        const pendingCases = await RescueRequest.find({
            status: 'pending',
            rejectedBy: { $ne: req.user._id },
        })
            .populate('user', 'name phone')
            .sort({ createdAt: 1 });

        let resultCases;
        if (hasLocation) {
            resultCases = pendingCases
                .map((rescue) => ({ ...rescue.toObject(), distance: haversineDistance(activeLat, activeLng, rescue.location.lat, rescue.location.lng) }))
                .filter((rescue) => rescue.distance <= 50)
                .sort((a, b) => a.distance - b.distance);
        } else {
            resultCases = pendingCases.map((rescue) => ({ ...rescue.toObject(), distance: null }));
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

const acceptCase = async (req, res) => {
    try {
        const { type, scheduleDate, transportType } = req.body;
        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        if (rescue.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Case already accepted or cancelled.' });
        }

        rescue.assignedNGO = req.user._id;
        rescue.acceptedAt = new Date();

        let updateMessage = '';

        if (type === 'schedule') {
            if (!scheduleDate) {
                return res.status(400).json({ success: false, message: 'Please select a valid schedule date and time.' });
            }
            const parsedScheduleDate = new Date(scheduleDate);
            if (Number.isNaN(parsedScheduleDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Scheduled date/time is invalid.' });
            }
            rescue.status = 'scheduled';
            rescue.scheduleDate = parsedScheduleDate;
            updateMessage = `NGO scheduled the rescue for ${parsedScheduleDate.toLocaleString()}`;
            pushStatusLog(rescue, 'scheduled', `NGO scheduled the rescue for ${parsedScheduleDate.toISOString()}`);
        } else if (type === 'hospital') {
            updateMessage = await processEscalationFallback(rescue, transportType, req.body.ngoCannotPay);
        } else {
            rescue.status = 'accepted';
            updateMessage = 'NGO accepted the case for treatment.';
            pushStatusLog(rescue, 'accepted', updateMessage);
        }

        emitRescueUpdate(rescue._id, rescue.status, { 
            message: updateMessage,
            transportType: rescue.transportType,
            ngoTransporting: rescue.ngoTransporting
        });
        await rescue.save();
        res.status(200).json({ success: true, message: 'Case accepted successfully.', rescue });
    } catch (error) {
        console.error('[NGO Controller] acceptCase error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateNGOStatus = async (req, res) => {
    try {
        const { status, message } = req.body;
        const rescue = await RescueRequest.findOne({ _id: req.params.id, assignedNGO: req.user._id });
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue not found or not assigned to you.' });

        const imageUrls = [];
        let videoUrl = null;
        const uploadedFiles = Array.isArray(req.files) ? req.files : [];

        for (const file of uploadedFiles) {
            try {
                const isVideo = file.mimetype.startsWith('video/');
                const result = await uploadBufferToCloudinary(file.buffer, {
                    folder: `VetsCue/rescue/${rescue._id}`,
                    resource_type: isVideo ? 'video' : 'image',
                });
                if (isVideo) videoUrl = result.secure_url;
                else imageUrls.push(result.secure_url);
            } catch (err) {
                console.error('[NGO Controller] Media upload error:', err.message);
            }
        }

        rescue.status = status;
        if (['on_the_way', 'reached', 'treating'].includes(status) && !rescue.workStartedAt) {
            rescue.workStartedAt = new Date();
        }
        if (imageUrls.length > 0) {
            rescue.images = [...(rescue.images || []), ...imageUrls].slice(-12);
        }
        if (videoUrl) {
            rescue.video = videoUrl;
        }

        pushStatusLog(rescue, status, message || `NGO updated status to ${status}.`, imageUrls, videoUrl);
        emitRescueUpdate(rescue._id, rescue.status, { message: message || `NGO updated status to ${status}` });
        await rescue.save();

        res.status(200).json({ success: true, message: `Status updated to ${status}.`, rescue });
    } catch (error) {
        console.error('[NGO Controller] updateNGOStatus error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const rejectCase = async (req, res) => {
    try {
        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        if (rescue.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Cannot reject: status is '${rescue.status}'.` });
        }

        rescue.rejectedBy = Array.isArray(rescue.rejectedBy) ? rescue.rejectedBy : [];
        if (!rescue.rejectedBy.some((id) => id.toString() === req.user._id.toString())) {
            rescue.rejectedBy.push(req.user._id);
        }

        const allNGOs = await User.find({ role: 'ngo', isApproved: true });
        let nearbyNgoCount = 0;
        allNGOs.forEach((n) => {
            if (Number.isFinite(n.location?.lat) && Number.isFinite(n.location?.lng)) {
                const dist = haversineDistance(rescue.location.lat, rescue.location.lng, n.location.lat, n.location.lng);
                if (dist <= 50) nearbyNgoCount += 1;
            }
        });

        if (nearbyNgoCount > 0 && rescue.rejectedBy.length >= nearbyNgoCount) {
            rescue.status = 'hospital_broadcasted';
            rescue.escalatedAt = new Date();
            pushStatusLog(rescue, 'hospital_broadcasted', 'All nearby NGOs rejected the case. Escalated to hospitals.');
            emitRescueUpdate(rescue._id, rescue.status, { message: 'All nearby NGOs rejected the case. Escalated to hospitals.' });
        }

        await rescue.save();
        res.status(200).json({ success: true, message: 'Case rejected. You will not see this case again.', rescue });
    } catch (error) {
        console.error('[NGO Controller] rejectCase error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMyCases = async (req, res) => {
    try {
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

const getAnalytics = async (req, res) => {
    try {
        const ngoId = req.user._id;
        const [accepted, completed, rejected, nearbyPending] = await Promise.all([
            RescueRequest.countDocuments({ assignedNGO: ngoId }),
            RescueRequest.countDocuments({ assignedNGO: ngoId, status: 'completed' }),
            RescueRequest.countDocuments({ rejectedBy: ngoId }),
            RescueRequest.countDocuments({ status: 'pending', rejectedBy: { $ne: ngoId } }),
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
                acceptance_rate: acceptanceRate,
            },
        });
    } catch (error) {
        console.error('[NGO Controller] getAnalytics error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const resolveOnSpot = async (req, res) => {
    try {
        const rescue = await RescueRequest.findOne({ _id: req.params.id, assignedNGO: req.user._id });
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found or not assigned to you.' });

        if (!['accepted', 'scheduled', 'on_the_way', 'reached', 'treating'].includes(rescue.status)) {
            return res.status(400).json({ success: false, message: `Cannot treat on spot from current status: ${rescue.status}` });
        }

        rescue.status = 'resolved_on_spot';
        rescue.outcome = 'on_spot_treated';
        rescue.workStartedAt = rescue.workStartedAt || new Date();
        pushStatusLog(rescue, 'resolved_on_spot', 'NGO treated the animal on the spot. Final completion or follow-up can be added next.');
        emitRescueUpdate(rescue._id, rescue.status, { message: 'NGO treated the animal on the spot.' });
        await rescue.save();

        res.status(200).json({ success: true, message: 'On-spot treatment recorded.', rescue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const completeCase = async (req, res) => {
    try {
        const rescue = await RescueRequest.findOne({ _id: req.params.id, assignedNGO: req.user._id });
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found or not assigned to you.' });

        if (!['resolved_on_spot', 'treating', 'reached'].includes(rescue.status)) {
            return res.status(400).json({ success: false, message: `Cannot complete case from status: ${rescue.status}` });
        }

        rescue.status = 'completed';
        rescue.completedAt = new Date();
        rescue.outcome = rescue.outcome === 'on_spot_treated' ? 'on_spot_treated' : 'hospital_treated';
        pushStatusLog(rescue, 'completed', rescue.outcome === 'on_spot_treated'
            ? 'Case completed after on-spot treatment.'
            : 'Case completed by NGO.');
        emitRescueUpdate(rescue._id, rescue.status, { message: 'Case marked completed by NGO.' });
        await rescue.save();

        res.status(200).json({ success: true, message: 'Case marked completed.', rescue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addFollowUp = async (req, res) => {
    try {
        const { scheduleDate, notes } = req.body;
        const rescue = await RescueRequest.findOne({ _id: req.params.id, assignedNGO: req.user._id });
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found or not assigned to you.' });

        const parsedScheduleDate = new Date(scheduleDate);
        if (Number.isNaN(parsedScheduleDate.getTime()) || parsedScheduleDate <= new Date()) {
            return res.status(400).json({ success: false, message: 'Please select a valid future follow-up date.' });
        }

        rescue.followUps = Array.isArray(rescue.followUps) ? rescue.followUps : [];
        rescue.followUps.push({
            scheduledFor: parsedScheduleDate,
            notes: notes || '',
        });
        pushStatusLog(rescue, 'scheduled', `Follow-up visit scheduled for ${parsedScheduleDate.toISOString()}. ${notes || ''}`.trim());
        await rescue.save();

        res.status(200).json({ success: true, message: 'Follow-up scheduled successfully.', rescue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const escalateToHospital = async (req, res) => {
    try {
        const { transportType, ngoCannotPay } = req.body;
        const rescue = await RescueRequest.findOne({ _id: req.params.id, assignedNGO: req.user._id });
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found or not assigned to you.' });

        if (!['accepted', 'scheduled', 'on_the_way', 'reached', 'treating', 'resolved_on_spot'].includes(rescue.status)) {
            return res.status(400).json({ success: false, message: `Cannot escalate. Current status: ${rescue.status}` });
        }

        rescue.workStartedAt = rescue.workStartedAt || new Date();
        const updateMessage = await processEscalationFallback(rescue, transportType, ngoCannotPay);

        emitRescueUpdate(rescue._id, rescue.status, { 
            message: updateMessage,
            transportType: rescue.transportType,
            ngoTransporting: rescue.ngoTransporting
        });
        await rescue.save();

        res.status(200).json({ success: true, message: 'Case escalated to hospitals.', rescue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const requestFundraiser = async (req, res) => {
    try {
        const { requestedGoal, billText } = req.body;
        const rescueId = req.params.id;

        const rescue = await RescueRequest.findOne({ _id: rescueId, assignedNGO: req.user._id });
        if (!rescue) return res.status(404).json({ success: false, message: 'Case not found or not assigned to you.' });

        // Only completed or treating cases can request a fundraiser
        if (!['completed', 'treating', 'reached', 'resolved_on_spot', 'hospital_broadcasted'].includes(rescue.status)) {
            return res.status(400).json({ success: false, message: `Cannot start a fundraiser from status: ${rescue.status}` });
        }

        if (rescue.fundraiser && ['pending', 'approved', 'completed'].includes(rescue.fundraiser.status)) {
            return res.status(400).json({ success: false, message: `Fundraiser is already ${rescue.fundraiser.status}.` });
        }

        let billImage = null;
        if (req.files && req.files.length > 0) {
            try {
                const result = await uploadBufferToCloudinary(req.files[0].buffer, {
                    folder: `VetsCue/fundraiser/${rescue._id}`,
                    resource_type: 'image',
                });
                billImage = result.secure_url;
            } catch (err) {
                console.error('[NGO Controller] Fundraiser bill upload error:', err.message);
                return res.status(500).json({ success: false, message: 'Failed to upload bill image evidence.' });
            }
        }

        if (!billImage) {
            return res.status(400).json({ success: false, message: 'An image of the estimated/actual bill is required.' });
        }
        
        if (!requestedGoal || requestedGoal < 100) {
            return res.status(400).json({ success: false, message: 'Minimum requested goal is ₹100.' });
        }

        rescue.fundraiser = {
            status: 'pending',
            requestedGoal: Number(requestedGoal),
            billText: billText || '',
            billImage,
            requestedAt: new Date(),
        };

        pushStatusLog(rescue, rescue.status, `NGO submitted a fundraiser request for ₹${requestedGoal}. Pending admin approval.`);
        await rescue.save();

        res.status(200).json({ success: true, message: 'Fundraiser requested. Awaiting Admin verification.', rescue });
    } catch (error) {
        console.error('[NGO Controller] requestFundraiser error:', error.message);
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
    updateNGOStatus,
    completeCase,
    addFollowUp,
    requestFundraiser,
};
