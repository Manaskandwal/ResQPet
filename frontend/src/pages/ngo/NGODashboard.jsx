import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { SkeletonCard } from '../../components/Skeleton';
import { MapPinIcon, CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

const NGODashboard = () => {
    const { user } = useAuth();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState({});
    const [locationSet, setLocationSet] = useState(true);

    const fetchCases = useCallback(async () => {
        try {
            console.log('[NGODashboard] Fetching cases...');
            const { data } = await api.get('/ngo/nearby');
            setCases(data.cases);
            setLocationSet(data.locationSet ?? true);
            console.log('[NGODashboard] Cases loaded:', data.count);
        } catch (error) {
            console.error('[NGODashboard] Fetch error:', error.message);
            const msg = error.response?.data?.message || 'Failed to load cases. Is the backend running?';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCases(); }, [fetchCases]);

    const handleAccept = async (id) => {
        setActing((p) => ({ ...p, [id]: 'accepting' }));
        try {
            console.log('[NGODashboard] Accepting case:', id);
            await api.put(`/rescue/${id}/accept-ngo`);
            toast.success('Case accepted! 🐾 Please respond immediately.');
            setCases((prev) => prev.filter((c) => c._id !== id));
        } catch (error) {
            console.error('[NGODashboard] Accept error:', error.message);
            toast.error(error.response?.data?.message || 'Failed to accept case.');
        } finally {
            setActing((p) => ({ ...p, [id]: null }));
        }
    };

    const handleReject = async (id) => {
        setActing((p) => ({ ...p, [id]: 'rejecting' }));
        try {
            console.log('[NGODashboard] Rejecting case:', id);
            await api.put(`/rescue/${id}/reject-ngo`);
            toast.success('Case passed. You won\'t see it again.');
            setCases((prev) => prev.filter((c) => c._id !== id));
        } catch (error) {
            console.error('[NGODashboard] Reject error:', error.message);
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">Rescue Cases {locationSet ? 'Nearby 🗺️' : '🐾 All Pending'}</h1>
                <p className="page-subtitle">
                    {locationSet
                        ? 'Cases within 50km of your registered location — oldest first'
                        : 'Showing all pending cases (set your location in profile to filter by radius)'}
                </p>
            </div>

            {/* No-location tip */}
            {!locationSet && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-btn text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-lg leading-none flex-shrink-0">📍</span>
                    <span>
                        <strong>Tip:</strong> Your account has no location set. You're seeing all pending cases across the city.
                        To filter by 50km proximity, ask your admin to update your profile location.
                    </span>
                </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="w-10 h-10 bg-amber-50 rounded-btn flex items-center justify-center mb-1">
                        <ClockIcon className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="stat-value">{cases.length}</p>
                    <p className="stat-label">Cases Nearby</p>
                </div>
                <div className="stat-card">
                    <div className="w-10 h-10 bg-primary-50 rounded-btn flex items-center justify-center mb-1">
                        <MapPinIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <p className="stat-value">50 km</p>
                    <p className="stat-label">Search Radius</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
            ) : cases.length === 0 ? (
                <div className="card text-center py-14">
                    <div className="text-5xl mb-3">🌟</div>
                    <p className="text-slate-700 font-semibold text-lg">No pending cases nearby!</p>
                    <p className="text-surface-muted text-sm mt-1">Check back in a little while, or update your location in your profile.</p>
                    <button onClick={fetchCases} className="btn-outline mt-4">Refresh</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {cases.map((c) => (
                        <div key={c._id} className="card-hover">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{c.description}</p>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="text-xs text-surface-muted">
                                            👤 {c.user?.name} {c.user?.phone && `· ${c.user.phone}`}
                                        </span>
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

                            {/* Image preview */}
                            {c.images?.[0] && (
                                <img src={c.images[0]} alt="rescue" className="w-full h-36 object-cover rounded-btn mb-3 border border-surface-border" />
                            )}

                            {/* Location & time */}
                            <p className="text-xs text-surface-muted mb-4">
                                📍 {c.location.address || `${c.location.lat.toFixed(4)}, ${c.location.lng.toFixed(4)}`}
                                {' · '}🕐 {new Date(c.createdAt).toLocaleString()}
                            </p>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAccept(c._id)}
                                    disabled={!!acting[c._id]}
                                    className="btn-primary flex-1"
                                >
                                    {acting[c._id] === 'accepting' ? (
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : <CheckIcon className="w-4 h-4" />}
                                    Accept Case
                                </button>
                                <button
                                    onClick={() => handleReject(c._id)}
                                    disabled={!!acting[c._id]}
                                    className="btn-outline"
                                >
                                    {acting[c._id] === 'rejecting' ? '...' : <XMarkIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={fetchCases} className="btn-ghost w-full text-sm">
                        🔄 Refresh Cases
                    </button>
                </div>
            )}
        </div>
    );
};

export default NGODashboard;
