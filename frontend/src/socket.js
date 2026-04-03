import { io } from 'socket.io-client';

// Determine the backend URL based on env
const backendUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';

// Helper to get current auth token
const getAuthToken = () => {
    try {
        return localStorage.getItem('vetscue_token') || localStorage.getItem('vetscue_admin_token');
    } catch {
        return null;
    }
};

const socket = io(backendUrl, {
    autoConnect: false,
    withCredentials: true,
    auth: {
        token: getAuthToken()
    }
});

// Update token when reconnecting (in case user logged in/out)
socket.io.on('reconnect_attempt', () => {
    socket.auth = { token: getAuthToken() };
});

export const refreshSocketAuth = () => {
    socket.auth = { token: getAuthToken() };
    return socket;
};

export const connectSocket = () => {
    refreshSocketAuth();
    if (!socket.connected) {
        socket.connect();
    }
    return socket;
};

export default socket;
