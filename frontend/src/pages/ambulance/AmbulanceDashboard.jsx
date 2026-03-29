import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { SkeletonCard } from '../../components/Skeleton';
import { formatIndianDateTime } from '../../utils/dateTime';
import { TruckIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

const STATUS_ACTIONS = {
    ambulance_assigned: { label: 'Mark En Route', nextStatus: 'en_route', btnClass: 'btn-primary' },
    en_route: { label: 'Mark Picked Up', nextStatus: 'picked_up', btnClass: 'btn-accent' },
    picked_up: { label: 'Mark Delivered', nextStatus: 'delivered', btnClass: 'btn-primary' },
};

const AmbulanceDashboard = () => {
    const { user } = useAuth();
    const [task, setTask] = useState(null);
    const [pingedTasks, setPingedTasks] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const isIndependent = user?.ambulanceType === 'independent';
    const isLinked = user?.ambulanceType === 'linked';

    const fetchData = useCallback(async () => {
        try {
            console.log('[AmbulanceDashboard] Fetching assigned task, pings, and history...');
            const [taskRes, histRes, pingsRes] = await Promise.all([
                api.get('/ambulance/assigned'),
                api.get('/ambulance/history'),
                api.get('/ambulance/pinged'),
            ]);
            setTask(taskRes.data.task);
            setHistory(histRes.data.history);
            setPingedTasks(pingsRes.data.tasks || []);
            console.log('[AmbulanceDashboard] Task:', taskRes.data.task?._id, 'Pings:', pingsRes.data.count);
        } catch (error) {
            console.error('[AmbulanceDashboard] Fetch error:', error.message);
            toast.error('Failed to load dashboard.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateStatus = async () => {
        if (!task) return;
        const action = STATUS_ACTIONS[task.status];
        if (!action) return;

        setUpdating(true);
        try {
            const { data } = await api.put(`/rescue/${task._id}/status`, { status: action.nextStatus });
            toast.success(`Status updated to: ${data.rescue.status}`);
            if (data.rescue.status === 'completed') {
                setTask(null);
                fetchData();
            } else {
                setTask(data.rescue);
            }
        } catch (error) {
            console.error('[AmbulanceDashboard] Status update error:', error.message);
            toast.error(error.response?.data?.message || 'Failed to update status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleAcceptPing = async (id) => {
        setUpdating(true);
        try {
            const { data } = await api.put(`/ambulance/rescue/${id}/accept-ping`);
            toast.success(data.message);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept dispatch.');
        } finally {
            setUpdating(false);
        }
    };

    const handleRejectPing = async (id) => {
        setUpdating(true);
        try {
            await api.put(`/ambulance/rescue/${id}/reject-ping`);
            toast.success('Dispatch rejected.');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject dispatch.');
        } finally {
            setUpdating(false);
        }
    };

    if (!user.isApproved) {
        if (isNewUI) return (
            <div className="resqpet-obsidian-theme flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-20 h-20 rounded-[2rem] bg-[#ffb77d]/10 flex items-center justify-center text-4xl">⏳</div>
                <div className="space-y-2">
                    <h2 className="font-headline text-3xl font-extrabold text-[#e5e2e1]">Awaiting Approval</h2>
                    <p className="text-[#e5e2e1]/40 max-w-sm">Your ambulance account is under admin review.</p>
                </div>
            </div>
        );
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Awaiting Admin Approval</h2>
                <p className="text-surface-muted max-w-md">Your ambulance account is under review.</p>
            </div>
        );
    }

    if (isNewUI) {
        const currentAction = task ? STATUS_ACTIONS[task.status] : null;
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8 max-w-xl mx-auto">
                <section className="space-y-2 text-center md:text-left">
                    <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">
                        {isLinked ? `Hospital Fleet Unit` : 'Independent Responder'}
                    </span>
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight">Mission <span className="text-[#76d6d5]">Control</span></h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#e5e2e1]/40 text-xs font-medium">
                        <p>Vehicle: <span className="text-[#76d6d5] font-bold">{user?.vehicleNumber || 'Not set'}</span></p>
                        {isLinked && user.linkedHospital && (
                            <p className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                                <span className="material-symbols-outlined text-sm">apartment</span>
                                Linked to: <span className="text-[#e5e2e1] font-bold">{user.linkedHospital.name || 'Your Hospital'}</span>
                            </p>
                        )}
                    </div>
                </section>

                {loading ? (
                    <div className="h-48 rounded-[2rem] bg-white/5 animate-pulse" />
                ) : !task ? (
                    <div className="space-y-6">
                        {pingedTasks.length > 0 && (
                            <div className="glass-card rounded-[2rem] border-2 border-red-500/30 bg-red-500/5 p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" /></span>
                                    <p className="text-xs font-black uppercase tracking-widest text-red-400">Incoming Dispatch</p>
                                </div>
                                {pingedTasks.map((ping) => (
                                    <div key={ping._id} className="space-y-4">
                                        <p className="font-bold text-[#e5e2e1]">{ping.description}</p>
                                        <p className="text-xs text-[#e5e2e1]/40">{ping.location?.address || 'Location provided'}</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleAcceptPing(ping._id)} disabled={updating} className="flex-1 py-4 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50">ACCEPT</button>
                                            <button onClick={() => handleRejectPing(ping._id)} disabled={updating} className="flex-1 py-4 rounded-2xl border border-white/10 text-[#e5e2e1]/40 text-xs font-black uppercase tracking-widest hover:border-white/20 transition-all disabled:opacity-50">Skip</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {pingedTasks.length === 0 && (
                            <div className="glass-card rounded-[3rem] border border-dashed border-white/10 p-16 text-center space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center mx-auto"><TruckIcon className="w-8 h-8 text-[#76d6d5]" /></div>
                                <p className="text-xs font-black uppercase tracking-widest text-white/20">No active assignment.</p>
                                <p className="text-xs text-white/20">You are available. A hospital will dispatch you when needed.</p>
                                <button onClick={fetchData} className="rounded-2xl border border-white/10 px-6 py-2.5 text-xs font-black uppercase text-[#e5e2e1]/30 hover:text-[#76d6d5] transition-all">Refresh</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="glass-card rounded-[2rem] border-2 border-[#76d6d5]/20 bg-[#1c1b1b] p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TruckIcon className="w-5 h-5 text-[#76d6d5]" />
                                    <span className="text-xs font-black uppercase tracking-widest text-[#76d6d5]">Active Dispatch</span>
                                </div>
                                <StatusBadge status={task.status} />
                            </div>
                            <p className="font-bold text-[#e5e2e1]">{task.description}</p>
                            <div className="flex items-center gap-2 text-sm text-[#e5e2e1]/40">
                                <MapPinIcon className="w-4 h-4 text-[#76d6d5] flex-shrink-0" />
                                {task.location?.address || `${task.location?.lat?.toFixed(4)}, ${task.location?.lng?.toFixed(4)}`}
                            </div>
                            {task.images?.[0] && <img src={task.images[0]} alt="rescue" className="w-full h-36 object-cover rounded-2xl opacity-70" />}
                            {currentAction && (
                                <button onClick={handleUpdateStatus} disabled={updating} className="w-full py-4 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50">
                                    {updating ? 'Updating...' : currentAction.label}
                                </button>
                            )}
                        </div>
                        <button onClick={fetchData} className="w-full py-3 rounded-2xl border border-white/5 text-[#e5e2e1]/20 text-xs font-black uppercase tracking-widest hover:text-[#76d6d5] transition-all">Refresh Status</button>
                    </div>
                )}

                {history.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-[#76d6d5]" />
                            <p className="text-xs font-black uppercase tracking-widest text-[#e5e2e1]/40">Completed Rescues</p>
                        </div>
                        <div className="space-y-3">
                            {history.slice(0, 5).map((h) => (
                                <div key={h._id} className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] p-4">
                                    <p className="text-sm font-bold text-[#e5e2e1] truncate">{h.description}</p>
                                    <p className="text-xs text-white/20 mt-1">{formatIndianDateTime(h.completedAt)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            <div>
                <h1 className="page-title">Ambulance Dashboard</h1>
                <p className="page-subtitle">Vehicle: {user?.vehicleNumber || 'Not set'}</p>
            </div>

            {loading ? (
                <SkeletonCard />
            ) : !task ? (
                <div className="space-y-4">
                    {pingedTasks.length > 0 && (
                        <div className="card border-2 border-rose-400 bg-rose-50/50">
                            <div className="flex items-center gap-2 mb-3 text-rose-600 font-bold">Incoming Dispatch</div>
                            {pingedTasks.map((ping) => (
                                <div key={ping._id} className="mb-4 last:mb-0">
                                    <p className="font-semibold text-slate-800 mb-1">{ping.description}</p>
                                    <p className="text-sm text-slate-600 mb-4">Location: {ping.location?.address || 'Location provided'}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAcceptPing(ping._id)} disabled={updating} className="btn bg-rose-600 hover:bg-rose-700 text-white flex-1 py-3 text-lg font-bold">
                                            ACCEPT
                                        </button>
                                        <button onClick={() => handleRejectPing(ping._id)} disabled={updating} className="btn bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 flex-1 py-3 font-semibold">
                                            Skip
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {pingedTasks.length === 0 && (
                        <div className="card text-center py-14">
                            <div className="text-5xl mb-3">OK</div>
                            <p className="text-slate-700 font-semibold text-lg">No Active Assignment</p>
                            <p className="text-surface-muted text-sm mt-1">You are available. A hospital will dispatch you when needed.</p>
                            <button onClick={fetchData} className="btn-outline mt-5">Refresh</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="card border-2 border-primary-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <TruckIcon className="w-5 h-5 text-primary-600" />
                                    <span className="font-bold text-primary-700">Active Dispatch</span>
                                </div>
                                <StatusBadge status={task.status} />
                            </div>

                            <p className="font-semibold text-slate-800 mb-2">{task.description}</p>

                            <div className="space-y-1.5 mb-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPinIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                    <span>{task.location?.address || `${task.location?.lat?.toFixed(4)}, ${task.location?.lng?.toFixed(4)}`}</span>
                                </div>
                            </div>

                            {task.images?.[0] && (
                                <img src={task.images[0]} alt="rescue" className="w-full h-40 object-cover rounded-btn mb-4 border border-surface-border" />
                            )}

                            {STATUS_ACTIONS[task.status] && (
                                <button onClick={handleUpdateStatus} disabled={updating} className={`${STATUS_ACTIONS[task.status].btnClass} w-full btn-lg`}>
                                    {updating ? 'Updating...' : STATUS_ACTIONS[task.status].label}
                                </button>
                            )}
                        </div>
                    </div>

                    <button onClick={fetchData} className="btn-ghost w-full text-sm">Refresh Status</button>
                </div>
            )}

            {history.length > 0 && (
                <div>
                    <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" /> Completed Rescues
                    </h2>
                    <div className="space-y-2">
                        {history.slice(0, 5).map((h) => (
                            <div key={h._id} className="card py-3">
                                <p className="text-sm font-medium text-slate-700 truncate">{h.description}</p>
                                <p className="text-[11px] text-surface-muted mt-0.5">
                                    {formatIndianDateTime(h.completedAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AmbulanceDashboard;
