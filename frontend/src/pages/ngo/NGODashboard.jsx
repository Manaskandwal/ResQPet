import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { SkeletonCard, SkeletonStatCard } from '../../components/Skeleton';
import {
    MapPinIcon, CheckIcon, XMarkIcon, ClockIcon,
    ClipboardDocumentListIcon, ChartBarIcon, CheckCircleIcon, PhoneIcon
} from '@heroicons/react/24/outline';

const NGODashboard = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [analytics, setAnalytics] = useState(null);
    const [nearbyCases, setNearbyCases] = useState([]);
    const [myCases, setMyCases] = useState([]);

    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState({});
    const [locationSet, setLocationSet] = useState(true);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);

            // Depending on tab, fetch specific data (or all at once for simplicity)
            const [analyticsRes, nearbyRes, mycasesRes] = await Promise.all([
                api.get('/ngo/analytics'),
                api.get('/ngo/nearby'),
                api.get('/ngo/my-cases')
            ]);

            setAnalytics(analyticsRes.data.analytics);
            setNearbyCases(nearbyRes.data.cases);
            setLocationSet(nearbyRes.data.locationSet ?? true);
            setMyCases(mycasesRes.data.cases);

        } catch (error) {
            console.error('[NGODashboard] Fetch error:', error.message);
            const msg = error.response?.data?.message || 'Failed to load panel data.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user.isApproved) fetchAll();
    }, [fetchAll, user.isApproved]);

    const handleAccept = async (id) => {
        setActing((p) => ({ ...p, [id]: 'accepting' }));
        try {
            await api.put(`/rescue/${id}/accept-ngo`);
            toast.success('Case accepted! 🐾 Please respond immediately.');
            fetchAll(); // Refreshes nearby out, my-cases in, and analytics up
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept case.');
        } finally {
            setActing((p) => ({ ...p, [id]: null }));
        }
    };

    const handleReject = async (id) => {
        setActing((p) => ({ ...p, [id]: 'rejecting' }));
        try {
            await api.put(`/rescue/${id}/reject-ngo`);
            toast.success('Case passed. You won\'t see it again.');
            setNearbyCases((prev) => prev.filter((c) => c._id !== id));
            // Optional: refetch analytics to update rejected count
            const analyticsRes = await api.get('/ngo/analytics');
            setAnalytics(analyticsRes.data.analytics);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject case.');
        } finally {
            setActing((p) => ({ ...p, [id]: null }));
        }
    };

    if (!user.isApproved) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Awaiting Admin Approval</h2>
                <p className="text-surface-muted max-w-md">
                    Your NGO account is under review. Once approved, you'll be able to see and accept nearby rescue cases.
                </p>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'nearby', label: `Nearby Cases (${nearbyCases.length})` },
        { id: 'my_cases', label: `My Cases (${myCases.length})` },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">NGO Dashboard 🐾</h1>
                <p className="page-subtitle">Manage operations and respond to rescue alerts.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-btn w-fit flex-wrap">
                {tabs.map((tab) => (
                    <button key={tab.id}
                        onClick={() => setSearchParams({ tab: tab.id })}
                        className={`px-4 py-2 rounded-btn text-sm font-medium transition-all
              ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Overview Tab ─────────────────────────────────── */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-slate-800 border-b border-surface-border pb-2">Operational Analytics</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {loading && !analytics ? (
                            [1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)
                        ) : analytics ? (
                            <>
                                <div className="stat-card">
                                    <div className="w-10 h-10 bg-amber-50 rounded-btn flex items-center justify-center mb-1">
                                        <ClockIcon className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <p className="stat-value">{analytics.nearby_pending}</p>
                                    <p className="stat-label">Nearby Pending</p>
                                </div>
                                <div className="stat-card">
                                    <div className="w-10 h-10 bg-blue-50 rounded-btn flex items-center justify-center mb-1">
                                        <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="stat-value">{analytics.accepted_count}</p>
                                    <p className="stat-label">Total Accepted</p>
                                </div>
                                <div className="stat-card">
                                    <div className="w-10 h-10 bg-green-50 rounded-btn flex items-center justify-center mb-1">
                                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                    </div>
                                    <p className="stat-value">{analytics.completed_count}</p>
                                    <p className="stat-label">Completed</p>
                                </div>
                                <div className="stat-card">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-btn flex items-center justify-center mb-1">
                                        <ChartBarIcon className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <p className="stat-value">{analytics.acceptance_rate}%</p>
                                    <p className="stat-label">Acceptance Rate</p>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}

            {/* ── Nearby Cases Tab ─────────────────────────────── */}
            {activeTab === 'nearby' && (
                <div className="space-y-4 animate-fade-in">
                    {/* No-location tip */}
                    {!locationSet && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-btn text-sm text-amber-700 flex items-start gap-2 mb-4">
                            <span className="text-lg leading-none flex-shrink-0">📍</span>
                            <span>
                                <strong>Tip:</strong> Your account has no location set. You're seeing all pending cases.
                                Ask admin to update your base location to filter by 50km radius.
                            </span>
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
                    ) : nearbyCases.length === 0 ? (
                        <div className="card text-center py-14">
                            <div className="text-5xl mb-3">🌟</div>
                            <p className="text-slate-700 font-semibold text-lg">No pending cases nearby!</p>
                            <p className="text-surface-muted text-sm mt-1">Check back in a little while.</p>
                            <button onClick={fetchAll} className="btn-outline mt-4">Refresh Dashboard</button>
                        </div>
                    ) : (
                        nearbyCases.map((c) => (
                            <div key={c._id} className="card-hover">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 truncate">{c.description}</p>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <span className="text-xs text-surface-muted">👤 {c.user?.name}</span>
                                            {c.distance !== null && c.distance !== undefined ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                                                    <MapPinIcon className="w-3 h-3" />{c.distance.toFixed(1)} km away
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                                    <MapPinIcon className="w-3 h-3" />Distance unknown
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <StatusBadge status={c.status} />
                                </div>

                                {c.images?.[0] && (
                                    <img src={c.images[0]} alt="rescue" className="w-full h-36 object-cover rounded-btn mb-3 border border-surface-border" />
                                )}

                                <p className="text-xs text-surface-muted mb-4">
                                    📍 {c.location.address || `${c.location.lat.toFixed(4)}, ${c.location.lng.toFixed(4)}`}
                                    {' · '}🕐 {new Date(c.createdAt).toLocaleString()}
                                </p>

                                <div className="flex gap-2">
                                    <button onClick={() => handleAccept(c._id)} disabled={!!acting[c._id]} className="btn-primary flex-1">
                                        {acting[c._id] === 'accepting' ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                                        Accept Case
                                    </button>
                                    <button onClick={() => handleReject(c._id)} disabled={!!acting[c._id]} className="btn-outline">
                                        {acting[c._id] === 'rejecting' ? '...' : <XMarkIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── My Cases Tab (Accepted) ──────────────────────── */}
            {activeTab === 'my_cases' && (
                <div className="space-y-4 animate-fade-in">
                    {loading ? (
                        <div className="space-y-4">{[1, 2].map(i => <SkeletonCard key={i} />)}</div>
                    ) : myCases.length === 0 ? (
                        <div className="card text-center py-14">
                            <div className="text-4xl mb-3">📋</div>
                            <p className="text-slate-700 font-semibold">No active cases</p>
                            <p className="text-surface-muted text-sm mt-1">Accept nearby cases to see them here.</p>
                        </div>
                    ) : (
                        myCases.map((c) => (
                            <div key={c._id} className="card border-l-4 border-l-primary-500">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">ID: {c._id.slice(-6).toUpperCase()}</span>
                                            <StatusBadge status={c.status} />
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{c.description}</h3>
                                        <p className="text-sm text-surface-muted mt-1">Accepted: {new Date(c.acceptedAt || c.updatedAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-btn border border-surface-border">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location</h4>
                                        <p className="text-sm font-medium text-slate-800 flex items-start gap-1">
                                            <MapPinIcon className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                                            {c.location.address || 'Address provided via coordinates'}
                                        </p>
                                        <a
                                            href={`https://maps.google.com/?q=${c.location.lat},${c.location.lng}`}
                                            target="_blank" rel="noreferrer"
                                            className="text-xs text-primary-600 font-medium hover:underline inline-flex items-center gap-1 mt-2 ml-5"
                                        >
                                            Open in Google Maps ↗
                                        </a>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-btn border border-surface-border">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reporter Details</h4>
                                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                                            👤 {c.user?.name || 'Anonymous User'}
                                        </p>
                                        {c.user?.phone && (
                                            <p className="text-sm font-medium text-slate-800 flex items-center gap-1 mt-1">
                                                <PhoneIcon className="w-4 h-4 text-slate-400" />
                                                <a href={`tel:${c.user.phone}`} className="hover:text-primary-600">{c.user.phone}</a>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {c.images && c.images.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attached Images</h4>
                                        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                                            {c.images.map((img, i) => (
                                                <img key={i} src={img} alt="rescue detail" className="h-32 w-48 object-cover rounded-btn snap-start border border-surface-border flex-shrink-0" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NGODashboard;
