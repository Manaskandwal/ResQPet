import { io } from 'socket.io-client';

// Determine the backend URL based on env
// If using Vite, VITE_API_URL is typically something like "http://localhost:5000/api"
// We want "http://localhost:5000"
const backendUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';

const socket = io(backendUrl, {
    autoConnect: false, // We'll connect manually when needed
    withCredentials: true
});

export default socket;
