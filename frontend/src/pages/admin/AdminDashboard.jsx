import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { SkeletonStatCard, SkeletonRow } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusComponents';
import {
    UsersIcon, ClipboardDocumentListIcon, CheckCircleIcon,
    ClockIcon, ShieldCheckIcon, TruckIcon, BuildingOffice2Icon,
    HeartIcon, TrashIcon,
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [pending, setPending] = useState([]);
    const [users, setUsers] = useState([]);
    const [rescues, setRescues] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState({});

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
            console.log(`[AdminDashboard] ${approve ? 'Approving' : 'Revoking'} userId:`, userId);
            const { data } = await api.put(`/admin/approve/${userId}`, { approve });
            toast.success(data.message);
            setPending((p) => p.filter((u) => u._id !== userId));
            fetchAll();
        } catch (error) {
            console.error('[AdminDashboard] Approve error:', error.message);
            toast.error(error.response?.data?.message || 'Action failed.');
        } finally {
            setActing((p) => ({ ...p, [userId]: false }));
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        setActing((p) => ({ ...p, [userId]: true }));
        try {
            console.log('[AdminDashboard] Deleting userId:', userId);
            await api.delete(`/admin/user/${userId}`);
            toast.success('User deleted.');
            setUsers((p) => p.filter((u) => u._id !== userId));
        } catch (error) {
            console.error('[AdminDashboard] Delete error:', error.message);
            toast.error(error.response?.data?.message || 'Delete failed.');
        } finally {
            setActing((p) => ({ ...p, [userId]: false }));
        }
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
        { id: 'approvals', label: `Approvals ${pending.length > 0 ? `(${pending.length})` : ''}` },
        { id: 'users', label: 'Users' },
        { id: 'rescues', label: 'Rescues' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">Admin Dashboard 🛡️</h1>
                <p className="page-subtitle">Platform management and oversight</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-btn w-fit flex-wrap">
                {tabs.map((tab) => (
                    <button key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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
                    <div className="px-5 py-4 border-b border-surface-border">
                        <h3 className="font-semibold text-slate-800">All Users ({users.length})</h3>
                    </div>
                    <div className="divide-y divide-surface-border">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
                        ) : (
                            users.map((u) => (
                                <div key={u._id} className="flex items-center gap-3 px-5 py-3">
                                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-slate-600">
                                        {u.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                                        <p className="text-xs text-surface-muted truncate">{u.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`badge text-[10px] capitalize ${u.isApproved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {u.role}
                                        </span>
                                        {u.role === 'user' && (
                                            <span className="text-xs text-slate-500 font-medium">₹{u.walletBalance}</span>
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
                        [1, 2, 3].map(i => <SkeletonCard key={i} />)
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
