const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

const DEPOSIT_AMOUNT = 20;

/**
 * @route   GET /api/ambulance/assigned
 * @desc    Get the rescue request currently assigned to this ambulance
 * @access  Private (ambulance only)
 */
const getAssignedTask = async (req, res) => {
    try {
        console.log(`[Ambulance Controller] getAssignedTask for ambulanceId: ${req.user._id}`);

        const task = await RescueRequest.findOne({
            assignedAmbulance: req.user._id,
            status: { $in: ['ambulance_assigned', 'en_route', 'picked_up'] },
        })
            .populate('user', 'name phone email location')
            .populate('assignedHospital', 'name orgName phone address location');

        if (!task) {
            console.log(`[Ambulance Controller] No active task for ambulanceId: ${req.user._id}`);
            return res.status(200).json({ success: true, task: null, message: 'No active task assigned.' });
        }

        console.log(`[Ambulance Controller] Active task: ${task._id}, status: ${task.status}`);
        res.status(200).json({ success: true, task });
    } catch (error) {
        console.error('[Ambulance Controller] getAssignedTask error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/rescue/:id/status
 * @desc    Ambulance updates status: en_route → picked_up → delivered (→ completed + refund)
 * @access  Private (ambulance only)
 */
const updateStatus = async (req, res) => {
    try {
        console.log(`[Ambulance Controller] updateStatus: rescueId=${req.params.id}, ambulanceId=${req.user._id}`);
        const { status } = req.body;

        const validTransitions = {
            ambulance_assigned: 'en_route',
            en_route: 'picked_up',
            picked_up: 'delivered',
        };

        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });

        // Security: only the assigned ambulance can update
        if (rescue.assignedAmbulance.toString() !== req.user._id.toString()) {
            console.warn(`[Ambulance Controller] Unauthorized status update attempt by: ${req.user._id}`);
            return res.status(403).json({ success: false, message: 'Not authorized to update this rescue.' });
        }

        const expectedNextStatus = validTransitions[rescue.status];
        if (!expectedNextStatus) {
            return res.status(400).json({
                success: false,
                message: `Cannot update status from '${rescue.status}'. No valid next step.`,
            });
        }

        if (status !== expectedNextStatus) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition. Expected next status: '${expectedNextStatus}'.`,
            });
        }

        // Update status and timestamp
        rescue.status = status;
        if (status === 'en_route') rescue.enRouteAt = new Date();
        if (status === 'picked_up') rescue.pickedUpAt = new Date();
        if (status === 'delivered') {
            rescue.deliveredAt = new Date();
            rescue.status = 'completed'; // auto-complete on delivery
            rescue.completedAt = new Date();
            console.log(`[Ambulance Controller] Rescue ${rescue._id} marked COMPLETED.`);
        }

        await rescue.save();

        // ── On completion: refund ₹20 deposit to user ─────────────────────────────
        if (rescue.status === 'completed' && rescue.depositDeducted && !rescue.depositRefunded) {
            try {
                const rescueUser = await User.findById(rescue.user);
                rescueUser.walletBalance += DEPOSIT_AMOUNT;
                await rescueUser.save();

                await WalletTransaction.create({
                    user: rescueUser._id,
                    amount: DEPOSIT_AMOUNT,
                    type: 'refund',
                    description: `₹${DEPOSIT_AMOUNT} deposit refunded for completed rescue #${rescue._id}`,
                    rescueRequest: rescue._id,
                    balanceAfter: rescueUser.walletBalance,
                });

                rescue.depositRefunded = true;
                await rescue.save();

                console.log(`[Ambulance Controller] Refunded ₹${DEPOSIT_AMOUNT} to userId: ${rescueUser._id}`);
            } catch (refundErr) {
                console.error('[Ambulance Controller] Deposit refund error:', refundErr.message);
                // Do NOT fail the status update — log and alert (could be processed manually)
            }
        }

        // ── Free up ambulance when completed ──────────────────────────────────────
        if (rescue.status === 'completed') {
            try {
                await User.findByIdAndUpdate(req.user._id, { isAvailable: true });
                console.log(`[Ambulance Controller] Ambulance ${req.user._id} marked available again.`);
            } catch (availErr) {
                console.error('[Ambulance Controller] Ambulance availability update error:', availErr.message);
            }
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

/**
 * @route   GET /api/ambulance/history
 * @desc    Get completed tasks history for this ambulance
 * @access  Private (ambulance only)
 */
const getHistory = async (req, res) => {
    try {
        console.log(`[Ambulance Controller] getHistory for ambulanceId: ${req.user._id}`);
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

module.exports = { getAssignedTask, updateStatus, getHistory };
