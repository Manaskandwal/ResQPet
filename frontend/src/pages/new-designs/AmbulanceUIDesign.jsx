import React from 'react';

export default function AmbulanceUIDesign() {
  return (
    <div className="resqpet-obsidian-theme w-full text-[#e5e2e1]">
      {/* Main Content Canvas (Map) */}
      <div className="relative h-screen w-full">
        {/* Background Map Layer */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-[#131313] overflow-hidden">
            <div className="relative w-full h-full opacity-40">
              <img className="w-full h-full object-cover grayscale brightness-50" data-alt="Dark city map" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx1R-uKGBVFUnYbPxdChebdXtZ9ASoXowLrb9NJg8579779AuhZJMiWMlsOOLEH_3JrkEpFMX5RpqmDIrFH5o1ROf-UgDUJoJyM_56gsZ0h-o3nHGdwoSYl_tLj39NLe-onZRDARCZZmcKHON_nOfWy3RJz9PTuSP-esRv67H6Ak3Tq-rJfdRidySvvfrWTYPCCp464DssJVHCXuJxp_hb3m7amh3ZGad-i0nPNZI1a7be_o7to2ztMJjZQcXlb5HazLjuFtZO1S9z" />
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M 200 800 Q 400 600 600 700 T 1000 400" fill="none" stroke="#76d6d5" strokeDasharray="8 4" strokeWidth="4"></path>
                <circle cx="200" cy="800" fill="#76d6d5" r="6"></circle>
                <circle cx="1000" cy="400" fill="#ffb77d" r="10"></circle>
              </svg>
            </div>
          </div>
        </div>
        {/* Floating UI Elements */}
        <div className="relative z-10 h-full w-full flex flex-col p-6">
          <div className="w-full max-w-lg mx-auto">
            <div className="glass-card rounded-[2rem] p-5 shadow-2xl flex items-center gap-5 border-l-4 border-[#76d6d5] border border-white/5 bg-[#1c1b1b]/80 backdrop-blur-md">
              <div className="relative shrink-0">
                <img className="w-20 h-20 rounded-2xl object-cover" data-alt="Rescue animal" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvaynKQahX5huhf1lu2Dx4POX4iRzkj7DdXcw-pWFc-EjzdZWQG6sYeaUUVwouTbEXdi_svSUhZr08_PvEgpOg8d1_L5zMWcRS2BqNZfJAfP6ajuUQuzOHy2FPN1Ihx-5kFj6J5J2GJ3miJirbWdOf4GedMKrSIsQRzEmW9Quz00bq5YjkwCCOyOMqUJvnLLQQqmD1X1LbpmoKPH_rWvs_t114LIxfAb5fTNkewQNPZr1zMB318ldQe8J2-a4iKoBos9UniLFY1b1w" />
                <div className="absolute -bottom-1 -right-1 bg-[#ffb77d] text-[#131313] px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase">Urgent</div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-[#76d6d5] tracking-widest uppercase">Current Mission</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#76d6d5]/10 border border-[#76d6d5]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#76d6d5] animate-pulse"></span>
                    <span className="text-[10px] font-bold text-[#76d6d5]">EN ROUTE</span>
                  </div>
                </div>
                <h2 className="font-headline text-lg font-extrabold text-[#e5e2e1] leading-none mb-1">Stray Golden Retriever</h2>
                <p className="text-[#e5e2e1]/40 text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">location_on</span> 5th Ave, Sector 12
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="w-full max-w-xl mx-auto space-y-4">
            <div className="grid grid-cols-3 gap-2 bg-[#1c1b1b]/80 backdrop-blur-md p-1.5 rounded-full border border-white/5 shadow-xl">
              <button className="flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-br from-[#76d6d5] to-[#008080] text-[#131313] font-bold text-xs uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">near_me</span> En Route
              </button>
              <button className="flex items-center justify-center gap-2 py-3 rounded-full text-[#e5e2e1]/40 hover:text-[#e5e2e1] transition-colors font-bold text-xs uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">check_circle</span> Arrived
              </button>
              <button className="flex items-center justify-center gap-2 py-3 rounded-full text-[#e5e2e1]/40 hover:text-[#e5e2e1] transition-colors font-bold text-xs uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">volunteer_activism</span> Rescued
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="h-20 rounded-3xl bg-[#ffb77d] flex flex-col items-center justify-center gap-1 text-[#131313] shadow-xl shadow-[#ffb77d]/20 active:scale-95 transition-transform group">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>sports_score</span>
                <span className="font-headline font-black text-sm uppercase">ARRIVED</span>
              </button>
              <button className="h-20 rounded-3xl bg-[#ff6b6b]/20 border border-[#ff6b6b]/30 text-[#ff6b6b] flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform group">
                <span className="material-symbols-outlined text-2xl">warning</span>
                <span className="font-headline font-black text-sm uppercase">EMERGENCY</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
