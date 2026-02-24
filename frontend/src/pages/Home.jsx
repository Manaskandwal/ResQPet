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
        <div className="min-h-screen bg-white font-sans">

            {/* ── Topbar ──────────────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
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

            {/* ── Hero ────────────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-primary-50/40 to-accent-50/30 py-20 md:py-28">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent-100 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/4" />

                <div className="relative max-w-4xl mx-auto px-5 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-sm text-primary-700 font-semibold mb-6 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-soft" />
                        Pilot Launch · Shahdara &amp; North East Delhi
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-5 animate-slide-up">
                        Rescue.<br />
                        <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Respond.</span><br />
                        Rebuild.
                    </h1>

                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed animate-slide-up">
                        Community-powered animal emergency coordination.<br />
                        <span className="text-primary-600 font-medium">Expanding into complete pet care.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up">
                        <Link to="/register?role=user" className="btn-accent btn-lg shadow-lg hover:shadow-xl">
                            🐾 Report a Rescue
                        </Link>
                        <Link to="/register?role=ngo" className="btn-outline btn-lg bg-white/80 backdrop-blur">
                            🌿 Join as NGO
                        </Link>
                        <Link to="/register?role=ambulance" className="btn-outline btn-lg bg-white/80 backdrop-blur">
                            🚑 Join as Ambulance
                        </Link>
                    </div>

                    {/* Trust row */}
                    <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-500 animate-fade-in">
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Free to use</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> No login to view</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Auto-escalation in 5 min</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Real-time coordination</span>
                    </div>
                </div>
            </section>

            {/* ── How Rescue Works ─────────────────────────────────────────────────── */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-5">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-800">How a Rescue Works</h2>
                        <p className="text-slate-500 mt-2">Four simple steps. Automatic. Fast. Reliable.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step, i) => (
                            <div key={step.title} className="card-hover text-center relative">
                                {/* Step connector */}
                                {i < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-10 -right-3 z-10 text-slate-300 text-xl">→</div>
                                )}
                                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-primary-100">
                                    {step.icon}
                                </div>
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold mb-2">
                                    {i + 1}
                                </div>
                                <h3 className="font-bold text-slate-800 mb-1">{step.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Escalation System ────────────────────────────────────────────────── */}
            <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="relative max-w-4xl mx-auto px-5 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm font-semibold mb-6">
                        ⚡ Automatic Escalation System
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">No response? We escalate automatically.</h2>
                    <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
                        If no NGO accepts a rescue within <strong>5 minutes</strong>, our system automatically
                        notifies all registered hospitals and ambulance providers — without any human intervention.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        {[
                            { time: '0:00', label: 'Rescue Reported', icon: '📍', active: true },
                            { time: '5:00', label: 'Auto-Escalated', icon: '⚡', active: true },
                            { time: '5:01', label: 'All Teams Alerted', icon: '📣', active: true },
                        ].map((item) => (
                            <div key={item.time} className="bg-white/15 backdrop-blur rounded-card p-4 border border-white/20">
                                <div className="text-3xl mb-2">{item.icon}</div>
                                <div className="text-sm font-bold text-primary-200 font-mono">{item.time}</div>
                                <div className="text-sm font-semibold mt-0.5">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pilot Region ─────────────────────────────────────────────────────── */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-5xl mx-auto px-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-semibold mb-4">
                                📍 Pilot Region — Phase 1
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-3">
                                Starting with<br />
                                <span className="text-primary-600">Shahdara &amp; North East Delhi</span>
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-5">
                                We're launching in two high-density urban districts of Delhi where street animal incidents are most reported.
                                The pilot is designed to prove the model before a city-wide rollout.
                            </p>
                            <ul className="space-y-2">
                                {['NGO partners onboarded', 'Hospital network mapped', 'Ambulance providers registered', 'Admin monitoring live'].map((item) => (
                                    <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                                        <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {pilotStats.map(({ value, label }) => (
                                <div key={label} className="card text-center">
                                    <p className="text-4xl font-extrabold text-primary-600 mb-1">{value}</p>
                                    <p className="text-sm text-slate-500 font-medium">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Future Expansion ─────────────────────────────────────────────────── */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-5">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-200 rounded-full text-violet-700 text-xs font-semibold mb-4">
                            🚀 Coming in Phase 2
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800">The Full Pet Care Ecosystem</h2>
                        <p className="text-slate-500 mt-2 max-w-xl mx-auto">
                            PawSaarthi is evolving into a complete tech-enabled animal care platform. These features are in active development.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {futureCards.map((card) => (
                            <div key={card.title} className={`card border bg-gradient-to-br ${card.color} relative opacity-90`}>
                                <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/80 border border-current/10 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Soon
                                </div>
                                <div className="text-4xl mb-3">{card.icon}</div>
                                <h3 className="font-bold text-slate-800 mb-1">{card.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Band ─────────────────────────────────────────────────────────── */}
            <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center">
                <div className="max-w-2xl mx-auto px-5">
                    <h2 className="text-2xl font-bold mb-2">Ready to make a difference?</h2>
                    <p className="text-primary-100 mb-6">Join PawSaarthi and be part of India's first tech-first animal rescue network.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/register" className="btn bg-white text-primary-700 hover:bg-primary-50 font-bold btn-lg shadow-lg">
                            Create Free Account
                        </Link>
                        <Link to="/login" className="btn bg-white/20 hover:bg-white/30 border border-white/30 text-white btn-lg backdrop-blur">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer & Disclaimer ──────────────────────────────────────────────── */}
            <footer className="py-10 bg-slate-900 text-slate-400">
                <div className="max-w-5xl mx-auto px-5">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-2.5">
                            <span className="text-2xl">🐾</span>
                            <div>
                                <p className="text-white font-bold">PawSaarthi</p>
                                <p className="text-xs text-slate-500">Phase 1 · Pilot · Delhi</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-5 text-sm">
                            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
                            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
                            <a href={`mailto:PawSaarthi.support@gmail.com`} className="hover:text-white transition-colors">Support</a>
                            <a href={`mailto:PawSaarthi.support@gmail.com?subject=Refund Request`} className="hover:text-white transition-colors">Refund Dispute</a>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="border-t border-slate-800 pt-6">
                        <div className="bg-slate-800/50 rounded-card p-4 mb-6">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                <strong className="text-slate-300">⚖️ Disclaimer:</strong>{' '}
                                PawSaarthi is a technology coordination platform. Rescue responses depend on community
                                participation and are not guaranteed. PawSaarthi does not directly employ rescuers, NGO
                                workers, or veterinarians. For urgent cases, please also contact local authorities.
                                For payment or refund disputes, email{' '}
                                <a href="mailto:PawSaarthi.support@gmail.com" className="text-primary-400 hover:underline">
                                    PawSaarthi.support@gmail.com
                                </a>
                            </p>
                        </div>
                        <p className="text-xs text-center text-slate-600">
                            © {new Date().getFullYear()} PawSaarthi. All rights reserved. Built with ❤️ for animals.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
