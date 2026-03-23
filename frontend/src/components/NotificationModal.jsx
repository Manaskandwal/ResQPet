import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { formatIndianDateTime } from '../utils/dateTime';
import { 
    BellIcon, 
    CheckCircleIcon, 
    TrashIcon, 
    ExclamationTriangleIcon, 
    CreditCardIcon,
    XMarkIcon 
} from '@heroicons/react/24/outline';

export default function NotificationModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'system', 'rescue', 'wallet'
    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

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
        if (user && isOpen) fetchNotifications();
    }, [user, isOpen]);

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
        return <BellIcon className="w-5 h-5 text-primary" />;
    };

    const filtered = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.isRead;
        if (filter === 'system') return n.type === 'system' || n.type.includes('approval');
        if (filter === 'rescue') return n.type.includes('rescue');
        if (filter === 'wallet') return n.type.includes('wallet');
        return true;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

            {/* Modal Content */}
            <div 
                className={`relative w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-[2.5rem] border shadow-2xl transition-all animate-in fade-in zoom-in duration-200 ${
                    isNewUI 
                    ? 'bg-surface border-surface-border text-on-background' 
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-8 py-6 flex items-center justify-between border-b ${
                    isNewUI ? 'border-surface-border bg-surface/50' : 'border-slate-100 bg-slate-50'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isNewUI ? 'bg-primary/10 text-primary' : 'bg-primary-50 text-primary-600'
                        }`}>
                            <BellIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-headline font-black tracking-tight ${isNewUI ? '' : 'text-slate-800'}`}>
                                Comms <span className="text-primary">Link</span>
                            </h2>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isNewUI ? 'text-on-background/40' : 'text-slate-400'}`}>
                                Mission Control Notifications
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleMarkAllRead} 
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                isNewUI 
                                ? 'bg-surface-hover border border-surface-border text-on-background/60 hover:text-on-background' 
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                            }`}
                        >
                            Mark All Read
                        </button>
                        <button onClick={onClose} className={`p-2 rounded-xl transition-all ${
                            isNewUI ? 'hover:bg-surface-hover text-on-background/40 hover:text-on-background' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                        }`}>
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className={`px-8 py-4 border-b overflow-x-auto flex gap-2 no-scrollbar ${
                    isNewUI ? 'border-surface-border bg-surface/30' : 'border-slate-50 bg-white'
                }`}>
                    {['all', 'unread', 'rescue', 'wallet', 'system'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 whitespace-nowrap rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                filter === f 
                                ? (isNewUI ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-primary-600 text-white shadow-md')
                                : (isNewUI ? 'text-on-background/40 hover:bg-surface-hover hover:text-on-background' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600')
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Body / List */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 no-scrollbar">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">Syncing Comms...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className={`w-20 h-20 mx-auto rounded-3xl border border-dashed flex items-center justify-center ${
                                isNewUI ? 'border-surface-border text-on-background/10' : 'border-slate-200 text-slate-200'
                            }`}>
                                <BellIcon className="w-10 h-10" />
                            </div>
                            <div className="space-y-1">
                                <h3 className={`font-bold ${isNewUI ? 'text-on-background' : 'text-slate-600'}`}>No Alerts</h3>
                                <p className={`text-xs ${isNewUI ? 'text-on-background/40' : 'text-slate-400'}`}>Your comms channel is clear for now.</p>
                            </div>
                        </div>
                    ) : (
                        filtered.map(n => (
                            <div 
                                key={n._id} 
                                className={`group p-5 rounded-3xl border transition-all flex gap-4 ${
                                    isNewUI 
                                    ? `bg-surface-hover/50 hover:bg-surface-hover ${n.isRead ? 'border-surface-border opacity-60' : 'border-primary/20'}` 
                                    : `bg-white hover:border-primary/20 ${n.isRead ? 'border-slate-100' : 'border-primary/10 shadow-sm'}`
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                    isNewUI ? 'bg-surface-hover border border-surface-border' : 'bg-slate-50'
                                }`}>
                                    {getIconForType(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-sm ${isNewUI ? 'text-on-background' : 'text-slate-900'}`}>{n.title}</h4>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap pl-2 ${isNewUI ? 'text-on-background/30' : 'text-slate-400'}`}>
                                            {formatIndianDateTime(n.createdAt)}
                                        </span>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${isNewUI ? 'text-on-background/60' : 'text-slate-600'}`}>{n.message}</p>
                                </div>
                                <div className="flex flex-col justify-between items-end pl-2">
                                    {!n.isRead && (
                                        <button 
                                            onClick={() => handleMarkAsRead(n._id)} 
                                            className={`p-1.5 rounded-lg transition-all ${
                                                isNewUI ? 'text-primary hover:bg-primary/10' : 'text-primary-600 hover:bg-primary-50'
                                            }`} 
                                            title="Mark as read"
                                        >
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDelete(n._id)} 
                                        className={`p-1.5 rounded-lg transition-all mt-auto scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 ${
                                            isNewUI ? 'text-red-400 hover:bg-red-400/10' : 'text-red-500 hover:bg-red-50'
                                        }`} 
                                        title="Delete alert"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className={`px-8 py-4 text-center border-t ${
                    isNewUI ? 'border-surface-border bg-surface/50' : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isNewUI ? 'text-on-background/20' : 'text-slate-400'}`}>
                        Comms Link Protected
                    </p>
                </div>
            </div>
        </div>
    );
}
