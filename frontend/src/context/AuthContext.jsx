import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// LocalStorage keys
const TOKEN_KEY = 'pawsaarthi_token';
const ADMIN_TOKEN_KEY = 'pawsaarthi_admin_token'; // saved before impersonation

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || null);
    const [loading, setLoading] = useState(true);

    // originalAdminToken — non-null only when admin is impersonating someone
    const [originalAdminToken, setOriginalAdminToken] = useState(
        localStorage.getItem(ADMIN_TOKEN_KEY) || null
    );

    const isImpersonating = !!originalAdminToken;

    // ── Bootstrap: validate token on mount ──────────────────────────────────
    useEffect(() => {
        const bootstrap = async () => {
            try {
                if (token) {
                    const { data } = await api.get('/auth/me');
                    setUser(data.user);
                }
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(ADMIN_TOKEN_KEY);
                setToken(null);
                setOriginalAdminToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Login ────────────────────────────────────────────────────────────────
    const login = useCallback((userData, jwtToken) => {
        localStorage.setItem(TOKEN_KEY, jwtToken);
        setToken(jwtToken);
        setUser(userData);
    }, []);

    // ── Logout ───────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
        setOriginalAdminToken(null);
        setUser(null);
    }, []);

    // ── Update user fields ───────────────────────────────────────────────────
    const updateUser = useCallback((updatedFields) => {
        setUser((prev) => ({ ...prev, ...updatedFields }));
    }, []);

    // ── Impersonate a user (admin only) ──────────────────────────────────────
    const impersonateUser = useCallback(async (userId) => {
        try {
            const { data } = await api.post('/auth/impersonate', { userId });
            if (!data.success) return { success: false, message: data.message };

            // Save the current admin token the first time we impersonate
            if (!originalAdminToken) {
                localStorage.setItem(ADMIN_TOKEN_KEY, token);
                setOriginalAdminToken(token);
            }

            localStorage.setItem(TOKEN_KEY, data.token);
            setToken(data.token);
            setUser(data.user);
            return { success: true };
        } catch (err) {
            console.error('[AuthContext] impersonateUser error:', err.response?.data?.message || err.message);
            return { success: false, message: err.response?.data?.message || 'Failed to switch account' };
        }
    }, [token, originalAdminToken]);

    // ── Stop impersonating — restore original admin token ────────────────────
    const stopImpersonating = useCallback(async () => {
        if (!originalAdminToken) return;
        try {
            localStorage.setItem(TOKEN_KEY, originalAdminToken);
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            setToken(originalAdminToken);
            setOriginalAdminToken(null);
            // Re-fetch admin user profile
            const { data } = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${originalAdminToken}` },
            });
            setUser(data.user);
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
