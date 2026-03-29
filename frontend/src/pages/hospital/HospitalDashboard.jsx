import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { formatIndianDateTime } from '../../utils/dateTime';
import {
    BuildingOffice2Icon, TruckIcon, ClipboardDocumentListIcon,
    BanknotesIcon, ArrowPathIcon, MapPinIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';

const HospitalDashboard = () => {
    const { user } = useAuth();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState({});
    const [locationRequired, setLocationRequired] = useState(false);
    const [locationSaving, setLocationSaving] = useState(false);
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');
    const [locationError, setLocationError] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const isGovt = user?.isGovernment;

    const fetchData = useCallback(async () => {
        try {
            const { data } = await api.get('/hospital/escalated');
            setCases(data.cases || []);
            setLocationRequired(false);
            setLocationError('');
            setErrorMsg('');
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to load dashboard data.';
            if (error.response?.status === 400 && message?.toLowerCase().includes('location')) {
                setLocationRequired(true);
                setLocationError(message);
            } else {
                setErrorMsg(message);
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const saveLocation = async (lat, lng) => {
        setLocationSaving(true);
        try {
            await api.put('/user/profile', { location: { lat, lng } });
            toast.success('Location updated.');
            setLocationRequired(false);
            setLocationError('');
            setManualLat('');
            setManualLng('');
            setLoading(true);
            await fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update location.');
        } finally {
            setLocationSaving(false);
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported.'); return; }
        setLocationSaving(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => { await saveLocation(pos.coords.latitude, pos.coords.longitude); },
            (err) => { setLocationSaving(false); toast.error(err?.message || 'Failed to fetch location.'); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleManualSave = () => {
        const lat = Number(manualLat);
        const lng = Number(manualLng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) { toast.error('Please enter valid coordinates.'); return; }
        saveLocation(lat, lng);
    };

    const handleAcceptCase = async (id) => {
        setActing((p) => ({ ...p, [id]: 'accept' }));
        try {
            const { data } = await api.put(`/hospital/rescue/${id}/accept-broadcast`);
            toast.success(data.message);
            setCases((p) => p.filter((c) => c._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to claim case.');
        } finally {
            setActing((p) => ({ ...p, [id]: false }));
        }
    };

    const handleRejectCase = async (id) => {
        setActing((p) => ({ ...p, [id]: 'reject' }));
        try {
            const { data } = await api.put(`/hospital/rescue/${id}/reject-broadcast`);
            toast.success(data.message);
            setCases((p) => p.filter((c) => c._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject case.');
        } finally {
            setActing((p) => ({ ...p, [id]: false }));
        }
    };

    // ─── Awaiting Approval ──────────────────────────────────────────────────────
    if (!user.isApproved) return (
        <div className="resqpet-obsidian-theme flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-20 h-20 rounded-[2rem] bg-[#ffb77d]/10 flex items-center justify-center text-4xl">⏳</div>
            <div className="space-y-2">
                <h2 className="font-headline text-3xl font-extrabold text-[#e5e2e1]">Awaiting Approval</h2>
                <p className="text-[#e5e2e1]/40 max-w-sm">Your hospital account is under admin review. You'll be notified once approved.</p>
            </div>
        </div>
    );

    // ─── Location Setup ─────────────────────────────────────────────────────────
    if (locationRequired) return (
        <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
            <section className="space-y-2">
                <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Hospital Setup</span>
                <h1 className="font-headline text-4xl font-extrabold tracking-tight">Set Your <span className="text-[#76d6d5]">Base Location</span></h1>
                <p className="text-[#e5e2e1]/40">{locationError || 'Location is required to view nearby escalations.'}</p>
            </section>
            <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-4 max-w-md">
                <button onClick={handleUseCurrentLocation} disabled={locationSaving}
                    className="w-full py-3 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50">
                    {locationSaving ? 'Saving...' : '📍 Use Current Location'}
                </button>
                <div className="relative flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">or enter manually</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input value={manualLat} onChange={(e) => setManualLat(e.target.value)} placeholder="Latitude"
                        className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-xs text-[#e5e2e1] placeholder:text-[#e5e2e1]/30 focus:outline-none focus:border-[#76d6d5]/40" />
                    <input value={manualLng} onChange={(e) => setManualLng(e.target.value)} placeholder="Longitude"
                        className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-xs text-[#e5e2e1] placeholder:text-[#e5e2e1]/30 focus:outline-none focus:border-[#76d6d5]/40" />
                </div>
                <button onClick={handleManualSave} disabled={locationSaving}
                    className="w-full py-3 rounded-2xl border border-white/10 text-[#e5e2e1]/40 text-xs font-black uppercase tracking-widest hover:text-[#76d6d5] hover:border-[#76d6d5]/20 transition-all disabled:opacity-50">
                    Save Coordinates
                </button>
            </div>
        </div>
    );

    // ─── Main Dashboard ─────────────────────────────────────────────────────────
    return (
        <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Hospital Control</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${isGovt ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                            {isGovt ? 'Government' : 'Private'}
                        </span>
                    </div>
                    <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">
                        Incoming <span className="text-[#76d6d5]">Broadcasts</span>
                    </h1>
                    <p className="text-[#e5e2e1]/40 text-sm">Escalated cases requiring hospital admission near you.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] px-5 py-3 text-center">
                        <p className="text-2xl font-headline font-black text-[#76d6d5]">{cases.length}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Active</p>
                    </div>
                    <button onClick={fetchData}
                        className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                        <ArrowPathIcon className="w-4 h-4 text-[#76d6d5]" />
                    </button>
                </div>
            </section>

            {/* Quick Nav */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { to: '/hospital/cases', icon: ClipboardDocumentListIcon, label: 'My Cases', color: 'text-[#76d6d5]', bg: 'bg-[#76d6d5]/10' },
                    { to: '/hospital/fleet', icon: TruckIcon, label: 'Fleet', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { to: '/hospital/billing', icon: BanknotesIcon, label: 'Billing', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { to: '/hospital/history', icon: CheckCircleIcon, label: 'History', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map(({ to, icon: Icon, label, color, bg }) => (
                    <Link key={to} to={to}
                        className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] p-4 flex items-center gap-3 hover:border-white/10 transition-all group">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-[#e5e2e1]/60 group-hover:text-[#e5e2e1] transition-colors">{label}</span>
                    </Link>
                ))}
            </div>

            {/* Error */}
            {errorMsg && (
                <div className="glass-card rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-300 flex items-center justify-between gap-3">
                    <span>{errorMsg}</span>
                    <button onClick={fetchData} className="px-3 py-1.5 rounded-xl border border-red-400/20 text-[10px] font-black uppercase tracking-widest hover:border-red-400/40">Retry</button>
                </div>
            )}

            {/* Cases */}
            {loading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-40 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>
            ) : cases.length === 0 ? (
                <div className="glass-card rounded-[2.5rem] border border-dashed border-white/10 p-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center mx-auto">
                        <BuildingOffice2Icon className="w-8 h-8 text-[#76d6d5]" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-white/20">No escalated cases nearby.</p>
                    <p className="text-xs text-white/20">Cases requiring hospital care will appear here when escalated.</p>
                    <button onClick={fetchData} className="rounded-2xl border border-white/10 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#e5e2e1]/40 hover:text-[#76d6d5] hover:border-[#76d6d5]/20 transition-all">
                        Refresh
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    {cases.map((c) => (
                        <div key={c._id} className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-4 hover:border-white/10 transition-all">
                            {/* Case Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <p className="font-bold text-[#e5e2e1] truncate">{c.description}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#e5e2e1]/30">
                                        <span>{c.user?.name}</span>
                                        {Number.isFinite(c.distance) && (
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-3 h-3 text-[#76d6d5]" />
                                                {c.distance.toFixed(1)} km away
                                            </span>
                                        )}
                                        <span>Escalated {formatIndianDateTime(c.escalatedAt)}</span>
                                    </div>
                                    {c.transportType && c.transportType !== 'na' && (
                                        <div className={`mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-xl w-fit border text-[9px] font-black uppercase tracking-widest ${c.transportType === 'self' ? 'bg-[#ffb77d]/10 border-[#ffb77d]/20 text-[#ffb77d]' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                            <span className="material-symbols-outlined text-sm">{c.transportType === 'self' ? 'person' : 'ambulance'}</span>
                                            {c.transportType === 'self' ? 'NGO Self Transport' : 'Ambulance Requested'}
                                        </div>
                                    )}
                                </div>
                                <StatusBadge status={c.status} />
                            </div>

                            {/* Image */}
                            {c.images?.[0] && (
                                <img src={c.images[0]} alt="rescue" className="w-full h-36 object-cover rounded-2xl opacity-70" />
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAcceptCase(c._id)}
                                    disabled={!!acting[c._id]}
                                    className="flex-[2] py-3 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <BuildingOffice2Icon className="w-4 h-4" />
                                    {acting[c._id] === 'accept' ? 'Claiming...' : 'Accept & Dispatch'}
                                </button>
                                <button
                                    onClick={() => handleRejectCase(c._id)}
                                    disabled={!!acting[c._id]}
                                    className="flex-1 py-3 rounded-2xl border border-white/10 text-[#e5e2e1]/40 text-xs font-black uppercase tracking-widest hover:border-red-400/30 hover:text-red-400 transition-all disabled:opacity-50"
                                >
                                    {acting[c._id] === 'reject' ? 'Rejecting...' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HospitalDashboard;
