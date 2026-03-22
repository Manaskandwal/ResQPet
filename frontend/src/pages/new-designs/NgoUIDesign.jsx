import React from 'react';

export default function NgoUIDesign() {
  return (
    <div className="resqpet-obsidian-theme min-h-screen bg-[#131313] text-[#e5e2e1]">
      
{/* Navigation Drawer (Desktop) */}
<aside className="hidden md:flex flex-col gap-2 p-4 h-screen w-72 fixed left-0 top-0 border-r border-white/10 bg-neutral-900/40 dark:bg-[#131313]/40 backdrop-blur-2xl z-50">
<div className="flex flex-col items-start px-4 py-8 gap-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
<span className="material-symbols-outlined text-black" style={{"fontVariationSettings":"'FILL' 1"}}>pets</span>
</div>
<h1 className="font-headline font-black tracking-tighter text-2xl text-primary">ResQPet</h1>
</div>
<div className="mt-8 w-full">
<div className="flex items-center gap-3 p-3 mb-6 bg-white/5 rounded-2xl">
<img alt="Profile" className="w-10 h-10 rounded-full object-cover border border-primary/20" data-alt="Portrait of a male NGO coordinator" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtb-3V_rvL3lwNe8q7JArGcmT1DdGeZUIGBkwQcz5dRWgxeF_GjEgLcWi-3JL_Dsu5u1x65oiFmwkUyFxx6_P5vlQ1MqvlHSUoHQtGaC-jBUlUuOu_8iOEn9N-GkDvYo7COPGMF6IPt5o_Og8gsqzeAaQu5t0DIdEDEEfjTfRRxvyP_MfHGfqJJ6APBPH3OCz1srtxamr_qHnTyKNW3FMrukVFttzkGmZd8gTSHeTuxBk5SmTxVK0RW_XvfeJQNy97NQzuDPBs0Sd7"/>
<div className="overflow-hidden">
<p className="font-headline font-semibold text-sm truncate">Alex Guardian</p>
<p className="text-xs text-neutral-500">Senior Coordinator</p>
</div>
</div>
</div>
</div>
<nav className="flex-1 space-y-1">
<a className="flex items-center gap-3 bg-gradient-to-br from-teal-400 to-teal-700 dark:from-[#76d6d5] dark:to-[#008080] text-black rounded-xl mx-2 shadow-[0_0_15px_rgba(118,214,213,0.3)] px-4 py-3 font-headline text-sm font-semibold transition-transform duration-300 ease-in-out" href="#">
<span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 1"}}>dashboard</span>
<span>Dashboard</span>
</a>
<a className="flex items-center gap-3 text-neutral-400 dark:text-neutral-500 hover:text-white mx-2 px-4 py-3 font-headline text-sm font-semibold hover:bg-white/5 transition-all" href="#">
<span className="material-symbols-outlined">emergency</span>
<span>Rescue Ops</span>
</a>
<a className="flex items-center gap-3 text-neutral-400 dark:text-neutral-500 hover:text-white mx-2 px-4 py-3 font-headline text-sm font-semibold hover:bg-white/5 transition-all" href="#">
<span className="material-symbols-outlined">medical_services</span>
<span>Medical Log</span>
</a>
<a className="flex items-center gap-3 text-neutral-400 dark:text-neutral-500 hover:text-white mx-2 px-4 py-3 font-headline text-sm font-semibold hover:bg-white/5 transition-all" href="#">
<span className="material-symbols-outlined">pets</span>
<span>Adoptions</span>
</a>
<a className="flex items-center gap-3 text-neutral-400 dark:text-neutral-500 hover:text-white mx-2 px-4 py-3 font-headline text-sm font-semibold hover:bg-white/5 transition-all" href="#">
<span className="material-symbols-outlined">insights</span>
<span>Analytics</span>
</a>
</nav>
<div className="p-4 mt-auto">
<div className="bg-surface-container-low rounded-2xl p-4 border border-white/5">
<p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-2">Emergency Hotline</p>
<p className="text-primary font-headline font-bold">800-RESQ-PET</p>
</div>
</div>
</aside>
{/* Top AppBar (Mobile/Global) */}
<header className="flex justify-between items-center w-full px-6 py-4 bg-neutral-900/60 dark:bg-[#131313]/60 backdrop-blur-xl docked full-width top-0 z-40 fixed md:pl-80 shadow-[0_8px_32px_0_rgba(118,214,213,0.06)]">
<div className="flex items-center gap-4">
<button className="md:hidden text-primary">
<span className="material-symbols-outlined">menu_open</span>
</button>
<h2 className="font-headline font-bold tracking-tight text-xl text-on-surface">Overview</h2>
</div>
<div className="flex items-center gap-4">
<div className="hidden sm:flex items-center px-4 py-2 bg-surface-container-lowest rounded-full border border-white/5">
<span className="material-symbols-outlined text-neutral-500 text-sm mr-2">search</span>
<input className="bg-transparent border-none text-sm focus:ring-0 text-on-surface w-32 lg:w-48" placeholder="Search rescues..." type="text"/>
</div>
<button className="p-2 rounded-full text-primary hover:bg-primary/10 transition-all active:scale-95 duration-200">
<span className="material-symbols-outlined">notifications_active</span>
</button>
</div>
</header>
{/* Main Content Canvas */}
<main className="md:ml-72 pt-24 pb-24 md:pb-12 px-6 lg:px-12 min-h-screen">
{/* Hero Section: Stats Dashboard */}
<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
<div className="glass-card p-6 rounded-3xl group hover:border-primary/30 transition-all">
<div className="flex justify-between items-start mb-4">
<div className="p-3 bg-primary/10 rounded-2xl text-primary">
<span className="material-symbols-outlined">health_and_safety</span>
</div>
<span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded-full">+12%</span>
</div>
<h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-1">Active Rescues</h3>
<p className="text-3xl font-headline font-extrabold text-on-surface">42</p>
</div>
<div className="glass-card p-6 rounded-3xl group hover:border-secondary/30 transition-all">
<div className="flex justify-between items-start mb-4">
<div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
<span className="material-symbols-outlined">warning</span>
</div>
<span className="text-[10px] font-bold text-secondary px-2 py-1 bg-secondary/10 rounded-full">Critical</span>
</div>
<h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-1">Urgent Cases</h3>
<p className="text-3xl font-headline font-extrabold text-on-surface">07</p>
</div>
<div className="glass-card p-6 rounded-3xl group hover:border-tertiary/30 transition-all">
<div className="flex justify-between items-start mb-4">
<div className="p-3 bg-tertiary/10 rounded-2xl text-tertiary">
<span className="material-symbols-outlined">volunteer_activism</span>
</div>
</div>
<h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-1">Active Volunteers</h3>
<p className="text-3xl font-headline font-extrabold text-on-surface">128</p>
<div className="flex -space-x-2 mt-4">
<img alt="v1" className="w-8 h-8 rounded-full border-2 border-background object-cover" data-alt="Volunteer avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzs7xOzQpdeQ4XniOOeAQGnMsHA_G2pa-zW2KChbTjpITPZWEewqVwIg2Qh8sPABKnRTZDdifWVgLpbW77xA9bc72EwQrTdIL9JYpqjmveSs_mp4rSt_khumB8N-Qzg04gq7tMhbnsJ0x8X7jvaMZsfDwhSEbvMNenmJvhoP4L8GDPmo-UBosqqKNgLDLDspkCNSMmNooV8lWRQoqK7zT2PYk6pBND1bBaLaekSY5vccAz3MpT3nemYLQ64f9M09Vpw52cpWdPSI99"/>
<img alt="v2" className="w-8 h-8 rounded-full border-2 border-background object-cover" data-alt="Volunteer avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4sdqHdaF-sMteZHZLeD4rTRUGJeXJ5LAQE4ShqL_RtdCT4Ju1s0SKXNiNhU0yuhGMNnnT_bwaMsIIy3VjHcp7syfEbZNsSHDs8Vvo27fZxVPlLltJnZ459GG6DsetubZ2lHbCjkenL53U1PUsEZenWqyFpKQdOC_90QtljSREjfMulztaeuUTXFE7RuATQLV8BjpkrmJtOKHeKzAex-KRWlDMvTH_C5eUIm7tofnrWCkGl4UyGwmza1ZbpelWW9Wqt6izLnpfpZol"/>
<img alt="v3" className="w-8 h-8 rounded-full border-2 border-background object-cover" data-alt="Volunteer avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMFbnaWFlgWrZUAnV3M-o99Xv8qSX-iRgJMQw7-g4N5uEiWDDCFNMUHzeN8PX2yBpufu-tq4MAylAWBhBbgHGfn1QSNSuii-dDZ7qzDGD9_i3lib4jwoxvXPt5fwcYKJMkVEb71ndaAp_8hjHXg0E_ITvE01Ec3As0wt6-f_C5ZAjBtUc6JobNU9TV8HATIa4JLaiTUwQu6KGuess5xBngqWl5wymXkN4LXpTbJDfUNxesI9-AIWTzifxlBopjlPPqgvilbzxHhcTP"/>
<div className="w-8 h-8 rounded-full border-2 border-background bg-surface-container-high flex items-center justify-center text-[10px] font-bold">+24</div>
</div>
</div>
<div className="glass-card p-6 rounded-3xl group hover:border-primary/30 transition-all">
<div className="flex justify-between items-start mb-4">
<div className="p-3 bg-primary/10 rounded-2xl text-primary">
<span className="material-symbols-outlined">payments</span>
</div>
</div>
<h3 className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-1">Fundraising</h3>
<p className="text-3xl font-headline font-extrabold text-on-surface">$12.4k</p>
<div className="w-full h-1.5 bg-surface-container-high rounded-full mt-4 overflow-hidden">
<div className="h-full bg-gradient-to-r from-primary to-tertiary w-3/4"></div>
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
<p className="text-neutral-500 text-sm">Real-time rescue monitoring</p>
</div>
<button className="text-primary text-sm font-bold flex items-center gap-2 hover:underline">
                        View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
{/* Rescue Card 1 (Urgent) */}
<div className="glass-card rounded-[2rem] overflow-hidden flex flex-col md:flex-row group transition-all hover:translate-y-[-4px]">
<div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
<img alt="Dog Rescue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Scared brown dog in urban setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6lbWLuVj2GG9jthMRzmDJdULiCuo5FS_gWnvN2Bj9GqS411WMhEZz1JbmfD_P90nJdxI6djfHTSqVQNjGXbMpba-EM0d4VF_Bqf4P1u_6QyaY0Oo60XSdfErJtU97qogbfS2dd347mZbtRonH72st2KEH8D_st1jt4aQscbppQkqS0IkLQmuB2nfPCO53P_LztexvgbPHtinYBiFAVay3Um75yWJN54lVLDiyVYth0G0BiPJvEGeb_Age4BsV2D3k3tHY7_h1llNM"/>
<div className="absolute top-4 left-4 bg-secondary-container text-black text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg">URGENT</div>
</div>
<div className="p-6 md:w-2/3 flex flex-col justify-between">
<div>
<div className="flex justify-between items-start mb-2">
<h3 className="font-headline text-xl font-bold">Stray Husky - Downtown</h3>
<span className="text-neutral-500 text-xs flex items-center gap-1">
<span className="material-symbols-outlined text-xs">schedule</span> 14m ago
                                </span>
</div>
<p className="text-neutral-400 text-sm mb-4 line-clamp-2 italic">"Reported injured near the main station. Seems dehydrated and has a visible limp on front right paw."</p>
<div className="flex flex-wrap gap-2 mb-6">
<span className="px-3 py-1 bg-surface-container text-neutral-400 text-[10px] font-bold rounded-full border border-white/5">Medium Sized</span>
<span className="px-3 py-1 bg-surface-container text-neutral-400 text-[10px] font-bold rounded-full border border-white/5">Injured</span>
<span className="px-3 py-1 bg-surface-container text-neutral-400 text-[10px] font-bold rounded-full border border-white/5">Near Transit</span>
</div>
</div>
<div className="flex items-center justify-between pt-4 border-t border-white/5">
<div className="flex items-center gap-2">
<div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
<span className="text-xs font-bold text-secondary">Awaiting Dispatch</span>
</div>
<button className="px-6 py-2 bg-gradient-to-br from-primary to-primary-container text-black font-headline font-bold text-sm rounded-full shadow-[0_0_15px_rgba(118,214,213,0.3)] hover:scale-105 transition-transform">
                                Dispatch Team
                            </button>
</div>
</div>
</div>
{/* Rescue Card 2 (In Progress) */}
<div className="glass-card rounded-[2rem] overflow-hidden flex flex-col md:flex-row group transition-all hover:translate-y-[-4px]">
<div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
<img alt="Cat Rescue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Kitten stuck in a narrow pipe" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj01yDZzA2u6EL3s2eJvEenuiH6NKTmlhAxR2vEOgLvjiBga8tyDNPYz0_WDZUs1owBN9ERFLK_x9dltUHied1NZbvRbaf1T3oIoQ2Gnh-UMb1uesUZ-CkoUgZK5740L5lJWhCoHE-fcvk3dr86eMYfGhgk7z07mVujukh4PEsP9TotfWKbaJ2AleRl7r6bCxUnU6gISyNE2nHEZtvdsaA1HzJ0FJDGgESYVtk8yzinEffOzQSUaqyfodBiiLq5dqjY-Affg3wol06"/>
<div className="absolute top-4 left-4 bg-primary/20 backdrop-blur-md text-primary text-[10px] font-black uppercase px-3 py-1 rounded-full border border-primary/30">IN PROGRESS</div>
</div>
<div className="p-6 md:w-2/3 flex flex-col justify-between">
<div>
<div className="flex justify-between items-start mb-2">
<h3 className="font-headline text-xl font-bold">Kitten Trapped - North End</h3>
<span className="text-neutral-500 text-xs flex items-center gap-1">
<span className="material-symbols-outlined text-xs">schedule</span> 1h 05m ago
                                </span>
</div>
<p className="text-neutral-400 text-sm mb-4 line-clamp-2 italic">"Stuck in a drainage pipe. Team Alpha is on site using specialized camera gear."</p>
<div className="flex flex-wrap gap-2 mb-6">
<span className="px-3 py-1 bg-surface-container text-neutral-400 text-[10px] font-bold rounded-full border border-white/5">Small Cat</span>
<span className="px-3 py-1 bg-surface-container text-neutral-400 text-[10px] font-bold rounded-full border border-white/5">Team Alpha</span>
</div>
</div>
<div className="flex items-center justify-between pt-4 border-t border-white/5">
<div className="flex items-center gap-3">
<img alt="Team Lead" className="w-8 h-8 rounded-full border border-primary/20 object-cover" data-alt="Team leader photo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuApzki0Fvh4Mkh_2Vz1FFugA-HOiN63g5-zijDGJWJwzLnhiI1tTh5BmFDHQlZENdOWnj9B1Mkf8PLtbx63X3BUX0NoOaXuVTb5SXhCIR3lALt5MsJuL7xCOasZRbHxI_6E949YoewI7Fz32egqgHOEWK0--4MgYzdU699Y3hAHst98ur8o4pvtCIpaVMYV0IZoxnO63IJJf5ImrkDDMGG-rSAN7gUMBzvmDXBRkdEmH5MGxKkU5C-l_cN0SEGSz9fRg4zGaUAOs0vP"/>
<span className="text-xs font-bold text-neutral-400">Mark Jenkins Lead</span>
</div>
<button className="px-6 py-2 bg-surface-container-high border border-white/10 text-on-surface font-headline font-bold text-sm rounded-full hover:bg-white/5 transition-all">
                                Track Live
                            </button>
</div>
</div>
</div>
</div>
{/* Right Column: Resource Allocation & Maps */}
<div className="space-y-8">
<div>
<h2 className="font-headline text-xl font-bold mb-4">Resource Allocation</h2>
<div className="glass-card p-6 rounded-[2rem]">
<div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
{/* SVG Donut Chart Placeholder */}
<svg className="w-full h-full transform -rotate-90">
<circle className="text-surface-container-highest" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="16"></circle>
<circle className="text-primary" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" stroke-dasharray="502" stroke-dashoffset="150" strokeWidth="16"></circle>
<circle className="text-secondary" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" stroke-dasharray="502" stroke-dashoffset="400" strokeWidth="16"></circle>
</svg>
<div className="absolute flex flex-col items-center">
<span className="text-3xl font-headline font-black text-on-surface">88%</span>
<span className="text-[10px] uppercase text-neutral-500 font-bold">Utilized</span>
</div>
</div>
<div className="space-y-3">
<div className="flex justify-between items-center">
<div className="flex items-center gap-2">
<div className="w-3 h-3 rounded-full bg-primary"></div>
<span className="text-xs font-semibold text-neutral-400">Medical Supplies</span>
</div>
<span className="text-xs font-bold">70%</span>
</div>
<div className="flex justify-between items-center">
<div className="flex items-center gap-2">
<div className="w-3 h-3 rounded-full bg-secondary"></div>
<span className="text-xs font-semibold text-neutral-400">Field Equipment</span>
</div>
<span className="text-xs font-bold">18%</span>
</div>
</div>
</div>
</div>
<div>
<h2 className="font-headline text-xl font-bold mb-4">Live Activity Map</h2>
<div className="glass-card rounded-[2rem] overflow-hidden h-64 relative group">
<img alt="Map" className="w-full h-full object-cover opacity-50 contrast-125 grayscale group-hover:grayscale-0 transition-all duration-700" data-location="Chicago" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmfebnTk6fbgbRgNne2dfNcY5gtnZtA9gX_pjSZlRrp0bIscfq062s6TolarTkgeLuhsk_XPI4AwuS6EEOVtNc9l2AXAFV_jOSJX-QK9Q-7ScdcHVlE2iibw3BmHwM9CJuJpbv1yjsZHd-MMloy6jRtj1OUIT6722oAKud0JQPEZTTJHMhUwO_PvfRHeTtyuh-s1gyxQ3lOxCKcWJI8gY4wpVwU1YDr68JUC7nPY95XZPyL90Bul-LbUqw84e1brRrpKYr9UFeHVJt"/>
<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
{/* Decorative Pins */}
<div className="absolute top-1/4 left-1/3 w-4 h-4 bg-secondary rounded-full border-4 border-background animate-bounce shadow-[0_0_15px_#fd8b00]"></div>
<div className="absolute top-1/2 left-2/3 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-[0_0_10px_#76d6d5]"></div>
<div className="absolute bottom-4 left-4 right-4">
<div className="bg-surface-container-high/80 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between border border-white/5">
<span className="text-xs font-bold">3 Active Dispatches</span>
<span className="material-symbols-outlined text-primary text-sm">open_in_new</span>
</div>
</div>
</div>
</div>
</div>
</div>
</main>
{/* Bottom Navigation Bar (Mobile) */}
<nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-4 pb-safe md:hidden bg-neutral-900/80 dark:bg-[#131313]/80 backdrop-blur-lg rounded-t-3xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
<a className="flex flex-col items-center justify-center text-teal-400 dark:text-[#76d6d5] font-bold group" href="#">
<span className="material-symbols-outlined group-hover:scale-110 transition-transform" style={{"fontVariationSettings":"'FILL' 1"}}>home</span>
<span className="font-['Inter'] text-[10px] uppercase tracking-widest mt-1">Home</span>
</a>
<a className="flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-600 group" href="#">
<span className="material-symbols-outlined group-hover:scale-110 transition-transform">priority_high</span>
<span className="font-['Inter'] text-[10px] uppercase tracking-widest mt-1">Urgent</span>
</a>
<a className="flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-600 group" href="#">
<span className="material-symbols-outlined group-hover:scale-110 transition-transform">location_on</span>
<span className="font-['Inter'] text-[10px] uppercase tracking-widest mt-1">Map</span>
</a>
<a className="flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-600 group" href="#">
<span className="material-symbols-outlined group-hover:scale-110 transition-transform">account_circle</span>
<span className="font-['Inter'] text-[10px] uppercase tracking-widest mt-1">Profile</span>
</a>
</nav>
{/* FAB (Rescue Hotkey) - Only on Dashboard/Home */}
<button className="fixed right-6 bottom-24 md:bottom-8 w-14 h-14 bg-gradient-to-br from-secondary to-secondary-container text-black rounded-full flex items-center justify-center shadow-2xl shadow-secondary/40 z-40 active:scale-90 transition-all">
<span className="material-symbols-outlined text-2xl" style={{"fontVariationSettings":"'FILL' 1"}}>emergency_share</span>
</button>

    </div>
  );
} // Generated UI component
