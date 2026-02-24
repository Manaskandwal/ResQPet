import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Login = () => {
    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (user && !authLoading) {
            const routes = {
                user: '/user/dashboard', ngo: '/ngo/dashboard',
                hospital: '/hospital/dashboard', ambulance: '/ambulance/dashboard', admin: '/admin/dashboard',
            };
            navigate(routes[user.role] || '/user/dashboard', { replace: true });
        }
    }, [user, authLoading, navigate]);

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log('[Login] Attempting login for:', form.email);
            const { data } = await api.post('/auth/login', form);
            login(data.user, data.token);
            toast.success(`Welcome back, ${data.user.name}! 🐾`);

            // Role-based redirect
            const routes = {
                user: '/user/dashboard', ngo: '/ngo/dashboard',
                hospital: '/hospital/dashboard', ambulance: '/ambulance/dashboard', admin: '/admin/dashboard',
            };
            navigate(routes[data.user.role] || '/');
        } catch (error) {
            console.error('[Login] Error:', error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return authLoading ? (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
            <div className="animate-spin text-primary-600 text-4xl">🐾</div>
        </div>
    ) : (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <img src="/logo.svg" alt="PawSaarthi" className="h-12 mx-auto mb-2" />
                    <p className="text-surface-muted mt-1">All in One Animal Platform</p>
                </div>

                {/* Card */}
                <div className="card shadow-card-hover">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Sign in to your account</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-group">
                            <label className="label" htmlFor="email">Email address</label>
                            <input id="email" name="email" type="email" autoComplete="email"
                                required className="input" placeholder="you@example.com"
                                value={form.email} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="password">Password</label>
                            <input id="password" name="password" type="password" autoComplete="current-password"
                                required className="input" placeholder="••••••••"
                                value={form.password} onChange={handleChange} />
                        </div>
                        <button type="submit" disabled={loading}
                            className="btn-primary w-full btn-lg mt-2">
                            {loading ? (
                                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in...</>
                            ) : 'Sign In'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-surface-muted mt-6">
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                            Register here
                        </Link>
                    </p>
                </div>

                {/* Demo hint */}
                <p className="text-center text-xs text-surface-muted mt-4">
                    Admin: admin@pawsaarthi.com / Admin@123456 (after seeding)
                </p>
            </div>
        </div>
    );
};

export default Login;
