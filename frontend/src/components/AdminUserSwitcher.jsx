import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { XMarkIcon, UserGroupIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

const ROLE_COLORS = {
    user: 'bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20',
    ngo: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
    hospital: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    ambulance: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

const DASHBOARD_ROUTES = {
    user: '/user/dashboard',
    ngo: '/ngo/dashboard',
    hospital: '/hospital/dashboard',
    ambulance: '/ambulance/dashboard',
    admin: '/admin/dashboard',
};

const AdminUserSwitcher = ({ onClose }) => {
    const { user, impersonateUser, stopImpersonating, isImpersonating } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [switching, setSwitching] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data.users || []);
        } catch (err) {
            console.error('[AdminUserSwitcher] fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSwitch = async (targetUser) => {
        setSwitching(targetUser._id);
        const res = await impersonateUser(targetUser._id);
        if (res.success) {
            onClose();
            navigate(DASHBOARD_ROUTES[targetUser.role] || '/');
        }
        setSwitching(null);
    };

    const handleBackToAdmin = async () => {
        await stopImpersonating();
        onClose();
        navigate('/admin/dashboard');
    };

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase())
    );

    // Group by role
    const grouped = filtered.reduce((acc, u) => {
        acc[u.role] = acc[u.role] || [];
        acc[u.role].push(u);
        return acc;
    }, {});
    const roleOrder = ['user', 'ngo', 'hospital', 'ambulance', 'admin'];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-[var(--border-surface)] flex items-center justify-between bg-[var(--hover-bg-overlay)]">
                    <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                        <h2 className="text-base font-bold text-[var(--text-main)]">Switch Account</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--hover-surface)] transition">
                        <XMarkIcon className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Admin banner + Back to Admin button */}
                {isImpersonating && (
                    <div className="px-5 py-3 bg-[var(--color-warning)]/10 border-b border-[var(--border-surface)] flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-[var(--color-warning)]">Currently viewing as:</p>
                            <p className="text-sm font-bold text-[var(--text-main)]">
                                {user?.impersonating?.name} ({user?.impersonating?.role})
                            </p>
                        </div>
                        <button
                            onClick={handleBackToAdmin}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-warning)] hover:brightness-110 text-white text-xs font-semibold rounded-lg transition"
                        >
                            <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                            Back to Admin
                        </button>
                    </div>
                )}

                {/* Search */}
                <div className="px-5 py-3 border-b border-[var(--border-surface)]">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search by name, email or role..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--border-surface)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 bg-[var(--bg-surface-hover)] text-[var(--text-main)]"
                            autoFocus
                        />
                    </div>
                </div>

                {/* User list */}
                <div className="overflow-y-auto flex-1 px-5 py-3 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-[var(--brand-primary)]/30 border-t-[var(--brand-primary)] rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-sm text-[var(--text-muted)] py-8">No users found</p>
                    ) : (
                        roleOrder.map(role => {
                            const roleUsers = grouped[role];
                            if (!roleUsers?.length) return null;
                            return (
                                <div key={role}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
                                        {role} ({roleUsers.length})
                                    </p>
                                    <div className="space-y-1.5">
                                        {roleUsers.map(u => {
                                            const isCurrentlyViewing =
                                                user?.impersonating?.userId?.toString() === u._id?.toString();
                                            return (
                                                <button
                                                    key={u._id}
                                                    onClick={() => handleSwitch(u)}
                                                    disabled={switching === u._id || isCurrentlyViewing}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${isCurrentlyViewing
                                                            ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20 cursor-default'
                                                            : 'border-[var(--border-surface)] hover:border-[var(--brand-primary)]/20 hover:bg-[var(--brand-primary)]/5 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] flex items-center justify-center shrink-0">
                                                        <span className="text-white text-xs font-bold">
                                                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-[var(--text-main)] truncate">{u.name}</p>
                                                        <p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isCurrentlyViewing && (
                                                            <span className="text-[10px] text-[var(--brand-primary)] font-bold">Viewing</span>
                                                        )}
                                                        {switching === u._id && (
                                                            <div className="w-4 h-4 border-2 border-[var(--brand-primary)]/30 border-t-[var(--brand-primary)] rounded-full animate-spin" />
                                                        )}
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${ROLE_COLORS[u.role] || 'bg-[var(--hover-bg-overlay)] text-[var(--text-muted)]'}`}>
                                                            {u.role}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminUserSwitcher;