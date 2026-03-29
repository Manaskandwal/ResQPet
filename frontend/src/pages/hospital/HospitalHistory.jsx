import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { formatIndianDateTime } from '../../utils/dateTime';
import { CheckCircleIcon, ArrowPathIcon, BanknotesIcon, FunnelIcon } from '@heroicons/react/24/outline';

const HospitalHistory = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [outcomeFilter, setOutcomeFilter] = useState('all');
    const [billFilter, setBillFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchHistory = useCallback(async () => {
        try {
            const { data } = await api.get('/hospital/my-cases');
            // Only show closed/completed cases
            const closed = (data.cases || []).filter(c =>
                ['completed', 'closed_unresolved', 'delivered', 'discharged'].includes(c.status) ||
                c.treatmentStatus === 'discharged' || c.treatmentStatus === 'treatment_complete'
            );
            setCases(closed);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load history.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const filteredCases = cases.filter((c) => {
        if (outcomeFilter !== 'all') {
            if (outcomeFilter === 'completed' && !['completed', 'delivered'].includes(c.status)) return false;
            if (outcomeFilter === 'unresolved' && c.status !== 'closed_unresolved') return false;
        }
        if (billFilter !== 'all') {
            if (billFilter === 'billed' && !c.bill?.createdAt) return false;
            if (billFilter === 'unbilled' && !!c.bill?.createdAt) return false;
            if (billFilter === 'paid' && c.bill?.paidStatus !== 'paid') return false;
        }
        if (dateFrom && new Date(c.createdAt) < new Date(dateFrom)) return false;
        if (dateTo && new Date(c.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
        return true;
    });

    const totalBilledAmount = filteredCases.reduce((sum, c) => sum + (c.bill?.totalAmount || 0), 0);
    const billedCount = filteredCases.filter(c => c.bill?.createdAt).length;
    const paidCount = filteredCases.filter(c => c.bill?.paidStatus === 'paid').length;

    return (
        <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Hospital</span>
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight">Case <span className="text-[#76d6d5]">History</span></h1>
                    <p className="text-[#e5e2e1]/40 text-sm">Review all completed and closed cases with billing details.</p>
                </div>
                <button onClick={fetchHistory} className="h-11 w-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all self-start md:self-auto">
                    <ArrowPathIcon className="w-4 h-4 text-[#76d6d5]" />
                </button>
            </section>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Cases', value: filteredCases.length, color: 'text-[#76d6d5]' },
                    { label: 'Cases Billed', value: billedCount, color: 'text-amber-400' },
                    { label: 'Bills Paid', value: paidCount, color: 'text-emerald-400' },
                    { label: 'Total Billed', value: `₹${totalBilledAmount.toFixed(0)}`, color: 'text-[#ffb77d]' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] p-5">
                        <p className={`text-2xl font-headline font-black ${color}`}>{value}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#e5e2e1]/40">
                    <FunnelIcon className="w-4 h-4" /> Filters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Outcome</label>
                        <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#131313] px-3 py-2.5 text-xs text-[#e5e2e1] focus:outline-none focus:border-[#76d6d5]/40 appearance-none">
                            <option value="all">All Outcomes</option>
                            <option value="completed">Completed</option>
                            <option value="unresolved">Closed Unresolved</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Bill Status</label>
                        <select value={billFilter} onChange={(e) => setBillFilter(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#131313] px-3 py-2.5 text-xs text-[#e5e2e1] focus:outline-none focus:border-[#76d6d5]/40 appearance-none">
                            <option value="all">All</option>
                            <option value="billed">Billed</option>
                            <option value="unbilled">Unbilled</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Date Range</label>
                        <div className="flex gap-2">
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                                className="flex-1 rounded-xl border border-white/10 bg-[#131313] px-2 py-2 text-xs text-[#e5e2e1] focus:outline-none focus:border-[#76d6d5]/40" />
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                                className="flex-1 rounded-xl border border-white/10 bg-[#131313] px-2 py-2 text-xs text-[#e5e2e1] focus:outline-none focus:border-[#76d6d5]/40" />
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>
            ) : filteredCases.length === 0 ? (
                <div className="glass-card rounded-[2.5rem] border border-dashed border-white/10 p-16 text-center space-y-3">
                    <CheckCircleIcon className="w-12 h-12 text-[#76d6d5]/20 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-widest text-white/20">No history found for this filter.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredCases.map((c) => (
                        <div key={c._id} className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-5 flex items-center justify-between gap-4 hover:border-white/10 transition-all">
                            <div className="min-w-0 flex-1 space-y-1">
                                <p className="font-bold text-[#e5e2e1] truncate">{c.description}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#e5e2e1]/30">
                                    <span>{c.user?.name}</span>
                                    {c.assignedAmbulance && <span>🚑 {c.assignedAmbulance.vehicleNumber}</span>}
                                    <span>{formatIndianDateTime(c.completedAt || c.closedAt || c.createdAt)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {c.bill?.createdAt && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <BanknotesIcon className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-[9px] font-black uppercase text-amber-400">₹{c.bill.totalAmount}</span>
                                    </div>
                                )}
                                <StatusBadge status={c.status} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HospitalHistory;
