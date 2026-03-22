import React from 'react';

export default function CitizenUIDesign() {
  return (
    <div className="resqpet-obsidian-theme min-h-screen bg-[#131313] text-[#e5e2e1]">
      
{/* TopAppBar */}
<header className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-xl bg-gradient-to-b from-[#1c1b1b] to-transparent shadow-[0_8px_32px_0_rgba(0,128,128,0.1)]">
<div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[#76d6d5] text-2xl" data-icon="pets">pets</span>
<span className="font-manrope font-bold tracking-tight text-2xl font-black text-[#76d6d5] tracking-tighter">ResQPet</span>
</div>
<div className="flex items-center gap-6">
<nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide">
<a className="text-[#76d6d5] transition-colors duration-300" href="#">Home</a>
<a className="text-[#e5e2e1]/70 hover:text-[#76d6d5] transition-colors duration-300" href="#">Report</a>
<a className="text-[#e5e2e1]/70 hover:text-[#76d6d5] transition-colors duration-300" href="#">My Cases</a>
</nav>
<div className="flex items-center gap-4">
<button className="active:scale-95 transition-transform text-[#e5e2e1]/70 hover:text-[#76d6d5]">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/20 overflow-hidden">
<img className="w-full h-full object-cover" data-alt="User profile avatar of a smiling man" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXYwvWXiScmVpeGzWFFnkb6Q0kQyx93ysUdItD7UUJKON23bQiTy9oxtAdHlGHCGiXkHj0NTd5H6ju67n-A2I3NlEG8sv5Jg3eCow8tPW8bAdDnvv3pJqeChcxju24NNcqLa8DmaNpZ16-DghP07TMe0bwl5UxVnFoVCsiIHso4fmO5uGn6PQAWlWLsUj3WYSHRWdYHEu9elVr6ub1L8ltCdZ394vlmWTRR3IGOQI0OQaFv_3RoRRqLdS3xNVQjSKaS0t-d8VDo_38"/>
</div>
</div>
</div>
</div>
</header>
<main className="pt-24 pb-32 px-6 max-w-7xl mx-auto min-h-screen">
{/* Header Section */}
<section className="mb-12">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
<div className="space-y-2">
<h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-background">
                        Hello, <span className="text-primary">Guardian</span>
</h1>
<p className="text-on-surface-variant max-w-md text-lg">
                        Your vigilance keeps our furry friends safe. Ready to make an impact today?
                    </p>
</div>
{/* Summary Card */}
<div className="glass-card rounded-2xl p-6 flex items-center gap-4 min-w-[280px]">
<div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
<span className="material-symbols-outlined" data-icon="volunteer_activism">volunteer_activism</span>
</div>
<div>
<div className="text-2xl font-bold font-headline">12 Animals</div>
<div className="text-sm text-on-surface-variant font-medium">Rescued by your reports</div>
</div>
</div>
</div>
</section>
{/* Main Hero: Report CTA & Map */}
<section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
<div className="lg:col-span-8 relative rounded-3xl overflow-hidden group min-h-[400px] border border-outline-variant/10">
<div className="absolute inset-0 bg-surface-container-low" data-location="New York" style={{"backgroundSize":"cover","backgroundPosition":"center"}}>
<div className="absolute inset-0 bg-gradient-to-r from-surface-dim via-surface-dim/40 to-transparent"></div>
</div>
<div className="relative h-full p-8 md:p-12 flex flex-col justify-center max-w-xl">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest mb-6 w-fit">
<span className="w-2 h-2 rounded-full bg-on-secondary-container animate-pulse"></span>
                        Live Map Active
                    </div>
<h2 className="font-headline text-3xl md:text-4xl font-bold mb-4 leading-tight">Spot an animal in distress?</h2>
<p className="text-on-surface-variant mb-8 text-lg">Pin the location and upload a photo. Our rapid response team is on standby 24/7.</p>
<button className="w-fit flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold rounded-full hover:scale-105 transition-all shadow-xl active:scale-95">
<span className="material-symbols-outlined" data-icon="campaign">campaign</span>
                        Report an Animal
                    </button>
</div>
{/* Glass Map Floating UI */}
<div className="absolute bottom-6 right-6 hidden md:block">
<div className="glass-card p-4 rounded-2xl flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
<span className="material-symbols-outlined text-primary" data-icon="location_on">location_on</span>
</div>
<div>
<div className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter">Current Zone</div>
<div className="text-sm font-semibold">Downtown Central</div>
</div>
</div>
</div>
</div>
<div className="lg:col-span-4 flex flex-col gap-8">
{/* Rescue Tracker */}
<div className="glass-card rounded-3xl p-8 flex flex-col h-full glow-teal border-primary/10">
<div className="flex justify-between items-start mb-8">
<div>
<h3 className="font-headline text-xl font-bold mb-1">Rescue Tracker</h3>
<p className="text-xs text-on-surface-variant">CASE #RQ-8821 (STRAY DOG)</p>
</div>
<span className="material-symbols-outlined text-primary animate-pulse" data-icon="radar">radar</span>
</div>
<div className="flex-grow space-y-8">
<div className="relative">
{/* Status Bar */}
<div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary w-[75%] rounded-full shadow-[0_0_12px_rgba(118,214,213,0.6)]"></div>
</div>
<div className="flex justify-between mt-4">
<div className="flex flex-col items-start gap-1">
<span className="text-[10px] font-bold text-primary uppercase">Status</span>
<span className="text-sm font-semibold">En Route</span>
</div>
<div className="flex flex-col items-end gap-1 text-right">
<span className="text-[10px] font-bold text-primary uppercase">ETA</span>
<span className="text-sm font-semibold">4 min away</span>
</div>
</div>
</div>
<div className="p-4 rounded-2xl bg-surface-container-low flex items-center gap-4">
<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
<img className="w-full h-full object-cover" data-alt="Female vet paramedic headshot" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMwO2soB_BDUozLuVwOcG9fOheIpx4xIgcwhVAyjGsyLn_oIc1xa-cletw1mkR1cmDbfjorbE4GHxl1Lhhqx4AOqBSwVabFzrLBgCkSC3gL37PIUCEtrsTIcBRn2BXCvygjJ1yc1sBmwuXzIgraPuB1A4AiyYeNP9CG9P5oHmAALOnsccM49P2UhvdJtMTCrvvO9npDA1MIUjciInfXX5S8sbDbvFOvqoBnoIzmrLpiK197ktOJFUM3ATmQpQvIxj6vkwebUsVXhG7"/>
</div>
<div>
<div className="text-sm font-bold">Medic Sarah Miller</div>
<div className="text-xs text-on-surface-variant">Ambulance Unit 4</div>
</div>
</div>
</div>
<button className="mt-8 text-primary text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all">
                        View Live Details
                        <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
</div>
</section>
{/* Highlights Section */}
<section>
<div className="flex items-center justify-between mb-8">
<h2 className="font-headline text-2xl font-bold">Recent Impact</h2>
<button className="text-sm font-semibold text-primary hover:underline">View Global Log</button>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
{/* Impact Card 1 */}
<div className="bg-surface-container rounded-[1.5rem] overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl">
<div className="h-48 relative">
<img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" data-alt="Portrait of a small golden puppy" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD18UU1RtdeZSVX-SISJMDX6icDJtVU4B3MQrD8XGdfodmAfxkDxuyliXxhcO8dPwcMhvA4vknOPLoxXaVB2YqKyvcWAy0bButjXQkuaWwvwU9q9s4tHgQ4xxoLD0cXyeTp2PCE6AhADZG-bdq5JRAll4dH98WNEzEI_UHzOACs7pc7neyoYhRrMU7RLC7PCn0JhDpH4ur9Xsi4WxRos_eOIHJ-OHh3gBDfJSrEvJutcu4h7z2SOL_ypZnDVc1K_n43mwYuVGqhEopA"/>
<div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold uppercase tracking-widest">Safe</div>
</div>
<div className="p-6">
<h4 className="font-headline font-bold text-lg mb-1">Milo</h4>
<p className="text-sm text-on-surface-variant mb-4">Rescued 2h ago from 5th Ave. Now receiving care.</p>
<div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
<div className="w-full h-full bg-tertiary"></div>
</div>
</div>
</div>
{/* Impact Card 2 */}
<div className="bg-surface-container rounded-[1.5rem] overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl">
<div className="h-48 relative">
<img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" data-alt="Close up of a black and white cat" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_T6wgQxp0SVzyl3fmkds8f-O_b00PxkU7r7qVte3LUFNF8_dfTU3iGmJALus3DJXdYGtvbtww_5nUWdH-1qmEakk562YZdPrXtEs2inH-D8xl8QQI879K06WiGKzgWNIB1TX4vjfgF86vXCxHohqFar_SOSNFhWxdGiRXWOLNli1kffrH0Hu3NkYN6OzFb4kNQQ4BJRC3LLlEQ3a0uTnZI6G5BPIKEPlwfCGYtv8NYTgrJ5HfxExcgdz544O3jgiBuG7KHHvGaLpC"/>
<div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-secondary text-on-secondary text-[10px] font-bold uppercase tracking-widest">Recovering</div>
</div>
<div className="p-6">
<h4 className="font-headline font-bold text-lg mb-1">Luna</h4>
<p className="text-sm text-on-surface-variant mb-4">Abandoned kitten found in Riverside. Stable condition.</p>
<div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
<div className="w-[60%] h-full bg-secondary"></div>
</div>
</div>
</div>
{/* Impact Card 3 */}
<div className="bg-surface-container rounded-[1.5rem] overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl">
<div className="h-48 relative">
<img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" data-alt="Medium sized dog looking alert" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQn8o1tr5unJMVhRWOKPtvHvzAzlkYvKvxZHVNIpuzjr6GBphyUzFSyUhIEHMZx3QkkKczyqWAYIM7YYP2oOuiM4GLgc0WJ_-NrybJT0tJI5wwxK43lnDEwlvidgiBpkknD9iK7VVwsJdf0XCHh2_PGUCTuAzqRvVPYQEdW6WQ5BpEyLcG6SZm3R_zjFcDv1dkT22LIXfYHnWZ04-A-8A4RlgfwMHOGZg-koMRL3kokdTpO9_Q2FNeI-4EYEQK2hhs7IY5macYPACz"/>
<div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold uppercase tracking-widest">Safe</div>
</div>
<div className="p-6">
<h4 className="font-headline font-bold text-lg mb-1">Cooper</h4>
<p className="text-sm text-on-surface-variant mb-4">Found near construction site. Reunited with owner.</p>
<div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
<div className="w-full h-full bg-tertiary"></div>
</div>
</div>
</div>
{/* Action Card */}
<div className="bg-surface-container-high border-2 border-dashed border-outline-variant/30 rounded-[1.5rem] flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:border-primary/50 transition-colors">
<div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
<span className="material-symbols-outlined text-3xl text-outline group-hover:text-primary transition-colors" data-icon="add_circle">add_circle</span>
</div>
<h4 className="font-headline font-bold text-lg mb-2">Become a Volunteer</h4>
<p className="text-xs text-on-surface-variant">Join our network of transporters and fosters.</p>
</div>
</div>
</section>
</main>
{/* BottomNavBar */}
<nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#1c1b1b]/40 backdrop-blur-2xl rounded-t-[2rem] border-t border-[#76d6d5]/15 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
<a className="flex flex-col items-center justify-center text-[#76d6d5] bg-[#008080]/20 rounded-2xl px-4 py-1 active:scale-90 transition-all duration-200" href="#">
<span className="material-symbols-outlined" data-icon="home">home</span>
<span className="font-inter text-[10px] font-semibold uppercase tracking-widest">Home</span>
</a>
<a className="flex flex-col items-center justify-center text-[#e5e2e1]/50 hover:bg-[#e5e2e1]/5 active:scale-90 transition-all duration-200" href="#">
<span className="material-symbols-outlined" data-icon="campaign">campaign</span>
<span className="font-inter text-[10px] font-semibold uppercase tracking-widest">Report</span>
</a>
<a className="flex flex-col items-center justify-center text-[#e5e2e1]/50 hover:bg-[#e5e2e1]/5 active:scale-90 transition-all duration-200" href="#">
<span className="material-symbols-outlined" data-icon="folder_shared">folder_shared</span>
<span className="font-inter text-[10px] font-semibold uppercase tracking-widest">My Cases</span>
</a>
<a className="flex flex-col items-center justify-center text-[#e5e2e1]/50 hover:bg-[#e5e2e1]/5 active:scale-90 transition-all duration-200" href="#">
<span className="material-symbols-outlined" data-icon="person">person</span>
<span className="font-inter text-[10px] font-semibold uppercase tracking-widest">Profile</span>
</a>
</nav>

    </div>
  );
} // Generated UI component
