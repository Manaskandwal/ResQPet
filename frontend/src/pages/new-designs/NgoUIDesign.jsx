import React from 'react';

export default function NgoUIDesign() {
  return (
    <div className="resqpet-obsidian-theme w-full text-on-background">
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
        {/* Hero Section: Stats Dashboard */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="glass-card p-6 rounded-3xl group hover:border-primary/30 transition-all border border-surface-border bg-surface">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <span className="material-symbols-outlined">health_and_safety</span>
              </div>
              <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded-full">+12%</span>
            </div>
            <h3 className="text-on-surface/40 text-xs font-bold uppercase tracking-widest mb-1">Active Rescues</h3>
            <p className="text-3xl font-headline font-extrabold text-on-surface">42</p>
          </div>
          <div className="glass-card p-6 rounded-3xl group hover:border-[#ffb77d]/30 transition-all border border-surface-border bg-surface">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#ffb77d]/10 rounded-2xl text-[#ffb77d]">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <span className="text-[10px] font-bold text-[#ffb77d] px-2 py-1 bg-[#ffb77d]/10 rounded-full">Critical</span>
            </div>
            <h3 className="text-on-surface/40 text-xs font-bold uppercase tracking-widest mb-1">Urgent Cases</h3>
            <p className="text-3xl font-headline font-extrabold text-on-surface">07</p>
          </div>
          <div className="glass-card p-6 rounded-3xl group hover:border-primary/30 transition-all border border-surface-border bg-surface">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <span className="material-symbols-outlined">volunteer_activism</span>
              </div>
            </div>
            <h3 className="text-on-surface/40 text-xs font-bold uppercase tracking-widest mb-1">Active Volunteers</h3>
            <p className="text-3xl font-headline font-extrabold text-on-surface">128</p>
            <div className="flex -space-x-2 mt-4">
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-on-surface/10 flex items-center justify-center text-[10px] font-bold text-on-surface">+24</div>
            </div>
          </div>
          <div className="glass-card p-6 rounded-3xl group hover:border-primary/30 transition-all border border-surface-border bg-surface">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <span className="material-symbols-outlined">payments</span>
              </div>
            </div>
            <h3 className="text-on-surface/40 text-xs font-bold uppercase tracking-widest mb-1">Fundraising</h3>
            <p className="text-3xl font-headline font-extrabold text-on-surface">$12.4k</p>
            <div className="w-full h-1.5 bg-on-surface/5 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-[#ffb77d] w-3/4"></div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Rescue Requests */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h2 className="font-headline text-2xl font-bold">Incoming Requests</h2>
                <p className="text-[#e5e2e1]/40 text-sm">Real-time rescue monitoring</p>
              </div>
              <button className="text-primary text-sm font-bold flex items-center gap-2 hover:underline">
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            {/* Rescue Card 1 (Urgent) */}
            <div className="glass-card rounded-[2rem] overflow-hidden flex flex-col md:flex-row group transition-all hover:translate-y-[-4px] border border-surface-border bg-surface">
              <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale brightness-75" data-alt="Rescue dog" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6lbWLuVj2GG9jthMRzmDJdULiCuo5FS_gWnvN2Bj9GqS411WMhEZz1JbmfD_P90nJdxI6djfHTSqVQNjGXbMpba-EM0d4VF_Bqf4P1u_6QyaY0Oo60XSdfErJtU97qogbfS2dd347mZbtRonH72st2KEH8D_st1jt4aQscbppQkqS0IkLQmuB2nfPCO53P_LztexvgbPHtinYBiFAVay3Um75yWJN54lVLDiyVYth0G0BiPJvEGeb_Age4BsV2D3k3tHY7_h1llNM" />
                <div className="absolute top-4 left-4 bg-[#ffb77d] text-black text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg">URGENT</div>
              </div>
              <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline text-xl font-bold text-on-surface">Stray Husky - Downtown</h3>
                    <span className="text-on-surface/40 text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span> 14m ago
                    </span>
                  </div>
                  <p className="text-on-surface/60 text-sm mb-4 line-clamp-2 italic">"Reported injured near the main station. Seems dehydrated and has a visible limp on front right paw."</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-on-surface/5 text-on-surface/40 text-[10px] font-bold rounded-full border border-surface-border">Medium Sized</span>
                    <span className="px-3 py-1 bg-on-surface/5 text-on-surface/40 text-[10px] font-bold rounded-full border border-surface-border">Injured</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ffb77d] animate-pulse"></div>
                    <span className="text-xs font-bold text-[#ffb77d]">Awaiting Dispatch</span>
                  </div>
                  <button className="px-6 py-2 bg-gradient-to-br from-primary to-primary-dim text-white font-headline font-bold text-sm rounded-full shadow-xl hover:scale-105 transition-transform">
                    Dispatch Team
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Resource Allocation & Maps */}
          <div className="space-y-8">
            <div className="glass-card p-6 rounded-[2rem] border border-surface-border bg-surface">
              <h2 className="font-headline text-xl font-bold mb-4 text-on-surface">Resource Allocation</h2>
              <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-on-surface/5" cx="80" cy="80" fill="transparent" r="64" stroke="currentColor" strokeWidth="12"></circle>
                  <circle className="text-primary" cx="80" cy="80" fill="transparent" r="64" stroke="currentColor" strokeDasharray="402" strokeDashoffset="120" strokeWidth="12"></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-headline font-black text-on-surface">88%</span>
                  <span className="text-[10px] uppercase text-on-surface/30 font-bold">Utilized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* FAB */}
      <button className="fixed right-6 bottom-8 w-14 h-14 bg-gradient-to-br from-[#ffb77d] to-[#fd8b00] text-black rounded-full flex items-center justify-center shadow-2xl z-40 active:scale-90 transition-all">
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_share</span>
      </button>
    </div>
  );
}
