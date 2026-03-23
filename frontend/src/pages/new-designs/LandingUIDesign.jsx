import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function LandingUIDesign() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalRequests: 0, totalNGOs: 0, completedRequests: 0 });

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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="vetscue-obsidian-theme min-h-screen bg-background text-on-background font-body overflow-x-hidden transition-colors duration-300">

      {/* ── Top Navigation ── */}
      <header className="fixed top-0 w-full z-[100] bg-background/80 backdrop-blur-xl border-b border-surface-border">
        <div className="flex justify-between items-center px-5 sm:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            <span className="text-xl sm:text-2xl font-black text-primary tracking-tighter font-headline leading-none">VetsCue</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">

            <Link to="/login" className="text-on-background/60 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-surface-border hover:bg-surface-hover hover:text-on-background transition-all">
              Login
            </Link>
            <Link to="/register" className="bg-primary text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)]">
              Register
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-surface border border-surface-border text-primary"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

      </header>
      
      {/* ── Mobile Navigation Layer (Outside Header for clean stack) ── */}
      {/* ── Mobile Navigation Layer (Outside Header for clean stack) ── */}
      {/* Mobile Sidebar Overlay - Ultra-subtle Dimmed Background */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      
      {/* Mobile Sidebar Content - 70% width for visibility of background */}
      <div className={`md:hidden fixed top-0 right-0 w-[70%] sm:w-[320px] h-full bg-surface border-l border-surface-border z-[210] transition-transform duration-500 ease-in-out flex flex-col p-8 ${mobileMenuOpen ? 'translate-x-0 shadow-[-30px_0_80px_rgba(0,0,0,0.5)]' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            <span className="text-xl font-black text-primary font-headline tracking-tighter">VetsCue</span>
          </div>
          <div className="flex gap-2">

            <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-primary border border-surface-border hover:bg-surface-hover transition-all">
                <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-3 mb-8">
          <p className="text-[#ffb77d] text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-30">Mission Access</p>
          <Link onClick={() => setMobileMenuOpen(false)} to="/login" className="flex items-center gap-4 py-4 px-5 rounded-2xl bg-surface-hover border border-surface-border text-on-background font-headline font-bold text-sm transition-all">
            <span className="material-symbols-outlined text-primary">login</span>
            Login
          </Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/register" className="flex items-center gap-4 py-4 px-5 rounded-2xl bg-primary text-black font-headline font-black text-sm shadow-lg shadow-primary/10 group transition-all">
            <span className="material-symbols-outlined">person_add</span>
            Join Mission
          </Link>
          <Link onClick={() => setMobileMenuOpen(false)} to="/fundraisers" className="flex items-center gap-4 py-4 px-5 rounded-2xl border border-[#ffb77d]/20 bg-[#ffb77d]/5 text-[#ffb77d] font-headline font-bold text-sm hover:bg-[#ffb77d]/10 transition-all">
            <span className="material-symbols-outlined">volunteer_activism</span>
            Emergency Fund
          </Link>
        </div>

        <div className="mt-auto border-t border-surface-border pt-8 text-center sm:text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-background/20 mb-1 leading-none">VetsCue Sanctuary</p>
          <p className="text-[10px] text-on-background/10 leading-none">Built for Life · 2026</p>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden pt-16 lg:pt-20">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#76d6d5]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#ffb77d]/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="text-[#ffb77d] text-[10px] font-black uppercase tracking-[0.4em]">Together, <span className="text-[#76d6d5]">We Save</span> Them All.</span>
              <h1 className="font-headline font-extrabold text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-none">
                The Ultimate Sanctuary.<br />
                <span className="bg-gradient-to-r from-[#76d6d5] to-[#ffb77d] bg-clip-text text-transparent">For Every Pet</span><br />
                &amp; Guardian.
              </h1>
            </div>
            <p className="text-on-background/50 text-lg leading-relaxed max-w-md">
              Discover a complete ecosystem for pet life: rapid emergency response with our trusted network, plus coming soon—seamless adoption, world-class health services, and a vibrant community.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => navigate('/register?role=user')}
                className="group flex flex-1 items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-sm hover:scale-[1.03] active:scale-[0.97] transition-all shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.3)]"
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
                <p className="text-xs font-black uppercase tracking-widest text-on-background/20">Platform</p>
                <p className="text-2xl font-headline font-black text-primary">Open</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-on-background/20">Response</p>
                <p className="text-2xl font-headline font-black text-[#ffb77d]">Best Effort</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-on-background/20">Network</p>
                <p className="text-2xl font-headline font-black text-on-background">Growing</p>
              </div>
            </div>
          </div>

          {/* Right: visual card */}
          <div className="relative hidden lg:block">
            <div className="glass-card rounded-[3rem] border border-surface-border bg-surface p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Live Rescue Network</p>
              </div>
              {[
                { icon: 'emergency', label: 'Emergency Reported', sub: 'Citizen submitted a case', color: 'text-red-400', accent: 'bg-red-400/10' },
                { icon: 'volunteer_activism', label: 'NGO Responding', sub: 'Case accepted — en route', color: 'text-primary', accent: 'bg-primary/10' },
                { icon: 'local_hospital', label: 'Hospital Ready', sub: 'Bed reserved for animal', color: 'text-indigo-400', accent: 'bg-indigo-400/10' },
                { icon: 'local_shipping', label: 'Ambulance Dispatched', sub: 'Tracking live on map', color: 'text-[#ffb77d]', accent: 'bg-[#ffb77d]/10' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-hover border border-surface-border transition-all">
                  <div className={`w-10 h-10 rounded-xl ${s.accent} flex items-center justify-center ${s.color} shrink-0`}>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-background">{s.label}</p>
                    <p className="text-[10px] text-on-background/30">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Integrated Services ── */}
      <section className="px-6 py-24 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center space-y-3">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">What We Do</span>
            <h2 className="font-headline font-bold text-4xl text-on-surface tracking-tight">Integrated Services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <div key={i} className="glass-card rounded-[2rem] border border-surface-border bg-background/60 p-8 space-y-5 group cursor-default hover:-translate-y-2 hover:border-primary/20 transition-all duration-500">
                <div className={`w-14 h-14 rounded-2xl ${s.accent} flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-lg text-on-surface">{s.label}</h3>
                  <p className="text-sm text-on-surface/40 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Login Options ── */}
      <section className="px-6 py-24 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-3">
              <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Choose who you are</span>
              <h2 className="font-headline font-bold text-4xl text-on-background tracking-tight">Login Portals</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {[
                { label: 'Citizens', value: stats.totalUsers },
                { label: 'NGOs', value: stats.totalNGOs },
                { label: 'Cases Solved', value: stats.completedRequests },
                { label: 'Total Requests', value: stats.totalRequests },
              ].map(({ label, value }) => (
                <div key={label} className="text-center space-y-2">
                  <p className="text-5xl font-black text-primary tracking-tighter">{value > 1000 ? `${(value/1000).toFixed(1)}k+` : value}</p>
                  <p className="text-[10px] font-black text-on-background/20 uppercase tracking-[0.3em]">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative group">
            <div className="rounded-[3rem] overflow-hidden border border-surface-border bg-surface aspect-square lg:aspect-video relative">
              {/* Fallback pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--brand-primary)_1px,_transparent_1px)] bg-[size:24px_24px]" />
              <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Rescue" className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700" />
              <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-surface to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">campaign</span>
                    </div>
                    <div>
                      <h3 className="font-headline font-black text-on-background tracking-tight">Active Rescues</h3>
                      <p className="text-xs text-on-background/40">Real-time emergency monitoring active</p>
                    </div>
                  </div>
              </div>
            </div>
          </div>
          <div className="mb-16 space-y-3">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Roles</span>
            <h2 className="font-headline font-bold text-4xl text-on-background tracking-tight">Access Portals</h2>
            <p className="text-on-background/40 max-w-lg">Every role has a dedicated experience. Choose yours and join the network.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {portals.map((p, i) => (
              <div
                key={i}
                onClick={() => navigate('/login')}
                className={`glass-card rounded-[2rem] border border-surface-border bg-surface p-7 space-y-4 cursor-pointer group hover:-translate-y-2 ${p.border} ${p.bg} transition-all duration-500`}
              >
                <div className={`w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center ${p.color} group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-base text-on-background">{p.label}</h3>
                  <p className="text-xs text-on-background/40 leading-relaxed">{p.desc}</p>
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
      <section className="px-6 py-24 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center space-y-3">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">The Flow</span>
            <h2 className="font-headline font-bold text-4xl text-on-surface tracking-tight">How It Works</h2>
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
                  <span className="font-headline text-4xl font-black text-primary/20">{s.step}</span>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface">{s.label}</h3>
                <p className="text-sm text-on-surface/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 py-20 bg-background">
        <div className="max-w-4xl mx-auto glass-card rounded-[3rem] border border-primary/20 bg-surface p-16 text-center space-y-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3rem]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#76d6d5]/10 blur-[60px]" />
          </div>
          <div className="relative space-y-4">
            <h2 className="font-headline text-4xl font-extrabold tracking-tight">Every Second <span className="text-primary">Counts.</span></h2>
            <p className="text-on-surface/50 max-w-md mx-auto italic font-medium">Join the VetsCue mission today. Together, we can ensure every pet has a future.</p>
          </div>
          <div className="relative flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link to="/register" className="h-16 px-10 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(var(--brand-primary-rgb),0.3)]">
                Join the Rescue
              </Link>
              <Link to="/fundraisers" className="h-16 px-10 rounded-2xl border border-on-surface/10 text-on-surface font-black uppercase tracking-widest text-xs flex items-center justify-center hover:bg-on-surface/5 transition-all">
                Donate to Help
              </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-background px-8 py-12 border-t border-surface-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            <span className="font-headline font-black text-primary text-xl tracking-tight leading-none">VetsCue</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            <button onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-widest text-on-background/30 hover:text-primary transition-colors">Emergency</button>
            <button onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-widest text-on-background/30 hover:text-primary transition-colors">Fundraisers</button>
            <button onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-widest text-on-background/30 hover:text-primary transition-colors">Impact Feed</button>
            <button onClick={() => navigate('/register')} className="text-[10px] font-black uppercase tracking-widest text-on-background/30 hover:text-primary transition-colors">Register</button>
          </div>
          <p className="text-[10px] text-on-background/20 font-black uppercase tracking-widest text-center">
            © 2026 VetsCue · Empowering Every Guardian 🐾
          </p>
        </div>
      </footer>
    </div>
  );
}
