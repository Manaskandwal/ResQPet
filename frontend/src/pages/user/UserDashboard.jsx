import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge, StatusTimeline } from '../../components/StatusComponents';
import { SkeletonCard, SkeletonStatCard } from '../../components/Skeleton';
import { formatIndianDate, formatIndianDateTime } from '../../utils/dateTime';
import {
    WalletIcon, PlusCircleIcon, ClipboardDocumentListIcon,
    CheckCircleIcon, ClockIcon, ArrowRightIcon, ChevronDoubleDownIcon,
    XMarkIcon,
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
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [rescues, setRescues] = useState([]);
    const [wallet, setWallet] = useState({ walletBalance: user?.walletBalance || 0, transactions: [] });
    const [loading, setLoading] = useState(true);
    const [topupAmt, setTopupAmt] = useState('');
    const [paying, setPaying] = useState(false);
    const [mockPaying, setMockPaying] = useState(false);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
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

    // ── MOCK PAYMENT (testing without Razorpay) ───────────────────────────────
    const handleMockTopup = async (amount) => {
        setMockPaying(true);
        try {
            const paymentStatus = 'success'; // temporary for testing
            console.log('[Mock] paymentStatus =', paymentStatus, '| crediting ₹', amount);
            const { data } = await api.post('/payment/mock-topup', { amount });
            toast.success(data.message);
            updateUser({ walletBalance: data.walletBalance });
            setWallet((p) => ({ ...p, walletBalance: data.walletBalance }));
            fetchData();
        } catch (error) {
            console.error('[Mock] mockTopup error:', error.message);
            toast.error(error.response?.data?.message || 'Mock top-up failed.');
        } finally {
            setMockPaying(false);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="page-subtitle">Help animals in need around you.</p>
                </div>
                <button
                    onClick={() => setWalletModalOpen(true)}
                    className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
                >
                    <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                        <WalletIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Wallet</p>
                        <p className="text-sm font-bold text-slate-700 leading-none">₹{wallet.walletBalance.toFixed(2)}</p>
                    </div>
                </button>
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
                {/* Rescue Requests */}
                <div className="lg:col-span-3 space-y-4">
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
                            {[rescues[0]].map((rescue) => (
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
                                    <StatusTimeline rescue={rescue} />
                                    <p className="text-[11px] text-surface-muted mt-3">
                                        Reported {formatIndianDateTime(rescue.createdAt)}
                                    </p>
                                </Link>
                            ))}
                            {rescues.length > 1 && (
                                <Link
                                    to="/user/reports"
                                    className="flex flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm font-semibold text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                                >
                                    <ChevronDoubleDownIcon className="h-5 w-5" />
                                    <span>View More Rescue Reports</span>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Wallet Modal */}
            <Transition appear show={walletModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setWalletModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <WalletIcon className="w-6 h-6 text-primary-600" />
                                        My Wallet
                                    </Dialog.Title>
                                    <button onClick={() => setWalletModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-[24px] overflow-hidden relative p-4 mb-4">
                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
                                    <div className="absolute -right-4 top-8 w-20 h-20 bg-white/5 rounded-full" />
                                    <div className="relative z-10">
                                        <span className="text-primary-100 text-xs font-medium">Available Balance</span>
                                        <p className="text-3xl font-bold mt-1 mb-1">₹{wallet.walletBalance.toFixed(2)}</p>
                                        <p className="text-primary-200 text-[10px] leading-tight opacity-80">
                                            ₹30 service fee per rescue. Refunded only if no work starts.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Top-up Wallet</label>
                                        <div className="flex gap-2">
                                            {[50, 100, 200].map((amt) => (
                                                <button key={amt} onClick={() => handleMockTopup(amt)}
                                                    disabled={mockPaying}
                                                    className="flex-1 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all active:scale-95">
                                                    +₹{amt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            ref={topupRef}
                                            type="number" min="10" placeholder="Custom amount"
                                            value={topupAmt}
                                            onChange={(e) => setTopupAmt(e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        />
                                        <button onClick={handleTopup} disabled={paying} className="btn-primary px-6 py-2 rounded-xl font-bold text-sm">
                                            {paying ? '...' : 'Pay'}
                                        </button>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-slate-800 text-sm">Recent Transactions</h3>
                                            <button
                                                onClick={() => { setWalletModalOpen(false); navigate('/user/payments?tab=all'); }}
                                                className="btn-outline btn-sm px-3 py-1 text-xs"
                                            >
                                                View All
                                            </button>
                                        </div>
                                        {wallet.transactions.length === 0 ? (
                                            <p className="text-slate-400 text-xs text-center py-4">No transactions yet.</p>
                                        ) : (
                                            <div className="space-y-3 pr-1">
                                                {wallet.transactions.slice(0, 5).map((txn) => (
                                                    <div key={txn._id} className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{txn.description}</p>
                                                            <p className="text-[10px] text-slate-400">{formatIndianDate(txn.createdAt)}</p>
                                                        </div>
                                                        <span className={`text-xs font-bold ${txn.type === 'credit' || txn.type === 'refund' ? 'text-green-600' : 'text-red-500'}`}>
                                                            {txn.type === 'debit' ? '-' : '+'}₹{txn.amount}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default UserDashboard;
