import React from 'react';

export default function AdminUIDesign() {
  return (
    <div className="resqpet-obsidian-theme w-full text-on-background">
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Summary Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Animals Saved Card */}
          <div className="glass-card p-6 rounded-[2rem] relative overflow-hidden group border border-surface-border bg-surface">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl filled-icon" style={{ "fontVariationSettings": "'FILL' 1" }}>favorite</span>
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
          <div className="glass-card p-6 rounded-[2rem] relative overflow-hidden group border border-surface-border bg-surface">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all duration-500"></div>
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-2xl filled-icon" style={{ "fontVariationSettings": "'FILL' 1" }}>handshake</span>
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
          <div className="glass-card p-6 rounded-[2rem] relative overflow-hidden group border border-surface-border bg-surface">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/10 rounded-full blur-2xl group-hover:bg-tertiary/20 transition-all duration-500"></div>
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-2xl filled-icon" style={{ "fontVariationSettings": "'FILL' 1" }}>local_hospital</span>
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
            <div className="glass-card p-8 rounded-[2.5rem] border border-surface-border bg-surface">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-2xl font-headline font-bold text-on-surface">Rescue Trends</h2>
                  <p className="text-on-surface-variant text-sm">Platform volume over the last 7 days</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-on-primary">WEEKLY</button>
                  <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-on-surface/5 hover:bg-on-surface/10 transition-colors text-on-surface/60">MONTHLY</button>
                </div>
              </div>
              {/* Sleek Visual Chart Simulation */}
              <div className="relative h-64 w-full flex items-end justify-between px-2 gap-4">
                {/* Background Grid */}
                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-5">
                  <div className="w-full h-px bg-on-surface"></div>
                  <div className="w-full h-px bg-on-surface"></div>
                  <div className="w-full h-px bg-on-surface"></div>
                  <div className="w-full h-px bg-on-surface"></div>
                </div>
                {/* Chart Bars with Gradient */}
                <div className="group relative flex-1 h-[40%] bg-white/5 rounded-t-xl hover:bg-primary/20 transition-all duration-300">
                  <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">42</div>
                </div>
                <div className="group relative flex-1 h-[60%] bg-white/5 rounded-t-xl hover:bg-primary/20 transition-all duration-300">
                  <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">68</div>
                </div>
                <div className="group relative flex-1 h-[45%] bg-white/5 rounded-t-xl hover:bg-primary/20 transition-all duration-300">
                  <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">51</div>
                </div>
                <div className="group relative flex-1 h-[85%] bg-white/5 rounded-t-xl hover:bg-primary/20 transition-all duration-300">
                  <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">94</div>
                </div>
                <div className="group relative flex-1 h-[70%] bg-white/5 rounded-t-xl hover:bg-primary/20 transition-all duration-300 border-x-2 border-t-2 border-primary/40">
                  <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">77</div>
                </div>
                <div className="group relative flex-1 h-[55%] bg-white/5 rounded-t-xl hover:bg-primary/20 transition-all duration-300">
                  <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">59</div>
                </div>
                <div className="group relative flex-1 h-[95%] bg-white/5 rounded-t-xl hover:bg-primary/20 transition-all duration-300">
                  <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent rounded-t-xl"></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded transition-opacity">112</div>
                </div>
              </div>
              <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-on-surface-variant/40 tracking-widest uppercase">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
            {/* User Management Section */}
            <div className="glass-card p-8 rounded-[2.5rem] border border-surface-border bg-surface">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-headline font-bold text-on-surface">Recent Users</h2>
                <button className="text-primary text-sm font-bold hover:underline">View All Users</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-on-surface-variant text-xs uppercase tracking-widest border-b border-surface-border">
                    <tr>
                      <th className="pb-4 font-semibold">User Identity</th>
                      <th className="pb-4 font-semibold text-center">Role</th>
                      <th className="pb-4 font-semibold text-center">Status</th>
                      <th className="pb-4 font-semibold text-right">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-surface-border group hover:bg-on-surface/5 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-on-surface/5 flex items-center justify-center font-bold text-primary">SC</div>
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
                    <tr className="border-b border-surface-border group hover:bg-on-surface/5 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-on-surface/5 flex items-center justify-center font-bold text-secondary">MJ</div>
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
                    <tr className="group hover:bg-on-surface/5 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-on-surface/5 flex items-center justify-center font-bold text-tertiary">LV</div>
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
            <div className="glass-card p-8 rounded-[2.5rem] h-full sticky top-4 overflow-hidden flex flex-col border border-surface-border bg-surface">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-headline font-bold text-on-surface">Rescue Activity</h2>
                <span className="bg-secondary/20 px-2 py-1 rounded-md text-[10px] font-black text-secondary">LIVE</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
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
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white/10 border border-white/20"></div>
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
              </div>
              <div className="mt-8 pt-6 border-t border-surface-border">
                <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-[#008080] text-black font-headline font-bold text-sm tracking-wide shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all">
                  EXPORT REPORT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Contextual FAB - Dashboard Main Action */}
      <button className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary text-black flex items-center justify-center shadow-[0_24px_48px_-12px_rgba(var(--brand-primary-rgb),0.4)] hover:scale-110 active:scale-90 transition-all z-50">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
}
