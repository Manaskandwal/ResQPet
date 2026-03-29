import axios from 'axios';

/**
 * Axios instance configured for the VetsCue API.
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
            const token = localStorage.getItem('vetscue_token');
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
                // 1. Check if this was an actual auth attempt (Login/Register)
                const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
                
                // 2. Identify public routes that shouldn't force a redirect/reload on 401
                const publicRoutes = ['/', '/login', '/register', '/fundraisers'];
                const isPublicRoute = publicRoutes.includes(window.location.pathname);

                if (!isAuthRequest && !isPublicRoute) {
                    console.warn('[Axios] session expired on protected route — redirecting to login.');
                    localStorage.removeItem('vetscue_token');
                    localStorage.removeItem('vetscue_admin_token');
                    window.location.href = '/login';
                } else {
                    // For public routes or login attempts, we just want the state to update (handled in AuthContext/Component)
                    // and definitely don't want a full page reload or redirect.
                    console.log('[Axios] 401 received on public route or auth request — skipping global redirect.');
                }
            }
            console.error('[Axios] Response error:', error.response?.data?.message || error.message);
        } catch (interceptorError) {
            console.error('[Axios] Response interceptor error:', interceptorError.message);
        }
        return Promise.reject(error);
    }
);

export default api;
