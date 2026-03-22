import React from 'react';

export default function CitizenUIDesign() {
  return (
    <div className="resqpet-obsidian-theme w-full text-[#e5e2e1]">
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
        {/* Header Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-background">
                Hello, <span className="text-[#76d6d5]">Guardian</span>
              </h1>
              <p className="text-[#e5e2e1]/70 max-w-md text-lg">
                Your vigilance keeps our furry friends safe. Ready to make an impact today?
              </p>
            </div>
            {/* Summary Card */}
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4 min-w-[280px] border border-white/5">
              <div className="w-12 h-12 rounded-full bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5]">
                <span className="material-symbols-outlined" data-icon="volunteer_activism">volunteer_activism</span>
              </div>
              <div>
                <div className="text-2xl font-bold font-headline transition-all">12 Animals</div>
                <div className="text-sm text-[#e5e2e1]/50 font-medium transition-all">Rescued by your reports</div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Hero: Report CTA & Map */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8 relative rounded-[2rem] overflow-hidden group min-h-[400px] border border-white/5 bg-[#1c1b1b]">
            <div className="absolute inset-0 opacity-40 grayscale" data-location="New York" style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-[#131313] via-[#131313]/40 to-transparent"></div>
            </div>
            <div className="relative h-full p-8 md:p-12 flex flex-col justify-center max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#76d6d5]/10 text-[#76d6d5] text-xs font-bold uppercase tracking-widest mb-6 w-fit">
                <span className="w-2 h-2 rounded-full bg-[#76d6d5] animate-pulse"></span>
                Live Map Active
              </div>
              <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4 leading-tight">Spot an animal in distress?</h2>
              <p className="text-[#e5e2e1]/70 mb-8 text-lg">Pin the location and upload a photo. Our rapid response team is on standby 24/7.</p>
              <button className="w-fit flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-[#76d6d5] to-[#008080] text-[#131313] font-bold rounded-full hover:scale-105 transition-all shadow-xl active:scale-95">
                <span className="material-symbols-outlined" data-icon="campaign">campaign</span>
                Report an Animal
              </button>
            </div>
            {/* Glass Map Floating UI */}
            <div className="absolute bottom-6 right-6 hidden md:block">
              <div className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#76d6d5]" data-icon="location_on">location_on</span>
                </div>
                <div>
                  <div className="text-xs text-[#e5e2e1]/40 uppercase font-bold tracking-tighter">Current Zone</div>
                  <div className="text-sm font-semibold">Downtown Central</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Rescue Tracker */}
            <div className="glass-card rounded-[2rem] p-8 flex flex-col h-full border border-[#76d6d5]/20 bg-[#1c1b1b]/50">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="font-headline text-xl font-bold mb-1">Rescue Tracker</h3>
                  <p className="text-xs text-[#e5e2e1]/40 transition-all uppercase tracking-wider">CASE #RQ-8821 (STRAY DOG)</p>
                </div>
                <span className="material-symbols-outlined text-[#76d6d5] animate-pulse" data-icon="radar">radar</span>
              </div>
              <div className="flex-grow space-y-8">
                <div className="relative">
                  {/* Status Bar */}
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#76d6d5] w-[75%] rounded-full shadow-[0_0_12px_rgba(118,214,213,0.6)]"></div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] font-bold text-[#76d6d5] uppercase">Status</span>
                      <span className="text-sm font-semibold">En Route</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <span className="text-[10px] font-bold text-[#76d6d5] uppercase">ETA</span>
                      <span className="text-sm font-semibold">4 min away</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 flex items-center gap-4 border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                    <img className="w-full h-full object-cover" data-alt="Female vet paramedic headshot" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMwO2soB_BDUozLuVwOcG9fOheIpx4xIgcwhVAyjGsyLn_oIc1xa-cletw1mkR1cmDbfjorbE4GHxl1Lhhqx4AOqBSwVabFzrLBgCkSC3gL37PIUCEtrsTIcBRn2BXCvygjJ1yc1sBmwuXzIgraPuB1A4AiyYeNP9CG9P5oHmAALOnsccM49P2UhvdJtMTCrvvO9npDA1MIUjciInfXX5S8sbDbvFOvqoBnoIzmrLpiK197ktOJFUM3ATmQpQvIxj6vkwebUsVXhG7" />
                  </div>
                  <div>
                    <div className="text-sm font-bold transition-all">Medic Sarah Miller</div>
                    <div className="text-xs text-[#e5e2e1]/50 transition-all">Ambulance Unit 4</div>
                  </div>
                </div>
              </div>
              <button className="mt-8 text-[#76d6d5] text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all">
                View Live Details
                <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        {/* Highlights Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline text-2xl font-bold">Recent Impact</h2>
            <button className="text-sm font-semibold text-[#76d6d5] hover:underline">View Global Log</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Impact Card 1 */}
            <div className="bg-[#1c1b1b] rounded-[1.5rem] overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl border border-white/5">
              <div className="h-48 relative">
                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" data-alt="Portrait of a small golden puppy" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD18UU1RtdeZSVX-SISJMDX6icDJtVU4B3MQrD8XGdfodmAfxkDxuyliXxhcO8dPwcMhvA4vknOPLoxXaVB2YqKyvcWAy0bButjXQkuaWwvwU9q9s4tHgQ4xxoLD0cXyeTp2PCE6AhADZG-bdq5JRAll4dH98WNEzEI_UHzOACs7pc7neyoYhRrMU7RLC7PCn0JhDpH4ur9Xsi4WxRos_eOIHJ-OHh3gBDfJSrEvJutcu4h7z2SOL_ypZnDVc1K_n43mwYuVGqhEopA" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#76d6d5] text-[#131313] text-[10px] font-bold uppercase tracking-widest">Safe</div>
              </div>
              <div className="p-6">
                <h4 className="font-headline font-bold text-lg mb-1 transition-all">Milo</h4>
                <p className="text-sm text-[#e5e2e1]/50 mb-4 transition-all">Rescued 2h ago from 5th Ave. Now receiving care.</p>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#76d6d5]"></div>
                </div>
              </div>
            </div>
            {/* Impact Card 2 */}
            <div className="bg-[#1c1b1b] rounded-[1.5rem] overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl border border-white/5">
              <div className="h-48 relative">
                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" data-alt="Close up of a black and white cat" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_T6wgQxp0SVzyl3fmkds8f-O_b00PxkU7r7qVte3LUFNF8_dfTU3iGmJALus3DJXdYGtvbtww_5nUWdH-1qmEakk562YZdPrXtEs2inH-D8xl8QQI879K06WiGKzgWNIB1TX4vjfgF86vXCxHohqFar_SOSNFhWxdGiRXWOLNli1kffrH0Hu3NkYN6OzFb4kNQQ4BJRC3LLlEQ3a0uTnZI6G5BPIKEPlwfCGYtv8NYTgrJ5HfxExcgdz544O3jgiBuG7KHHvGaLpC" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#ffb77d] text-[#131313] text-[10px] font-bold uppercase tracking-widest">Recovering</div>
              </div>
              <div className="p-6">
                <h4 className="font-headline font-bold text-lg mb-1 transition-all">Luna</h4>
                <p className="text-sm text-[#e5e2e1]/50 mb-4 transition-all">Abandoned kitten found in Riverside. Stable condition.</p>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[60%] h-full bg-[#ffb77d]"></div>
                </div>
              </div>
            </div>
            {/* Impact Card 3 */}
            <div className="bg-[#1c1b1b] rounded-[1.5rem] overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl border border-white/5">
              <div className="h-48 relative">
                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" data-alt="Medium sized dog looking alert" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQn8o1tr5unJMVhRWOKPtvHvzAzlkYvKvxZHVNIpuzjr6GBphyUzFSyUhIEHMZx3QkkKczyqWAYIM7YYP2oOuiM4GLgc0WJ_-NrybJT0tJI5wwxK43lnDEwlvidgiBpkknD9iK7VVwsJdf0XCHh2_PGUCTuAzqRvVPYQEdW6WQ5BpEyLcG6SZm3R_zjFcDv1dkT22LIXfYHnWZ04-A-8A4RlgfwMHOGZg-koMRL3kokdTpO9_Q2FNeI-4EYEQK2hhs7IY5macYPACz" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#76d6d5] text-[#131313] text-[10px] font-bold uppercase tracking-widest">Safe</div>
              </div>
              <div className="p-6">
                <h4 className="font-headline font-bold text-lg mb-1 transition-all">Cooper</h4>
                <p className="text-sm text-[#e5e2e1]/50 mb-4 transition-all">Found near construction site. Reunited with owner.</p>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#76d6d5]"></div>
                </div>
              </div>
            </div>
            {/* Action Card */}
            <div className="bg-[#1c1b1b] border-2 border-dashed border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:border-[#76d6d5]/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#76d6d5]/20 transition-colors">
                <span className="material-symbols-outlined text-3xl text-white/20 group-hover:text-[#76d6d5] transition-colors" data-icon="add_circle">add_circle</span>
              </div>
              <h4 className="font-headline font-bold text-lg mb-2 transition-all">Become a Volunteer</h4>
              <p className="text-xs text-[#e5e2e1]/50 transition-all">Join our network of transporters and fosters.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
