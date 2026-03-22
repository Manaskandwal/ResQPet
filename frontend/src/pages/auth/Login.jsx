import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PawLoader from '../../components/PawLoader';

const Login = () => {
    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';
    
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

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
        setErrorMsg('');
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleGoogleSuccess = async (response) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/google', { credential: response.credential });
            if (data.success) {
                login(data.user, data.token);
                toast.success(`Welcome, ${data.user.name}! 🐾`);
                const routes = {
                    user: '/user/dashboard', ngo: '/ngo/dashboard',
                    hospital: '/hospital/dashboard', ambulance: '/ambulance/dashboard', admin: '/admin/dashboard',
                };
                navigate(routes[data.user.role] || redirect);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email.trim() || !form.password.trim()) {
            setErrorMsg('Please fill in all fields.');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        try {
            const { data } = await api.post('/auth/login', form);
            if (data.success) {
                login(data.user, data.token);
                toast.success(`Welcome back, ${data.user.name}! 🐾`);
                const routes = {
                    user: '/user/dashboard', ngo: '/ngo/dashboard',
                    hospital: '/hospital/dashboard', ambulance: '/ambulance/dashboard', admin: '/admin/dashboard',
                };
                navigate(routes[data.user.role] || redirect);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            setErrorMsg(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="min-h-screen bg-[#131313] flex items-center justify-center"><PawLoader /></div>;

    return (
        <div className="h-screen bg-[#131313] flex flex-col lg:flex-row overflow-hidden font-body relative">
            {/* Left Column: Splash */}
            <div className="hidden lg:flex lg:w-3/5 relative items-center justify-center bg-[#0e0e0e] h-full">
                <div className="absolute inset-0 z-0">
                    <img src="/auth_splash.png" alt="Rescue Mission" className="w-full h-full object-cover opacity-60 mix-blend-luminosity grayscale hover:grayscale-0 transition-all duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#131313] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#131313]/20 via-transparent to-[#131313]/50 pointer-events-none" />
                </div>
                
                <div className="relative z-10 p-16 space-y-6 max-w-2xl">
                    <div className="flex items-center gap-3 animate-slide-in">
                        <span className="material-symbols-outlined text-[#76d6d5] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
                        <span className="text-4xl font-black text-[#76d6d5] font-headline tracking-tighter uppercase leading-none">VetsCue</span>
                    </div>
                    <div className="space-y-2 animate-slide-up">
                        <h2 className="text-6xl font-black font-headline text-white leading-tight tracking-tighter">The Ultimate <br /><span className="text-[#76d6d5]">Guardians</span> of Life.</h2>
                        <p className="text-lg text-white/50 leading-relaxed max-w-md">Orchestrating every rescue mission with precision and compassion.</p>
                    </div>
                    {/* Floating metric */}
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-xl w-fit animate-pulse-soft">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5] mb-1">Impact Status</p>
                        <p className="text-2xl font-black text-white">Always On-Duty</p>
                    </div>
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="flex-1 relative flex items-center justify-center p-8 lg:p-12 h-full overflow-y-auto no-scrollbar">
                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-8 left-8 p-3 rounded-full hover:bg-white/5 text-[#e5e2e1]/40 hover:text-[#e5e2e1] transition-all group border border-transparent hover:border-white/5 flex items-center gap-2"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Go Back</span>
                </button>

                <div className="w-full max-w-sm space-y-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-black font-headline text-white tracking-tight">Welcome Back</h1>
                        <p className="text-sm text-white/30 mt-2">Sign in to orchestrate the mission.</p>
                    </div>

                    {errorMsg && (
                        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 animate-slide-up flex gap-3 items-center">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            {errorMsg}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Social login integration */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/20">Quick Access</label>
                            <div className="w-full flex justify-center">
                                <GoogleLogin 
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => toast.error('Google Sign In failed')}
                                    theme="filled_black"
                                    shape="circle"
                                    width="100%"
                                />
                            </div>
                        </div>

                        <div className="relative flex items-center justify-center group">
                            <div className="w-full border-b border-white/5"></div>
                            <span className="absolute px-4 text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/20 bg-[#131313]">Or use email</span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 ml-1" htmlFor="email text">Email Address</label>
                                <input id="email" name="email" type="email" required className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-white focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 outline-none transition-all placeholder:text-white/10" placeholder="e.g. guardian@resqpet.com" value={form.email} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30" htmlFor="password">Password</label>
                                    <Link to="/forgot-password" disabled className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5] hover:text-[#76d6d5]/80 pointer-events-none opacity-50">Forgot?</Link>
                                </div>
                                <input id="password" name="password" type="password" required className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-white focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 outline-none transition-all placeholder:text-white/10" placeholder="••••••••" value={form.password} onChange={handleChange} />
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(118,214,213,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <span className="w-4 h-4 border-2 border-[#131313]/30 border-t-[#131313] rounded-full animate-spin" /> : 'Log In Account'}
                            </button>
                        </form>
                    </div>

                    <div className="pt-4 text-center">
                        <p className="text-xs text-white/30">
                            New Guardian? <Link to="/register" className="text-[#76d6d5] font-black hover:underline underline-offset-4">Join the Mission</Link>
                        </p>
                    </div>
                </div>
                
                {/* Visual anchor at bottom right for branding if needed */}
                <div className="absolute bottom-12 right-12 hidden lg:flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-20 hover:opacity-100">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">The Sanctuary Ecosystem</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slide-in { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-slide-in { animation: slide-in 0.8s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
                .animate-fade-in { animation: fade-in 1s ease-out forwards; }
            `}} />
        </div>
    );
};

export default Login;
