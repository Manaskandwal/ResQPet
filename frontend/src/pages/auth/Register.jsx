import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

const ROLES = [
    { value: 'user', label: '🙋 Citizen (Report Animals)' },
    { value: 'ngo', label: '🌿 NGO (Rescue Organisation)' },
    { value: 'hospital', label: '🏥 Animal Hospital' },
    { value: 'ambulance', label: '🚑 Ambulance Service' },
];

const Register = () => {
    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', orgName: '', phone: '', vehicleNumber: '' });
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
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            console.log('[Register] Registering:', form.email, 'as', form.role);
            const { data } = await api.post('/auth/register', form);
            login(data.user, data.token);
            toast.success(data.message || 'Registration successful! 🐾');

            const routes = {
                user: '/user/dashboard', ngo: '/ngo/dashboard',
                hospital: '/hospital/dashboard', ambulance: '/ambulance/dashboard',
            };
            navigate(routes[data.user.role] || '/');
        } catch (error) {
            console.error('[Register] Error:', error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const isOrg = ['ngo', 'hospital', 'ambulance'].includes(form.role);

    if (isNewUI) {
        return (
            <div className="min-h-screen bg-[#131313] flex items-center justify-center p-4">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#76d6d5]/10 rounded-full blur-[128px]" />
                </div>
                <div className="relative w-full max-w-md">
                    <div className="text-center mb-10 space-y-3">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-[#76d6d5]/10 border border-[#76d6d5]/20 mx-auto"><span className="text-3xl">🐾</span></div>
                        <h1 className="font-headline text-3xl font-extrabold text-[#e5e2e1] tracking-tight">Join ResQPet</h1>
                        <p className="text-[#e5e2e1]/40 text-sm">Create your account</p>
                    </div>
                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Role Selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">I am a...</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ROLES.map(({ value, label }) => (
                                        <button key={value} type="button" onClick={() => setForm((p) => ({ ...p, role: value }))} className={`text-xs font-bold px-3 py-3 rounded-2xl border transition-all text-left ${form.role === value ? 'border-[#76d6d5]/40 bg-[#76d6d5]/10 text-[#76d6d5]' : 'border-white/5 text-[#e5e2e1]/30 hover:border-white/10 hover:text-[#e5e2e1]/60'}`}>{label}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30" htmlFor="name">Full Name</label>
                                <input id="name" name="name" type="text" required className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3.5 text-sm text-[#e5e2e1] placeholder:text-white/20 outline-none focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 transition-all" placeholder="Your name" value={form.name} onChange={handleChange} />
                            </div>
                            {isOrg && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30" htmlFor="orgName">Organisation Name</label>
                                    <input id="orgName" name="orgName" type="text" className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3.5 text-sm text-[#e5e2e1] placeholder:text-white/20 outline-none focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 transition-all" placeholder="Organisation / Hospital name" value={form.orgName} onChange={handleChange} />
                                </div>
                            )}
                            {form.role === 'ambulance' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30" htmlFor="vehicleNumber">Vehicle Number</label>
                                    <input id="vehicleNumber" name="vehicleNumber" type="text" className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3.5 text-sm text-[#e5e2e1] placeholder:text-white/20 outline-none focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 transition-all" placeholder="e.g. UP32 AB 1234" value={form.vehicleNumber} onChange={handleChange} />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30" htmlFor="phone">Phone Number</label>
                                <input id="phone" name="phone" type="tel" className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3.5 text-sm text-[#e5e2e1] placeholder:text-white/20 outline-none focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 transition-all" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handleChange} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30" htmlFor="reg-email">Email address</label>
                                <input id="reg-email" name="email" type="email" required className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3.5 text-sm text-[#e5e2e1] placeholder:text-white/20 outline-none focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 transition-all" placeholder="you@example.com" value={form.email} onChange={handleChange} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30" htmlFor="reg-password">Password</label>
                                <input id="reg-password" name="password" type="password" required className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3.5 text-sm text-[#e5e2e1] placeholder:text-white/20 outline-none focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 transition-all" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
                            </div>
                            {isOrg && (
                                <div className="p-4 rounded-2xl border border-[#ffb77d]/20 bg-[#ffb77d]/5 text-xs text-[#ffb77d]/80">
                                    ⏳ <strong>Note:</strong> Your account will require admin approval before you can access the platform.
                                </div>
                            )}
                            <button type="submit" disabled={loading} className="w-full py-4 mt-2 rounded-2xl bg-[#76d6d5] text-[#131313] text-sm font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {loading ? <><span className="w-4 h-4 border-2 border-[#131313]/30 border-t-[#131313] rounded-full animate-spin" />Creating account...</> : 'Create Account'}
                            </button>
                        </form>
                        <p className="text-center text-sm text-[#e5e2e1]/30 mt-6">
                            Already have an account?{' '}<Link to="/login" className="text-[#76d6d5] font-bold hover:text-[#76d6d5]/80 transition-colors">Sign in</Link>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg mb-4">
                        <span className="text-3xl">🐾</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Join PawSaarthi</h1>
                    <p className="text-surface-muted mt-1">Create your account</p>
                </div>

                <div className="card shadow-card-hover">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Create Account</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role selector */}
                        <div className="form-group">
                            <label className="label">I am a...</label>
                            <div className="grid grid-cols-2 gap-2">
                                {ROLES.map(({ value, label }) => (
                                    <button key={value} type="button"
                                        onClick={() => setForm((p) => ({ ...p, role: value }))}
                                        className={`text-xs font-medium px-3 py-2.5 rounded-btn border transition-all text-left
                      ${form.role === value
                                                ? 'border-primary-400 bg-primary-50 text-primary-700'
                                                : 'border-surface-border text-slate-600 hover:bg-surface-hover'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label" htmlFor="name">Full Name</label>
                            <input id="name" name="name" type="text" required className="input"
                                placeholder="Your name" value={form.name} onChange={handleChange} />
                        </div>

                        {isOrg && (
                            <div className="form-group">
                                <label className="label" htmlFor="orgName">Organisation Name</label>
                                <input id="orgName" name="orgName" type="text" className="input"
                                    placeholder="Organisation / Hospital name" value={form.orgName} onChange={handleChange} />
                            </div>
                        )}

                        {form.role === 'ambulance' && (
                            <div className="form-group">
                                <label className="label" htmlFor="vehicleNumber">Vehicle Number</label>
                                <input id="vehicleNumber" name="vehicleNumber" type="text" className="input"
                                    placeholder="e.g. UP32 AB 1234" value={form.vehicleNumber} onChange={handleChange} />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="label" htmlFor="phone">Phone Number</label>
                            <input id="phone" name="phone" type="tel" className="input"
                                placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label className="label" htmlFor="reg-email">Email address</label>
                            <input id="reg-email" name="email" type="email" required className="input"
                                placeholder="you@example.com" value={form.email} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label className="label" htmlFor="reg-password">Password</label>
                            <input id="reg-password" name="password" type="password" required className="input"
                                placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
                        </div>

                        {/* Approval notice for orgs */}
                        {isOrg && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-btn text-xs text-amber-700">
                                ⏳ <strong>Note:</strong> Your account will require admin approval before you can access the platform.
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full btn-lg mt-2">
                            {loading ? (
                                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating account...</>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-surface-muted mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
