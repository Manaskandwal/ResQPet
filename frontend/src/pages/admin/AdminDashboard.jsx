import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { SkeletonStatCard, SkeletonRow } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusComponents';
import { formatIndianDateTime } from '../../utils/dateTime';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    LineChart, Line, CartesianGrid 
} from 'recharts';
import {
    UsersIcon,
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    ClockIcon,
    ShieldCheckIcon,
    TruckIcon,
    BuildingOffice2Icon,
    HeartIcon,
    TrashIcon,
    MapPinIcon,
    XMarkIcon,
    CheckIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

const LocationModal = ({ user, onClose, onSaved }) => {
    const [form, setForm] = useState({
        lat: user.location?.lat ?? '',
        lng: user.location?.lng ?? '',
        address: user.location?.address ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [detecting, setDetecting] = useState(false);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported in this browser.');
            return;
        }

        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm((prev) => ({
                    ...prev,
                    lat: pos.coords.latitude.toFixed(6),
                    lng: pos.coords.longitude.toFixed(6),
                }));
                setDetecting(false);
                toast.success('Current location captured!');
            },
            () => {
                toast.error('Could not get location. Check browser permissions.');
                setDetecting(false);
            }
        );
    };

    const handleSave = async () => {
        if (!form.lat || !form.lng) {
            toast.error('Latitude and Longitude are required.');
            return;
        }

        setSaving(true);
        try {
            const { data } = await api.put(`/admin/users/${user._id}/location`, {
                lat: parseFloat(form.lat),
                lng: parseFloat(form.lng),
                address: form.address,
            });

            toast.success(data.message);
            onSaved(user._id, {
                lat: parseFloat(form.lat),
                lng: parseFloat(form.lng),
                address: form.address,
            });
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save location.');
        } finally {
            setSaving(false);
        }
    };

    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

    if (isNewUI) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#131313]/80 backdrop-blur-xl resqpet-obsidian-theme">
                <div className="bg-[#1c1b1b] rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-lg border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5">
                        <div>
                            <h3 className="font-headline text-xl font-black text-[#e5e2e1]">Set Base Hub</h3>
                            <p className="text-[10px] font-black text-[#76d6d5] uppercase tracking-widest mt-1">
                                {user.orgName || user.name} · {user.role}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors text-[#e5e2e1]/40">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        <button
                            onClick={detectLocation}
                            disabled={detecting}
                            className="w-full h-14 rounded-2xl bg-[#76d6d5]/10 border border-[#76d6d5]/20 text-[#76d6d5] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-[#76d6d5]/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <MapPinIcon className="w-5 h-5 shadow-[0_0_15px_rgba(118,214,213,0.5)]" />
                            {detecting ? 'Syncing...' : 'Detect Hub Coordinates'}
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#e5e2e1]/30 uppercase tracking-widest px-2">Latitude</label>
                                <input
                                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 font-bold text-[#e5e2e1] focus:ring-2 focus:ring-[#76d6d5]/20 focus:border-[#76d6d5]/40 transition-all outline-none"
                                    type="number" step="any"
                                    value={form.lat}
                                    onChange={(e) => setForm((prev) => ({ ...prev, lat: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#e5e2e1]/30 uppercase tracking-widest px-2">Longitude</label>
                                <input
                                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 font-bold text-[#e5e2e1] focus:ring-2 focus:ring-[#76d6d5]/20 focus:border-[#76d6d5]/40 transition-all outline-none"
                                    type="number" step="any"
                                    value={form.lng}
                                    onChange={(e) => setForm((prev) => ({ ...prev, lng: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#e5e2e1]/30 uppercase tracking-widest px-2">Address Label</label>
                            <input
                                className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 font-bold text-[#e5e2e1] focus:ring-2 focus:ring-[#76d6d5]/20 focus:border-[#76d6d5]/40 transition-all outline-none"
                                type="text"
                                placeholder="e.g. Metro Station, New Delhi"
                                value={form.address}
                                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                            />
                        </div>

                        {form.lat && form.lng && (
                            <div className="p-6 bg-[#76d6d5]/5 rounded-3xl border border-[#76d6d5]/10">
                                <p className="text-sm font-bold text-[#76d6d5] mb-1">{form.address || 'Geo-Coordinates Synced'}</p>
                                <p className="text-[10px] font-medium text-[#e5e2e1]/40 leading-relaxed uppercase tracking-widest">
                                    The partner will receive alerts for rescues within a <span className="text-[#e5e2e1]">50km</span> radius of this location.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 p-8 border-t border-white/5 bg-white/5">
                        <button onClick={onClose} className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/40 hover:text-[#e5e2e1] transition-colors">Discard</button>
                        <button onClick={handleSave} disabled={saving} className="flex-[2] h-14 bg-[#76d6d5] text-[#131313] rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#76d6d5]/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                            {saving ? 'Syncing...' : 'Lock Hub Location'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-card shadow-card-hover w-full max-w-md animate-slide-up">
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
                    <div>
                        <h3 className="font-bold text-slate-800">Set Base Location</h3>
                        <p className="text-xs text-surface-muted mt-0.5">
                            {user.orgName || user.name} · <span className="capitalize">{user.role}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-surface-hover">
                        <XMarkIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <button
                        onClick={detectLocation}
                        disabled={detecting}
                        className="btn-outline w-full gap-2"
                    >
                        <MapPinIcon className="w-4 h-4" />
                        {detecting ? 'Detecting...' : 'Use My Current Location (Admin Device)'}
                    </button>

                    <div className="flex gap-3">
                        <div className="form-group flex-1">
                            <label className="label">Latitude</label>
                            <input
                                className="input"
                                type="number"
                                step="any"
                                placeholder="e.g. 28.6704"
                                value={form.lat}
                                onChange={(e) => setForm((prev) => ({ ...prev, lat: e.target.value }))}
                            />
                        </div>
                        <div className="form-group flex-1">
                            <label className="label">Longitude</label>
                            <input
                                className="input"
                                type="number"
                                step="any"
                                placeholder="e.g. 77.3819"
                                value={form.lng}
                                onChange={(e) => setForm((prev) => ({ ...prev, lng: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">
                            Location Label <span className="text-surface-muted font-normal">(optional)</span>
                        </label>
                        <input
                            className="input"
                            type="text"
                            placeholder="e.g. Shahdara, Delhi"
                            value={form.address}
                            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                        />
                    </div>

                    {form.lat && form.lng && (
                        <div className="p-3 bg-primary-50 border border-primary-100 rounded-btn text-xs text-primary-700">
                            <strong>{form.address || 'Base location'}</strong> - lat: {form.lat}, lng: {form.lng}
                            <br />
                            <span className="text-primary-500">
                                NGO will see all pending rescues within <strong>50km</strong> of this point.
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 px-5 py-4 border-t border-surface-border">
                    <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                        {saving ? (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckIcon className="w-4 h-4" />
                        )}
                        Save Location
                    </button>
                </div>
            </div>
        </div>
    );
};

const ApprovalCard = ({ user: u, acting, onApprove }) => {
    const needsTypeSelect = ['hospital', 'ambulance'].includes(u.role);
    const [selectedType, setSelectedType] = useState(u.isGovernment ? 'government' : 'private');

    return (
        <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-[#1c1b1b] w-full flex flex-col md:flex-row md:items-center gap-6 group hover:border-[#76d6d5]/30 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5] text-2xl font-black flex-shrink-0">
                {u.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-3">
                    <h4 className="font-bold text-lg">{u.orgName || u.name}</h4>
                    <span className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#76d6d5]">{u.role}</span>
                    {needsTypeSelect && (
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${selectedType === 'government' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                            {selectedType === 'government' ? 'Govt' : 'Private'}
                        </span>
                    )}
                </div>
                <p className="text-sm text-[#e5e2e1]/50">{u.email}</p>
                {u.regNumber && <p className="text-[10px] font-black text-[#e5e2e1]/20 uppercase tracking-widest">Reg No: {u.regNumber}</p>}
                {u.address && <p className="text-[10px] text-[#e5e2e1]/20">{u.address}</p>}

                {/* Govt/Private Type Selector */}
                {needsTypeSelect && (
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Institution Type:</span>
                        <div className="flex rounded-xl overflow-hidden border border-white/10">
                            {['government', 'private'].map((type) => (
                                <button key={type} onClick={() => setSelectedType(type)}
                                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${selectedType === type
                                        ? type === 'government' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                                        : 'text-white/30 hover:text-white/50'}`}>
                                    {type === 'government' ? '🏛 Govt' : '🏢 Private'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                    onClick={() => onApprove(u._id, true, needsTypeSelect ? selectedType === 'government' : undefined)}
                    disabled={acting[u._id]}
                    className="px-6 py-3 bg-[#76d6d5] text-[#131313] font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all min-w-[130px]"
                >
                    {acting[u._id] ? '...' : 'Approve'}
                </button>
                <button
                    onClick={() => onApprove(u._id, false)}
                    disabled={acting[u._id]}
                    className="px-6 py-3 border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                    Reject
                </button>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const [roleFilter, setRoleFilter] = useState('all');
    const [rescueFilter, setRescueFilter] = useState('all');

    const [analytics, setAnalytics] = useState(null);
    const [pending, setPending] = useState([]);
    const [users, setUsers] = useState([]);
    const [rescues, setRescues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState({});
    const [locationModal, setLocationModal] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [fundraisers, setFundraisers] = useState([]);
    const [fundraisersLoading, setFundraisersLoading] = useState(false);

    const fetchFundraisers = useCallback(async () => {
        try {
            setFundraisersLoading(true);
            const { data } = await api.get('/admin/fundraisers');
            setFundraisers(data.fundraisers || []);
        } catch (error) {
            toast.error('Failed to load fundraisers.');
        } finally {
            setFundraisersLoading(false);
        }
    }, []);

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

    useEffect(() => {
        fetchAll();
        fetchFundraisers();
    }, [fetchAll, fetchFundraisers]);

    const fetchAuditLogs = useCallback(async () => {
        try {
            setAuditLoading(true);
            const { data } = await api.get('/admin/audit-logs');
            setAuditLogs(data.logs || []);
        } catch (error) {
            toast.error('Failed to load audit logs.');
        } finally {
            setAuditLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'audit') {
            fetchAuditLogs();
        }
    }, [activeTab, fetchAuditLogs]);

    const handleApprove = async (userId, approve, isGovernment) => {
        setActing((prev) => ({ ...prev, [userId]: true }));
        try {
            const payload = { approve };
            if (typeof isGovernment === 'boolean') payload.isGovernment = isGovernment;
            const { data } = await api.put(`/admin/approve/${userId}`, payload);
            toast.success(data.message);
            setPending((prev) => prev.filter((u) => u._id !== userId));
            fetchAll();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed.');
        } finally {
            setActing((prev) => ({ ...prev, [userId]: false }));
        }
    };

    const handleUpdateMeta = async (userId, payload) => {
        setActing((prev) => ({ ...prev, [userId]: true }));
        try {
            const { data } = await api.patch(`/admin/users/${userId}/meta`, payload);
            toast.success(data.message);
            fetchAll();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed.');
        } finally {
            setActing((prev) => ({ ...prev, [userId]: false }));
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        setActing((prev) => ({ ...prev, [userId]: true }));
        try {
            await api.delete(`/admin/user/${userId}`);
            toast.success('User deleted.');
            setUsers((prev) => prev.filter((u) => u._id !== userId));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed.');
        } finally {
            setActing((prev) => ({ ...prev, [userId]: false }));
        }
    };

    const handleImpersonate = async (userId) => {
        try {
            const { data } = await api.post('/auth/impersonate-start', { userId });
            localStorage.setItem('vetscue_token', data.token);
            localStorage.setItem('isImpersonating', 'true');
            toast.success('Successfully impersonated user. Redirecting...');
            setTimeout(() => window.location.href = '/', 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Impersonation failed.');
        }
    };

    const orgRoles = ['ngo', 'hospital', 'ambulance'];
    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

    const commonStats = analytics ? [
        { label: 'Total Citizens', value: analytics.totalUsers, Icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50', obsidianColor: 'text-[#76d6d5]', accent: 'bg-[#76d6d5]/10' },
        { label: 'Platform Rescues', value: analytics.totalRequests, Icon: ClipboardDocumentListIcon, color: 'text-indigo-600', bg: 'bg-indigo-50', obsidianColor: 'text-blue-400', accent: 'bg-blue-400/10' },
        { label: 'Success Cases', value: analytics.completedRequests, Icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50', obsidianColor: 'text-green-400', accent: 'bg-green-400/10' },
        { label: 'Active Tasks', value: analytics.pendingRequests, Icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50', obsidianColor: 'text-amber-400', accent: 'bg-amber-400/10' },
        { label: 'NGO Partners', value: analytics.totalNGOs, Icon: HeartIcon, color: 'text-rose-600', bg: 'bg-rose-50', obsidianColor: 'text-rose-400', accent: 'bg-rose-400/10' },
        { label: 'Hospital Network', value: analytics.totalHospitals, Icon: BuildingOffice2Icon, color: 'text-sky-600', bg: 'bg-sky-50', obsidianColor: 'text-indigo-400', accent: 'bg-indigo-400/10' },
        { label: 'Dispatch Fleet', value: analytics.totalAmbulances, Icon: TruckIcon, color: 'text-teal-600', bg: 'bg-teal-50', obsidianColor: 'text-teal-400', accent: 'bg-teal-400/10' },
        { label: 'New Approvals', value: analytics.pendingApprovals, Icon: ShieldCheckIcon, color: 'text-orange-600', bg: 'bg-orange-50', obsidianColor: 'text-[#ffb77d]', accent: 'bg-[#ffb77d]/10' },
    ] : [];

    const statCardsResponsive = commonStats.map(s => ({
        ...s,
        color: s.obsidianColor
    }));

    const statCards = commonStats;

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-12 overflow-x-hidden">
                {locationModal && (
                    <LocationModal
                        user={locationModal}
                        onClose={() => setLocationModal(null)}
                        onSaved={handleLocationSaved}
                    />
                )}

                {/* Dashboard Title Section */}
                <section>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">System Overview</span>
                            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">Admin <span className="text-[#76d6d5]">Dashboard</span></h1>
                            <p className="text-[#e5e2e1]/50 max-w-md">Orchestrate the mission and managed verified network partners.</p>
                        </div>
                        <div className="lg:hidden flex bg-[#1c1b1b]/50 p-1 rounded-2xl border border-white/5 backdrop-blur-xl overflow-x-auto no-scrollbar scroll-smooth flex-nowrap">
                            {[
                                { id: 'overview', label: 'Home' },
                                { id: 'approvals', label: 'Approvals' },
                                { id: 'users', label: 'Users' },
                                { id: 'audit', label: 'Security Logs' },
                                { id: 'rescues', label: 'Rescues' },
                                { id: 'finances', label: 'Finances' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSearchParams({ tab: t.id })}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                                        activeTab === t.id 
                                        ? 'bg-[#76d6d5] text-[#131313] shadow-[0_0_20px_rgba(118,214,213,0.3)]' 
                                        : 'text-[#e5e2e1]/40 hover:text-[#e5e2e1]'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-12">
                        {/* Summary Stats Grid */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {loading ? (
                                [1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)
                            ) : (
                                statCardsResponsive.slice(0, 4).map(({ label, value, Icon, color, accent }) => (
                                    <div key={label} className="glass-card rounded-[2rem] p-6 sm:p-8 border border-white/5 bg-[#1c1b1b]/30 group hover:border-[#76d6d5]/30 transition-all flex flex-col justify-between h-52">
                                        <div className={`w-14 h-14 rounded-2xl ${accent} flex items-center justify-center ${color} group-hover:scale-110 transition-transform shadow-lg`}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-4xl font-headline font-black text-[#e5e2e1] tracking-tighter">{value}</p>
                                            <p className="text-[10px] font-black text-[#e5e2e1]/30 uppercase tracking-[0.2em]">{label}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Verification Queue & Mini Management */}
                            <div className="lg:col-span-8 flex flex-col gap-8">
                                <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b] overflow-hidden">
                                     <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                                        <h3 className="font-headline font-bold text-xl uppercase tracking-tight">Recent Activity</h3>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5]">Live Updates</span>
                                     </div>
                                     <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full text-left min-w-[800px]">
                                            {/* Table content goes here */}
                                        </table>
                                     </div>
                                     <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                                        {statCardsResponsive.slice(4).map(({ label, value, color }) => (
                                            <div key={label}>
                                                <p className={`text-3xl font-headline font-black mb-1 ${color}`}>{value}</p>
                                                <p className="text-[10px] font-black text-[#e5e2e1]/30 uppercase tracking-widest">{label}</p>
                                            </div>
                                        ))}
                                     </div>
                                </div>
                                
                                {/* Analytics Charts */}
                                {analytics?.chartData && (
                                    <div className="space-y-6">
                                        <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b] p-8 hidden md:block">
                                            <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-[#76d6d5]"></span>
                                                Daily Rescues <span className="text-[10px] text-[#e5e2e1]/40 font-black tracking-widest uppercase">(Last 30 Days)</span>
                                            </h3>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={analytics.chartData.dailyCases}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                                        <XAxis dataKey="_id" stroke="#ffffff40" fontSize={10} tickMargin={10} axisLine={false} />
                                                        <YAxis stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} />
                                                        <Tooltip 
                                                            cursor={{fill: '#ffffff05'}}
                                                            contentStyle={{backgroundColor: '#131313', border: '1px solid #ffffff10', borderRadius: '12px'}}
                                                        />
                                                        <Bar dataKey="count" fill="#76d6d5" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b] p-8 hidden md:block">
                                            <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-[#ffb77d]"></span>
                                                Daily Donations <span className="text-[10px] text-[#e5e2e1]/40 font-black tracking-widest uppercase">(Last 30 Days INR)</span>
                                            </h3>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={analytics.chartData.dailyDonations}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                                        <XAxis dataKey="_id" stroke="#ffffff40" fontSize={10} tickMargin={10} axisLine={false} />
                                                        <YAxis stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} />
                                                        <Tooltip 
                                                            contentStyle={{backgroundColor: '#131313', border: '1px solid #ffffff10', borderRadius: '12px'}}
                                                        />
                                                        <Line type="monotone" dataKey="amount" stroke="#ffb77d" strokeWidth={3} dot={{r: 4, fill: '#ffb77d', strokeWidth: 0}} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Quick Recent Activity */}
                                <div className="space-y-4">
                                    <h3 className="font-headline text-xl font-bold px-2">Recently Reported</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {rescues.slice(0, 4).map(r => (
                                            <div key={r._id} className="glass-card p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all">
                                                <div className="min-w-0">
                                                    <p className="font-bold truncate text-[#e5e2e1]">{r.description}</p>
                                                    <p className="text-[10px] text-[#e5e2e1]/40 uppercase tracking-widest mt-1">{formatIndianDateTime(r.createdAt)}</p>
                                                </div>
                                                <StatusBadge status={r.status} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Urgent Actions: Pending Approvals */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="glass-card rounded-[2.5rem] border border-[#ffb77d]/20 bg-[#1c1b1b] p-8">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-[#ffb77d]/10 flex items-center justify-center text-[#ffb77d]">
                                            <ShieldCheckIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-headline font-bold text-lg leading-tight">Partner Approval</h3>
                                            <p className="text-[10px] text-[#ffb77d] font-black uppercase tracking-widest">Waiting for Review</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {pending.length === 0 ? (
                                            <div className="text-center py-8 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                                <span className="material-symbols-outlined text-[#76d6d5] text-4xl mb-2">done_all</span>
                                                <p className="text-xs font-bold text-[#e5e2e1]/30 uppercase tracking-widest">No pending reviews</p>
                                            </div>
                                        ) : (
                                            pending.slice(0, 3).map(u => (
                                                <div key={u._id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold truncate">{u.orgName || u.name}</p>
                                                        <p className="text-[10px] text-[#76d6d5] font-black uppercase tracking-widest">{u.role}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setSearchParams({ tab: 'approvals' })}
                                                        className="p-2 rounded-lg bg-[#ffb77d]/10 text-[#ffb77d] hover:bg-[#ffb77d]/20"
                                                    >
                                                        <ArrowRightIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                        {pending.length > 3 && (
                                            <button 
                                                onClick={() => setSearchParams({ tab: 'approvals' })}
                                                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#e5e2e1]/20 hover:text-[#76d6d5] transition-colors"
                                            >
                                                + View {pending.length - 3} More
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'approvals' && (
                    <section className="space-y-6 w-full max-w-full">
                         <div className="flex items-center gap-3 px-2 mb-8">
                            <h2 className="font-headline text-2xl font-bold">New Partners Review</h2>
                            <span className="bg-[#ffb77d] text-[#131313] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{pending.length}</span>
                        </div>
                        <div className="space-y-4">
                            {pending.length === 0 ? (
                                <div className="glass-card rounded-[3rem] py-20 text-center border border-dashed border-white/10">
                                    <span className="material-symbols-outlined text-[#76d6d5] text-6xl mb-4">task_alt</span>
                                    <h3 className="text-xl font-bold">All caught up!</h3>
                                    <p className="text-[#e5e2e1]/40">No organizations are currently awaiting verification.</p>
                                </div>
                            ) : (
                                pending.map(u => (
                                    <ApprovalCard
                                        key={u._id}
                                        user={u}
                                        acting={acting}
                                        onApprove={handleApprove}
                                    />
                                ))
                            )}
                        </div>
                    </section>
                )}

                {activeTab === 'users' && (
                    <section className="space-y-8 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                             <div className="flex items-center gap-4">
                                <h2 className="font-headline text-2xl font-bold">List of Users</h2>
                                <span className="text-[#e5e2e1]/30 text-xs font-bold uppercase tracking-widest">{users.length} Total</span>
                             </div>
                             <div className="relative min-w-[160px]">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full bg-[#1c1b1b] border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#76d6d5] outline-none focus:ring-2 focus:ring-[#76d6d5]/20 transition-all appearance-none cursor-pointer"
                                >
                                    {['all', 'user', 'ngo', 'hospital', 'ambulance'].map((r) => (
                                        <option key={r} value={r} className="bg-[#1c1b1b]">
                                            {r === 'all' ? 'All Roles' : (r === 'user' ? 'Citizen' : r.toUpperCase()) }
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#76d6d5]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users.filter(u => roleFilter === 'all' || u.role === roleFilter).map(u => (
                                <div key={u._id} className="glass-card p-6 rounded-[2rem] border border-white/5 bg-[#1c1b1b] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${u.isApproved ? 'bg-[#76d6d5]/10 text-[#76d6d5]' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {u.isApproved ? 'Verified' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-[#e5e2e1]">
                                            {(u.name || u.orgName || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold truncate max-w-[120px]">{u.orgName || u.name || 'Unknown User'}</h4>
                                                {['hospital', 'ambulance'].includes(u.role) && (
                                                    <button
                                                        onClick={() => handleUpdateMeta(u._id, { isGovernment: !u.isGovernment })}
                                                        disabled={acting[u._id]}
                                                        title="Click to toggle institution type"
                                                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border transition-colors flex-shrink-0 ${u.isGovernment ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' : 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'} ${acting[u._id] ? 'opacity-50 cursor-wait' : ''}`}
                                                    >
                                                        {acting[u._id] ? '...' : u.isGovernment ? 'Govt' : 'Private'}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-black text-[#76d6d5] uppercase tracking-widest">{u.role || 'user'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-2 text-xs text-[#e5e2e1]/40">
                                            <span className="material-symbols-outlined text-sm">mail</span>
                                            <span className="truncate">{u.email}</span>
                                        </div>
                                        {orgRoles.includes(u.role) && (
                                            <div className="flex items-center gap-2 text-xs text-[#e5e2e1]/40">
                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                <span className="truncate">{u.location?.address || 'Location Not Set'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-white/5">
                                        {orgRoles.includes(u.role) && (
                                            <button 
                                                onClick={() => setLocationModal(u)}
                                                className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#76d6d5]/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                <MapPinIcon className="w-3 h-3" />
                                                Set Base
                                            </button>
                                        )}
                                        {u.role !== 'admin' && (
                                            <>
                                                <button 
                                                    onClick={() => handleImpersonate(u._id)}
                                                    className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#76d6d4] hover:bg-[#76d6d4]/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <ShieldCheckIcon className="w-3 h-3" />
                                                    Impersonate
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(u._id)}
                                                    className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <TrashIcon className="w-3 h-3" />
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === 'audit' && (
                    <section className="space-y-8 w-full">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <h2 className="font-headline text-2xl font-bold">Security Audit Logs</h2>
                                <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">Critical</span>
                            </div>
                        </div>
                        <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b] overflow-hidden">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left min-w-[800px]">
                                    <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-[#e5e2e1]/40">
                                        <tr>
                                            <th className="px-8 py-4">Event Group</th>
                                            <th className="px-8 py-4">Admin Actor</th>
                                            <th className="px-8 py-4">Target User</th>
                                            <th className="px-8 py-4">IP Address</th>
                                            <th className="px-8 py-4">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {auditLoading ? (
                                            [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-16 bg-white/5" />)
                                        ) : auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-20 text-center text-[#e5e2e1]/30 uppercase tracking-[0.3em] font-black">No security audit logs found</td>
                                            </tr>
                                        ) : auditLogs.map(log => (
                                            <tr key={log._id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.action === 'impersonation_start' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                                            <span className="material-symbols-outlined text-sm">{log.action === 'impersonation_start' ? 'person_search' : 'person'}</span>
                                                        </div>
                                                        <p className="text-sm font-bold capitalize">{log.action.replace('_', ' ')}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-[#e5e2e1]">{log.adminId?.name}</p>
                                                    <p className="text-[10px] text-[#e5e2e1]/40">{log.adminId?.email}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-[#e5e2e1]">{log.targetId?.name}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-[10px] font-bold text-[#e5e2e1]/40 font-mono">{log.ipAddress || 'System'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/40">{formatIndianDateTime(log.timestamp)}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}
                {activeTab === 'rescues' && (
                    <section className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between px-2 gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="font-headline text-2xl font-bold">Platform Rescues</h2>
                                <span className="text-[10px] font-black text-[#76d6d4] uppercase tracking-[0.2em] bg-[#76d6d4]/10 px-2 py-1 rounded border border-[#76d6d4]/20">{rescues.length} Reports</span>
                            </div>
                            
                            {/* Desktop Tabs */}
                            <div className="hidden md:flex bg-[#1c1b1b]/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-xl overflow-x-auto custom-scrollbar">
                                {['all', 'pending', 'ambulance_pinged', 'accepted', 'completed', 'unresolved'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setRescueFilter(f)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                                            rescueFilter === f 
                                            ? 'bg-white text-black shadow-lg' 
                                            : 'text-[#e5e2e1]/40 hover:text-[#e5e2e1]'
                                        }`}
                                    >
                                        {f.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            {/* Mobile Dropdown */}
                            <div className="md:hidden relative min-w-[160px]">
                                <select
                                    value={rescueFilter}
                                    onChange={(e) => setRescueFilter(e.target.value)}
                                    className="w-full bg-[#1c1b1b] border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#76d6d4] outline-none focus:ring-2 focus:ring-[#76d6d4]/20 transition-all appearance-none cursor-pointer"
                                >
                                    {['all', 'pending', 'ambulance_pinged', 'accepted', 'completed', 'unresolved'].map((f) => (
                                        <option key={f} value={f} className="bg-[#1c1b1b]">
                                            {f === 'all' ? 'All Rescues' : f.replace('_', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#76d6d4]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b] overflow-hidden">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-[#e5e2e1]/40">
                                    <tr>
                                        <th className="px-8 py-4">Report</th>
                                        <th className="px-8 py-4 hidden md:table-cell">Reporter</th>
                                        <th className="px-8 py-4">Timestamp</th>
                                        <th className="px-8 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {rescues.filter(r => rescueFilter === 'all' || r.status === rescueFilter).map(r => (
                                        <tr key={r._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-[#e5e2e1]">{r.description}</p>
                                            </td>
                                            <td className="px-8 py-6 hidden md:table-cell">
                                                <p className="text-sm">{r.user?.name}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#e5e2e1]/40">{formatIndianDateTime(r.createdAt)}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <StatusBadge status={r.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                            {rescues.filter(r => rescueFilter === 'all' || r.status === rescueFilter).length === 0 && (
                                <div className="py-20 text-center text-[#e5e2e1]/30 uppercase tracking-[0.3em] font-black">No matching rescues found</div>
                            )}
                        </div>
                    </section>
                )}

                {activeTab === 'finances' && (
                    <section className="space-y-6 w-full">
                         <div className="flex items-center gap-3 px-2 mb-8">
                            <h2 className="font-headline text-2xl font-bold">Fundraisers & Finances</h2>
                            <span className="bg-[#ffb77d] text-[#131313] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{fundraisers.length} Total</span>
                        </div>
                        <div className="space-y-4">
                            {fundraisersLoading ? (
                                <div className="p-8 text-center text-[#e5e2e1]/40">Loading financial requests...</div>
                            ) : fundraisers.length === 0 ? (
                                <div className="glass-card rounded-[3rem] py-20 text-center border border-dashed border-white/10">
                                    <span className="material-symbols-outlined text-[#76d6d4] text-6xl mb-4">account_balance_wallet</span>
                                    <h3 className="text-xl font-bold">No active fundraisers</h3>
                                    <p className="text-[#e5e2e1]/40">No organizations have requested case funding recently.</p>
                                </div>
                            ) : (
                                fundraisers.map(r => (
                                    <div key={r._id} className="glass-card rounded-[2rem] p-6 border border-white/5 bg-[#1c1b1b] flex flex-col lg:flex-row gap-6 hover:border-[#ffb77d]/30 transition-all">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h3 className="font-bold text-lg">{r.description}</h3>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#76d6d4] mt-1 line-clamp-1">
                                                        Requested by: {r.assignedNGO?.orgName || r.assignedNGO?.name}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm border ${
                                                        r.fundraiser.status === 'pending' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                                                        r.fundraiser.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                                                        'bg-red-500/10 border-red-500/30 text-red-500'
                                                    }`}>
                                                        {r.fundraiser.status}
                                                    </span>
                                                    <p className="font-headline text-2xl font-black text-[#ffb77d] tracking-tighter mt-2">
                                                        ₹{r.fundraiser.requestedGoal}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/40">Justification</p>
                                                <p className="text-sm font-medium leading-relaxed">{r.fundraiser.billText || 'No justification provided.'}</p>
                                            </div>

                                        </div>

                                        <div className="flex flex-col gap-4 min-w-[200px]">
                                            <a 
                                                href={r.fundraiser.billImage} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="h-24 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center relative group overflow-hidden"
                                            >
                                                <img src={r.fundraiser.billImage} alt="Bill Proof" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all" />
                                                <span className="relative z-10 text-[10px] font-black uppercase tracking-widest drop-shadow-md">View Proof</span>
                                            </a>
                                            
                                            {r.fundraiser.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button 
                                                        disabled={acting[r._id]}
                                                        onClick={async () => {
                                                            try {
                                                                setActing(prev => ({ ...prev, [r._id]: true }));
                                                                await api.put(`/admin/rescue/${r._id}/fundraiser/review`, { action: 'reject' });
                                                                toast.success('Rejected the request.');
                                                                fetchFundraisers();
                                                            } catch (err) {
                                                                toast.error(err.response?.data?.message || 'Error occurred');
                                                            } finally {
                                                                setActing(prev => ({ ...prev, [r._id]: false }));
                                                            }
                                                        }}
                                                        className="flex-1 py-3 rounded-xl border border-red-500/30 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        {acting[r._id] ? '...' : 'Reject'}
                                                    </button>
                                                    
                                                    <button
                                                        disabled={acting[r._id]}
                                                        onClick={async () => {
                                                            try {
                                                                setActing(prev => ({ ...prev, [r._id]: true }));
                                                                await api.put(`/admin/rescue/${r._id}/fundraiser/review`, { action: 'approve' });
                                                                toast.success('Approved successfully.');
                                                                fetchFundraisers();
                                                            } catch (err) {
                                                                toast.error(err.response?.data?.message || 'Error occurred');
                                                            } finally {
                                                                setActing(prev => ({ ...prev, [r._id]: false }));
                                                            }
                                                        }} 
                                                        className="flex-[2] py-3 rounded-xl bg-[#ffb77d] text-[#131313] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,183,125,0.2)]"
                                                    >
                                                        {acting[r._id] ? '...' : 'Approve'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {locationModal && (
                <LocationModal
                    user={locationModal}
                    onClose={() => setLocationModal(null)}
                    onSaved={handleLocationSaved}
                />
            )}

            <div>
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-subtitle">Platform management and oversight</p>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonStatCard key={i} />)
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

            {activeTab === 'approvals' && (
                <div className="space-y-3">
                    {loading ? (
                        [1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-20" />)
                    ) : pending.length === 0 ? (
                        <div className="card text-center py-12">
                            <div className="text-5xl mb-3">OK</div>
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
                                    <p className="text-xs text-surface-muted">
                                        {u.email} · <span className="capitalize font-medium">{u.role}</span>
                                    </p>
                                    {u.regNumber && <p className="text-xs text-surface-muted">Reg: {u.regNumber}</p>}
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleApprove(u._id, true)}
                                        disabled={acting[u._id]}
                                        className="btn-primary btn-sm"
                                    >
                                        {acting[u._id] ? '...' : 'Approve'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="card overflow-hidden p-0">
                    <div className="px-5 py-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-slate-800">
                                Users ({users.filter((u) => roleFilter === 'all' || u.role === roleFilter).length})
                            </h3>
                            <span className="text-xs text-surface-muted flex items-center gap-1 mt-1">
                                <MapPinIcon className="w-3 h-3" /> Click map pin to set base location for NGO, Hospital, or Ambulance
                            </span>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-btn text-xs font-medium overflow-x-auto">
                            {['all', 'user', 'ngo', 'hospital', 'ambulance'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRoleFilter(r)}
                                    className={`px-3 py-1.5 rounded-btn capitalize transition-all whitespace-nowrap ${
                                        roleFilter === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {r === 'user' ? 'Citizen' : r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-surface-border">
                        {loading ? (
                            [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)
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
                                            {orgRoles.includes(u.role) && (
                                                <p className="text-[10px] mt-0.5 flex items-center gap-1">
                                                    {u.location?.lat ? (
                                                        <span className="text-green-600 flex items-center gap-0.5">
                                                            <MapPinIcon className="w-3 h-3" />
                                                            {u.location.address || `${Number(u.location.lat).toFixed(4)}, ${Number(u.location.lng).toFixed(4)}`}
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
                                                <span className="text-xs text-slate-500 font-medium">Rs {u.walletBalance}</span>
                                            )}
                                            {orgRoles.includes(u.role) && (
                                                <button
                                                    onClick={() => setLocationModal(u)}
                                                    title="Set base location"
                                                    className={`p-1.5 rounded transition-colors ${
                                                        u.location?.lat ? 'text-green-600 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'
                                                    }`}
                                                >
                                                    <MapPinIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                            {u.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(u._id)}
                                                    disabled={acting[u._id]}
                                                    className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                >
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

            {activeTab === 'rescues' && (
                <div className="space-y-3">
                    {loading ? (
                        [1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-20" />)
                    ) : (
                        rescues.map((r) => (
                            <div key={r._id} className="card">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{r.description}</p>
                                        <p className="text-xs text-surface-muted mt-0.5">
                                            {r.user?.name} · {formatIndianDateTime(r.createdAt)}
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
