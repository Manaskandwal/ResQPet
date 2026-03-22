import React from 'react';

export default function HospitalUIDesign() {
  return (
    <div className="resqpet-obsidian-theme min-h-screen bg-[#131313] text-[#e5e2e1]">
      
{/* TopAppBar */}
<header className="fixed top-0 w-full z-50 px-6 py-4 bg-[#131313]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
<div className="flex justify-between items-center w-full max-w-screen-xl mx-auto">
<div className="flex items-center gap-4">
<div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-primary/20">
<img alt="Head Veterinarian Profile" className="w-full h-full object-cover" data-alt="Portrait of a senior male head veterinarian" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyVuzxrSfm_Yv8z_mdG606orlKMlHo_3ufHWSfmbtuyPRuVyDS7hkpiTqixg1DFTLeevqZ1i52X3DabLh1s6z-eeisPNWrsjvArxcYmyNUKfMjETDQ8g4ncNDR7gqszXfRKtdimM0xEHO4p34g_m8NwhToO6EVjYufG3Xr4y_qiK5QpvD_kik2YMRIrD4ym0iUjvmT35uc9rgIOFnySJg8rAIDhWyxw2xaNOQ3gSuVj35NNynaKG33HfuKJi4qbolVUoUxhibFF1u0"/>
</div>
<h1 className="font-headline font-black text-[#76d6d5] tracking-tighter text-2xl">Clinical Guardian</h1>
</div>
<nav className="hidden md:flex items-center gap-8">
<a className="font-headline tracking-tight font-bold text-sm text-[#76d6d5]" href="#">Dashboard</a>
<a className="font-headline tracking-tight font-bold text-sm text-[#E5E2E1]/60 hover:bg-[#2A2A2A]/40 transition-colors px-3 py-1 rounded-lg" href="#">Queue</a>
<a className="font-headline tracking-tight font-bold text-sm text-[#E5E2E1]/60 hover:bg-[#2A2A2A]/40 transition-colors px-3 py-1 rounded-lg" href="#">Wards</a>
<a className="font-headline tracking-tight font-bold text-sm text-[#E5E2E1]/60 hover:bg-[#2A2A2A]/40 transition-colors px-3 py-1 rounded-lg" href="#">Staff</a>
</nav>
<button className="p-2 rounded-full text-[#76d6d5] hover:bg-[#2A2A2A]/40 transition-colors active:scale-95 duration-200">
<span className="material-symbols-outlined">notifications_active</span>
</button>
</div>
</header>
{/* NavigationDrawer (Sidebar) */}
<aside className="fixed left-0 top-0 h-full w-80 z-40 bg-[#131313] rounded-r-2xl border-r border-white/5 shadow-2xl shadow-[#76d6d5]/5 hidden xl:flex flex-col pt-24 pb-8 px-6">
<div className="mb-10 flex flex-col items-start px-4">
<span className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1">Rescue Central</span>
<h2 className="font-headline font-bold text-[#76d6d5] text-xl">Emergency Ward</h2>
<div className="flex items-center gap-2 mt-2 py-1 px-3 bg-white/5 rounded-full border border-white/10">
<span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
<span className="text-xs font-medium text-[#E5E2E1]/70">Active Shift</span>
</div>
</div>
<nav className="flex-1 space-y-2">
<a className="flex items-center gap-4 px-4 py-3 bg-[#008080]/20 text-[#76d6d5] rounded-xl transition-all duration-300 ease-in-out" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-body font-medium text-sm">Dashboard</span>
</a>
<a className="flex items-center gap-4 px-4 py-3 text-[#E5E2E1]/70 hover:bg-white/5 hover:text-[#76d6d5] rounded-xl transition-all duration-300 ease-in-out" href="#">
<span className="material-symbols-outlined">emergency</span>
<span className="font-body font-medium text-sm">Patient Queue</span>
</a>
<a className="flex items-center gap-4 px-4 py-3 text-[#E5E2E1]/70 hover:bg-white/5 hover:text-[#76d6d5] rounded-xl transition-all duration-300 ease-in-out" href="#">
<span className="material-symbols-outlined">pets</span>
<span className="font-body font-medium text-sm">Ward Status</span>
</a>
<a className="flex items-center gap-4 px-4 py-3 text-[#E5E2E1]/70 hover:bg-white/5 hover:text-[#76d6d5] rounded-xl transition-all duration-300 ease-in-out" href="#">
<span className="material-symbols-outlined">description</span>
<span className="font-body font-medium text-sm">Medical Records</span>
</a>
<a className="flex items-center gap-4 px-4 py-3 text-[#E5E2E1]/70 hover:bg-white/5 hover:text-[#76d6d5] rounded-xl transition-all duration-300 ease-in-out" href="#">
<span className="material-symbols-outlined">group</span>
<span className="font-body font-medium text-sm">Staff Directory</span>
</a>
</nav>
<div className="mt-auto p-4 glass-card rounded-2xl flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined">support_agent</span>
</div>
<div>
<p className="text-sm font-bold text-on-surface">Need Help?</p>
<p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Support available 24/7</p>
</div>
</div>
</aside>
{/* Main Content Area */}
<main className="xl:ml-80 pt-28 px-6 pb-32 min-h-screen">
<div className="max-w-screen-xl mx-auto">
{/* Hero Stats / Ward Status */}
<section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
<div className="md:col-span-2 glass-card rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between group">
<div className="relative z-10">
<span className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 block">Hospital Capacity</span>
<h2 className="font-headline text-4xl font-extrabold tracking-tighter mb-4 text-on-surface">Ward Status</h2>
</div>
<div className="flex items-end justify-between relative z-10">
<div className="flex gap-4">
<div className="text-center">
<div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent flex items-center justify-center mb-2">
<span className="font-headline font-bold text-xl">84%</span>
</div>
<span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">ICU Beds</span>
</div>
<div className="text-center">
<div className="w-16 h-16 rounded-full border-4 border-tertiary border-t-transparent flex items-center justify-center mb-2 opacity-60">
<span className="font-headline font-bold text-xl">42%</span>
</div>
<span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">General</span>
</div>
</div>
<div className="text-right">
<p className="text-5xl font-black text-primary tracking-tighter">24/32</p>
<p className="text-xs font-medium text-on-surface-variant">Total Occupancy</p>
</div>
</div>
{/* Decorative element */}
<div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>
</div>
<div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between border-l-4 border-secondary">
<div>
<span className="material-symbols-outlined text-secondary text-4xl mb-4">emergency_share</span>
<h3 className="font-headline font-bold text-xl text-on-surface">Emergency Incoming</h3>
</div>
<div>
<p className="text-4xl font-black text-on-surface tracking-tighter">03</p>
<p className="text-xs font-medium text-on-surface-variant">Estimated ETA &lt; 15m</p>
</div>
</div>
<div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between border-l-4 border-primary">
<div>
<span className="material-symbols-outlined text-primary text-4xl mb-4">medical_services</span>
<h3 className="font-headline font-bold text-xl text-on-surface">Staff On Duty</h3>
</div>
<div>
<p className="text-4xl font-black text-on-surface tracking-tighter">18</p>
<p className="text-xs font-medium text-on-surface-variant">Vets &amp; Techs active</p>
</div>
</div>
</section>
{/* Bento Layout: Patient Queue & Medical Records */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
{/* Patient Queue (Left Column - 5 spans) */}
<section className="lg:col-span-5 space-y-6">
<div className="flex items-center justify-between mb-4">
<h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Patient Queue</h3>
<span className="px-3 py-1 bg-secondary-container/20 text-secondary rounded-full text-[10px] font-bold uppercase tracking-widest border border-secondary/20">High Urgency</span>
</div>
<div className="space-y-4">
{/* Queue Item 1 */}
<div className="bg-surface-container-low hover:bg-surface-container transition-colors rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group cursor-pointer">
<div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-highest shrink-0">
<img alt="Beagle mix patient" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" data-alt="Close up of a brown and white beagle dog" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwPCmcMtuaVy1qX3vBLQsd4mP7zESrlQkKNWHOau3ojBlrCtO7CyF9limb_LpyzojTEW4N1vJN-d1lNkyo0mPyPUtTNxpjvy_3qHigtZQTcKdfdKwx40lT5ud84yBTIIOfIfN2NvGVMidH50ex_62Hc138xG76jKsuTecvk1QN53i1TppW3KkdGcz4DQkrh1hIbHaxQN2i03AmWixIHIMr82c7aRe17ivr8VCkjvQA7aZFtuwPRdEDeELvQeFXxKjetJT2abuRcq7S"/>
</div>
<div className="flex-1">
<div className="flex items-center justify-between mb-1">
<h4 className="font-headline font-bold text-on-surface">Cooper</h4>
<span className="text-[10px] font-bold text-secondary">AMB-04 • 4m</span>
</div>
<p className="text-xs text-on-surface-variant leading-relaxed">Suspected toxicity, lethargic, increased heart rate.</p>
<div className="flex gap-2 mt-2">
<span className="text-[9px] uppercase font-bold tracking-tighter bg-white/5 px-2 py-0.5 rounded text-on-surface-variant">Triage: Orange</span>
<span className="text-[9px] uppercase font-bold tracking-tighter bg-white/5 px-2 py-0.5 rounded text-on-surface-variant">Weight: 12kg</span>
</div>
</div>
<div className="w-1 h-12 bg-secondary rounded-full"></div>
</div>
{/* Queue Item 2 */}
<div className="bg-surface-container-low hover:bg-surface-container transition-colors rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group cursor-pointer">
<div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-highest shrink-0">
<img alt="Calico cat patient" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" data-alt="Portrait of a calico cat looking alert" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT3tsEagJZ-Lgd6sadIANunFsvlpMwAIx7XmBSTQy02BSmYnxjfujdk_qSvQqe5j79v-y8vc3Xyh8-7APAuARjZljdz-WPOLqvpvgfYjeqY7oUG9tVk5Ayhl4illtCSrUtrmwBvSDWNtbqkaaao-V3jYbTUm7K-_6l2HRRlFqKFb34trzloGW9GSnWl45dfib16bKCzBg7W1Ei7Lfs3ogbquSoYng36FrRHXrDMbdn33jeG2djUe3jX-k8LzvYegrxQNC5uBhXjw19"/>
</div>
<div className="flex-1">
<div className="flex items-center justify-between mb-1">
<h4 className="font-headline font-bold text-on-surface">Luna</h4>
<span className="text-[10px] font-bold text-primary">AMB-12 • 12m</span>
</div>
<p className="text-xs text-on-surface-variant leading-relaxed">Fractured limb, stabilization required. Vital signs stable.</p>
<div className="flex gap-2 mt-2">
<span className="text-[9px] uppercase font-bold tracking-tighter bg-white/5 px-2 py-0.5 rounded text-on-surface-variant">Triage: Yellow</span>
<span className="text-[9px] uppercase font-bold tracking-tighter bg-white/5 px-2 py-0.5 rounded text-on-surface-variant">Microchipped</span>
</div>
</div>
<div className="w-1 h-12 bg-primary rounded-full"></div>
</div>
{/* Queue Item 3 */}
<div className="bg-surface-container-low hover:bg-surface-container transition-colors rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group cursor-pointer">
<div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-highest shrink-0">
<img alt="Golden Retriever patient" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" data-alt="Happy golden retriever sitting on grass" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgulBXhNPAoaJgrQ72l7Znh6lQ6trJuydo5J7PrVvbzhoHYfM_EY6LMDIQrlfpOdi5rC4QFMk069nDZk1CUvS7ycOPFYKYxpL9C7ibbMOWOmxQS6XDryIwgYYhZ6pHxNNcoL3YwwnCXZWkicIIADnLehhDoD-1fA2Wp9GEDcNx77Gp-odB3DKlewEnBsoP0so9wSZh1EWXnKAgfJunbfWkODe48tNgck33OFn6p9j_DeFLM4KApH67PE4vwd4csvDdXdQ28UPSdGEl"/>
</div>
<div className="flex-1">
<div className="flex items-center justify-between mb-1">
<h4 className="font-headline font-bold text-on-surface">Max</h4>
<span className="text-[10px] font-bold text-on-surface-variant">Private Car • 18m</span>
</div>
<p className="text-xs text-on-surface-variant leading-relaxed">Post-op follow up, sudden swelling at incision site.</p>
<div className="flex gap-2 mt-2">
<span className="text-[9px] uppercase font-bold tracking-tighter bg-white/5 px-2 py-0.5 rounded text-on-surface-variant">Triage: Blue</span>
<span className="text-[9px] uppercase font-bold tracking-tighter bg-white/5 px-2 py-0.5 rounded text-on-surface-variant">Return Patient</span>
</div>
</div>
<div className="w-1 h-12 bg-on-surface-variant rounded-full"></div>
</div>
</div>
<button className="w-full py-4 border border-outline-variant/30 rounded-2xl font-headline font-bold text-sm text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all">
                        View Complete Queue
                    </button>
</section>
{/* Admitted Pets / Medical Records (Right Column - 7 spans) */}
<section className="lg:col-span-7 space-y-6">
<div className="flex items-center justify-between mb-4">
<h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Admitted Pets</h3>
<div className="flex gap-2">
<button className="p-2 glass-card rounded-lg text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined">filter_list</span></button>
<button className="p-2 glass-card rounded-lg text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined">search</span></button>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{/* Record Card 1 */}
<div className="glass-card rounded-[1.5rem] overflow-hidden group">
<div className="h-48 relative">
<img alt="Husky in ward" className="w-full h-full object-cover" data-alt="Siberian husky laying down in a bright clinic setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlhPYwaxWvu5VEDxXZZLVxbXOjgLiIPItmeOdNTuT92htUq33_UGIf7y5karYLPJyrNiri62Vas0JuGdRF2l7HLDvHxe6pzKVB7gXxo0M5Zg4ENN1ElVPTJsukeK7VC3e7AsOf5zi-9BhiA-s3wWhBsTOSZtKuhB6TWFcxrBJ30sQHj-bIEz1j63fmYKTawlKf19YLf9Wh_r0vkkoS29NYx0Pjh0-cpDuqjVKxJtNTzrqZOF821TtjQG_8ZSJvdd_mi6U_fu6q6R5r"/>
<div className="absolute inset-0 bg-gradient-to-t from-[#201f1f] to-transparent"></div>
<div className="absolute bottom-4 left-4">
<span className="bg-primary/20 backdrop-blur-md text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/30">Ward A-04</span>
</div>
</div>
<div className="p-6 bg-surface-container">
<div className="flex justify-between items-start mb-3">
<div>
<h4 className="font-headline text-xl font-bold text-on-surface">Ghost</h4>
<p className="text-xs text-on-surface-variant">3yr • Siberian Husky</p>
</div>
<span className="material-symbols-outlined text-primary" style={{"fontVariationSettings":"'FILL' 1"}}>vital_signs</span>
</div>
<div className="space-y-3 mb-6">
<div className="flex justify-between items-center text-xs">
<span className="text-on-surface-variant">Condition</span>
<span className="font-bold text-primary">Stable</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="w-[75%] h-full bg-gradient-to-r from-primary to-primary-container"></div>
</div>
<p className="text-[11px] leading-relaxed text-on-surface-variant italic">"Monitoring recovery from acute gastroenteritis. Fluids ongoing."</p>
</div>
<div className="flex gap-2">
<button className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all">Details</button>
<button className="flex-1 py-2 border border-outline-variant/30 text-on-surface-variant text-xs font-bold rounded-xl hover:bg-white/5 transition-all">Medication</button>
</div>
</div>
</div>
{/* Record Card 2 */}
<div className="glass-card rounded-[1.5rem] overflow-hidden group">
<div className="h-48 relative">
<img alt="Small dog in ward" className="w-full h-full object-cover" data-alt="Small mixed breed dog looking curious" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtqpQi4wodVu1e0k8s_rzXhCTpoh6FtyauWs4hQipGgJstwbfb41Za8uqcuFPxh1oZSiN8pgZMr8wI4euG1nZkBVlyAYFqORtLX3uyjputCeGbMwqT46mw3NEQcXAGUb8JYgACO5KKtcyC2ZNR8MkRMM0CvYdipUJQpOZ9Wg3V0_FnqMzKEzBQLtVo_w2s-DKJo_Cz9QNqOi02fjgv0fm140JFR9F1ZbGVZnvK-WBjVm54A_nJ6akpcxbu0W6h4GfZal1ofGSRCbF3"/>
<div className="absolute inset-0 bg-gradient-to-t from-[#201f1f] to-transparent"></div>
<div className="absolute bottom-4 left-4">
<span className="bg-secondary-container/20 backdrop-blur-md text-secondary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-secondary/30">ICU-02</span>
</div>
</div>
<div className="p-6 bg-surface-container">
<div className="flex justify-between items-start mb-3">
<div>
<h4 className="font-headline text-xl font-bold text-on-surface">Bella</h4>
<p className="text-xs text-on-surface-variant">8yr • Maltese Terrier</p>
</div>
<span className="material-symbols-outlined text-secondary" style={{"fontVariationSettings":"'FILL' 1"}}>crisis_alert</span>
</div>
<div className="space-y-3 mb-6">
<div className="flex justify-between items-center text-xs">
<span className="text-on-surface-variant">Condition</span>
<span className="font-bold text-secondary">Critical</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="w-[30%] h-full bg-secondary"></div>
</div>
<p className="text-[11px] leading-relaxed text-on-surface-variant italic">"Post-trauma respiratory support. Oxygen saturation monitored 24/7."</p>
</div>
<div className="flex gap-2">
<button className="flex-1 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold rounded-xl transition-all">Update</button>
<button className="flex-1 py-2 border border-outline-variant/30 text-on-surface-variant text-xs font-bold rounded-xl hover:bg-white/5 transition-all">History</button>
</div>
</div>
</div>
</div>
</section>
</div>
</div>
</main>
{/* BottomNavBar (Mobile Only) */}
<nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-[#1C1B1B]/80 backdrop-blur-2xl rounded-full border border-white/10 shadow-[0_24px_48px_rgba(118,214,213,0.15)] flex justify-around items-center px-8 py-4 z-50">
<button className="bg-gradient-to-br from-[#76d6d5] to-[#008080] text-[#131313] rounded-full p-3 shadow-lg shadow-[#76d6d5]/20 active:scale-90 duration-150">
<span className="material-symbols-outlined">vital_signs</span>
</button>
<button className="text-[#E5E2E1]/40 flex flex-col items-center gap-1 hover:text-[#76d6d5] transition-all">
<span className="material-symbols-outlined">pending_actions</span>
<span className="font-body text-[10px] uppercase tracking-widest font-bold">Queue</span>
</button>
<button className="text-[#E5E2E1]/40 flex flex-col items-center gap-1 hover:text-[#76d6d5] transition-all">
<span className="material-symbols-outlined">folder_shared</span>
<span className="font-body text-[10px] uppercase tracking-widest font-bold">Records</span>
</button>
<button className="text-[#E5E2E1]/40 flex flex-col items-center gap-1 hover:text-[#76d6d5] transition-all">
<span className="material-symbols-outlined">crisis_alert</span>
<span className="font-body text-[10px] uppercase tracking-widest font-bold">Alerts</span>
</button>
</nav>

    </div>
  );
} // Generated UI component
