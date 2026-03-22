import React from 'react';

export default function AmbulanceUIDesign() {
  return (
    <div className="resqpet-obsidian-theme min-h-screen bg-[#131313] text-[#e5e2e1]">
      
{/* TopAppBar Shell */}
<header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#131313]/60 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,128,128,0.1)]">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[#76d6d5]" data-icon="emergency">emergency</span>
<span className="font-['Manrope'] font-black text-[#76d6d5] text-xl tracking-tighter">ResQPet</span>
</div>
<h1 className="font-['Manrope'] font-bold tracking-tighter text-lg uppercase text-[#76d6d5] hidden md:block">Emergency: Active</h1>
<div className="flex items-center gap-4">
<button className="p-2 rounded-full hover:bg-[#76d6d5]/10 transition-colors active:scale-95 duration-150 ease-in-out">
<span className="material-symbols-outlined text-[#76d6d5]" data-icon="notifications_active">notifications_active</span>
</button>
<div className="h-8 w-8 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden">
<img className="w-full h-full object-cover" data-alt="User profile avatar driver" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVHoZxrZekK0gqnM__VOU6RGY9oNzlc2knegkYU3rpHjHKPi5RSspkxlexYw5d3p3BeL70-NMk2Q1RxUTRt5-5gv2iu8lG9aVPtLr0p_znXOnof6gf_BYk-SiivU_rbvD-IKVBXmuWjCoCj6OxMczRdkEkNbYlnsQoFfySsIM1fjgJ0BWvTm3AfEieOrFbFOIEvK-jzHrYKfVEe4H8e4gHZTTWb14YGtqQUARyXXZrv1HfEnZFaooquShud8srNpksnn0qZoFgQiVB"/>
</div>
</div>
</header>
{/* Main Content Canvas (Map) */}
<main className="relative h-full w-full pt-16 pb-24">
{/* Background Map Layer */}
<div className="absolute inset-0 z-0">
<div className="w-full h-full bg-surface-container-lowest overflow-hidden">
{/* Mock Map Implementation */}
<div className="relative w-full h-full opacity-60">
<img className="w-full h-full object-cover grayscale brightness-50 contrast-125" data-alt="Dark stylized city map background" data-location="New York City" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx1R-uKGBVFUnYbPxdChebdXtZ9ASoXowLrb9NJg8579779AuhZJMiWMlsOOLEH_3JrkEpFMX5RpqmDIrFH5o1ROf-UgDUJoJyM_56gsZ0h-o3nHGdwoSYl_tLj39NLe-onZRDARCZZmcKHON_nOfWy3RJz9PTuSP-esRv67H6Ak3Tq-rJfdRidySvvfrWTYPCCp464DssJVHCXuJxp_hb3m7amh3ZGad-i0nPNZI1a7be_o7to2ztMJjZQcXlb5HazLjuFtZO1S9z"/>
{/* Glowing Teal Route Line (SVG Overlay) */}
<svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
<path className="map-glow" d="M 200 800 Q 400 600 600 700 T 1000 400" fill="none" stroke="#76d6d5" stroke-dasharray="8 4" strokeWidth="4"></path>
<circle className="map-glow" cx="200" cy="800" fill="#76d6d5" r="6"></circle>
<circle className="map-glow" cx="1000" cy="400" fill="#ffb77d" r="10"></circle>
</svg>
</div>
</div>
</div>
{/* Floating UI Elements */}
<div className="relative z-10 h-full w-full flex flex-col pointer-events-none p-6">
{/* Current Mission Card */}
<div className="w-full max-w-lg mx-auto pointer-events-auto">
<div className="glass-panel rounded-3xl p-5 shadow-2xl flex items-center gap-5 border-l-4 border-primary">
<div className="relative shrink-0">
<img className="w-20 h-20 rounded-2xl object-cover shadow-lg" data-alt="Golden Retriever stray dog profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvaynKQahX5huhf1lu2Dx4POX4iRzkj7DdXcw-pWFc-EjzdZWQG6sYeaUUVwouTbEXdi_svSUhZr08_PvEgpOg8d1_L5zMWcRS2BqNZfJAfP6ajuUQuzOHy2FPN1Ihx-5kFj6J5J2GJ3miJirbWdOf4GedMKrSIsQRzEmW9Quz00bq5YjkwCCOyOMqUJvnLLQQqmD1X1LbpmoKPH_rWvs_t114LIxfAb5fTNkewQNPZr1zMB318ldQe8J2-a4iKoBos9UniLFY1b1w"/>
<div className="absolute -bottom-1 -right-1 bg-secondary text-on-secondary px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">Urgent</div>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<span className="text-xs font-bold text-primary tracking-widest uppercase">Current Mission</span>
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
<span className="text-[10px] font-bold text-primary">EN ROUTE</span>
</div>
</div>
<h2 className="font-headline text-lg font-extrabold text-on-surface leading-none mb-1">Stray Golden Retriever</h2>
<p className="text-on-surface-variant text-sm flex items-center gap-1">
<span className="material-symbols-outlined text-xs" data-icon="location_on">location_on</span> 5th Ave, Sector 12
                        </p>
<div className="mt-3 flex items-center gap-4">
<div className="flex flex-col">
<span className="text-[10px] uppercase text-on-surface-variant/60 font-bold tracking-widest">Distance</span>
<span className="text-sm font-bold text-on-surface">2.4km</span>
</div>
<div className="h-6 w-px bg-outline-variant/30"></div>
<div className="flex flex-col">
<span className="text-[10px] uppercase text-on-surface-variant/60 font-bold tracking-widest">ETA</span>
<span className="text-sm font-bold text-on-surface">6 mins</span>
</div>
</div>
</div>
</div>
</div>
{/* Spacer */}
<div className="flex-1"></div>
{/* Bottom Control Panel */}
<div className="w-full max-w-xl mx-auto space-y-4 pointer-events-auto">
{/* Status Toggles */}
<div className="grid grid-cols-3 gap-2 bg-surface-container-low/80 backdrop-blur-md p-1.5 rounded-full border border-outline-variant/20 shadow-xl">
<button className="flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-br from-[#76d6d5] to-[#008080] text-[#131313] font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(118,214,213,0.3)]">
<span className="material-symbols-outlined text-sm" data-icon="near_me">near_me</span> En Route
                    </button>
<button className="flex items-center justify-center gap-2 py-3 rounded-full text-on-surface-variant/60 hover:text-on-surface transition-colors font-bold text-xs uppercase tracking-widest">
<span className="material-symbols-outlined text-sm" data-icon="check_circle">check_circle</span> Arrived
                    </button>
<button className="flex items-center justify-center gap-2 py-3 rounded-full text-on-surface-variant/60 hover:text-on-surface transition-colors font-bold text-xs uppercase tracking-widest">
<span className="material-symbols-outlined text-sm" data-icon="volunteer_activism">volunteer_activism</span> Rescued
                    </button>
</div>
{/* Primary Large Actions */}
<div className="grid grid-cols-2 gap-4">
<button className="h-20 rounded-3xl bg-secondary-container flex flex-col items-center justify-center gap-1 shadow-[0_12px_24px_rgba(253,139,0,0.2)] active:scale-95 transition-transform group">
<span className="material-symbols-outlined text-on-secondary-container text-2xl group-hover:scale-110 transition-transform" data-icon="sports_score">sports_score</span>
<span className="text-on-secondary-container font-headline font-black text-sm uppercase tracking-tighter">ARRIVED</span>
</button>
<button className="h-20 rounded-3xl bg-error-container flex flex-col items-center justify-center gap-1 shadow-[0_12px_24px_rgba(147,0,10,0.2)] active:scale-95 transition-transform group">
<span className="material-symbols-outlined text-on-error-container text-2xl group-hover:scale-110 transition-transform" data-icon="warning">warning</span>
<span className="text-on-error-container font-headline font-black text-sm uppercase tracking-tighter">REPORT EMERGENCY</span>
</button>
</div>
</div>
</div>
</main>
{/* BottomNavBar Shell */}
<nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-[#131313]/80 backdrop-blur-2xl rounded-t-[1.5rem] shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
<a className="flex flex-col items-center justify-center text-[#e5e2e1]/40 px-4 py-2 hover:text-[#76d6d5] transition-all" href="#">
<span className="material-symbols-outlined" data-icon="assignment">assignment</span>
<span className="font-['Inter'] font-semibold text-[10px] tracking-wide mt-1">Missions</span>
</a>
<a className="flex flex-col items-center justify-center bg-gradient-to-br from-[#76d6d5] to-[#008080] text-[#131313] rounded-full px-6 py-2 shadow-[0_0_15px_rgba(118,214,213,0.4)] scale-110 duration-300" href="#">
<span className="material-symbols-outlined" data-icon="explore" style={{"fontVariationSettings":"'FILL' 1"}}>explore</span>
<span className="font-['Inter'] font-semibold text-[10px] tracking-wide mt-1">Map</span>
</a>
<a className="flex flex-col items-center justify-center text-[#e5e2e1]/40 px-4 py-2 hover:text-[#76d6d5] transition-all" href="#">
<span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
<span className="font-['Inter'] font-semibold text-[10px] tracking-wide mt-1">Profile</span>
</a>
</nav>
{/* Floating Action Button Suppression - Task focused dashboard, FAB suppressed to keep focus on Arrived/Emergency primary actions */}

    </div>
  );
} // Generated UI component
