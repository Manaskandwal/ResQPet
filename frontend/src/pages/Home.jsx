import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const steps = [
    { icon: 'ðŸ“', title: 'Report', desc: 'Spot a stray or pet in distress and log a request with location.' },
    { icon: 'ðŸ¤', title: 'Respond', desc: 'Nearby verified partners are notified and can accept if available.' },
    { icon: 'âš¡', title: 'Escalate', desc: 'System alerts available partners who try their best to provide a response.' },
    { icon: 'âœ…', title: 'Resolve', desc: 'Partner resolves the case. Our future roadmap connects you with vets!' },
];

const futureCards = [
    { icon: 'ðŸš‘', title: 'Emergency Ambulance', desc: 'Book a dedicated animal ambulance for emergencies. Instant dispatch, live tracking.', color: 'from-red-50 to-rose-50 border-red-100' },
    { icon: 'ðŸ‘¨â€âš•ï¸', title: 'Consult a Vet', desc: 'Connect with verified veterinary doctors via video or chat. Available 24/7.', color: 'from-blue-50 to-sky-50 border-blue-100' },
    { icon: 'ðŸ›ï¸', title: 'Pet Marketplace', desc: 'Quality pet care products, medicines and food â€” delivered to your door.', color: 'from-violet-50 to-purple-50 border-violet-100' },
];

const pilotStats = [
    { value: '2', label: 'Initial Districts' },
    { value: '5+', label: 'NGO Partners' },
    { value: '1', label: 'Ecosystem' },
    { value: 'âˆž', label: 'Care Options' },
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
                <div className="animate-spin text-primary-600 text-4xl">ðŸ¾</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans">

            {/* â”€â”€ Topbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <nav className="bg-white border-b border-slate-100 flex-shrink-0">
                <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[8px] flex items-center justify-center shadow-sm">
                            <span className="text-base">ðŸ¾</span>
                        </div>
                        <span className="text-lg font-bold text-slate-800">PawSaarthi</span>
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-[10px] font-semibold border border-primary-100 ml-1">
                            Phase 1 Â· Pilot
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/login" className="btn-ghost btn-sm text-slate-600">Sign In</Link>
                        <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* â”€â”€ Hero (Single Screen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-primary-50/40 to-accent-50/30 flex items-center justify-center py-16 sm:py-20">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent-100 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/4" />

                <div className="relative max-w-4xl mx-auto px-5 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-sm text-primary-700 font-semibold mb-6 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-soft" />
                        Pilot Launch Â· Shahdara &amp; North East Delhi
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-5 animate-slide-up">
                        The Ultimate Sanctuary.<br />
                        <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">For Every Pet</span><br />
                        &amp; Guardian.
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
                        Discover a complete ecosystem for pet life: seamless adoption, world-class health services, a vibrant community, and rapid emergency response.<br />
                        <span className="text-primary-600 font-medium tracking-tight">One Hybrid Platform. Endless Care.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
                        <Link to="/register?role=user" className="btn-accent btn-lg text-lg px-8 py-4 shadow-lg hover:shadow-xl">
                            ðŸ¾ Report a Rescue
                        </Link>
                        <div className="flex gap-3">
                            <Link to="/register?role=ngo" className="btn-outline btn-lg bg-white/80 backdrop-blur">
                                ðŸŒ¿ NGO
                            </Link>
                            <Link to="/register?role=ambulance" className="btn-outline btn-lg bg-white/80 backdrop-blur">
                                ðŸš‘ Ambulance
                            </Link>
                        </div>
                    </div>

                    {/* Trust row */}
                    <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 animate-fade-in">
                        <span className="flex items-center gap-1.5"><span className="text-green-500">âœ“</span> Free to use</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">âœ“</span> Hybrid Services Coming</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">âœ“</span> Best-effort emergency aid</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">âœ“</span> Verified Partner Network</span>
                    </div>
                </div>
            </section>


            {/* How it works */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="text-center mb-10 sm:mb-12">
                        <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest">How It Works</p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Building a unified pet ecosystem</h2>
                        <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
                            A community-driven flow linking citizens with NGOs, bringing comprehensive care to stray and domestic pets alike.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step) => (
                            <div key={step.title} className="card-hover">
                                <div className="text-3xl mb-3">{step.icon}</div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pilot stats */}
            <section className="py-12 sm:py-16 bg-slate-50 border-y border-slate-100">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                        {pilotStats.map((stat) => (
                            <div key={stat.label} className="stat-card text-center">
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Roadmap */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
                        <div>
                            <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Whats Next</p>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Expanding into full pet care</h2>
                        </div>
                        <Link to="/register" className="btn-outline">Join the waitlist</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {futureCards.map((card) => (
                            <div key={card.title} className={`card border ${card.color}`}>
                                <div className="text-3xl mb-3">{card.icon}</div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">{card.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 sm:py-20 bg-gradient-to-br from-primary-600 to-primary-500 text-white">
                <div className="max-w-4xl mx-auto px-5 text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Be the first responder in your community</h2>
                    <p className="text-white/90 text-lg mb-8">
                        Whether you are a citizen, NGO, hospital, or ambulance partner -- PawSaarthi helps you act fast.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register?role=user" className="btn-accent btn-lg bg-white text-primary-700 hover:bg-white/90">
                            Report a Rescue
                        </Link>
                        <Link to="/register?role=ngo" className="btn-outline btn-lg border-white text-white hover:bg-white/10">
                            Become a Partner
                        </Link>
                    </div>
                </div>
            </section>

            {/* Minimal footer to keep it single screen */}
            <footer className="bg-white border-t border-slate-100 py-4 flex-shrink-0">
                <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2">
                        <span>ðŸ¾ PawSaarthi</span>
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



