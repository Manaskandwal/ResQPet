import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { formatIndianDateTime } from '../utils/dateTime';
import { BellIcon, CheckCircleIcon, TrashIcon, ExclamationTriangleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

export default function Notifications() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'system', 'rescue', 'wallet'
    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';
    const isDark = theme === 'dark';

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications || []);
        } catch (error) {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All marked as read');
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            toast.error('Deletion failed');
        }
    };

    const getIconForType = (type = '') => {
        if (type.includes('rescue')) return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
        if (type.includes('wallet')) return <CreditCardIcon className="w-5 h-5 text-emerald-500" />;
        if (type.includes('approval')) return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
        return <BellIcon className="w-5 h-5 text-[#76d6d5]" />;
    };

    const filtered = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.isRead;
        if (filter === 'system') return n.type === 'system' || n.type.includes('approval');
        if (filter === 'rescue') return n.type.includes('rescue');
        if (filter === 'wallet') return n.type.includes('wallet');
        return true;
    });

    if (loading) {
        return (
            <div className={`p-8 min-h-[50vh] flex items-center justify-center ${isNewUI ? 'text-[#76d6d5]' : 'text-primary'}`}>
                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`max-w-4xl mx-auto space-y-6 animate-fade-in ${isNewUI ? 'resqpet-obsidian-theme text-[#e5e2e1]' : ''}`}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-extrabold ${isNewUI ? 'font-headline text-[#e5e2e1]' : 'text-slate-800'}`}>
                        Comms <span className={isNewUI ? 'text-[#76d6d5]' : 'text-primary'}>Link</span>
                    </h1>
                    <p className={`text-sm mt-2 ${isNewUI ? 'text-[#e5e2e1]/50' : 'text-slate-500'}`}>Your mission updates and system alerts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleMarkAllRead} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
                        isNewUI
                        ? `bg-surface-card border border-surface-border text-on-background/60 hover:text-on-background hover:bg-surface-hover`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                        Mark All Read
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={`flex overflow-x-auto p-1.5 rounded-2xl border backdrop-blur-xl ${isNewUI ? 'bg-surface-card/50 border-surface-border' : 'bg-white border-slate-200 shadow-sm'}`}>
                {['all', 'unread', 'rescue', 'wallet', 'system'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-2 whitespace-nowrap rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            filter === f
                            ? (isNewUI ? 'bg-brand text-[#131313] shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)]' : 'bg-primary text-white')
                            : (isNewUI ? 'text-on-background/40 hover:text-on-background' : 'text-slate-500 hover:text-slate-900')
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className={`py-20 text-center rounded-3xl border border-dashed ${isNewUI ? 'glass-card border-surface-border' : 'bg-white border-slate-200'}`}>
                        <BellIcon className={`w-12 h-12 mx-auto mb-4 ${isNewUI ? 'text-on-surface/10' : 'text-slate-200'}`} />
                        <h3 className={`font-bold ${isNewUI ? 'text-on-background' : 'text-slate-600'}`}>No Alerts</h3>
                        <p className={`text-sm ${isNewUI ? 'text-on-background/40' : 'text-slate-400'}`}>Your comms channel is clear.</p>
                    </div>
                ) : (
                    filtered.map(n => {
                        if (!n) return null;
                        return (
                        <div key={n._id} className={`p-5 rounded-2xl border transition-all flex gap-4 ${
                            isNewUI
                            ? `glass-card bg-surface-card ${n.isRead ? 'border-surface-border opacity-75' : 'border-brand/30 shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.05)]'}`
                            : `bg-white hover:border-primary/30 ${n.isRead ? 'border-slate-100' : 'border-primary/20 shadow-sm'}`
                        }`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                isNewUI ? 'bg-surface-hover border border-surface-border' : 'bg-slate-50'
                            }`}>
                                {getIconForType(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold text-sm ${isNewUI ? 'text-on-background' : 'text-slate-900'}`}>{n.title}</h4>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap pl-2 ${isNewUI ? 'text-on-background/40' : 'text-slate-400'}`}>
                                        {formatIndianDateTime(n.createdAt)}
                                    </span>
                                </div>
                                <p className={`text-sm ${isNewUI ? 'text-on-background/60' : 'text-slate-600'}`}>{n.message}</p>
                            </div>
                            <div className="flex flex-col justify-between items-end pl-2">

                                {!n.isRead && (
                                    <button onClick={() => handleMarkAsRead(n._id)} className={`p-1.5 rounded-lg transition-colors ${isNewUI ? 'text-brand hover:bg-surface-hover' : 'text-primary hover:bg-primary-50'}`} title="Mark as read">
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => handleDelete(n._id)} className={`p-1.5 rounded-lg transition-colors mt-auto ${isNewUI ? 'text-red-400/50 hover:text-red-400 hover:bg-red-400/10' : 'text-red-400 hover:bg-red-50'}`} title="Delete alert">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )})
                )}
            </div>
        </div>
    );
}
