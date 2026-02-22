import axios from 'axios';

/**
 * Axios instance configured for the PawSaarthi API.
 * Automatically attaches JWT token from localStorage on every request.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://resqpet-backend.onrender.com/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// ── Request interceptor: attach JWT ───────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem('pawsaarthi_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('[Axios] Request interceptor error:', error.message);
        }
        return config;
    },
    (error) => {
        console.error('[Axios] Request error:', error.message);
        return Promise.reject(error);
    }
);

// ── Response interceptor: handle 401 globally ─────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        try {
            if (error.response?.status === 401) {
                console.warn('[Axios] 401 received — clearing token and redirecting to login');
                localStorage.removeItem('pawsaarthi_token');
                window.location.href = '/login';
            }
            console.error('[Axios] Response error:', error.response?.data?.message || error.message);
        } catch (interceptorError) {
            console.error('[Axios] Response interceptor error:', interceptorError.message);
        }
        return Promise.reject(error);
    }
);

export default api;
