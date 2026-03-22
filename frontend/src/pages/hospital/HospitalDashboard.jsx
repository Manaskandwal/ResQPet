import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { SkeletonCard } from '../../components/Skeleton';
import { formatIndianDateTime } from '../../utils/dateTime';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

const HospitalDashboard = () => {
    const { user } = useAuth();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState({});

    const fetchData = useCallback(async () => {
        try {
            console.log('[HospitalDashboard] Fetching broadcasted cases...');
            const { data } = await api.get('/hospital/escalated');
            setCases(data.cases || []);
            console.log('[HospitalDashboard] Cases loaded:', data.count || 0);
        } catch (error) {
            console.error('[HospitalDashboard] Fetch error:', error.message);
            toast.error('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAcceptCase = async (id) => {
        setActing((prev) => ({ ...prev, [id]: true }));
        try {
            const { data } = await api.put(`/hospital/rescue/${id}/accept-broadcast`);
            toast.success(data.message);
            setCases((prev) => prev.filter((c) => c._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to claim case.');
        } finally {
            setActing((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleRejectCase = async (id) => {
        setActing((prev) => ({ ...prev, [id]: 'reject' }));
        try {
            const { data } = await api.put(`/hospital/rescue/${id}/reject-broadcast`);
            toast.success(data.message);
            setCases((prev) => prev.filter((c) => c._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject case.');
        } finally {
            setActing((prev) => ({ ...prev, [id]: false }));
        }
    };

    if (!user.isApproved) {
        if (isNewUI) return (
            <div className="resqpet-obsidian-theme flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-20 h-20 rounded-[2rem] bg-[#ffb77d]/10 flex items-center justify-center text-4xl">⏳</div>
                <div className="space-y-2">
                    <h2 className="font-headline text-3xl font-extrabold text-[#e5e2e1]">Awaiting Approval</h2>
                    <p className="text-[#e5e2e1]/40 max-w-sm">Your hospital account is under admin review. You'll be notified once approved.</p>
                </div>
            </div>
        );
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Awaiting Admin Approval</h2>
                <p className="text-surface-muted max-w-md">Your hospital account is under review.</p>
            </div>
        );
    }

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
                <section className="flex items-end justify-between gap-4">
                    <div className="space-y-2">
                        <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Hospital</span>
                        <h1 className="font-headline text-4xl font-extrabold tracking-tight">Case <span className="text-[#76d6d5]">Broadcasts</span></h1>
                        <p className="text-[#e5e2e1]/40">Escalated cases needing ambulance dispatch.</p>
                    </div>
                    <div className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] px-6 py-4 text-center">
                        <p className="text-3xl font-headline font-black text-[#76d6d5]">{cases.length}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 mt-1">Broadcasts</p>
                    </div>
                </section>

                {loading ? (
                    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>
                ) : cases.length === 0 ? (
                    <div className="glass-card rounded-[3rem] border border-dashed border-white/10 p-16 text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center text-3xl mx-auto"><BuildingOffice2Icon className="w-8 h-8 text-[#76d6d5]" /></div>
                        <p className="text-xs font-black uppercase tracking-widest text-white/20">No escalated cases nearby.</p>
                        <button onClick={fetchData} className="rounded-2xl border border-white/10 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#e5e2e1]/40 hover:text-[#76d6d5] hover:border-[#76d6d5]/20 transition-all">Refresh</button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {cases.map((c) => (
                            <div key={c._id} className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p className="font-bold text-[#e5e2e1] truncate">{c.description}</p>
                                        <p className="text-xs text-[#e5e2e1]/30">
                                            {c.user?.name} · {Number.isFinite(c.distance) ? `${c.distance.toFixed(1)} km away` : ''} · Escalated {formatIndianDateTime(c.escalatedAt)}
                                        </p>
                                    </div>
                                    <StatusBadge status={c.status} />
                                </div>
                                {c.images?.[0] && <img src={c.images[0]} alt="rescue" className="w-full h-36 object-cover rounded-2xl opacity-70" />}
                                <div className="flex gap-3">
                                    <button onClick={() => handleAcceptCase(c._id)} disabled={!!acting[c._id]} className="flex-1 py-3 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        <BuildingOffice2Icon className="w-4 h-4" />{acting[c._id] === true ? 'Claiming...' : 'Accept & Dispatch'}
                                    </button>
                                    <button onClick={() => handleRejectCase(c._id)} disabled={!!acting[c._id]} className="px-5 py-3 rounded-2xl border border-white/10 text-[#e5e2e1]/40 text-xs font-black uppercase tracking-widest hover:border-red-400/30 hover:text-red-400 transition-all disabled:opacity-50">Reject</button>
                                </div>
                            </div>
                        ))}
                        <button onClick={fetchData} className="w-full py-3 rounded-2xl border border-white/5 text-[#e5e2e1]/20 text-xs font-black uppercase tracking-widest hover:text-[#76d6d5] transition-all">Refresh</button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">Hospital Dashboard</h1>
                <p className="page-subtitle">Escalated cases needing ambulance dispatch</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div className="stat-card">
                    <div className="w-10 h-10 bg-orange-50 rounded-btn flex items-center justify-center mb-1">
                        <BuildingOffice2Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="stat-value">{cases.length}</p>
                    <p className="stat-label">Broadcasts Nearby</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
            ) : cases.length === 0 ? (
                <div className="card text-center py-14">
                    <div className="text-5xl mb-3">OK</div>
                    <p className="text-slate-700 font-semibold text-lg">No escalated cases nearby.</p>
                    <p className="text-surface-muted text-sm mt-1">All clear. Cases requiring hospitals will appear here.</p>
                    <button onClick={fetchData} className="btn-outline mt-4">Refresh</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {cases.map((c) => (
                        <div key={c._id} className="card-hover">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{c.description}</p>
                                    <p className="text-xs text-surface-muted mt-0.5">
                                        User: {c.user?.name} · Distance: {Number.isFinite(c.distance) ? `${c.distance.toFixed(1)} km` : 'N/A'} ·
                                        {' '}Escalated: {formatIndianDateTime(c.escalatedAt)}
                                    </p>
                                </div>
                                <StatusBadge status={c.status} />
                            </div>
                            {c.images?.[0] && (
                                <img src={c.images[0]} alt="rescue" className="w-full h-36 object-cover rounded-btn mb-3 border border-surface-border" />
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAcceptCase(c._id)}
                                    disabled={!!acting[c._id]}
                                    className="btn w-full border-0 bg-indigo-500 text-white hover:bg-indigo-600"
                                >
                                    <BuildingOffice2Icon className="w-4 h-4" />
                                    {acting[c._id] === true ? 'Claiming Case...' : 'Accept & Dispatch Ambulance'}
                                </button>
                                <button
                                    onClick={() => handleRejectCase(c._id)}
                                    disabled={!!acting[c._id]}
                                    className="btn-outline whitespace-nowrap"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={fetchData} className="btn-ghost w-full text-sm">Refresh</button>
                </div>
            )}
        </div>
    );
};

export default HospitalDashboard;
