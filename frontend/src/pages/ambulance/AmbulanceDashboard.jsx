import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { formatIndianDateTime } from '../../utils/dateTime';
import {
    TruckIcon, MapPinIcon, ArrowPathIcon, CheckCircleIcon, ClockIcon, HistoryIcon
} from '@heroicons/react/24/outline';

const LOCATION_PING_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

const AMBULANCE_STATUS_LABELS = {
    ambulance_assigned: 'Assignment Accepted',
    en_route: 'En Route to Animal',
    picked_up: 'Animal Picked Up',
    delivered: 'Delivered to Hospital',
    completed: 'Completed',
};

const NEXT_STATUS = {
    ambulance_assigned: 'en_route',
    en_route: 'picked_up',
    picked_up: 'delivered',
};

const STATUS_LABELS = {
    en_route: 'Mark En Route',
    picked_up: 'Mark Picked Up',
    delivered: 'Mark Delivered',
};

const AmbulanceDashboard = () => {
    const { user } = useAuth();
    const [task, setTask] = useState(null);
    const [pings, setPings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState({});
    const [locationSharing, setLocationSharing] = useState(false);
    const [locationError, setLocationError] = useState('');
    const locationIntervalRef = useRef(null);

    const fetchTask = useCallback(async () => {
        try {
            const [taskRes, pingsRes] = await Promise.all([
                api.get('/ambulance/assigned').catch(() => ({ data: { task: null } })),
                api.get('/ambulance/pinged').catch(() => ({ data: { tasks: [] } })),
            ]);
            setTask(taskRes.data.task || null);
            setPings(pingsRes.data.tasks || []);
        } catch (error) {
            console.error('[AmbulanceDashboard] fetchTask error:', error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTask();
        return () => { if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); };
    }, [fetchTask]);

    // ─── Location Ping ───────────────────────────────────────────────────────────
    const pingLocation = useCallback(async () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await api.put('/ambulance/location', { lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationError('');
                } catch (err) {
                    setLocationError('Failed to ping location.');
                }
            },
            (err) => setLocationError(err.message || 'Location access denied.'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    const startLocationSharing = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported.'); return; }
        setLocationSharing(true);
        pingLocation(); // immediate first ping
        locationIntervalRef.current = setInterval(pingLocation, LOCATION_PING_INTERVAL_MS);
        toast.success('Location sharing started — pinging every 2 minutes.');
    };

    const stopLocationSharing = () => {
        if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
        setLocationSharing(false);
        toast.success('Location sharing stopped.');
    };

    // ─── Ping Accept / Reject ────────────────────────────────────────────────────
    const handleAcceptPing = async (id) => {
        setActing((p) => ({ ...p, [id]: 'accept' }));
        try {
            const { data } = await api.put(`/ambulance/rescue/${id}/accept-ping`);
            toast.success('Dispatch accepted!');
            setTask(data.rescue);
            setPings([]);
            // Auto-start location sharing
            startLocationSharing();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept dispatch.');
        } finally {
            setActing((p) => ({ ...p, [id]: false }));
        }
    };

    const handleRejectPing = async (id) => {
        setActing((p) => ({ ...p, [id]: 'reject' }));
        try {
            await api.put(`/ambulance/rescue/${id}/reject-ping`);
            toast.success('Dispatch skipped.');
            setPings((p) => p.filter((t) => t._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to skip dispatch.');
        } finally {
            setActing((p) => ({ ...p, [id]: false }));
        }
    };

    // ─── Status Update ───────────────────────────────────────────────────────────
    const handleStatusUpdate = async (rescueId, newStatus) => {
        setActing((p) => ({ ...p, [rescueId]: 'status' }));
        try {
            const { data } = await api.put(`/ambulance/rescue/${rescueId}/status`, { status: newStatus });
            toast.success(`Status updated: ${AMBULANCE_STATUS_LABELS[newStatus] || newStatus}`);
            setTask(data.rescue);
            if (['completed', 'delivered'].includes(newStatus)) {
                stopLocationSharing();
                fetchTask();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status.');
        } finally {
            setActing((p) => ({ ...p, [rescueId]: false }));
        }
    };

    // ─── Awaiting Approval ───────────────────────────────────────────────────────
    if (!user.isApproved) return (
        <div className="resqpet-obsidian-theme flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-20 h-20 rounded-[2rem] bg-[#ffb77d]/10 flex items-center justify-center text-4xl">⏳</div>
            <div className="space-y-2">
                <h2 className="font-headline text-3xl font-extrabold text-[#e5e2e1]">Awaiting Approval</h2>
                <p className="text-[#e5e2e1]/40 max-w-sm">Your ambulance account is under admin review. You'll be notified once approved.</p>
            </div>
        </div>
    );

    return (
        <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Ambulance</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${user.ambulanceType === 'linked' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                            {user.ambulanceType === 'linked' ? 'Fleet Unit' : 'Independent'}
                        </span>
                        {user.vehicleNumber && <span className="text-[10px] font-mono text-[#e5e2e1]/30">{user.vehicleNumber}</span>}
                    </div>
                    <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">
                        Dispatch <span className="text-[#76d6d5]">Control</span>
                    </h1>
                    <p className="text-[#e5e2e1]/40 text-sm">Manage assigned dispatches and share live location.</p>
                </div>
                <button onClick={fetchTask} className="h-11 w-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all self-start md:self-auto">
                    <ArrowPathIcon className="w-4 h-4 text-[#76d6d5]" />
                </button>
            </section>

            {/* Location Sharing Toggle */}
            <div className={`glass-card rounded-[2rem] border p-6 transition-all ${locationSharing ? 'border-[#76d6d5]/30 bg-[#76d6d5]/5' : 'border-white/5 bg-[#1c1b1b]'}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${locationSharing ? 'bg-[#76d6d5]/20' : 'bg-white/5'}`}>
                            <MapPinIcon className={`w-6 h-6 ${locationSharing ? 'text-[#76d6d5]' : 'text-white/20'}`} />
                            {locationSharing && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#76d6d5] border-2 border-[#131313] animate-pulse" />
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-sm text-[#e5e2e1]">
                                {locationSharing ? 'Location Sharing Active' : 'Location Sharing Off'}
                            </p>
                            <p className="text-[10px] text-[#e5e2e1]/40 mt-0.5">
                                {locationSharing ? 'Pinging hospital every 2 minutes' : 'Turn on when on an active dispatch'}
                            </p>
                            {locationError && <p className="text-[10px] text-red-400 mt-0.5">{locationError}</p>}
                        </div>
                    </div>
                    <button
                        onClick={locationSharing ? stopLocationSharing : startLocationSharing}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${locationSharing
                            ? 'bg-red-500/10 border border-red-400/20 text-red-400 hover:bg-red-500/20'
                            : 'bg-[#76d6d5] text-[#131313] hover:scale-105'}`}>
                        {locationSharing ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>

            {/* Quick Link: History */}
            <Link to="/ambulance/history"
                className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] p-4 flex items-center gap-3 hover:border-white/10 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                    <span className="text-xs font-black uppercase tracking-wider text-[#e5e2e1]/60 group-hover:text-[#e5e2e1] transition-colors">My Trip History</span>
                    <p className="text-[9px] text-white/30 mt-0.5">View past completed dispatches and stats.</p>
                </div>
                <span className="text-white/20 text-lg">›</span>
            </Link>

            {loading ? (
                <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-40 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>
            ) : (
                <>
                    {/* Active Assignment */}
                    {task && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#76d6d5]">Active Assignment</p>
                            <div className="glass-card rounded-[2rem] border border-[#76d6d5]/20 bg-[#76d6d5]/5 p-6 space-y-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1.5 min-w-0 flex-1">
                                        <p className="font-bold text-[#e5e2e1]">{task.description}</p>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#e5e2e1]/40">
                                            <span>👤 {task.user?.name}</span>
                                            {task.user?.phone && <span>📞 {task.user.phone}</span>}
                                        </div>
                                        {task.assignedHospital && (
                                            <div className="flex items-center gap-1.5 text-xs text-[#76d6d5]/60">
                                                <span className="material-symbols-outlined text-sm">local_hospital</span>
                                                {task.assignedHospital.orgName || task.assignedHospital.name}
                                            </div>
                                        )}
                                    </div>
                                    <StatusBadge status={task.status} />
                                </div>

                                {/* Progress Steps */}
                                <div className="flex items-center gap-2">
                                    {['ambulance_assigned', 'en_route', 'picked_up', 'delivered'].map((step, idx) => {
                                        const stepOrder = ['ambulance_assigned', 'en_route', 'picked_up', 'delivered'];
                                        const currentIdx = stepOrder.indexOf(task.status);
                                        const done = idx <= currentIdx;
                                        return (
                                            <div key={step} className="flex items-center gap-2 flex-1">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? 'bg-[#76d6d5]' : 'bg-white/10'}`} />
                                                {idx < 3 && <div className={`h-px flex-1 ${idx < currentIdx ? 'bg-[#76d6d5]/50' : 'bg-white/10'}`} />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-[#76d6d5] font-bold">{AMBULANCE_STATUS_LABELS[task.status] || task.status}</p>

                                {/* Update Button */}
                                {NEXT_STATUS[task.status] && (
                                    <button
                                        onClick={() => handleStatusUpdate(task._id, NEXT_STATUS[task.status])}
                                        disabled={!!acting[task._id]}
                                        className="w-full py-3.5 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
                                    >
                                        {acting[task._id] === 'status' ? 'Updating...' : STATUS_LABELS[NEXT_STATUS[task.status]]}
                                    </button>
                                )}
                                {task.status === 'delivered' || task.status === 'completed' ? (
                                    <div className="text-center text-xs text-emerald-400 font-bold">✓ Assignment Complete</div>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {/* Pending Pings */}
                    {pings.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">Incoming Dispatches ({pings.length})</p>
                            {pings.map((ping) => (
                                <div key={ping._id} className="glass-card rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-[#e5e2e1]">{ping.description}</p>
                                            <p className="text-xs text-[#e5e2e1]/40 mt-1">{ping.user?.name}</p>
                                            <div className="flex items-center gap-1.5 text-[10px] text-amber-400/60 mt-1">
                                                <span className="material-symbols-outlined text-sm">local_hospital</span>
                                                {ping.assignedHospital?.orgName || ping.assignedHospital?.name}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/20">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">New Dispatch</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAcceptPing(ping._id)}
                                            disabled={!!acting[ping._id] || !!task}
                                            className="flex-[2] py-3 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-40"
                                        >
                                            {acting[ping._id] === 'accept' ? 'Accepting...' : task ? 'Already on a Mission' : '✓ Accept Dispatch'}
                                        </button>
                                        <button
                                            onClick={() => handleRejectPing(ping._id)}
                                            disabled={!!acting[ping._id]}
                                            className="flex-1 py-3 rounded-2xl border border-white/10 text-[#e5e2e1]/40 text-xs font-black uppercase tracking-widest hover:border-red-400/30 hover:text-red-400 transition-all disabled:opacity-50"
                                        >
                                            {acting[ping._id] === 'reject' ? '...' : 'Skip'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Idle State */}
                    {!task && pings.length === 0 && (
                        <div className="glass-card rounded-[2.5rem] border border-dashed border-white/10 p-16 text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center mx-auto">
                                <TruckIcon className="w-8 h-8 text-[#76d6d5]" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-white/20">Standing By</p>
                            <p className="text-xs text-white/20">No active assignment or incoming dispatches right now.</p>
                            <button onClick={fetchTask} className="rounded-2xl border border-white/10 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#e5e2e1]/40 hover:text-[#76d6d5] hover:border-[#76d6d5]/20 transition-all">
                                Refresh
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AmbulanceDashboard;
