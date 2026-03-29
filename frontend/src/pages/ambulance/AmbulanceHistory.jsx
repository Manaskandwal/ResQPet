import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { formatIndianDateTime } from '../../utils/dateTime';
import { TruckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const AmbulanceHistory = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const fetchHistory = useCallback(async () => {
        try {
            const { data } = await api.get('/ambulance/history');
            setHistory(data.history || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load history.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const paginated = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(history.length / PAGE_SIZE);

    const thisMonthCount = history.filter(c => {
        const d = new Date(c.completedAt || c.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const govtCount = history.filter(c => c.assignedHospital?.isGovernment).length;
    const privateCount = history.length - govtCount;

    return (
        <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Ambulance</span>
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight">My <span className="text-[#76d6d5]">History</span></h1>
                    <p className="text-[#e5e2e1]/40 text-sm">All completed dispatches and transport missions.</p>
                </div>
                <button onClick={fetchHistory} className="h-11 w-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all self-start md:self-auto">
                    <ArrowPathIcon className="w-4 h-4 text-[#76d6d5]" />
                </button>
            </section>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Trips', value: history.length, color: 'text-[#76d6d5]' },
                    { label: 'This Month', value: thisMonthCount, color: 'text-[#ffb77d]' },
                    { label: 'Govt Cases', value: govtCount, color: 'text-blue-400' },
                    { label: 'Private Cases', value: privateCount, color: 'text-amber-400' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] p-5">
                        <p className={`text-2xl font-headline font-black ${color}`}>{value}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>
            ) : history.length === 0 ? (
                <div className="glass-card rounded-[2.5rem] border border-dashed border-white/10 p-16 text-center space-y-3">
                    <TruckIcon className="w-12 h-12 text-[#76d6d5]/20 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-widest text-white/20">No completed trips yet.</p>
                    <p className="text-xs text-white/20">Completed dispatches will appear here.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {paginated.map((c) => (
                            <div key={c._id} className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-5 flex items-center justify-between gap-4 hover:border-white/10 transition-all">
                                <div className="min-w-0 flex-1 space-y-1">
                                    <p className="font-bold text-[#e5e2e1] truncate">{c.description}</p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#e5e2e1]/30">
                                        <span>👤 {c.user?.name}</span>
                                        {c.assignedHospital && (
                                            <span>🏥 {c.assignedHospital.orgName || c.assignedHospital.name}</span>
                                        )}
                                        <span>🗓 {formatIndianDateTime(c.completedAt || c.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {c.assignedHospital?.isGovernment && (
                                        <span className="px-2 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400">Govt</span>
                                    )}
                                    <StatusBadge status={c.status} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-white/40 hover:text-[#76d6d5] hover:border-[#76d6d5]/20 transition-all disabled:opacity-30">
                                ‹ Prev
                            </button>
                            <span className="text-xs text-white/30 font-bold">{page} / {totalPages}</span>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-white/40 hover:text-[#76d6d5] hover:border-[#76d6d5]/20 transition-all disabled:opacity-30">
                                Next ›
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AmbulanceHistory;
