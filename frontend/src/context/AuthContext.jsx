import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('pawsaarthi_token') || null);
    const [loading, setLoading] = useState(true);

    // On mount: validate stored token and fetch user profile
    useEffect(() => {
        const bootstrap = async () => {
            try {
                if (token) {
                    console.log('[AuthContext] Bootstrapping: validating stored token...');
                    const { data } = await api.get('/auth/me');
                    setUser(data.user);
                    console.log('[AuthContext] Bootstrap success, user:', data.user.email);
                }
            } catch (error) {
                console.error('[AuthContext] Bootstrap failed (invalid token):', error.message);
                // Clear invalid token
                localStorage.removeItem('pawsaarthi_token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = useCallback((userData, jwtToken) => {
        try {
            console.log('[AuthContext] Login:', userData.email, 'role:', userData.role);
            localStorage.setItem('pawsaarthi_token', jwtToken);
            setToken(jwtToken);
            setUser(userData);
        } catch (error) {
            console.error('[AuthContext] login error:', error.message);
        }
    }, []);

    const logout = useCallback(() => {
        try {
            console.log('[AuthContext] Logging out user:', user?.email);
            localStorage.removeItem('pawsaarthi_token');
            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('[AuthContext] logout error:', error.message);
        }
    }, [user]);

    const updateUser = useCallback((updatedFields) => {
        setUser((prev) => ({ ...prev, ...updatedFields }));
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
