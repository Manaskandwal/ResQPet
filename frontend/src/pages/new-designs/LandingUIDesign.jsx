import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingUIDesign() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // If user is already logged in, redirect to their dashboard
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
    { icon: 'person', label: 'Citizen Portal', desc: 'Report emergencies, track rescues, and manage your wallet.', color: 'text-[#76d6d5]', border: 'hover:border-[#76d6d5]/30', bg: 'hover:bg-[#76d6d5]/5' },
    { icon: 'group', label: 'NGO Portal', desc: 'Accept rescue cases and coordinate field missions.', color: 'text-[#ffb77d]', border: 'hover:border-[#ffb77d]/30', bg: 'hover:bg-[#ffb77d]/5' },
    { icon: 'local_hospital', label: 'Hospital Portal', desc: 'Manage escalated cases and dispatch ambulances.', color: 'text-indigo-400', border: 'hover:border-indigo-400/30', bg: 'hover:bg-indigo-400/5' },
    { icon: 'local_shipping', label: 'Ambulance Portal', desc: 'Accept dispatches and update rescue status in real-time.', color: 'text-rose-400', border: 'hover:border-rose-400/30', bg: 'hover:bg-rose-400/5' },
  ];

  const services = [
    { icon: 'emergency', label: 'Emergency Rescue', desc: 'Submit a geo-tagged rescue case in seconds. NGOs and responders are notified instantly.', color: 'text-red-400', accent: 'bg-red-400/10' },
    { icon: 'volunteer_activism', label: 'Fundraising', desc: 'Turn a rescue case into a public fundraiser to cover hospital and ambulance costs.', color: 'text-[#ffb77d]', accent: 'bg-[#ffb77d]/10' },
    { icon: 'share', label: 'Community Impact', desc: 'Share rescue updates, see completions, and celebrate every life saved on the Impact Feed.', color: 'text-[#76d6d5]', accent: 'bg-[#76d6d5]/10' },
    { icon: 'local_hospital', label: 'Hospital Network', desc: 'Escalate critical cases to nearby hospitals with a single click. Full ambulance dispatch chain.', color: 'text-indigo-400', accent: 'bg-indigo-400/10' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#131313] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#76d6d5]/30 border-t-[#76d6d5] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="resqpet-obsidian-theme min-h-screen bg-[#131313] text-[#e5e2e1] font-body overflow-x-hidden">

      {/* ── Top Navigation ── */}
      <header className="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#76d6d5] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            <span className="text-2xl font-extrabold text-[#76d6d5] tracking-tighter font-headline">ResQPet</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[#e5e2e1]/60 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 hover:text-[#e5e2e1] transition-all">
              Login
            </Link>
            <Link to="/register" className="bg-[#76d6d5] text-[#131313] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(118,214,213,0.3)]">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#76d6d5]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#ffb77d]/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="text-[#ffb77d] text-[10px] font-black uppercase tracking-[0.4em]">The Luminous Guardian</span>
              <h1 className="font-headline font-extrabold text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-none">
                The Ultimate Sanctuary.<br />
                <span className="bg-gradient-to-r from-[#76d6d5] to-[#ffb77d] bg-clip-text text-transparent">For Every Pet</span><br />
                &amp; Guardian.
              </h1>
            </div>
            <p className="text-[#e5e2e1]/50 text-lg leading-relaxed max-w-md">
              Discover a complete ecosystem for pet life: rapid emergency response with our trusted network, plus coming soon—seamless adoption, world-class health services, and a vibrant community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/register?role=user')}
                className="group flex flex-1 items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#76d6d5] text-[#131313] font-black uppercase tracking-widest text-sm hover:scale-[1.03] active:scale-[0.97] transition-all shadow-[0_0_30px_rgba(118,214,213,0.3)]"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_share</span>
                Emergency Rescue
              </button>
              <button
                onClick={() => navigate('/fundraisers')}
                className="flex flex-1 items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#ffb77d]/10 border border-[#ffb77d]/20 text-[#ffb77d] font-black uppercase tracking-widest text-sm hover:bg-[#ffb77d]/20 hover:border-[#ffb77d]/40 transition-all"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
                Donate to the Mission
              </button>
            </div>

            {/* Inline quick stats — no dummy values, just factual labels */}
            <div className="flex gap-8 pt-4 border-t border-white/5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#e5e2e1]/20">Platform</p>
                <p className="text-2xl font-headline font-black text-[#76d6d5]">Open</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#e5e2e1]/20">Response</p>
                <p className="text-2xl font-headline font-black text-[#ffb77d]">Best Effort</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#e5e2e1]/20">Network</p>
                <p className="text-2xl font-headline font-black text-[#e5e2e1]">Growing</p>
              </div>
            </div>
          </div>

          {/* Right: visual card */}
          <div className="relative hidden lg:block">
            <div className="glass-card rounded-[3rem] border border-white/5 bg-[#1c1b1b] p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#76d6d5] opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#76d6d5]" />
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5]">Live Rescue Network</p>
              </div>
              {[
                { icon: 'emergency', label: 'Emergency Reported', sub: 'Citizen submitted a case', color: 'text-red-400', accent: 'bg-red-400/10' },
                { icon: 'volunteer_activism', label: 'NGO Responding', sub: 'Case accepted — en route', color: 'text-[#76d6d5]', accent: 'bg-[#76d6d5]/10' },
                { icon: 'local_hospital', label: 'Hospital Ready', sub: 'Bed reserved for animal', color: 'text-indigo-400', accent: 'bg-indigo-400/10' },
                { icon: 'local_shipping', label: 'Ambulance Dispatched', sub: 'Tracking live on map', color: 'text-[#ffb77d]', accent: 'bg-[#ffb77d]/10' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div className={`w-10 h-10 rounded-xl ${s.accent} flex items-center justify-center ${s.color} shrink-0`}>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#e5e2e1]">{s.label}</p>
                    <p className="text-[10px] text-[#e5e2e1]/30">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Integrated Services ── */}
      <section className="px-6 py-24 bg-[#1c1b1b]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center space-y-3">
            <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.4em]">What We Do</span>
            <h2 className="font-headline font-bold text-4xl text-[#e5e2e1] tracking-tight">Integrated Services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <div key={i} className="glass-card rounded-[2rem] border border-white/5 bg-[#131313]/60 p-8 space-y-5 group cursor-default hover:-translate-y-2 hover:border-white/10 transition-all duration-500">
                <div className={`w-14 h-14 rounded-2xl ${s.accent} flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-lg text-[#e5e2e1]">{s.label}</h3>
                  <p className="text-sm text-[#e5e2e1]/40 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Access Portals ── */}
      <section className="px-6 py-24 bg-[#131313]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 space-y-3">
            <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.4em]">Roles</span>
            <h2 className="font-headline font-bold text-4xl text-[#e5e2e1] tracking-tight">Access Portals</h2>
            <p className="text-[#e5e2e1]/40 max-w-lg">Every role has a dedicated experience. Choose yours and join the network.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {portals.map((p, i) => (
              <div
                key={i}
                onClick={() => navigate('/login')}
                className={`glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-7 space-y-4 cursor-pointer group hover:-translate-y-2 ${p.border} ${p.bg} transition-all duration-500`}
              >
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${p.color} group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-base text-[#e5e2e1]">{p.label}</h3>
                  <p className="text-xs text-[#e5e2e1]/40 leading-relaxed">{p.desc}</p>
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${p.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Get Started <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 py-24 bg-[#1c1b1b]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center space-y-3">
            <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.4em]">The Flow</span>
            <h2 className="font-headline font-bold text-4xl text-[#e5e2e1] tracking-tight">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: 'smartphone', label: 'Report', desc: 'Citizen spots animal in distress and submits geo-tagged report via the app.' },
              { step: '02', icon: 'group', label: 'NGO Dispatched', desc: 'Nearest verified NGO receives an alert and accepts the rescue mission.' },
              { step: '03', icon: 'local_hospital', label: 'Escalate if Needed', desc: 'Serious cases are escalated to partner hospitals with ambulance dispatch.' },
              { step: '04', icon: 'check_circle', label: 'Rescue Complete', desc: 'Status updates in real-time. Impact posted on the community feed.' },
            ].map((s, i) => (
              <div key={i} className="space-y-4 group hover:-translate-y-1 transition-transform duration-300 cursor-default">
                <div className="flex items-center gap-4">
                  <span className="font-headline text-4xl font-black text-[#76d6d5]/20">{s.step}</span>
                  <div className="w-12 h-12 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>
                </div>
                <h3 className="font-headline font-bold text-lg text-[#e5e2e1]">{s.label}</h3>
                <p className="text-sm text-[#e5e2e1]/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 py-20 bg-[#131313]">
        <div className="max-w-4xl mx-auto glass-card rounded-[3rem] border border-[#76d6d5]/20 bg-[#1c1b1b] p-16 text-center space-y-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3rem]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#76d6d5]/10 blur-[60px]" />
          </div>
          <div className="relative space-y-4">
            <h2 className="font-headline text-4xl font-extrabold tracking-tight">Every Second <span className="text-[#76d6d5]">Counts.</span></h2>
            <p className="text-[#e5e2e1]/50 max-w-md mx-auto">Join ResQPet today. Be the reason an animal makes it home safely.</p>
          </div>
          <div className="relative flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-10 py-4 rounded-2xl bg-[#76d6d5] text-[#131313] font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(118,214,213,0.3)]"
            >
              Join the Network
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-4 rounded-2xl border border-white/10 text-[#e5e2e1]/60 font-black uppercase tracking-widest text-sm hover:bg-white/5 hover:text-[#e5e2e1] transition-all"
            >
              Already a Member? Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0e0e0e] px-8 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#76d6d5]" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            <span className="font-headline font-black text-[#76d6d5] text-xl tracking-tight">ResQPet</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            <button onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 hover:text-[#76d6d5] transition-colors">Emergency</button>
            <button onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 hover:text-[#76d6d5] transition-colors">Fundraisers</button>
            <button onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 hover:text-[#76d6d5] transition-colors">Impact Feed</button>
            <button onClick={() => navigate('/register')} className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 hover:text-[#76d6d5] transition-colors">Register</button>
          </div>
          <p className="text-[10px] text-[#e5e2e1]/20 font-black uppercase tracking-widest text-center">
            © 2024 ResQPet · Made for Animals 🐾
          </p>
        </div>
      </footer>
    </div>
  );
}
