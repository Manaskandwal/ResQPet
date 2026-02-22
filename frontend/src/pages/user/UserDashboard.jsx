import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge, StatusTimeline } from '../../components/StatusComponents';
import { SkeletonCard, SkeletonStatCard } from '../../components/Skeleton';
import {
    WalletIcon, PlusCircleIcon, ClipboardDocumentListIcon,
    ArrowUpTrayIcon, CheckCircleIcon, ClockIcon,
} from '@heroicons/react/24/outline';

// ── Razorpay helper ────────────────────────────────────────────────────────────
const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const UserDashboard = () => {
    const { user, updateUser } = useAuth();
    const [rescues, setRescues] = useState([]);
    const [wallet, setWallet] = useState({ walletBalance: user?.walletBalance || 0, transactions: [] });
    const [loading, setLoading] = useState(true);
    const [topupAmt, setTopupAmt] = useState('');
    const [paying, setPaying] = useState(false);
    const topupRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            console.log('[UserDashboard] Fetching data...');
            const [rescRes, walletRes] = await Promise.all([
                api.get('/rescue/mine'),
                api.get('/user/wallet'),
            ]);
            setRescues(rescRes.data.rescues);
            setWallet({ walletBalance: walletRes.data.walletBalance, transactions: walletRes.data.transactions });
            updateUser({ walletBalance: walletRes.data.walletBalance });
            console.log('[UserDashboard] Data loaded: rescues=', rescRes.data.count, 'balance=₹', walletRes.data.walletBalance);
        } catch (error) {
            console.error('[UserDashboard] Fetch error:', error.message);
            toast.error('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleTopup = async () => {
        const amount = parseFloat(topupAmt);
        if (!amount || amount < 10) { toast.error('Minimum top-up is ₹10.'); return; }

        setPaying(true);
        try {
            console.log('[UserDashboard] Initiating Razorpay top-up for ₹', amount);
            const loaded = await loadRazorpay();
            if (!loaded) { toast.error('Failed to load Razorpay. Check your internet connection.'); return; }

            const { data } = await api.post('/payment/create-order', { amount });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || data.keyId,
                amount: data.order.amount,
                currency: 'INR',
                name: 'PawSaarthi',
                description: 'Wallet Top-up',
                order_id: data.order.id,
                handler: async (response) => {
                    try {
                        console.log('[UserDashboard] Razorpay payment successful, verifying...');
                        const verifyRes = await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount,
                        });
                        toast.success(`₹${amount} added to wallet! 🎉`);
                        updateUser({ walletBalance: verifyRes.data.walletBalance });
                        setWallet((p) => ({ ...p, walletBalance: verifyRes.data.walletBalance }));
                        setTopupAmt('');
                        fetchData();
                    } catch (verifyErr) {
                        console.error('[UserDashboard] Payment verification failed:', verifyErr.message);
                        toast.error('Payment verification failed. Contact support.');
                    }
                },
                prefill: { name: user?.name, email: user?.email },
                theme: { color: '#0d9488' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (resp) => {
                console.error('[UserDashboard] Razorpay payment failed:', resp.error);
                toast.error(`Payment failed: ${resp.error.description}`);
            });
            rzp.open();
        } catch (error) {
            console.error('[UserDashboard] Top-up error:', error.message);
            toast.error(error.response?.data?.message || 'Failed to initiate payment.');
        } finally {
            setPaying(false);
        }
    };

    const stats = [
        { label: 'Total Reports', value: rescues.length, Icon: ClipboardDocumentListIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Rescues', value: rescues.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length, Icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Completed', value: rescues.filter(r => r.status === 'completed').length, Icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <SkeletonStatCard key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="page-title">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
                <p className="page-subtitle">Help animals in need around you.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map(({ label, value, Icon, color, bg }) => (
                    <div key={label} className="stat-card">
                        <div className={`w-10 h-10 ${bg} rounded-btn flex items-center justify-center mb-1`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <p className="stat-value">{value}</p>
                        <p className="stat-label">{label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Wallet Card */}
                <div className="lg:col-span-1">
                    <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-card overflow-hidden relative">
                        {/* Decorative circle */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
                        <div className="absolute -right-4 top-8 w-20 h-20 bg-white/5 rounded-full" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <WalletIcon className="w-5 h-5 text-primary-200" />
                                <span className="text-primary-100 text-sm font-medium">Wallet Balance</span>
                            </div>
                            <p className="text-4xl font-bold mb-1">₹{wallet.walletBalance.toFixed(2)}</p>
                            <p className="text-primary-200 text-xs mb-5">₹20 deposit required per rescue</p>

                            {/* Top-up section */}
                            <div className="flex gap-2">
                                <input
                                    ref={topupRef}
                                    type="number" min="10" step="10" placeholder="Amount (₹)"
                                    value={topupAmt}
                                    onChange={(e) => setTopupAmt(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-btn bg-white/20 border border-white/30
                             text-white placeholder-primary-200 text-sm focus:outline-none
                             focus:ring-2 focus:ring-white/40"
                                />
                                <button onClick={handleTopup} disabled={paying} className="btn bg-white text-primary-700 hover:bg-primary-50 font-bold text-sm px-4 flex-shrink-0">
                                    {paying ? '...' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recent transactions */}
                    <div className="card mt-4">
                        <h3 className="font-semibold text-slate-700 text-sm mb-3">Recent Transactions</h3>
                        {wallet.transactions.length === 0 ? (
                            <p className="text-surface-muted text-sm text-center py-4">No transactions yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {wallet.transactions.slice(0, 5).map((txn) => (
                                    <div key={txn._id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                                        <div>
                                            <p className="text-xs font-medium text-slate-700 truncate max-w-[160px]">{txn.description}</p>
                                            <p className="text-[11px] text-surface-muted">{new Date(txn.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-sm font-bold ${txn.type === 'credit' || txn.type === 'refund' ? 'text-green-600' : 'text-red-500'}`}>
                                            {txn.type === 'debit' ? '-' : '+'}₹{txn.amount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Rescue Requests */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">My Rescue Reports</h2>
                        <Link to="/user/submit-rescue" className="btn-accent btn-sm">
                            <PlusCircleIcon className="w-4 h-4" />
                            Report Animal
                        </Link>
                    </div>

                    {rescues.length === 0 ? (
                        <div className="card text-center py-12">
                            <div className="text-5xl mb-3">🐾</div>
                            <p className="text-slate-600 font-medium">No rescue reports yet.</p>
                            <p className="text-surface-muted text-sm mt-1 mb-4">Spot an animal in need? Report it!</p>
                            <Link to="/user/submit-rescue" className="btn-primary inline-flex">
                                <PlusCircleIcon className="w-4 h-4" />
                                Submit First Report
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rescues.map((rescue) => (
                                <Link key={rescue._id} to={`/user/rescue/${rescue._id}`}
                                    className="card-hover block cursor-pointer">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{rescue.description}</p>
                                            <p className="text-xs text-surface-muted mt-0.5">
                                                📍 {rescue.location.address || `${rescue.location.lat.toFixed(4)}, ${rescue.location.lng.toFixed(4)}`}
                                            </p>
                                        </div>
                                        <StatusBadge status={rescue.status} />
                                    </div>
                                    {rescue.images?.[0] && (
                                        <img src={rescue.images[0]} alt="rescue" className="w-full h-32 object-cover rounded-btn mb-3" />
                                    )}
                                    <div className="divider" />
                                    <StatusTimeline status={rescue.status} />
                                    <p className="text-[11px] text-surface-muted mt-3">
                                        Reported {new Date(rescue.createdAt).toLocaleString()}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
