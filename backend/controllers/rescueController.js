const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { uploadBufferToCloudinary } = require('../middleware/upload');
const { SERVICE_FEE } = require('../config/constants');
const { emitRescueUpdate, emitNewCaseToNgos } = require('../config/socket');
const { onRescueNeedsAmbulance } = require('../services/ambulanceDispatchService');
const { scheduleRescueEscalation, cancelRescueEscalation } = require('../jobs/rescueEscalationScheduler');

const DEPOSIT_AMOUNT = SERVICE_FEE;

const canRefundServiceFee = (rescue) => !!(rescue.depositDeducted && !rescue.depositRefunded && !rescue.workStartedAt);

/**
 * @route   POST /api/rescue
 * @desc    Submit a new rescue request (deducts Rs 30 service fee from wallet)
 * @access  Private (user only)
 */
const submitRescue = async (req, res) => {
    try {
        const { description, lat, lng, address, animalType, animalTypeOther, willingToPay, willingToGo } = req.body;

        if (!description || !lat || !lng) {
            return res.status(400).json({ success: false, message: 'Description and location (lat/lng) are required.' });
        }

        if (!['dog', 'cat', 'other'].includes(animalType)) {
            return res.status(400).json({ success: false, message: 'Please select a valid animal type.' });
        }

        const user = await User.findById(req.user._id);
        if (user.walletBalance < DEPOSIT_AMOUNT) {
            return res.status(400).json({
                success: false,
                message: `Insufficient wallet balance. A small service fee of Rs ${DEPOSIT_AMOUNT} is required to submit a rescue request.`,
            });
        }

        const imageUrls = [];
        let videoUrl = null;
        const uploadedFiles = Array.isArray(req.files) ? req.files : [];

        for (const file of uploadedFiles) {
            try {
                const isVideo = file.mimetype.startsWith('video/');
                const result = await uploadBufferToCloudinary(file.buffer, {
                    folder: 'VetsCue/rescue',
                    resource_type: isVideo ? 'video' : 'image',
                });

                if (isVideo) videoUrl = result.secure_url;
                else imageUrls.push(result.secure_url);
            } catch (uploadErr) {
                console.error('[Rescue Controller] Media upload error:', uploadErr.message);
            }
        }

        user.walletBalance -= DEPOSIT_AMOUNT;
        await user.save();

        const rescueRequest = await RescueRequest.create({
            user: user._id,
            description,
            animalType,
            animalTypeOther: animalType === 'other' ? (animalTypeOther || '') : '',
            images: imageUrls,
            video: videoUrl,
            location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                address: address || '',
            },
            willingToPay: willingToPay === 'true' || willingToPay === true,
            willingToGo: willingToGo === 'true' || willingToGo === true,
            depositDeducted: true,
            statusLogs: [
                {
                    status: 'pending',
                    message: 'Rescue request created and waiting for responders.',
                    images: imageUrls,
                    video: videoUrl,
                },
            ],
        });

        await WalletTransaction.create({
            user: user._id,
            amount: DEPOSIT_AMOUNT,
            type: 'debit',
            description: `Rs ${DEPOSIT_AMOUNT} service fee charged for rescue request #${rescueRequest._id}`,
            rescueRequest: rescueRequest._id,
            balanceAfter: user.walletBalance,
        });

        // Emit real-time alert to all NGOs
        emitNewCaseToNgos(rescueRequest);

        // Schedule escalation timers (20-min + 45-min)
        scheduleRescueEscalation(rescueRequest._id, rescueRequest.createdAt);

        res.status(201).json({
            success: true,
            message: 'Rescue request submitted. Help is on the way.',
            rescueRequest,
            walletBalance: user.walletBalance,
        });
    } catch (error) {
        console.error('[Rescue Controller] submitRescue error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Failed to submit rescue request.' });
    }
};

