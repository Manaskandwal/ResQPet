const axios = require('axios');
const io = require('socket.io-client');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// Actor Class combining REST calls & Socket listeners
class BotActor {
    constructor(name, email, role, extraPayload = {}) {
        this.name = name;
        this.email = email;
        this.password = 'password123';
        this.role = role;
        this.extraPayload = extraPayload;

        this.token = null;
        this.userId = null;
        this.socket = null;

        // Use chalk-like coloring manually for console
        this.color = this.getColor();
    }

    getColor() {
        switch (this.role) {
            case 'admin': return '\x1b[35m'; // Magenta
            case 'user': return '\x1b[36m';  // Cyan
            case 'ngo': return '\x1b[32m';   // Green
            case 'hospital': return '\x1b[34m'; // Blue
            case 'ambulance': return '\x1b[31m'; // Red
            default: return '\x1b[0m';
        }
    }

    log(message) {
        const msg = `[${this.name} (${this.role})] ${message}`;
        if (global.systemLog) {
            global.systemLog(msg);
        } else {
            console.error(msg);
        }
    }

    async registerAndLogin() {
        try {
            // Register
            const regPayload = {
                name: this.name,
                email: this.email,
                password: this.password,
                role: this.role,
                ...this.extraPayload
            };
            const regRes = await axios.post(`${BASE_URL}/auth/register`, regPayload);

            this.userId = regRes?.data?.user ? regRes.data.user._id : null;

            // Login
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                email: this.email,
                password: this.password
            });

            if (loginRes?.data?.success) {
                this.token = loginRes.data.token;
                this.userId = loginRes.data.user._id;
                this.log(`Successfully logged in.`);
                return true;
            } else if (loginRes?.data?.message?.includes('approval')) {
                this.log(`Registration requires Admin approval (Expected via strict RoleGuard).`);
                return false;
            } else {
                this.log(`Login failed: ${loginRes?.data?.message || loginRes?.message || 'Unknown network error'}`);
                return false;
            }
        } catch (error) {
            this.log(`Error in registerAndLogin: ${error.message}`);
            return false;
        }
    }

    async getHeaders() {
        return { Authorization: `Bearer ${this.token}` };
    }

    connectSocket() {
        return new Promise((resolve) => {
            if (!this.token) {
                this.log(`Cannot connect socket without token.`);
                return resolve(false);
            }

            this.socket = io(SOCKET_URL, {
                query: { token: this.token }
            });

            this.socket.on('connect', () => {
                this.log(`🟢 Connected to real-time WebSockets.`);
                resolve(true);
            });

            this.socket.on('connect_error', (err) => {
                this.log(`🔴 Socket Error: ${err.message}`);
                resolve(false);
            });

            // Generic listeners to log incoming broadcasts dynamically
            this.socket.onAny((eventName, ...args) => {
                // Ignore standard noise
                if (['connect', 'new_nearby_emergency', 'hospital_broadcast', 'ambulance_pinged'].includes(eventName)) {
                    this.log(`📩 Received socket event [${eventName}]: ${JSON.stringify(args[0])}`);
                }
            });
        });
    }

    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.log(`⚪ Disconnected socket.`);
        }
    }
}

module.exports = { BotActor };
