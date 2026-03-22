import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

const Login = () => {
    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(''); // Local error state for immediate feedback

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

    const handleChange = (e) => {
        setErrorMsg(''); // Clear error when typing
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic frontend validation
        if (!form.email.trim() || !form.password.trim()) {
            setErrorMsg('Please fill in all fields.');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        
        try {
            console.log('[Login] Attempting login for:', form.email);
            const { data } = await api.post('/auth/login', form);
            
            if (data.success) {
                login(data.user, data.token);
                toast.success(`Welcome back, ${data.user.name}! 🐾`);
    
                // Role-based redirect
                const routes = {
                    user: '/user/dashboard', ngo: '/ngo/dashboard',
                    hospital: '/hospital/dashboard', ambulance: '/ambulance/dashboard', admin: '/admin/dashboard',
                };
                navigate(routes[data.user.role] || '/');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            console.error('[Login] Error:', message);
            setErrorMsg(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (isNewUI) {
        return (
            <div className="min-h-screen bg-[#131313] flex items-center justify-center p-4">
                {/* Ambient glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#76d6d5]/10 rounded-full blur-[128px]" />
                </div>
                <div className="relative w-full max-w-md">
                    <div className="text-center mb-10 space-y-3">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-[#76d6d5]/10 border border-[#76d6d5]/20 mx-auto">
                            <span className="text-3xl">🐾</span>
                        </div>
                        <h1 className="font-headline text-3xl font-extrabold text-[#e5e2e1] tracking-tight">Welcome Back</h1>
                        <p className="text-[#e5e2e1]/40 text-sm">Sign in to your ResQPet account</p>
                    </div>
                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-8">
                        {errorMsg && (
                            <div className="mb-6 p-4 rounded-2xl border border-red-400/20 bg-red-400/5 flex items-start gap-3">
                                <span className="text-red-400">⚠️</span>
                                <p className="text-sm text-red-400">{errorMsg}</p>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30" htmlFor="email">Email Address</label>
                                <input id="email" name="email" type="email" autoComplete="email" required className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3.5 text-sm text-[#e5e2e1] placeholder:text-white/20 outline-none focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 transition-all" placeholder="name@example.com" value={form.email} onChange={handleChange} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30" htmlFor="password">Password</label>
                                <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3.5 text-sm text-[#e5e2e1] placeholder:text-white/20 outline-none focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 transition-all" placeholder="••••••••" value={form.password} onChange={handleChange} />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4 mt-2 rounded-2xl bg-[#76d6d5] text-[#131313] text-sm font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {loading ? <><span className="w-4 h-4 border-2 border-[#131313]/30 border-t-[#131313] rounded-full animate-spin" /> Signing in...</> : 'Sign In'}
                            </button>
                        </form>
                        <p className="text-center text-sm text-[#e5e2e1]/30 mt-8">
                            New to ResQPet?{' '}<Link to="/register" className="text-[#76d6d5] font-bold hover:text-[#76d6d5]/80 transition-colors">Create an account</Link>
                        </p>
                    </div>
                    <p className="text-center text-xs text-[#e5e2e1]/20 mt-6">© 2024 ResQPet • Made for Animals 🐾</p>
                </div>
            </div>
        );
    }

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
                    <p className="text-surface-muted mt-1 text-sm font-medium">All in One Animal Platform</p>
                </div>

                {/* Card */}
                <div className="card shadow-card-hover border-surface-border">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
                    <p className="text-slate-500 text-sm mb-6">Sign in to your account to continue</p>
                    
                    {/* Error Box */}
                    {errorMsg && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-pulse-soft">
                            <span className="text-red-500 mt-0.5">⚠️</span>
                            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="form-group">
                            <label className="label text-slate-700 font-semibold" htmlFor="email">Email Address</label>
                            <input 
                                id="email" 
                                name="email" 
                                type="email" 
                                autoComplete="email"
                                required 
                                className="input focus:ring-primary-500" 
                                placeholder="name@example.com"
                                value={form.email} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="form-group">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="label text-slate-700 font-semibold m-0" htmlFor="password">Password</label>
                            </div>
                            <input 
                                id="password" 
                                name="password" 
                                type="password" 
                                autoComplete="current-password"
                                required 
                                className="input focus:ring-primary-500" 
                                placeholder="••••••••"
                                value={form.password} 
                                onChange={handleChange} 
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`btn-primary w-full btn-lg mt-2 flex items-center justify-center gap-2 ${loading ? 'opacity-80' : ''}`}
                        >
                            {loading ? (
                                <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in...</>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                    
                    <p className="text-center text-sm text-surface-muted mt-8">
                        New to PawSaarthi?{' '}
                        <Link to="/register" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">
                            Create an account
                        </Link>
                    </p>
                </div>

                {/* Footer links or info */}
                <div className="mt-8 text-center text-xs text-slate-400 space-y-2">
                    <p>© 2024 ResQPet • Made for Animals 🐾</p>
                </div>
            </div>
        </div>
    );
};


export default Login;
