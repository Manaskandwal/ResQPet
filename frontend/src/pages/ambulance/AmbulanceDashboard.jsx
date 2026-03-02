import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { SkeletonCard } from '../../components/Skeleton';
import { TruckIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const STATUS_ACTIONS = {
    ambulance_assigned: { label: '🚗 Mark En Route', nextStatus: 'en_route', btnClass: 'btn-primary' },
    en_route: { label: '📦 Mark Picked Up', nextStatus: 'picked_up', btnClass: 'btn-accent' },
    picked_up: { label: '✅ Mark Delivered', nextStatus: 'delivered', btnClass: 'btn-primary' },
};

const AmbulanceDashboard = () => {
    const { user } = useAuth();
    const [task, setTask] = useState(null);
    const [pingedTasks, setPingedTasks] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

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

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpdateStatus = async () => {
        if (!task) return;
        const action = STATUS_ACTIONS[task.status];
        if (!action) return;

        setUpdating(true);
        try {
            console.log('[AmbulanceDashboard] Updating status to:', action.nextStatus, 'for rescue:', task._id);
            const { data } = await api.put(`/rescue/${task._id}/status`, { status: action.nextStatus });
            toast.success(`Status updated to: ${data.rescue.status} 🎉`);
            if (data.rescue.status === 'completed') {
                toast.success('Rescue completed! You are now available for next dispatch.');
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
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Awaiting Admin Approval</h2>
                <p className="text-surface-muted max-w-md">Your ambulance account is under review.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            <div>
                <h1 className="page-title">Ambulance Dashboard 🚑</h1>
                <p className="page-subtitle">Vehicle: {user?.vehicleNumber || 'Not set'}</p>
            </div>

            {loading ? (
                <SkeletonCard />
            ) : !task ? (
                <div className="space-y-4">
                    {pingedTasks.length > 0 && (
                        <div className="card border-2 border-rose-400 bg-rose-50/50">
                            <div className="flex items-center gap-2 mb-3 text-rose-600 font-bold">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                </span>
                                🚨 INCOMING DISPATCH
                            </div>
                            {pingedTasks.map(ping => (
                                <div key={ping._id} className="mb-4 last:mb-0">
                                    <p className="font-semibold text-slate-800 mb-1">{ping.description}</p>
                                    <p className="text-sm text-slate-600 mb-4">📍 {ping.location?.address || 'Location provided'}</p>
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
                            <div className="text-5xl mb-3">✅</div>
                            <p className="text-slate-700 font-semibold text-lg">No Active Assignment</p>
                            <p className="text-surface-muted text-sm mt-1">
                                You are available. A hospital will dispatch you when needed.
                            </p>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
                                Available for dispatch
                            </div>
                            <button onClick={fetchData} className="btn-outline mt-5">🔄 Refresh</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Active task card */}
                    <div className="card border-2 border-primary-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full opacity-60" />
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
                                {task.user && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <span>👤</span>
                                        <span>{task.user.name}
                                            {task.user.phone && (
                                                <a href={`tel:${task.user.phone}`} className="text-primary-600 ml-2 hover:underline">{task.user.phone}</a>
                                            )}
                                        </span>
                                    </div>
                                )}
                                {task.assignedHospital && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <span>🏥</span>
                                        <span>{task.assignedHospital.orgName || task.assignedHospital.name}</span>
                                    </div>
                                )}
                            </div>

                            {task.images?.[0] && (
                                <img src={task.images[0]} alt="rescue" className="w-full h-40 object-cover rounded-btn mb-4 border border-surface-border" />
                            )}

                            {/* Status action button */}
                            {STATUS_ACTIONS[task.status] && (
                                <button onClick={handleUpdateStatus} disabled={updating} className={`${STATUS_ACTIONS[task.status].btnClass} w-full btn-lg`}>
                                    {updating ? (
                                        <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Updating...</>
                                    ) : STATUS_ACTIONS[task.status].label}
                                </button>
                            )}
                        </div>
                    </div>

                    <button onClick={fetchData} className="btn-ghost w-full text-sm">🔄 Refresh Status</button>
                </div>
            )}

            {/* Completed history */}
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
                                    ✅ {h.completedAt ? new Date(h.completedAt).toLocaleString() : 'N/A'}
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
