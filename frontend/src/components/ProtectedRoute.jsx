import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps routes that require authentication and a specific role.
 * Admin users (isAdmin: true) bypass all role restrictions.
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[var(--brand-primary)]/30 border-t-[var(--brand-primary)] rounded-full animate-spin" />
                    <p className="text-sm text-[var(--text-muted)] font-medium">Loading VetsCue...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    // Admin users can access any route regardless of role
    if (user?.isAdmin) return <Outlet />;

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;