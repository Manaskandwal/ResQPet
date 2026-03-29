import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AuthDropdown from '../../components/AuthDropdown';
import PawLoader from '../../components/PawLoader';

const ROLES = [
    { value: 'user', label: 'Citizen', icon: '🙋', desc: 'Report and save animals' },
    { value: 'ngo', label: 'NGO', icon: '🌿', desc: 'Rescue organization' },
    { value: 'hospital', label: 'Hospital', icon: '🏥', desc: 'Animal medical center' },
    { value: 'ambulance', label: 'Ambulance', icon: '🚑', desc: 'Emergency logistics' },
];

const Register = () => {
    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialRole = searchParams.get('role') || 'user';

    const [form, setForm] = useState({
        name: '', email: '', password: '', role: initialRole,
        orgName: '', phone: '', vehicleNumber: '', hospitalType: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

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
    const handleRoleChange = (role) => setForm((p) => ({ ...p, role }));

    const handleGoogleSuccess = async (response) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/google', {
                credential: response.credential,
                role: form.role
            });
            if (data.success) {
                login(data.user, data.token);
                toast.success(`Welcome, ${data.user.name}! 🐾`);
                const routes = {
                    user: '/user/dashboard', ngo: '/ngo/dashboard',
                    hospital: '/hospital/dashboard', ambulance: '/ambulance/dashboard', admin: '/admin/dashboard',
                };
                navigate(routes[data.user.role] || '/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Google registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', form);
            login(data.user, data.token);
            toast.success(data.message || 'Registration successful! 🐾');

            const routes = {
                user: '/user/dashboard', ngo: '/ngo/dashboard',
                hospital: '/hospital/dashboard', ambulance: '/ambulance/dashboard',
            };
            navigate(routes[data.user.role] || '/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const isOrg = ['ngo', 'hospital', 'ambulance'].includes(form.role);

    if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><PawLoader /></div>;

    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-x-hidden font-body relative transition-colors duration-300">
            {/* Left Column: Splash - Mirroring Login but different slogan */}
            <div className="hidden lg:flex lg:w-3/5 relative items-center justify-center bg-surface min-h-screen">
                <div className="absolute inset-0 z-0">
                    <img src="/auth_splash.png" alt="Rescue Mission" className="w-full h-full object-cover opacity-30 grayscale saturate-50 contrast-125" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#131313] pointer-events-none" />
                </div>

                <div className="relative z-10 p-16 space-y-6 max-w-2xl">
                    <div className="flex items-center gap-3 animate-slide-in">
                        <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
                        <span className="text-4xl font-black text-primary font-headline tracking-tighter">VetsCue</span>
                    </div>
                    <div className="space-y-2 animate-slide-up">
                        <h2 className="text-6xl font-black font-headline text-on-surface leading-tight tracking-tighter">Join the <br /><span className="text-primary">Ecosystem</span> of Care.</h2>
                        <p className="text-lg text-on-surface/50 leading-relaxed max-w-md">Connect with a nationwide network of rescuers and guardians.</p>
                    </div>
                </div>
            </div>

            {/* Right Column: Form Side - Ensuring compact spacing to avoid scroll */}
            <div className="flex-1 relative flex items-center justify-center p-6 lg:p-2 min-h-screen overflow-y-auto no-scrollbar">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 p-2 rounded-full hover:bg-white/5 text-[#e5e2e1]/40 hover:text-[#e5e2e1] transition-all border border-transparent hover:border-white/5 flex items-center gap-2 group"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Back to Home</span>
                </button>

                <div className="w-full max-w-sm space-y-6 animate-fade-in py-8">
                    <div>
                        <h1 className="text-2xl font-black font-headline text-on-background tracking-tight leading-none">Register Account</h1>
                        <p className="text-xs text-on-background/30 mt-2">Become a verified Guardian.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Role Dropdown */}
                            <AuthDropdown
                                label="Join as a..."
                                options={ROLES}
                                value={form.role}
                                onChange={handleRoleChange}
                            />

                            <div className="w-full flex justify-center mt-2">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => toast.error('Google Auth Signature failed')}
                                    theme="filled_black"
                                    shape="circle"
                                    text="signup_with"
                                    width="100%"
                                />
                            </div>
                        </div>

                        <div className="relative flex items-center justify-center">
                            <div className="w-full border-b border-surface-border"></div>
                            <span className="absolute px-4 text-[9px] font-black uppercase tracking-widest text-on-background/20 bg-background">Or use details</span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-on-background/30 ml-1">Full Name</label>
                                    <input name="name" type="text" required className="w-full px-4 py-3 rounded-2xl bg-surface-hover border border-surface-border text-sm text-on-background focus:border-primary/30 focus:ring-1 focus:ring-primary/10 outline-none transition-all placeholder:text-on-background/10" placeholder="Guardian Name" value={form.name} onChange={handleChange} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-on-background/30 ml-1">Phone Number</label>
                                    <input name="phone" type="tel" className="w-full px-4 py-3 rounded-2xl bg-surface-hover border border-surface-border text-sm text-on-background focus:border-primary/30 focus:ring-1 focus:ring-primary/10 outline-none transition-all placeholder:text-on-background/10" placeholder="91+..." value={form.phone} onChange={handleChange} />
                                </div>
                                {isOrg && (
                                    <div className="col-span-1 sm:col-span-2 space-y-1.5 animate-slide-up">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[#76d6d5] ml-1">Organisation / Hospital Name</label>
                                        <input name="orgName" type="text" required className="w-full px-4 py-3 rounded-2xl bg-[#76d6d5]/5 border border-[#76d6d5]/10 text-sm text-white focus:border-[#76d6d5]/30 focus:ring-1 focus:ring-[#76d6d5]/20 outline-none transition-all" value={form.orgName} onChange={handleChange} />
                                    </div>
                                )}
                                {form.role === 'hospital' && (
                                    <div className="col-span-1 sm:col-span-2 space-y-1.5 animate-slide-up">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[#76d6d5] ml-1">Hospital Type</label>
                                        <select
                                            name="hospitalType"
                                            required
                                            value={form.hospitalType}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-2xl bg-[#76d6d5]/5 border border-[#76d6d5]/10 text-sm text-white focus:border-[#76d6d5]/30 focus:ring-1 focus:ring-[#76d6d5]/20 outline-none transition-all appearance-none"
                                        >
                                            <option value="" disabled className="bg-[#1c1b1b]">Select hospital type</option>
                                            <option value="private" className="bg-[#1c1b1b]">Private Hospital</option>
                                            <option value="government" className="bg-[#1c1b1b]">Government Hospital</option>
                                        </select>
                                    </div>
                                )}
                                {form.role === 'ambulance' && (
                                    <div className="col-span-1 sm:col-span-2 space-y-1.5 animate-slide-up">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30 ml-1">Ambulance Vehicle ID</label>
                                        <input name="vehicleNumber" type="text" required className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-sm text-white focus:border-[#76d6d5]/30 focus:ring-1 outline-none transition-all" value={form.vehicleNumber} onChange={handleChange} />
                                    </div>
                                )}
                                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-on-background/30 ml-1">Login Email</label>
                                    <input name="email" type="email" required className="w-full px-4 py-3 rounded-2xl bg-surface-hover border border-surface-border text-sm text-on-background focus:border-primary/30 outline-none font-bold" placeholder="guardian@example.com" value={form.email} onChange={handleChange} />
                                </div>
                                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30 ml-1">Secure Password</label>
                                    <div className="relative">
                                        <input name="password" type={showPass ? 'text' : 'password'} required className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-sm text-white focus:border-[#76d6d5]/30 outline-none pr-10" placeholder="Min. 6 chars" value={form.password} onChange={handleChange} />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#76d6d5] transition-colors p-1">
                                            <span className="material-symbols-outlined text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-4 mt-2 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(118,214,213,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <span className="w-4 h-4 border-2 border-[#131313]/30 border-t-[#131313] rounded-full animate-spin" /> : 'Confirm Registration'}
                            </button>
                        </form>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] text-on-background/30">
                            Already Member? <Link to="/login" className="text-primary font-black hover:underline decoration-1 underline-offset-4">Return to login</Link>
                        </p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slide-in { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-slide-in { animation: slide-in 0.8s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
                .animate-fade-in { animation: fade-in 1s ease-out forwards; }
            `}} />
        </div>
    );
};

export default Register;