const getMyRescues = async (req, res) => {
    try {
        const rescues = await RescueRequest.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('assignedNGO', 'name orgName phone')
            .populate('assignedHospital', 'name orgName phone')
            .populate('assignedAmbulance', 'name vehicleNumber phone');

        res.status(200).json({ success: true, count: rescues.length, rescues });
    } catch (error) {
        console.error('[Rescue Controller] getMyRescues error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getRescueById = async (req, res) => {
    try {
        const rescue = await RescueRequest.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('assignedNGO', 'name orgName phone location')
            .populate('assignedHospital', 'name orgName phone location')
            .populate('assignedAmbulance', 'name vehicleNumber phone');

        if (!rescue) {
            return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        }

        // Handle case where user might have been deleted (rescue.user is null)
        const rescueUserId = rescue.user ? rescue.user._id.toString() : null;
        if (req.user.role === 'user' && rescueUserId !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.status(200).json({ success: true, rescue });
    } catch (error) {
        console.error('[Rescue Controller] getRescueById error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const cancelRescue = async (req, res) => {
    try {
        const rescue = await RescueRequest.findById(req.params.id);

        if (!rescue) {
            return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        }

        if (rescue.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        if (['completed', 'cancelled', 'closed_unresolved'].includes(rescue.status)) {
            return res.status(400).json({ success: false, message: `Cannot cancel: status is '${rescue.status}'.` });
        }

        rescue.status = 'cancelled';
        rescue.closedAt = new Date();
        rescue.statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
        rescue.statusLogs.push({
            status: 'cancelled',
            message: 'Case cancelled by the user.',
        });

        if (canRefundServiceFee(rescue)) {
            const user = await User.findById(rescue.user);
            user.walletBalance += DEPOSIT_AMOUNT;
            await user.save();

            rescue.depositRefunded = true;

            await WalletTransaction.create({
                user: user._id,
                amount: DEPOSIT_AMOUNT,
                type: 'credit',
                description: `Rs ${DEPOSIT_AMOUNT} service fee refunded for cancelled rescue request #${rescue._id}`,
                rescueRequest: rescue._id,
                balanceAfter: user.walletBalance,
            });
        }

        // Free the assigned ambulance if one was assigned
        if (rescue.assignedAmbulance) {
            await User.findByIdAndUpdate(rescue.assignedAmbulance, { isAvailable: true });
        }

        // Stop any pending escalation timers.
        cancelRescueEscalation(rescue._id);

        await rescue.save();
        emitRescueUpdate(rescue._id, 'cancelled', { message: 'Case cancelled by user' });

        res.status(200).json({ success: true, message: 'Rescue request cancelled successfully.', rescue });
    } catch (error) {
        console.error('[Rescue Controller] cancelRescue error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const makeFundraiser = async (req, res) => {
    try {
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

        // Only allow fundraiser conversion if the case is in a terminal or stalled state
        const allowedStatuses = ['completed', 'closed_unresolved', 'hospital_escalated'];
        if (!allowedStatuses.includes(rescue.status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Fundraisers can only be created for cases that are ${allowedStatuses.join(' or ')}.` 
            });
        }

        rescue.isFundraiser = true;
        rescue.estimatedCost = estimatedCost;
        rescue.status = 'fundraiser_active';
        
        // Add to status logs
        rescue.statusLogs.push({
            status: 'fundraiser_active',
            message: `Case converted to public fundraiser with estimated cost of ₹${estimatedCost}.`,
            timestamp: new Date()
        });

        await rescue.save();
        emitRescueUpdate(rescue._id, 'fundraiser_active', { message: `Case converted to public fundraiser` });

        res.status(200).json({ success: true, message: 'Your case is now public for fundraising.', rescue });
    } catch (error) {
        console.error('[Rescue Controller] makeFundraiser error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getImpactFeed = async (req, res) => {
    try {
        await RescueRequest.updateMany(
            { status: 'resolved_on_spot' },
            {
                $set: {
                    status: 'completed',
                    outcome: 'on_spot_treated',
                },
            }
        );

        const rescues = await RescueRequest.find({
            status: { $in: ['completed'] },
        })
            .populate('user', 'name')
            .populate('assignedNGO', 'name orgName')
            .sort({ completedAt: -1, updatedAt: -1 })
            .limit(30);

        const feed = rescues.map((rescue) => {
            const beforeImage = rescue.images?.[0] || null;
            const statusLogs = Array.isArray(rescue.statusLogs) ? rescue.statusLogs : [];
            const afterLog = [...statusLogs].reverse().find((log) => (log.images && log.images.length && log.images[0] !== beforeImage) || log.video);
            const fallbackAfter = [...(rescue.images || [])].reverse().find((image) => image && image !== beforeImage) || null;
            const afterImage = afterLog?.images?.[0] || fallbackAfter || null;

            return {
                _id: rescue._id,
                description: rescue.description,
                status: rescue.status,
                location: rescue.location,
                createdAt: rescue.createdAt,
                completedAt: rescue.completedAt,
                beforeImage,
                afterImage,
                afterSummary: afterLog?.message || (rescue.outcome === 'on_spot_treated' ? 'The animal improved through on-spot treatment and follow-up care.' : 'Reached safe completion after treatment.'),
                helperName: rescue.assignedNGO?.orgName || rescue.assignedNGO?.name || rescue.user?.name || 'VetsCue team',
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

const toggleImpactLike = async (req, res) => {
    try {
        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        if (rescue.status !== 'completed') {
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

const addImpactComment = async (req, res) => {
    try {
        const message = String(req.body.message || '').trim();
        if (!message) {
            return res.status(400).json({ success: false, message: 'Comment message is required.' });
        }

        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        if (rescue.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Only completed rescue stories can receive comments.' });
        }

        rescue.impact = rescue.impact || { likes: [], comments: [] };
        rescue.impact.comments.push({
            user: req.user._id,
            name: req.user.name,
            message,
        });
        await rescue.save();

        res.status(200).json({
            success: true,
            commentsCount: rescue.impact.comments.length,
            comments: rescue.impact.comments.slice(-5).reverse(),
        });
    } catch (error) {
        console.error('[Rescue Controller] addImpactComment error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateWillingness = async (req, res) => {
    try {
        const { willingToPay, willingToGo } = req.body;
        const rescue = await RescueRequest.findById(req.params.id);

        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        if (rescue.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the reporter can update these fields.' });
        }
        if (['completed', 'cancelled', 'closed_unresolved'].includes(rescue.status)) {
            return res.status(400).json({ success: false, message: 'Cannot update: case is already closed.' });
        }

        if (typeof willingToPay !== 'undefined') rescue.willingToPay = willingToPay === 'true' || willingToPay === true;
        if (typeof willingToGo !== 'undefined') rescue.willingToGo = willingToGo === 'true' || willingToGo === true;

        await rescue.save();
        res.status(200).json({ success: true, message: 'Preferences updated.', rescue });
    } catch (error) {
        console.error('[Rescue Controller] updateWillingness error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const manualTransportResponse = async (req, res) => {
    try {
        const { accept } = req.body;
        const rescue = await RescueRequest.findById(req.params.id);

        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        if (rescue.status !== 'manual_transport_accepted') {
            return res.status(400).json({ success: false, message: `Action not allowed for status: ${rescue.status}` });
        }

        const isNgo = req.user.role === 'ngo' && rescue.assignedNGO?.toString() === req.user._id.toString();
        const isUser = req.user.role === 'user' && rescue.user.toString() === req.user._id.toString();
        
        if (!isNgo && !isUser) {
            return res.status(403).json({ success: false, message: 'You are not authorized to respond to this transport block.' });
        }

        if (accept) {
            rescue.status = 'en_route';
            rescue.transportType = 'self';
            rescue.ngoTransporting = isNgo;
            
            rescue.statusLogs.push({
                status: 'en_route',
                message: `${req.user.name || req.user.orgName} has accepted to manually transport the animal.`,
                timestamp: new Date()
            });
            emitRescueUpdate(rescue._id, 'en_route', { message: 'Manual transport started.' });
        } else {
            // Rejecting transport
            rescue.status = 'closed_unresolved';
            rescue.outcome = 'closed_unresolved';
            rescue.closedAt = new Date();
            
            rescue.statusLogs.push({
                status: 'closed_unresolved',
                message: `${req.user.name || req.user.orgName} could not transport. Case closed as unresolved.`,
                timestamp: new Date()
            });

            // Refund deposit since platform failed to transport the successfully accepted animal
            if (rescue.depositDeducted && !rescue.depositRefunded) {
                const rUser = await User.findById(rescue.user);
                if (rUser) {
                    rUser.walletBalance += DEPOSIT_AMOUNT;
                    await rUser.save();
                    rescue.depositRefunded = true;
                    await WalletTransaction.create({
                        user: rUser._id,
                        amount: DEPOSIT_AMOUNT,
                        type: 'credit',
                        description: `Rs ${DEPOSIT_AMOUNT} service fee refunded as no transport was available for rescue request #${rescue._id}`,
                        rescueRequest: rescue._id,
                        balanceAfter: rUser.walletBalance,
                    });
                }
            }

            emitRescueUpdate(rescue._id, 'closed_unresolved', { message: 'Manual transport rejected. Case closed.' });
        }

        await rescue.save();
        res.status(200).json({ success: true, message: accept ? 'Transport started manually.' : 'Case closed.', rescue });
    } catch (error) {
        console.error('[Rescue Controller] manualTransportResponse error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const payHospitalBill = async (req, res) => {
    try {
        const rescue = await RescueRequest.findById(req.params.id);
        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        if (!rescue.bill || rescue.bill.paidStatus === 'paid') {
            return res.status(400).json({ success: false, message: 'No pending bill associated with this case.' });
        }

        const user = await User.findById(req.user._id);
        const amountToPay = rescue.bill.totalAmount;

        if (user.walletBalance < amountToPay) {
            return res.status(400).json({ success: false, message: `Insufficient wallet balance. You need ₹${amountToPay}.` });
        }

        // Deduct money
        user.walletBalance -= amountToPay;
        await user.save();

        rescue.bill.paidStatus = 'paid';
        
        const txn = await WalletTransaction.create({
            user: user._id,
            amount: amountToPay,
            type: 'debit',
            description: `Payment to ${rescue.assignedHospital || 'Hospital'} for rescue request #${rescue._id}`,
            rescueRequest: rescue._id,
            balanceAfter: user.walletBalance,
        });

        rescue.bill.walletTransactionId = txn._id;
        
        rescue.statusLogs.push({
            status: rescue.status,
            message: `Hospital bill of ₹${amountToPay} was paid by ${user.orgName || user.name}.`,
            timestamp: new Date()
        });

        await rescue.save();
        
        const Notification = require('../models/Notification');
        // Notify Hospital
        await Notification.create({
            recipient: rescue.assignedHospital,
            title: `Bill Paid`,
            message: `The bill of ₹${amountToPay} for rescue case has been paid.`,
            type: 'rescue_bill_paid',
            rescueRequest: rescue._id,
        });

        emitRescueUpdate(rescue._id, 'bill_paid', { message: 'Hospital bill paid.' });
        res.status(200).json({ success: true, message: 'Bill successfully paid.', walletBalance: user.walletBalance, rescue });
    } catch (error) {
        console.error('[Rescue Controller] payHospitalBill error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const requestReturnTransport = async (req, res) => {
    try {
        const { takeManually } = req.body;
        const rescue = await RescueRequest.findById(req.params.id);

        if (!rescue) return res.status(404).json({ success: false, message: 'Rescue request not found.' });
        if (rescue.treatmentStatus !== 'discharged') {
            return res.status(400).json({ success: false, message: 'Animal must be discharged before requesting return.' });
        }

        const isNgo = req.user.role === 'ngo' && rescue.assignedNGO?.toString() === req.user._id.toString();
        const isUser = req.user.role === 'user' && rescue.user.toString() === req.user._id.toString();
        
        if (!isNgo && !isUser) {
            return res.status(403).json({ success: false, message: 'You are not authorized.' });
        }

        if (takeManually) {
            rescue.status = 'completed';
            rescue.completedAt = new Date();
            if (req.user.role === 'ngo') {
                rescue.outcome = 'on_spot_treated';
            } else {
                rescue.outcome = 'hospital_treated';
            }
            rescue.statusLogs.push({
                status: 'completed',
                message: `${req.user.name || req.user.orgName} manually took the animal back. Case closed successfully.`,
                timestamp: new Date()
            });

            // Handle deposit refund logic - only refund if work never started (rescue couldn't proceed)
            if (canRefundServiceFee(rescue)) {
                const requestingUser = await User.findById(rescue.user);
                requestingUser.walletBalance += DEPOSIT_AMOUNT;
                await requestingUser.save();
                rescue.depositRefunded = true;
                await WalletTransaction.create({
                    user: requestingUser._id,
                    amount: DEPOSIT_AMOUNT,
                    type: 'refund',
                    description: `Rs ${DEPOSIT_AMOUNT} service fee refunded for cancelled rescue request #${rescue._id}`,
                    rescueRequest: rescue._id,
                    balanceAfter: requestingUser.walletBalance,
                });
            }

            emitRescueUpdate(rescue._id, 'completed', { message: 'Case completed via manual return.' });
        } else {
            // Free return ambulance trip ping 
            // We set status back to ambulance_pinged and clear the old ambulance
            rescue.status = 'ambulance_pinged';
            const oldAmbulance = rescue.assignedAmbulance;
            if (oldAmbulance) {
                await User.findByIdAndUpdate(oldAmbulance, { isAvailable: true });
                rescue.assignedAmbulance = null;
            }
            
            rescue.statusLogs.push({
                status: 'ambulance_pinged',
                message: 'Requested a free return ambulance to transport the animal back.',
                timestamp: new Date()
            });
            emitRescueUpdate(rescue._id, 'ambulance_pinged', { message: 'Requested return ambulance ping.' });
            
            // Ping Hospital Fleet + Independent
            const { emitAmbulanceDispatch } = require('../config/socket');
            // Assuming hospital fleet:
            const hospitalFleet = await User.find({
                role: 'ambulance',
                linkedHospital: rescue.assignedHospital,
                isAvailable: true,
                isApproved: true,
            });
            
            rescue.activeAmbulancePings = hospitalFleet.map((amb) => ({
                ambulanceId: amb._id,
                pingedAt: new Date(),
            }));
            rescue.pingRejectors = [];

            // Dispatch
            const targetIds = hospitalFleet.map(a => a._id);
            if (targetIds.length > 0) emitAmbulanceDispatch(rescue, targetIds);

            // Start event-driven dispatch service for return ambulance
            onRescueNeedsAmbulance(rescue._id).catch(err =>
                console.error(`[Rescue Controller] Failed to start return ambulance dispatch: ${err.message}`)
            );
        }

        await rescue.save();
        res.status(200).json({ success: true, message: takeManually ? 'Case completed.' : 'Dispatching return ambulance.', rescue });
    } catch (error) {
        console.error('[Rescue Controller] requestReturnTransport error:', error.message);
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
    updateWillingness,
    manualTransportResponse,
    payHospitalBill,
    requestReturnTransport
};
