import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { SkeletonStatCard, SkeletonRow } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusComponents';
import {
    UsersIcon, ClipboardDocumentListIcon, CheckCircleIcon,
    ClockIcon, ShieldCheckIcon, TruckIcon, BuildingOffice2Icon,
    HeartIcon, TrashIcon, MapPinIcon, PencilSquareIcon, XMarkIcon, CheckIcon,
} from '@heroicons/react/24/outline';

// ── Location Editor Modal ──────────────────────────────────────────────────────
const LocationModal = ({ user, onClose, onSaved }) => {
    const [form, setForm] = useState({
        lat: user.location?.lat ?? '',
        lng: user.location?.lng ?? '',
        address: user.location?.address ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [detecting, setDetecting] = useState(false);

    const detectLocation = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported in this browser.'); return; }
        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm((p) => ({ ...p, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
                setDetecting(false);
                toast.success('Current location captured!');
            },
            () => { toast.error('Could not get location. Check browser permissions.'); setDetecting(false); }
        );
    };

    const handleSave = async () => {
        if (!form.lat || !form.lng) { toast.error('Latitude and Longitude are required.'); return; }
        setSaving(true);
        try {
            const { data } = await api.put(`/admin/users/${user._id}/location`, {
                lat: parseFloat(form.lat),
                lng: parseFloat(form.lng),
                address: form.address,
            });
            toast.success(data.message);
            onSaved(user._id, { lat: parseFloat(form.lat), lng: parseFloat(form.lng), address: form.address });
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save location.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-card shadow-card-hover w-full max-w-md animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
                    <div>
                        <h3 className="font-bold text-slate-800">Set Base Location</h3>
                        <p className="text-xs text-surface-muted mt-0.5">{user.orgName || user.name} · <span className="capitalize">{user.role}</span></p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-surface-hover">
                        <XMarkIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Current location */}
                    <button
                        onClick={detectLocation}
                        disabled={detecting}
                        className="btn-outline w-full gap-2"
                    >
                        <MapPinIcon className="w-4 h-4" />
                        {detecting ? 'Detecting...' : '📍 Use My Current Location (Admin Device)'}
                    </button>

                    <div className="flex gap-3">
                        <div className="form-group flex-1">
                            <label className="label">Latitude</label>
                            <input className="input" type="number" step="any" placeholder="e.g. 28.6704"
                                value={form.lat} onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))} />
                        </div>
                        <div className="form-group flex-1">
                            <label className="label">Longitude</label>
                            <input className="input" type="number" step="any" placeholder="e.g. 77.3819"
                                value={form.lng} onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Location Label <span className="text-surface-muted font-normal">(optional)</span></label>
                        <input className="input" type="text" placeholder="e.g. Shahdara, Delhi"
                            value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
                    </div>

                    {/* Preview */}
                    {form.lat && form.lng && (
                        <div className="p-3 bg-primary-50 border border-primary-100 rounded-btn text-xs text-primary-700">
                            📍 <strong>{form.address || 'Base location'}</strong> — lat: {form.lat}, lng: {form.lng}
                            <br />
                            <span className="text-primary-500">NGO will see all pending rescues within <strong>50km</strong> of this point.</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-2 px-5 py-4 border-t border-surface-border">
                    <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                        {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                        Save Location
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const [roleFilter, setRoleFilter] = useState('all');

    const [analytics, setAnalytics] = useState(null);
    const [pending, setPending] = useState([]);
    const [users, setUsers] = useState([]);
    const [rescues, setRescues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState({});
    const [locationModal, setLocationModal] = useState(null);

    const fetchAll = useCallback(async () => {
        try {
            console.log('[AdminDashboard] Fetching all admin data...');
            const [analyticsRes, pendingRes, usersRes, rescuesRes] = await Promise.all([
                api.get('/admin/analytics'),
                api.get('/admin/pending-approvals'),
                api.get('/admin/users'),
                api.get('/admin/rescue-requests'),
            ]);
            setAnalytics(analyticsRes.data.analytics);
            setPending(pendingRes.data.users);
            setUsers(usersRes.data.users);
            setRescues(rescuesRes.data.rescues);
            console.log('[AdminDashboard] Data loaded. Pending approvals:', pendingRes.data.count);
        } catch (error) {
            console.error('[AdminDashboard] Fetch error:', error.message);
            toast.error('Failed to load admin data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleApprove = async (userId, approve) => {
        setActing((p) => ({ ...p, [userId]: true }));
        try {
            const { data } = await api.put(`/admin/approve/${userId}`, { approve });
            toast.success(data.message);
            setPending((p) => p.filter((u) => u._id !== userId));
            fetchAll();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed.');
        } finally {
            setActing((p) => ({ ...p, [userId]: false }));
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        setActing((p) => ({ ...p, [userId]: true }));
        try {
            await api.delete(`/admin/user/${userId}`);
            toast.success('User deleted.');
            setUsers((p) => p.filter((u) => u._id !== userId));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed.');
        } finally {
            setActing((p) => ({ ...p, [userId]: false }));
        }
    };

    // Called by modal on successful save — update local state without refetch
    const handleLocationSaved = (userId, newLocation) => {
        setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, location: newLocation } : u));
    };

    const statCards = analytics ? [
        { label: 'Total Users', value: analytics.totalUsers, Icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Rescues', value: analytics.totalRequests, Icon: ClipboardDocumentListIcon, color: 'text-slate-600', bg: 'bg-slate-100' },
        { label: 'Completed', value: analytics.completedRequests, Icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Pending', value: analytics.pendingRequests, Icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Pending Approvals', value: analytics.pendingApprovals, Icon: ShieldCheckIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'NGOs', value: analytics.totalNGOs, Icon: HeartIcon, color: 'text-pink-600', bg: 'bg-pink-50' },
        { label: 'Hospitals', value: analytics.totalHospitals, Icon: BuildingOffice2Icon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Ambulances', value: analytics.totalAmbulances, Icon: TruckIcon, color: 'text-teal-600', bg: 'bg-teal-50' },
    ] : [];

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'approvals', label: `Approvals${pending.length > 0 ? ` (${pending.length})` : ''}` },
        { id: 'users', label: 'Users' },
        { id: 'rescues', label: 'Rescues' },
    ];

    const orgRoles = ['ngo', 'hospital', 'ambulance'];

    return (
        <div className="space-y-6">
            {/* Location modal */}
            {locationModal && (
                <LocationModal
                    user={locationModal}
                    onClose={() => setLocationModal(null)}
                    onSaved={handleLocationSaved}
                />
            )}

            <div>
                <h1 className="page-title">Admin Dashboard 🛡️</h1>
                <p className="page-subtitle">Platform management and oversight</p>
            </div>

            {/* Tabs */}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonStatCard key={i} />)
                    ) : (
                        statCards.map(({ label, value, Icon, color, bg }) => (
                            <div key={label} className="stat-card">
                                <div className={`w-10 h-10 ${bg} rounded-btn flex items-center justify-center mb-1`}>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <p className="stat-value">{value}</p>
                                <p className="stat-label">{label}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── Approvals Tab ────────────────────────────────── */}
            {activeTab === 'approvals' && (
                <div className="space-y-3">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="card animate-pulse h-20" />)
                    ) : pending.length === 0 ? (
                        <div className="card text-center py-12">
                            <div className="text-5xl mb-3">✅</div>
                            <p className="text-slate-700 font-semibold">No pending approvals!</p>
                        </div>
                    ) : (
                        pending.map((u) => (
                            <div key={u._id} className="card flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary-700 font-bold text-sm">{u.name?.charAt(0)?.toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{u.orgName || u.name}</p>
                                    <p className="text-xs text-surface-muted">{u.email} · <span className="capitalize font-medium">{u.role}</span></p>
                                    {u.regNumber && <p className="text-xs text-surface-muted">Reg: {u.regNumber}</p>}
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => handleApprove(u._id, true)} disabled={acting[u._id]} className="btn-primary btn-sm">
                                        {acting[u._id] ? '...' : '✓ Approve'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── Users Tab ───────────────────────────────────── */}
            {activeTab === 'users' && (
                <div className="card overflow-hidden p-0">
                    <div className="px-5 py-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-slate-800">
                                Users ({users.filter(u => roleFilter === 'all' || u.role === roleFilter).length})
                            </h3>
                            <span className="text-xs text-surface-muted flex items-center gap-1 mt-1">
                                <MapPinIcon className="w-3 h-3" /> Click 📍 to set base location for NGO/Hospital/Ambulance
                            </span>
                        </div>

                        {/* Role Filter */}
                        <div className="flex bg-slate-100 p-1 rounded-btn text-xs font-medium overflow-x-auto">
                            {['all', 'user', 'ngo', 'hospital', 'ambulance'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRoleFilter(r)}
                                    className={`px-3 py-1.5 rounded-btn capitalize transition-all whitespace-nowrap ${roleFilter === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {r === 'user' ? 'Citizen' : r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="divide-y divide-surface-border">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
                        ) : (
                            users
                                .filter((u) => roleFilter === 'all' || u.role === roleFilter)
                                .map((u) => (
                                    <div key={u._id} className="flex items-center gap-3 px-5 py-3">
                                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-slate-600">
                                            {u.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{u.orgName || u.name}</p>
                                            <p className="text-xs text-surface-muted truncate">{u.email}</p>
                                            {/* Location pill for org roles */}
                                            {orgRoles.includes(u.role) && (
                                                <p className="text-[10px] mt-0.5 flex items-center gap-1">
                                                    {u.location?.lat ? (
                                                        <span className="text-green-600 flex items-center gap-0.5">
                                                            <MapPinIcon className="w-3 h-3" />
                                                            {u.location.address || `${u.location.lat.toFixed(4)}, ${u.location.lng.toFixed(4)}`}
                                                            <span className="text-slate-400 ml-1">· 50km radius active</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600 flex items-center gap-0.5">
                                                            <MapPinIcon className="w-3 h-3" />
                                                            No base location set
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`badge text-[10px] capitalize ${u.isApproved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {u.role}
                                            </span>
                                            {u.role === 'user' && (
                                                <span className="text-xs text-slate-500 font-medium">₹{u.walletBalance}</span>
                                            )}
                                            {/* Set Location button for org accounts */}
                                            {orgRoles.includes(u.role) && (
                                                <button
                                                    onClick={() => setLocationModal(u)}
                                                    title="Set base location"
                                                    className={`p-1.5 rounded transition-colors ${u.location?.lat
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-amber-500 hover:bg-amber-50'}`}
                                                >
                                                    <MapPinIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                            {u.role !== 'admin' && (
                                                <button onClick={() => handleDelete(u._id)} disabled={acting[u._id]}
                                                    className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            )}

            {/* ── Rescues Tab ──────────────────────────────────── */}
            {activeTab === 'rescues' && (
                <div className="space-y-3">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="card animate-pulse h-20" />)
                    ) : (
                        rescues.map((r) => (
                            <div key={r._id} className="card">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{r.description}</p>
                                        <p className="text-xs text-surface-muted mt-0.5">
                                            👤 {r.user?.name} · 🕐 {new Date(r.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <StatusBadge status={r.status} />
                                </div>
                            </div>
                        ))
                    )}
                    {!loading && rescues.length === 0 && (
                        <div className="card text-center py-12">
                            <p className="text-slate-600">No rescue requests yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
