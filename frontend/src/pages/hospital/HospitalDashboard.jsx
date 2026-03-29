import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { SkeletonCard } from '../../components/Skeleton';
import { formatIndianDateTime } from '../../utils/dateTime';
import { BuildingOffice2Icon, TruckIcon, UsersIcon } from '@heroicons/react/24/outline';

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

const HospitalDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState({});
    const [locationRequired, setLocationRequired] = useState(false);
    const [locationSaving, setLocationSaving] = useState(false);
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');
    const [locationError, setLocationError] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = useCallback(async () => {
        try {
            console.log('[HospitalDashboard] Fetching broadcasted cases...');
            const { data } = await api.get('/hospital/escalated');
            setCases(data.cases || []);
            setLocationRequired(false);
            setLocationError('');
            setErrorMsg('');
            console.log('[HospitalDashboard] Cases loaded:', data.count || 0);
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to load dashboard data.';
            console.error('[HospitalDashboard] Fetch error:', message);
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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            const message = error.response?.data?.message || 'Failed to update location.';
            toast.error(message);
        } finally {
            setLocationSaving(false);
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported in this browser.');
            return;
        }
        setLocationSaving(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                await saveLocation(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => {
                setLocationSaving(false);
                toast.error(err?.message || 'Failed to fetch location.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleManualSave = () => {
        const lat = Number(manualLat);
        const lng = Number(manualLng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            toast.error('Please enter valid latitude and longitude.');
            return;
        }
        saveLocation(lat, lng);
    };

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

    if (locationRequired) {
        if (isNewUI) {
            return (
                <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
                    <section className="space-y-2">
                        <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Hospital</span>
                        <h1 className="font-headline text-4xl font-extrabold tracking-tight">Set Your <span className="text-[#76d6d5]">Base Location</span></h1>
                        <p className="text-[#e5e2e1]/40">
                            {locationError || 'Location is required to view nearby escalations.'}
                        </p>
                    </section>

                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-4">
                        <button
                            onClick={handleUseCurrentLocation}
                            disabled={locationSaving}
                            className="w-full py-3 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                            {locationSaving ? 'Saving Location...' : 'Use Current Location'}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                value={manualLat}
                                onChange={(e) => setManualLat(e.target.value)}
                                placeholder="Latitude"
                                className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-xs text-[#e5e2e1] placeholder:text-[#e5e2e1]/30 focus:outline-none focus:border-[#76d6d5]/40"
                            />
                            <input
                                value={manualLng}
                                onChange={(e) => setManualLng(e.target.value)}
                                placeholder="Longitude"
                                className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-xs text-[#e5e2e1] placeholder:text-[#e5e2e1]/30 focus:outline-none focus:border-[#76d6d5]/40"
                            />
                        </div>
                        <button
                            onClick={handleManualSave}
                            disabled={locationSaving}
                            className="w-full py-3 rounded-2xl border border-white/10 text-[#e5e2e1]/40 text-xs font-black uppercase tracking-widest hover:text-[#76d6d5] hover:border-[#76d6d5]/20 transition-all disabled:opacity-50"
                        >
                            Save Manual Coordinates
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="page-title">Set Hospital Location</h1>
                    <p className="page-subtitle">{locationError || 'Location is required to view nearby escalations.'}</p>
                </div>
                <div className="card space-y-4">
                    <button className="btn w-full" onClick={handleUseCurrentLocation} disabled={locationSaving}>
                        {locationSaving ? 'Saving Location...' : 'Use Current Location'}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            value={manualLat}
                            onChange={(e) => setManualLat(e.target.value)}
                            placeholder="Latitude"
                            className="input"
                        />
                        <input
                            value={manualLng}
                            onChange={(e) => setManualLng(e.target.value)}
                            placeholder="Longitude"
                            className="input"
                        />
                    </div>
                    <button className="btn-outline w-full" onClick={handleManualSave} disabled={locationSaving}>
                        Save Manual Coordinates
                    </button>
                </div>
            </div>
        );
    }

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Hospital Control</span>
                        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">Case <span className="text-[#76d6d5]">Broadcasts</span></h1>
                        <p className="text-[#e5e2e1]/40">Manage emergencies and dispatch your fleet.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link 
                            to="/hospital/fleet"
                            className="h-14 px-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            <TruckIcon className="w-4 h-4 text-[#76d6d5]" /> My Fleet
                        </Link>
                        <div className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] px-6 py-2 text-center flex flex-col justify-center">
                            <p className="text-2xl font-headline font-black text-[#76d6d5]">{cases.length}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Active</p>
                        </div>
                    </div>
                </section>

                {errorMsg && (
                    <div className="glass-card rounded-[2rem] border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-300 flex items-center justify-between gap-3">
                        <span>{errorMsg}</span>
                        <button
                            onClick={fetchData}
                            className="px-3 py-1.5 rounded-xl border border-red-400/20 text-[10px] font-black uppercase tracking-widest hover:border-red-400/40"
                        >
                            Retry
                        </button>
                    </div>
                )}
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
                                        {c.transportType && c.transportType !== 'na' && (
                                            <div className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-xl w-fit border ${c.transportType === 'self' ? 'bg-[#ffb77d]/10 border-[#ffb77d]/20 text-[#ffb77d]' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {c.transportType === 'self' ? 'person' : 'ambulance'}
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                    {c.transportType === 'self' ? 'NGO Transporting Self' : 'Ambulance Requested'}
                                                </span>
                                            </div>
                                        )}
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
            {errorMsg && (
                <div className="card border border-red-200 bg-red-50 text-red-700 text-sm flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <button onClick={fetchData} className="btn-outline">Retry</button>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="w-10 h-10 bg-orange-50 rounded-btn flex items-center justify-center mb-1">
                        <BuildingOffice2Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="stat-value">{cases.length}</p>
                    <p className="stat-label">Broadcasts Nearby</p>
                </div>
                <Link to="/hospital/fleet" className="stat-card hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-blue-50 rounded-btn flex items-center justify-center mb-1">
                        <TruckIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="stat-value">Manage</p>
                    <p className="stat-label">My Fleet</p>
                </Link>
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
                                    {c.transportType && c.transportType !== 'na' && (
                                        <div className={`mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md w-fit text-[10px] font-bold border ${c.transportType === 'self' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                            <span className="material-symbols-outlined text-[14px]">
                                                {c.transportType === 'self' ? 'person' : 'ambulance'}
                                            </span>
                                            {c.transportType === 'self' ? 'NGO Self Transport' : 'Ambulance Requested'}
                                        </div>
                                    )}
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
