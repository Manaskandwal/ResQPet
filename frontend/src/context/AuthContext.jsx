import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'vetscue_token';
const ADMIN_TOKEN_KEY = 'vetscue_admin_token';
const USER_KEY = 'vetscue_user';

export const AuthProvider = ({ children }) => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUserRaw = storedToken ? localStorage.getItem(USER_KEY) : null;
    let storedUser = null;
    try {
        storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
    } catch {
        storedUser = null;
    }

    const [user, setUser] = useState(storedUser || null);
    const [token, setToken] = useState(storedToken || null);
    const [loading, setLoading] = useState(Boolean(storedToken));
    const [originalAdminToken, setOriginalAdminToken] = useState(
        localStorage.getItem(ADMIN_TOKEN_KEY) || null
    );
    const hasBootstrappedRef = useRef(false);

    const isImpersonating = !!originalAdminToken;

    useEffect(() => {
        if (hasBootstrappedRef.current) return;
        hasBootstrappedRef.current = true;

        const bootstrap = async () => {
            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.get('/auth/me');
                setUser(data.user);
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            } catch (err) {
                const status = err?.response?.status;
                if (status === 401 || status === 403) {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(ADMIN_TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                    setToken(null);
                    setOriginalAdminToken(null);
                    setUser(null);
                } else {
                    // Network/server error: keep existing session data to avoid forced logout
                    console.warn('[AuthContext] /auth/me failed, keeping cached session:', err?.message);
                }
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, [storedToken]);

    const login = useCallback((userData, jwtToken) => {
        localStorage.setItem(TOKEN_KEY, jwtToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        setLoading(false);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setOriginalAdminToken(null);
        setUser(null);
        setLoading(false);
    }, []);

    const updateUser = useCallback((updatedFields) => {
        setUser((prev) => {
            const next = { ...(prev || {}), ...updatedFields };
            localStorage.setItem(USER_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const impersonateUser = useCallback(async (userId) => {
        try {
            const { data } = await api.post('/auth/impersonate', { userId });
            if (!data.success) return { success: false, message: data.message };

            if (!originalAdminToken) {
            localStorage.setItem(ADMIN_TOKEN_KEY, token);
            setOriginalAdminToken(token);
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
        } catch (err) {
            console.error('[AuthContext] impersonateUser error:', err.response?.data?.message || err.message);
            return { success: false, message: err.response?.data?.message || 'Failed to switch account' };
        }
    }, [token, originalAdminToken]);

    const stopImpersonating = useCallback(async () => {
        if (!originalAdminToken) return;
        try {
            localStorage.setItem(TOKEN_KEY, originalAdminToken);
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(originalAdminToken);
            setOriginalAdminToken(null);
            const { data } = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${originalAdminToken}` },
            });
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        } catch {
            logout();
        }
    }, [originalAdminToken, logout]);

    return (
        <AuthContext.Provider
            value={{
                user, token, loading,
                isImpersonating, originalAdminToken,
                login, logout, updateUser,
                impersonateUser, stopImpersonating,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
