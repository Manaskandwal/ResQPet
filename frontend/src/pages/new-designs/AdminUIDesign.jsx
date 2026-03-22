import React from 'react';

export default function AdminUIDesign() {
  return (
    <div className="resqpet-obsidian-theme min-h-screen bg-[#131313] text-[#e5e2e1]">
      
{/* NavigationDrawer Component */}
<aside className="h-screen w-72 fixed left-0 top-0 z-40 bg-[#1C1B1B] border-r border-white/5 flex flex-col h-full p-6 space-y-2 shadow-2xl">
<div className="mb-10 px-2 flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
<span className="material-symbols-outlined text-on-primary font-bold">pets</span>
</div>
<span className="text-xl font-headline font-black text-primary tracking-tighter">ResQPet</span>
</div>
<div className="flex items-center gap-3 p-3 mb-8 bg-surface-container rounded-xl">
<img alt="Admin Profile Photo" className="w-10 h-10 rounded-full object-cover" data-alt="Professional portrait of a male administrator" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlKlIfm7OJvCpxR_lQhsvPza_yiOiDXsD35mujotyga-TEgKk6yOfa90mejmA3AbVQohfB-vVejCSdUnS_zg2swT6CD-8JnsrU-Bl78IpWmDQUxuyoB9T_Xxv2UVLLA_qrjaGNBprA0ndFTlgoVhnEtWbggbjFoFCcvh7Ze3omYut0-Cid-Cg4IFYotuYndt68MQ9WwBubgxexfJVQ5ISB9QcTYhPz6L3pCBufWE8fIaZ7ErkL7nO_lplS5v2NzMrO-wai_3FYXV6I"/>
<div className="flex flex-col">
<span className="font-headline text-sm font-semibold text-on-surface">Editorial Control</span>
<span className="text-xs text-on-surface-variant">Super Admin</span>
</div>
</div>
<nav className="space-y-1">
<div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#76d6d5]/10 to-transparent text-[#76d6d5] border-l-4 border-[#76d6d5] font-manrope text-sm font-semibold cursor-pointer">
<span className="material-symbols-outlined text-xl">dashboard</span>
                Dashboard
            </div>
<div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#E5E2E1]/60 font-manrope text-sm font-semibold hover:bg-[#2A2A2A] hover:text-[#76d6d5] transition-colors cursor-pointer">
<span className="material-symbols-outlined text-xl">pets</span>
                Rescues
            </div>
<div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#E5E2E1]/60 font-manrope text-sm font-semibold hover:bg-[#2A2A2A] hover:text-[#76d6d5] transition-colors cursor-pointer">
<span className="material-symbols-outlined text-xl">handshake</span>
                NGO Partners
            </div>
<div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#E5E2E1]/60 font-manrope text-sm font-semibold hover:bg-[#2A2A2A] hover:text-[#76d6d5] transition-colors cursor-pointer">
<span className="material-symbols-outlined text-xl">local_hospital</span>
                Medical Centers
            </div>
<div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#E5E2E1]/60 font-manrope text-sm font-semibold hover:bg-[#2A2A2A] hover:text-[#76d6d5] transition-colors cursor-pointer">
<span className="material-symbols-outlined text-xl">manage_accounts</span>
                User Management
            </div>
</nav>
<div className="mt-auto pt-6">
<div className="p-4 glass-card rounded-2xl bg-secondary-container/10 border-secondary/20">
<p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">System Health</p>
<div className="flex items-center gap-2">
<div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
<span className="text-sm font-medium text-on-surface">Live Operations</span>
</div>
</div>
</div>
</aside>
{/* Main Content Area */}
<main className="ml-72 min-h-screen">
{/* TopAppBar Component */}
<header className="bg-[#131313]/60 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4 shadow-[0_24px_24px_-12px_rgba(118,214,213,0.06)]">
<div className="flex items-center gap-6">
<span className="text-2xl font-headline font-black text-[#76d6d5] tracking-tighter">ResQPet Admin</span>
<div className="hidden md:flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-white/5">
<span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
<input className="bg-transparent border-none text-sm focus:ring-0 text-on-surface w-64 placeholder:text-on-surface-variant/40" placeholder="Search database..." type="text"/>
</div>
</div>
<div className="flex items-center gap-4">
<button className="p-2 rounded-full hover:bg-[#2A2A2A] transition-all text-on-surface-variant">
<span className="material-symbols-outlined">notifications</span>
</button>
<div className="w-px h-6 bg-white/10 mx-2"></div>
<div className="flex items-center gap-3 cursor-pointer group">
<img alt="Admin Profile" className="w-8 h-8 rounded-full border border-primary/30 group-hover:scale-105 duration-300" data-alt="User avatar thumbnail" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBa6y2xh35XOoEgwAKbmiMMBpbi11M3kCFolN5h6eKrYbOCXMB4f2nQZAjXgDNBKVci1JqJL7kd2cEGgYRdiLUNYaJfY7MX2YAYvgJ3Fv-oWvWi1VoQhBbEI_I5IzRY_2cI5CQq8FQoZvfAQHxbNtpx-z7oVh7wdZugTBuNmdn594VM9op7bqZHXLysDxzIuhAfr26l-cFXYbc63hixneSDnR_zk2Uhtpp0h19qq9BJvjpCNVaEvDjDP4ihcGIOAxPCyuHy16o_A5zg"/>
</div>
</div>
</header>
<div className="p-8 space-y-8 max-w-7xl mx-auto">
{/* Summary Bento Grid */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
{/* Animals Saved Card */}
<div className="glass-card p-6 rounded-[2rem] relative overflow-hidden group">
<div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-2xl filled-icon" style={{"fontVariationSettings":"'FILL' 1"}}>favorite</span>
</div>
<div>
<p className="text-sm font-medium text-on-surface-variant uppercase tracking-widest">Animals Saved</p>
<h3 className="text-4xl font-headline font-black text-on-surface mt-1">5,000<span className="text-primary">+</span></h3>
</div>
<div className="flex items-center gap-2 text-primary text-xs font-bold">
<span className="material-symbols-outlined text-sm">trending_up</span>
<span>12% INCREASE THIS MONTH</span>
</div>
</div>
</div>
{/* Active NGOs Card */}
<div className="glass-card p-6 rounded-[2rem] relative overflow-hidden group">
<div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all duration-500"></div>
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-2xl filled-icon" style={{"fontVariationSettings":"'FILL' 1"}}>handshake</span>
</div>
<div>
<p className="text-sm font-medium text-on-surface-variant uppercase tracking-widest">Active NGOs</p>
<h3 className="text-4xl font-headline font-black text-on-surface mt-1">200<span className="text-secondary">+</span></h3>
</div>
<div className="flex items-center gap-2 text-secondary text-xs font-bold">
<span className="material-symbols-outlined text-sm">hub</span>
<span>8 PARTNERS PENDING APPROVAL</span>
</div>
</div>
</div>
{/* Hospitals Card */}
<div className="glass-card p-6 rounded-[2rem] relative overflow-hidden group">
<div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/10 rounded-full blur-2xl group-hover:bg-tertiary/20 transition-all duration-500"></div>
<div className="flex flex-col gap-4">
<div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-2xl filled-icon" style={{"fontVariationSettings":"'FILL' 1"}}>local_hospital</span>
</div>
<div>
<p className="text-sm font-medium text-on-surface-variant uppercase tracking-widest">Medical Centers</p>
<h3 className="text-4xl font-headline font-black text-on-surface mt-1">54</h3>
</div>
<div className="flex items-center gap-2 text-tertiary text-xs font-bold">
<span className="material-symbols-outlined text-sm">check_circle</span>
<span>ALL CENTERS FULLY VERIFIED</span>
</div>
</div>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
{/* Main Activity Chart Section */}
<div className="lg:col-span-8 space-y-8">
<div className="glass-card p-8 rounded-[2.5rem]">
<div className="flex justify-between items-end mb-10">
<div>
<h2 className="text-2xl font-headline font-bold text-on-surface">Rescue Trends</h2>
<p className="text-on-surface-variant text-sm">Platform volume over the last 7 days</p>
</div>
<div className="flex gap-2">
<button className="px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-on-primary">WEEKLY</button>
<button className="px-4 py-1.5 rounded-full text-xs font-bold bg-surface-container hover:bg-surface-container-high transition-colors">MONTHLY</button>
</div>
</div>
{/* Sleek Visual Chart Simulation */}
<div className="relative h-64 w-full flex items-end justify-between px-2 gap-4">
{/* Background Grid */}
<div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-5">
<div className="w-full h-px bg-white"></div>
<div className="w-full h-px bg-white"></div>
<div className="w-full h-px bg-white"></div>
<div className="w-full h-px bg-white"></div>
</div>
{/* Chart Bars with Gradient */}
<div className="group relative flex-1 h-[40%] bg-surface-container rounded-t-xl hover:bg-primary/20 transition-all duration-300">
<div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
<div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">42</div>
</div>
<div className="group relative flex-1 h-[60%] bg-surface-container rounded-t-xl hover:bg-primary/20 transition-all duration-300">
<div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
<div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">68</div>
</div>
<div className="group relative flex-1 h-[45%] bg-surface-container rounded-t-xl hover:bg-primary/20 transition-all duration-300">
<div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
<div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">51</div>
</div>
<div className="group relative flex-1 h-[85%] bg-surface-container rounded-t-xl hover:bg-primary/20 transition-all duration-300">
<div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
<div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">94</div>
</div>
<div className="group relative flex-1 h-[70%] bg-surface-container rounded-t-xl hover:bg-primary/20 transition-all duration-300 border-x-2 border-t-2 border-primary/40">
<div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
<div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">77</div>
</div>
<div className="group relative flex-1 h-[55%] bg-surface-container rounded-t-xl hover:bg-primary/20 transition-all duration-300">
<div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
<div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">59</div>
</div>
<div className="group relative flex-1 h-[95%] bg-surface-container rounded-t-xl hover:bg-primary/20 transition-all duration-300">
<div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
<div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">112</div>
</div>
</div>
<div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-on-surface-variant/40 tracking-widest uppercase">
<span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
</div>
</div>
{/* User Management Section */}
<div className="glass-card p-8 rounded-[2.5rem]">
<div className="flex justify-between items-center mb-6">
<h2 className="text-2xl font-headline font-bold text-on-surface">Recent Users</h2>
<button className="text-primary text-sm font-bold hover:underline">View All Users</button>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead className="text-on-surface-variant text-xs uppercase tracking-widest border-b border-white/5">
<tr>
<th className="pb-4 font-semibold">User Identity</th>
<th className="pb-4 font-semibold text-center">Role</th>
<th className="pb-4 font-semibold text-center">Status</th>
<th className="pb-4 font-semibold text-right">Activity</th>
</tr>
</thead>
<tbody className="text-sm">
<tr className="border-b border-white/5 group hover:bg-white/5 transition-colors">
<td className="py-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary">SC</div>
<div>
<div className="font-bold text-on-surface">Sarah Chen</div>
<div className="text-xs text-on-surface-variant">sarah.c@rescue.org</div>
</div>
</div>
</td>
<td className="py-4 text-center">
<span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-wider uppercase">NGO REP</span>
</td>
<td className="py-4 text-center">
<div className="flex justify-center items-center gap-1.5 text-primary">
<div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
<span className="text-xs font-medium">Active</span>
</div>
</td>
<td className="py-4 text-right text-on-surface-variant text-xs">2 mins ago</td>
</tr>
<tr className="border-b border-white/5 group hover:bg-white/5 transition-colors">
<td className="py-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-secondary">MJ</div>
<div>
<div className="font-bold text-on-surface">Marcus Johnson</div>
<div className="text-xs text-on-surface-variant">marcus.j@gmail.com</div>
</div>
</div>
</td>
<td className="py-4 text-center">
<span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-black tracking-wider uppercase">CITIZEN</span>
</td>
<td className="py-4 text-center">
<div className="flex justify-center items-center gap-1.5 text-primary">
<div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
<span className="text-xs font-medium">Active</span>
</div>
</td>
<td className="py-4 text-right text-on-surface-variant text-xs">15 mins ago</td>
</tr>
<tr className="group hover:bg-white/5 transition-colors">
<td className="py-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-tertiary">LV</div>
<div>
<div className="font-bold text-on-surface">Dr. Linda Vane</div>
<div className="text-xs text-on-surface-variant">l.vane@cityhealth.med</div>
</div>
</div>
</td>
<td className="py-4 text-center">
<span className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-[10px] font-black tracking-wider uppercase">ADMIN</span>
</td>
<td className="py-4 text-center">
<div className="flex justify-center items-center gap-1.5 text-primary">
<div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
<span className="text-xs font-medium">Active</span>
</div>
</td>
<td className="py-4 text-right text-on-surface-variant text-xs">1 hour ago</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
{/* Recent Activity Feed */}
<div className="lg:col-span-4">
<div className="glass-card p-8 rounded-[2.5rem] h-full sticky top-28 overflow-hidden flex flex-col">
<div className="flex items-center justify-between mb-8">
<h2 className="text-xl font-headline font-bold text-on-surface">Rescue Activity</h2>
<span className="bg-secondary-container px-2 py-1 rounded-md text-[10px] font-black text-on-secondary-container">LIVE</span>
</div>
<div className="flex-1 overflow-y-auto space-y-8 pr-2">
{/* Activity Item 1 */}
<div className="relative pl-8 border-l-2 border-primary/20 py-1">
<div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary shadow-[0_0_12px_rgba(118,214,213,0.5)]"></div>
<span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">Critical Rescue</span>
<p className="text-sm font-semibold text-on-surface leading-snug">NGO "Paw Haven" completed rescue of 3 kittens in Sector 7.</p>
<span className="text-[10px] text-on-surface-variant mt-2 block">Just now</span>
</div>
{/* Activity Item 2 */}
<div className="relative pl-8 border-l-2 border-secondary/20 py-1">
<div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-secondary shadow-[0_0_12px_rgba(255,183,125,0.5)]"></div>
<span className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-1">Medical Update</span>
<p className="text-sm font-semibold text-on-surface leading-snug">City Pet Hospital marked "Case #4021" as stabilized.</p>
<span className="text-[10px] text-on-surface-variant mt-2 block">12 minutes ago</span>
</div>
{/* Activity Item 3 */}
<div className="relative pl-8 border-l-2 border-white/10 py-1">
<div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-surface-container-highest border border-white/20"></div>
<span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-1">Verification</span>
<p className="text-sm font-semibold text-on-surface leading-snug">New NGO partner "WildLife First" submitted documents.</p>
<span className="text-[10px] text-on-surface-variant mt-2 block">45 minutes ago</span>
</div>
{/* Activity Item 4 */}
<div className="relative pl-8 border-l-2 border-primary/20 py-1">
<div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary shadow-[0_0_12px_rgba(118,214,213,0.5)]"></div>
<span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">Platform Growth</span>
<p className="text-sm font-semibold text-on-surface leading-snug">Global adoption count reached milestone of 5,000+.</p>
<span className="text-[10px] text-on-surface-variant mt-2 block">2 hours ago</span>
</div>
{/* Activity Item 5 */}
<div className="relative pl-8 border-l-2 border-secondary/20 py-1">
<div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-secondary shadow-[0_0_12px_rgba(255,183,125,0.5)]"></div>
<span className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-1">System Notice</span>
<p className="text-sm font-semibold text-on-surface leading-snug">API sync with Metropolitan Vet Network completed.</p>
<span className="text-[10px] text-on-surface-variant mt-2 block">4 hours ago</span>
</div>
</div>
<div className="mt-8 pt-6 border-t border-white/5">
<button className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-sm tracking-wide shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all">
                                EXPORT REPORT
                            </button>
</div>
</div>
</div>
</div>
</div>
</main>
{/* Contextual FAB - Dashboard Main Action */}
<button className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_24px_24px_-12px_rgba(118,214,213,0.3)] hover:scale-110 active:scale-90 transition-all z-50">
<span className="material-symbols-outlined text-3xl">add</span>
</button>

    </div>
  );
} // Generated UI component
