import React from 'react';

export default function LandingUIDesign() {
  return (
    <div className="resqpet-obsidian-theme min-h-screen bg-[#131313] text-[#e5e2e1]">
      
{/* Top Navigation Shell */}
<header className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-xl shadow-[0_0_24px_rgba(118,214,213,0.06)]">
<div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[#76d6d5] text-2xl">pets</span>
<span className="text-2xl font-extrabold text-[#76d6d5] tracking-tighter font-headline">ResQPet</span>
</div>
<button className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold font-label uppercase tracking-wider active:scale-95 transition-transform">
                Emergency
            </button>
</div>
</header>
{/* Hero Section */}
<section className="relative h-[795px] w-full flex items-end pb-12 overflow-hidden">
<div className="absolute inset-0 z-0">
<img className="w-full h-full object-cover" data-alt="Portrait of a majestic rescued dog looking hopeful" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbAatU7NbycwcY767PnPYiqiBCY1CopwSjCDPihJ4NhBwx3KLYbSp4NbgvjPo8flNUBTZcbXN6vwGDZ-Bp4wJtpdAoP6-0vw2wbu8arZNDC2Q55sCJzu_ATFzVIneK02VnrKjdmgyZNf5p5tlfBGI3fnMsjMfHz3ixPxMrD-pRJYQNpFyqkdCD0Q5QkvJMbRZwmAcJRZduopydl3b9SpNdpSajKSiunQ9wWWHtWU42O9rGh8VkH3uu9XIaKYtramJNFOe7dNDDOUDZ"/>
<div className="absolute inset-0 hero-gradient"></div>
</div>
<div className="relative z-10 px-6 w-full max-w-xl mx-auto">
<div className="glass-card p-8 rounded-3xl mb-8">
<span className="text-primary font-label font-bold tracking-[0.2em] text-[10px] uppercase mb-3 block">Protecting Lives</span>
<h1 className="font-headline font-extrabold text-4xl leading-tight mb-4 tracking-tight text-on-surface">
                    Empowering Every Rescue
                </h1>
<p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                    Bridging the gap between compassionate citizens and the frontline heroes: NGOs, ambulances, and specialized pet hospitals.
                </p>
<div className="flex flex-col gap-3">
<button className="action-gradient text-on-primary-container py-4 rounded-full font-bold font-headline flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 1"}}>emergency_share</span>
                        EMERGENCY RESCUE
                    </button>
<button className="border border-outline-variant/30 text-secondary bg-surface/40 backdrop-blur-md py-4 rounded-full font-bold font-headline flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
<span className="material-symbols-outlined">volunteer_activism</span>
                        DONATE NOW
                    </button>
</div>
</div>
</div>
</section>
{/* Quick Navigation (Bento Grid) */}
<section className="px-6 py-12 bg-surface">
<h2 className="font-headline font-bold text-2xl mb-8 text-on-surface-variant">Access Portals</h2>
<div className="grid grid-cols-2 gap-4">
<div className="col-span-2 glass-card rounded-2xl p-6 relative overflow-hidden group">
<div className="relative z-10">
<span className="material-symbols-outlined text-primary text-3xl mb-4">person</span>
<h3 className="font-headline font-bold text-xl mb-1">Citizens</h3>
<p className="text-xs text-on-surface-variant">Report cases &amp; find pet care</p>
</div>
<span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-primary/5 group-hover:text-primary/10 transition-colors">person</span>
</div>
<div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
<span className="material-symbols-outlined text-secondary text-2xl mb-3">group</span>
<h3 className="font-headline font-bold text-sm">NGOs</h3>
<p className="text-[10px] text-on-surface-variant mt-1">Manage rescues &amp; foster networks</p>
</div>
<div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
<span className="material-symbols-outlined text-tertiary text-2xl mb-3">emergency_share</span>
<h3 className="font-headline font-bold text-sm">Ambulances</h3>
<p className="text-[10px] text-on-surface-variant mt-1">Real-time dispatch &amp; GPS tracking</p>
</div>
</div>
</section>
{/* Impact Section */}
<section className="px-6 py-16 bg-surface-container-low relative overflow-hidden">
<div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]"></div>
<div className="relative z-10">
<div className="mb-12">
<h2 className="font-headline font-black text-4xl text-on-surface tracking-tighter">Impact</h2>
<div className="h-1 w-12 bg-primary mt-2"></div>
</div>
<div className="space-y-6">
{/* Stat 1 */}
<div className="flex items-center justify-between border-b border-outline-variant/10 pb-6">
<div>
<div className="text-4xl font-headline font-black text-primary">5,000+</div>
<div className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Animals Saved</div>
</div>
<span className="material-symbols-outlined text-on-surface-variant/20 text-5xl">pets</span>
</div>
{/* Stat 2 */}
<div className="flex items-center justify-between border-b border-outline-variant/10 pb-6">
<div>
<div className="text-4xl font-headline font-black text-secondary">200+</div>
<div className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Active NGOs</div>
</div>
<span className="material-symbols-outlined text-on-surface-variant/20 text-5xl">home_health</span>
</div>
{/* Stat 3 */}
<div className="flex items-center justify-between border-b border-outline-variant/10 pb-6">
<div>
<div className="text-4xl font-headline font-black text-tertiary">50+</div>
<div className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Dedicated Ambulances</div>
</div>
<span className="material-symbols-outlined text-on-surface-variant/20 text-5xl">ambulance</span>
</div>
</div>
</div>
</section>
{/* Footer Shell */}
<footer className="bg-[#131313] w-full px-8 py-12 flex flex-col items-center gap-8 mt-20 border-t border-[#E5E2E1]/5">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[#76d6d5]">pets</span>
<span className="font-['Manrope'] font-black text-[#76d6d5] text-xl">ResQPet</span>
</div>
<div className="flex flex-wrap justify-center gap-6">
<a className="font-['Inter'] text-xs uppercase tracking-widest text-[#E5E2E1]/40 hover:text-[#ffb77d] transition-colors" href="#">Emergency Protocol</a>
<a className="font-['Inter'] text-xs uppercase tracking-widest text-[#E5E2E1]/40 hover:text-[#ffb77d] transition-colors" href="#">Donate Now</a>
<a className="font-['Inter'] text-xs uppercase tracking-widest text-[#E5E2E1]/40 hover:text-[#ffb77d] transition-colors" href="#">NGO Portal</a>
<a className="font-['Inter'] text-xs uppercase tracking-widest text-[#E5E2E1]/40 hover:text-[#ffb77d] transition-colors" href="#">Privacy</a>
</div>
<p className="text-[10px] text-[#E5E2E1]/30 text-center font-label tracking-widest">
            © 2024 ResQPet. The Luminous Guardian.
        </p>
</footer>
{/* Bottom Navigation (Mobile Primary Shell) */}
<nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 glass-card rounded-full px-8 py-4 flex justify-between items-center shadow-2xl border-white/5">
<div className="flex flex-col items-center gap-1 text-[#76d6d5]">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 1"}}>insights</span>
<span className="text-[9px] font-bold uppercase tracking-tighter">Impact</span>
</div>
<div className="flex flex-col items-center gap-1 text-[#E5E2E1]/60">
<span className="material-symbols-outlined">person</span>
<span className="text-[9px] font-bold uppercase tracking-tighter">Citizens</span>
</div>
<div className="flex flex-col items-center gap-1 text-[#E5E2E1]/60">
<span className="material-symbols-outlined">group</span>
<span className="text-[9px] font-bold uppercase tracking-tighter">NGOs</span>
</div>
<div className="flex flex-col items-center gap-1 text-[#E5E2E1]/60">
<span className="material-symbols-outlined">emergency_share</span>
<span className="text-[9px] font-bold uppercase tracking-tighter">Ambulances</span>
</div>
</nav>

    </div>
  );
} // Generated UI component
