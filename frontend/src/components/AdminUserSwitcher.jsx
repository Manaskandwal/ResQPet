import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { XMarkIcon, UserGroupIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

const ROLE_COLORS = {
    user: 'bg-blue-50 text-blue-700 border-blue-200',
    ngo: 'bg-green-50 text-green-700 border-green-200',
    hospital: 'bg-rose-50 text-rose-700 border-rose-200',
    ambulance: 'bg-orange-50 text-orange-700 border-orange-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-indigo-50">
                    <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5 text-primary-600" />
                        <h2 className="text-base font-bold text-slate-800">Switch Account</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/80 transition">
                        <XMarkIcon className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Admin banner + Back to Admin button */}
                {isImpersonating && (
                    <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-amber-700">Currently viewing as:</p>
                            <p className="text-sm font-bold text-amber-900">
                                {user?.impersonating?.name} ({user?.impersonating?.role})
                            </p>
                        </div>
                        <button
                            onClick={handleBackToAdmin}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition"
                        >
                            <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                            Back to Admin
                        </button>
                    </div>
                )}

                {/* Search */}
                <div className="px-5 py-3 border-b border-slate-100">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email or role..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-slate-50"
                            autoFocus
                        />
                    </div>
                </div>

                {/* User list */}
                <div className="overflow-y-auto flex-1 px-5 py-3 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-8">No users found</p>
                    ) : (
                        roleOrder.map(role => {
                            const roleUsers = grouped[role];
                            if (!roleUsers?.length) return null;
                            return (
                                <div key={role}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
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
                                                            ? 'bg-primary-50 border-primary-200 cursor-default'
                                                            : 'border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                                                        <span className="text-white text-xs font-bold">
                                                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                                                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isCurrentlyViewing && (
                                                            <span className="text-[10px] text-primary-600 font-bold">Viewing</span>
                                                        )}
                                                        {switching === u._id && (
                                                            <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                                                        )}
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${ROLE_COLORS[u.role] || 'bg-slate-50 text-slate-500'}`}>
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
