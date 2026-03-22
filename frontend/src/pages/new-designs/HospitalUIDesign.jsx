import React from 'react';

export default function HospitalUIDesign() {
  return (
    <div className="resqpet-obsidian-theme w-full text-[#e5e2e1]">
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
        {/* Hero Stats / Ward Status */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="md:col-span-2 glass-card rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between group border border-white/5 bg-[#1c1b1b]">
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#ffb77d] mb-2 block">Hospital Capacity</span>
              <h2 className="font-headline text-4xl font-extrabold tracking-tighter mb-4 text-[#e5e2e1]">Ward Status</h2>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-[#76d6d5] border-t-transparent flex items-center justify-center mb-2">
                    <span className="font-headline font-bold text-xl">84%</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/40">ICU Beds</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-[#ffb77d] border-t-transparent flex items-center justify-center mb-2 opacity-60">
                    <span className="font-headline font-bold text-xl">42%</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/40">General</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-5xl font-black text-[#76d6d5] tracking-tighter">24/32</p>
                <p className="text-xs font-medium text-[#e5e2e1]/40">Total Occupancy</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between border-l-4 border-[#ffb77d] border border-white/5 bg-[#1c1b1b]">
            <div>
              <span className="material-symbols-outlined text-[#ffb77d] text-4xl mb-4">emergency_share</span>
              <h3 className="font-headline font-bold text-xl text-[#e5e2e1]">Emergency Incoming</h3>
            </div>
            <div>
              <p className="text-4xl font-black text-[#e5e2e1] tracking-tighter">03</p>
              <p className="text-xs font-medium text-[#e5e2e1]/40">ETA &lt; 15m</p>
            </div>
          </div>
          <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between border-l-4 border-[#76d6d5] border border-white/5 bg-[#1c1b1b]">
            <div>
              <span className="material-symbols-outlined text-[#76d6d5] text-4xl mb-4">medical_services</span>
              <h3 className="font-headline font-bold text-xl text-[#e5e2e1]">Staff On Duty</h3>
            </div>
            <div>
              <p className="text-4xl font-black text-[#e5e2e1] tracking-tighter">18</p>
              <p className="text-xs font-medium text-[#e5e2e1]/40">Vets active</p>
            </div>
          </div>
        </section>

        {/* Bento Layout: Patient Queue & Records */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-5 space-y-6">
            <h3 className="font-headline text-2xl font-bold tracking-tight text-[#e5e2e1]">Patient Queue</h3>
            <div className="space-y-4">
              <div className="bg-[#1c1b1b] hover:bg-white/5 transition-colors rounded-2xl p-5 flex items-center gap-4 border border-white/5 cursor-pointer">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwPCmcMtuaVy1qX3vBLQsd4mP7zESrlQkKNWHOau3ojBlrCtO7CyF9limb_LpyzojTEW4N1vJN-d1lNkyo0mPyPUtTNxpjvy_3qHigtZQTcKdfdKwx40lT5ud84yBTIIOfIfN2NvGVMidH50ex_62Hc138xG76jKsuTecvk1QN53i1TppW3KkdGcz4DQkrh1hIbHaxQN2i03AmWixIHIMr82c7aRe17ivr8VCkjvQA7aZFtuwPRdEDeELvQeFXxKjetJT2abuRcq7S" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-headline font-bold text-[#e5e2e1]">Cooper</h4>
                    <span className="text-[10px] font-bold text-[#ffb77d]">AMB-04 • 4m</span>
                  </div>
                  <p className="text-xs text-[#e5e2e1]/50 italic text-sm">Suspected toxicity, lethargic.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-7 space-y-6">
            <h3 className="font-headline text-2xl font-bold tracking-tight text-[#e5e2e1]">Admitted Pets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-[1.5rem] overflow-hidden border border-white/5 bg-[#1c1b1b]">
                <div className="h-48 relative">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlhPYwaxWvu5VEDxXZZLVxbXOjgLiIPItmeOdNTuT92htUq33_UGIf7y5karYLPJyrNiri62Vas0JuGdRF2l7HLDvHxe6pzKVB7gXxo0M5Zg4ENN1ElVPTJsukeK7VC3e7AsOf5zi-9BhiA-s3wWhBsTOSZtKuhB6TWFcxrBJ30sQHj-bIEz1j63fmYKTawlKf19YLf9Wh_r0vkkoS29NYx0Pjh0-cpDuqjVKxJtNTzrqZOF821TtjQG_8ZSJvdd_mi6U_fu6q6R5r" className="w-full h-full object-cover grayscale" />
                </div>
                <div className="p-6">
                  <h4 className="font-headline text-xl font-bold text-[#e5e2e1]">Ghost</h4>
                  <p className="text-xs text-[#e5e2e1]/40 mb-4">3yr • Siberian Husky</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-[#76d6d5]/10 text-[#76d6d5] text-xs font-bold rounded-xl">Details</button>
                    <button className="flex-1 py-2 border border-white/10 text-[#e5e2e1]/40 text-xs font-bold rounded-xl">Meds</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
