const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const { emitRescueUpdate } = require('../config/socket');

const getAssignedTask = async (req, res) => {
    try {
        const task = await RescueRequest.findOne({
            assignedAmbulance: req.user._id,
            status: { $in: ['ambulance_assigned', 'en_route', 'picked_up'] },
        })
            .populate('user', 'name phone email location')
            .populate('assignedHospital', 'name orgName phone address location');

        res.status(200).json({ success: true, task: task || null, message: task ? undefined : 'No active task assigned.' });
    } catch (error) {
        console.error('[Ambulance Controller] getAssignedTask error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validTransitions = {
            ambulance_assigned: 'en_route',
            en_route: 'picked_up',
            picked_up: 'delivered',
        };

        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        if (rescue.assignedAmbulance.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this rescue.' });
        }

        const expectedNextStatus = validTransitions[rescue.status];
        if (!expectedNextStatus || status !== expectedNextStatus) {
            return res.status(400).json({ success: false, message: `Invalid status transition. Expected next status: '${expectedNextStatus}'.` });
        }

        rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
        rescue.status = status;
        rescue.workStartedAt = rescue.workStartedAt || new Date();
        if (status === 'en_route') rescue.enRouteAt = new Date();
        if (status === 'picked_up') rescue.pickedUpAt = new Date();
        if (status === 'delivered') {
            rescue.deliveredAt = new Date();
            rescue.status = 'completed';
            rescue.completedAt = new Date();
            rescue.outcome = 'hospital_treated';
        }

        rescue.statusLogs.push({
            status: rescue.status,
            message: rescue.status === 'completed'
                ? 'Ambulance completed transport and the case is now completed.'
                : `Ambulance updated status to ${rescue.status}.`,
        });

        emitRescueUpdate(rescue._id, rescue.status, { message: `Ambulance updated status to ${rescue.status}` });
        await rescue.save();

        if (rescue.status === 'completed') {
            await User.findByIdAndUpdate(req.user._id, { isAvailable: true });
        }

        res.status(200).json({
            success: true,
            message: `Status updated to '${rescue.status}'.`,
            rescue,
        });
    } catch (error) {
        console.error('[Ambulance Controller] updateStatus error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getHistory = async (req, res) => {
    try {
        const history = await RescueRequest.find({
            assignedAmbulance: req.user._id,
            status: 'completed',
        })
            .populate('user', 'name phone')
            .sort({ completedAt: -1 })
            .limit(50);

        res.status(200).json({ success: true, count: history.length, history });
    } catch (error) {
        console.error('[Ambulance Controller] getHistory error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPingedTasks = async (req, res) => {
    try {
        const pingedTasks = await RescueRequest.find({
            status: 'ambulance_pinged',
            'activeAmbulancePings.ambulanceId': req.user._id,
        })
            .populate('user', 'name phone location')
            .populate('assignedHospital', 'name orgName phone location');

        res.status(200).json({ success: true, count: pingedTasks.length, tasks: pingedTasks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const acceptPing = async (req, res) => {
    try {
        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue || rescue.status !== 'ambulance_pinged') {
            return res.status(400).json({ success: false, message: 'Rescue no longer available.' });
        }

        const isPinged = rescue.activeAmbulancePings.some((ping) => ping.ambulanceId.toString() === req.user._id.toString());
        if (!isPinged) return res.status(403).json({ success: false, message: 'You were not pinged or ping expired.' });

        rescue.status = 'ambulance_assigned';
        rescue.assignedAmbulance = req.user._id;
        rescue.ambulanceAssignedAt = new Date();
        rescue.workStartedAt = rescue.workStartedAt || new Date();
        rescue.activeAmbulancePings = [];
        rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
        rescue.statusLogs.push({
            status: 'ambulance_assigned',
            message: `${req.user.name} accepted the ambulance dispatch.`,
        });

        emitRescueUpdate(rescue._id, rescue.status, { message: 'Ambulance accepted the dispatch.' });
        await rescue.save();
        await User.findByIdAndUpdate(req.user._id, { isAvailable: false });

        res.status(200).json({ success: true, message: 'You have claimed this dispatch.', rescue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const rejectPing = async (req, res) => {
    try {
        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue || rescue.status !== 'ambulance_pinged') {
            return res.status(400).json({ success: false, message: 'Rescue no longer available.' });
        }

        rescue.activeAmbulancePings = rescue.activeAmbulancePings.filter((p) => p.ambulanceId.toString() !== req.user._id.toString());
        if (!rescue.pingRejectors.includes(req.user._id)) {
            rescue.pingRejectors.push(req.user._id);
        }

        await rescue.save();
        res.status(200).json({ success: true, message: 'Ping rejected. Driver skipped.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAssignedTask, updateStatus, getHistory, getPingedTasks, acceptPing, rejectPing };
