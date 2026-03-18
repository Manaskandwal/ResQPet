import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const steps = [
    { icon: '📍', title: 'Report', desc: 'Citizen spots an animal in distress and submits a rescue request with photo and location.' },
    { icon: '🤝', title: 'Respond', desc: 'Nearby NGOs are instantly notified and can accept the case within 5 minutes.' },
    { icon: '⚡', title: 'Escalate', desc: 'If no NGO responds in 5 minutes, the system automatically alerts hospitals and ambulances.' },
    { icon: '✅', title: 'Resolve', desc: 'Ambulance picks up the animal, delivers to care, and the rescue is marked complete.' },
];

const futureCards = [
    { icon: '🚑', title: 'Emergency Ambulance', desc: 'Book a dedicated animal ambulance for emergencies. Instant dispatch, live tracking.', color: 'from-red-50 to-rose-50 border-red-100' },
    { icon: '👨‍⚕️', title: 'Consult a Vet', desc: 'Connect with verified veterinary doctors via video or chat. Available 24/7.', color: 'from-blue-50 to-sky-50 border-blue-100' },
    { icon: '🛍️', title: 'Pet Marketplace', desc: 'Quality pet care products, medicines and food — delivered to your door.', color: 'from-violet-50 to-purple-50 border-violet-100' },
];

const pilotStats = [
    { value: '2', label: 'Pilot Districts' },
    { value: '5+', label: 'NGO Partners' },
    { value: '24/7', label: 'Monitoring' },
    { value: '∞', label: 'Scalability' },
];

const Home = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (user && !loading) {
            const routes = {
                user: '/user/dashboard', ngo: '/ngo/dashboard',
                hospital: '/hospital/dashboard', ambulance: '/ambulance/dashboard', admin: '/admin/dashboard',
            };
            navigate(routes[user.role] || '/user/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin text-primary-600 text-4xl">🐾</div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-white font-sans flex flex-col">

            {/* ── Topbar ──────────────────────────────────────────────────────────── */}
            <nav className="bg-white border-b border-slate-100 flex-shrink-0">
                <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[8px] flex items-center justify-center shadow-sm">
                            <span className="text-base">🐾</span>
                        </div>
                        <span className="text-lg font-bold text-slate-800">PawSaarthi</span>
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-[10px] font-semibold border border-primary-100 ml-1">
                            Phase 1 · Pilot
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/login" className="btn-ghost btn-sm text-slate-600">Sign In</Link>
                        <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero (Single Screen) ────────────────────────────────────────────────────────────── */}
            <section className="relative flex-1 overflow-hidden bg-gradient-to-br from-slate-50 via-primary-50/40 to-accent-50/30 flex items-center justify-center">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent-100 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/4" />

                <div className="relative max-w-4xl mx-auto px-5 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-sm text-primary-700 font-semibold mb-6 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-soft" />
                        Pilot Launch · Shahdara &amp; North East Delhi
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-5 animate-slide-up">
                        Rescue.<br />
                        <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Respond.</span><br />
                        Rebuild.
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
                        Community-powered animal emergency coordination.<br />
                        <span className="text-primary-600 font-medium">Expanding into complete pet care.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
                        <Link to="/register?role=user" className="btn-accent btn-lg text-lg px-8 py-4 shadow-lg hover:shadow-xl">
                            🐾 Report a Rescue
                        </Link>
                        <div className="flex gap-3">
                            <Link to="/register?role=ngo" className="btn-outline btn-lg bg-white/80 backdrop-blur">
                                🌿 NGO
                            </Link>
                            <Link to="/register?role=ambulance" className="btn-outline btn-lg bg-white/80 backdrop-blur">
                                🚑 Ambulance
                            </Link>
                        </div>
                    </div>

                    {/* Trust row */}
                    <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 animate-fade-in">
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Free to use</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> No login to view</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Auto-escalation in 5 min</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Real-time coordination</span>
                    </div>
                </div>
            </section>

            {/* Minimal footer to keep it single screen */}
            <footer className="bg-white border-t border-slate-100 py-4 flex-shrink-0">
                <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2">
                        <span>🐾 PawSaarthi</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>Pilot Delhi</span>
                    </div>
                    <div className="flex gap-6">
                        <Link to="/login" className="hover:text-primary-600 transition-colors">Sign In</Link>
                        <Link to="/register" className="hover:text-primary-600 transition-colors">Register</Link>
                        <a href="mailto:PawSaarthi.support@gmail.com" className="hover:text-primary-600 transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
