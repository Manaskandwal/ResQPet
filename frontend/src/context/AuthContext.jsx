import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'pawsaarthi_token';
const ADMIN_TOKEN_KEY = 'pawsaarthi_admin_token';

export const AuthProvider = ({ children }) => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const [user, setUser] = useState(null);
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
    }, [storedToken]);

    const login = useCallback((userData, jwtToken) => {
        localStorage.setItem(TOKEN_KEY, jwtToken);
        setToken(jwtToken);
        setUser(userData);
        setLoading(false);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
        setOriginalAdminToken(null);
        setUser(null);
        setLoading(false);
    }, []);

    const updateUser = useCallback((updatedFields) => {
        setUser((prev) => ({ ...prev, ...updatedFields }));
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
            setToken(originalAdminToken);
            setOriginalAdminToken(null);
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
