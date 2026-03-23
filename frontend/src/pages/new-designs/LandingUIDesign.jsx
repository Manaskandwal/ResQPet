import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingUIDesign() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalRequests: 0, totalNGOs: 0, completedRequests: 0 });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/public/stats`);
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Redirect logged-in users
  useEffect(() => {
    if (!loading && user) {
      const routes = {
        user: '/user/dashboard', ngo: '/ngo/dashboard',
        hospital: '/hospital/dashboard', ambulance: '/ambulance/dashboard', admin: '/admin/dashboard',
      };
      navigate(routes[user.role] || '/user/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const portals = [
    { icon: 'person', label: 'Citizen Portal', desc: 'Report & Track rescues.', color: 'text-[#76d6d5]' },
    { icon: 'group', label: 'NGO Portal', desc: 'Coordinate field missions.', color: 'text-[#ffb77d]' },
    { icon: 'local_hospital', label: 'Hospital Portal', desc: 'Advanced medical care.', color: 'text-indigo-400' },
    { icon: 'local_shipping', label: 'Ambulance Portal', desc: 'Rapid patient dispatch.', color: 'text-rose-400' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#76d6d5]/30 border-t-[#76d6d5] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-sans overflow-x-hidden selection:bg-[#76d6d5]/30 selection:text-[#76d6d5]">

      {/* ── Fixed Static Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-[500] transition-colors duration-300 border-b ${scrolled ? 'bg-[#0e0e0e] border-white/5 shadow-2xl' : 'bg-transparent border-transparent'} py-5`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="material-symbols-outlined text-[#76d6d5] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            <span className="text-2xl font-black text-[#76d6d5] tracking-tight">VetsCue</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[#e5e2e1]/60 hover:text-[#76d6d5] transition-colors">
              Login
            </Link>
            <Link to="/register" className="bg-[#76d6d5] text-[#0e0e0e] px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#76d6d5]/10">
              Join Us
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-[6rem] pb-20 md:pb-32 px-6 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#76d6d5]/10 blur-[150px] rounded-full -translate-y-1/2" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-8 animate-fade-in text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#76d6d5] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#76d6d5]">Rescue Ecosystem Live</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-white">
              The Sanctuary<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#76d6d5] to-[#93f3f1]">For Every Life.</span>
            </h1>

            <p className="text-lg text-[#e5e2e1]/40 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium italic">
              "Actionable tech for rapid animal rescue. Deploy help, manage recovery, and drive impact."
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4">
              <button onClick={() => navigate('/register')} className="px-10 py-5 rounded-2xl bg-[#76d6d5] text-[#0e0e0e] font-black uppercase tracking-widest text-xs shadow-xl shadow-[#76d6d5]/20 hover:-translate-y-1 transition-all group">
                Emergency Rescue
                <span className="material-symbols-outlined text-sm align-middle ml-2 group-hover:translate-x-1 transition-transform">bolt</span>
              </button>
              <button onClick={() => navigate('/fundraisers')} className="px-10 py-5 rounded-2xl border border-white/10 bg-white/5 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                Support Mission
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[4rem] border border-white/10 overflow-hidden shadow-2xl bg-[#1c1b1b] p-3 aspect-[4/5]">
              <img
                src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Rescue Team"
                className="w-full h-full object-cover rounded-[3rem] transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Dashboard Stats ── */}
      <section className="py-20 border-y border-white/5 bg-[#131212]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: 'Rescued Lives', value: stats.completedRequests || '5,200+', icon: 'favorite' },
            { label: 'NGO Partners', value: stats.totalNGOs || '240+', icon: 'handshake' },
            { label: 'Citizen Guardians', value: stats.totalUsers || '12k+', icon: 'group' },
            { label: 'Active Tasks', value: stats.totalRequests || '1,100+', icon: 'bolt' },
          ].map((s, i) => (
            <div key={i} className="space-y-3 p-8 rounded-3xl hover:bg-white/5 transition-all">
              <span className="material-symbols-outlined text-[#76d6d5] text-4xl mb-4 leading-none">{s.icon}</span>
              <p className="text-4xl font-black text-white tracking-tighter leading-none">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#76d6d5]/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Portal Entry ── */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#76d6d5]">Unified Platform Access</h2>
            <h3 className="text-5xl font-black tracking-tight text-white leading-none">Choose Your Mission</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {portals.map((p, i) => (
              <Link
                key={i}
                to="/login"
                className="group p-10 rounded-[3rem] bg-[#1c1b1b] border border-white/5 hover:border-[#76d6d5]/30 hover:bg-[#76d6d5]/5 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="space-y-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center ${p.color} shadow-inner`}>
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black tracking-tight text-white group-hover:text-[#76d6d5] transition-colors">{p.label}</h4>
                    <p className="text-sm text-[#e5e2e1]/30 leading-relaxed">{p.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#76d6d5] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    Get Started <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Impact Section ── */}
      <section className="py-32 bg-[#1c1b1b]/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#ffb77d]/10 blur-[100px] rounded-full" />
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <img
                src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
                alt="Rescue 1"
                className="w-full h-[300px] rounded-[2.5rem] object-cover border border-white/5 hover:scale-105 transition-transform duration-500"
              />
              <img
                src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
                alt="Rescue 2"
                className="w-full h-[300px] rounded-[2.5rem] object-cover border border-white/5 mt-10 hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ffb77d]">Impact Driven</h2>
            <h3 className="text-5xl font-black tracking-tight text-white leading-tight">Every Second Saved<br />Is a Life Restored.</h3>
            <p className="text-[#e5e2e1]/40 leading-relaxed font-medium">
              VetsCue is designed for rapid response. Our network connects citizens to responders in real-time, ensuring that emergency aid arrives before it's too late.
            </p>
            <div className="pt-4">
              <Link to="/register" className="inline-flex items-center gap-4 px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-[#76d6d5] hover:text-[#0e0e0e] hover:border-[#76d6d5] transition-all">
                Join the Network <span className="material-symbols-outlined">launch</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final Message ── */}
      <section className="py-40 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="space-y-6">
            <h3 className="text-6xl font-black tracking-tighter text-white">Rescue Simplified.<br />Life Prioritized.</h3>
            <p className="text-lg text-[#e5e2e1]/40 italic font-medium">Be the bridge between distress and safety. VetsCue is your gateway.</p>
          </div>
          <Link to="/register" className="inline-block px-14 py-6 rounded-3xl bg-[#76d6d5] text-[#0e0e0e] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-[#76d6d5]/30 hover:scale-110 active:scale-95 transition-all">
            Register Now
          </Link>
        </div>
      </section>

      <footer className="py-20 border-t border-white/5 bg-[#0e0e0e] text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#76d6d5] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            <span className="text-3xl font-black tracking-tight text-[#76d6d5]">VetsCue</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/5">The Ultimate Sanctuary · 2026</p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fade-in { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}} />
    </div>
  );
}
