const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            // Reusing logic from server.js for CORS
            origin: (origin, callback) => {
                const isDev = (process.env.NODE_ENV || 'development') !== 'production';
                const productionOrigin = process.env.CLIENT_URL;

                if (!origin) return callback(null, true);

                if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                    return callback(null, true);
                }

                if (productionOrigin && origin === productionOrigin) {
                    return callback(null, true);
                }

                callback(null, true); // Fallback for sockets to prevent strict block during dev
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] New client connected: ${socket.id}`);

        // Clients can join rooms based on their user ID or role to receive targeted pings
        socket.on('join', (data) => {
            if (data && data.userId) {
                socket.join(data.userId); // Join room named after User ID
                console.log(`[Socket] Client ${socket.id} joined room: ${data.userId}`);
            }
            if (data && data.role) {
                socket.join(`role_${data.role}`); // e.g. role_hospital, role_ambulance
                console.log(`[Socket] Client ${socket.id} joined role room: role_${data.role}`);
            }
        });

        // Ambulance real-time location streaming
        socket.on('ambulance_location_update', (data) => {
            // data should contain { rescueRequestId, lat, lng }
            // Broadcast this to a specific room for the rescue request so User/Hospital/Admin can see
            if (data && data.rescueRequestId) {
                const roomName = `rescue_${data.rescueRequestId}`;
                // Broadcast to everyone in that room EXCEPT the sender
                socket.to(roomName).emit('location_update', {
                    lat: data.lat,
                    lng: data.lng,
                    timestamp: new Date()
                });
            }
        });

        socket.on('join_rescue_room', (data) => {
            if (data && data.rescueRequestId) {
                const roomName = `rescue_${data.rescueRequestId}`;
                socket.join(roomName);
                console.log(`[Socket] Client ${socket.id} joined rescue room: ${roomName}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    console.log('[Socket] Socket.io initialized.');
    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized!');
    }
    return io;
};

/**
 * Emits a rescue status update to the dedicated rescue room.
 * @param {string} rescueId - The ID of the rescue request.
 * @param {string} status - The new status.
 * @param {Object} payload - Additional data (e.g. log message).
 */
const emitRescueUpdate = (rescueId, status, payload = {}) => {
    try {
        const _io = getIo();
        const roomName = `rescue_${rescueId}`;
        _io.to(roomName).emit('status_update', {
            rescueId,
            status,
            ...payload,
            timestamp: new Date()
        });
        console.log(`[Socket] Emitted status_update for rescue ${rescueId}: ${status}`);
    } catch (error) {
        console.error('[Socket] emitRescueUpdate error:', error.message);
    }
};

/**
 * Broadcasts a new rescue alert to all NGOs.
 */
const emitNewCaseToNgos = (rescue) => {
    try {
        const _io = getIo();
        _io.to('role_ngo').emit('new_rescue_alert', {
            rescueId: rescue._id,
            description: rescue.description,
            location: rescue.location,
            timestamp: new Date()
        });
        console.log(`[Socket] Broadcasted new_rescue_alert for rescue ${rescue._id} to all NGOs.`);
    } catch (error) {
        console.error('[Socket] emitNewCaseToNgos error:', error.message);
    }
};

/**
 * Broadcasts a dispatch alert to specific ambulances or the entire role.
 */
const emitAmbulanceDispatch = (rescue, ambulanceIds = []) => {
    try {
        const _io = getIo();
        const payload = {
            rescueId: rescue._id,
            description: rescue.description,
            location: rescue.location,
            hospitalName: rescue.assignedHospital?.orgName || 'Nearby Hospital',
            timestamp: new Date()
        };

        if (ambulanceIds.length > 0) {
            ambulanceIds.forEach(id => {
                _io.to(id.toString()).emit('new_dispatch_alert', payload);
            });
            console.log(`[Socket] Sent new_dispatch_alert for rescue ${rescue._id} to ${ambulanceIds.length} ambulances.`);
        } else {
            _io.to('role_ambulance').emit('new_dispatch_alert', payload);
            console.log(`[Socket] Broadcasted new_dispatch_alert for rescue ${rescue._id} to all ambulances.`);
        }
    } catch (error) {
        console.error('[Socket] emitAmbulanceDispatch error:', error.message);
    }
};

module.exports = { initSocket, getIo, emitRescueUpdate, emitNewCaseToNgos, emitAmbulanceDispatch };
