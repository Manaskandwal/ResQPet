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
    const [currentZone, setCurrentZone] = useState('Locating...');
    const topupRef = useRef(null);

    // Fetch real live location and reverse geocode to get area name
    useEffect(() => {
        if (!navigator.geolocation) { setCurrentZone('Location unavailable'); return; }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const data = await res.json();
                    const addr = data.address;
                    // Pick the most specific locality name available
                    const zone = addr.neighbourhood || addr.suburb || addr.quarter || addr.village || addr.town || addr.city || addr.county || 'Your Area';
                    setCurrentZone(zone);
                } catch { setCurrentZone('Your Area'); }
            },
            () => setCurrentZone('Location unavailable'),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
        );
    }, []);

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
                name: 'VetsCue',
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

    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

    if (loading) {
        return (
            <div className={`space-y-6 ${isNewUI ? 'resqpet-obsidian-theme' : ''}`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <SkeletonStatCard key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-12">
                {/* Header Section */}
                <section>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">
                                Hello, <span className="text-[#76d6d5]">{user?.name?.split(' ')[0]}</span>
                            </h1>
                            <p className="text-[10px] text-[#e5e2e1]/30 font-black uppercase tracking-[0.2em] leading-relaxed">
                                Your help saves lives. Ready to help an animal today?
                            </p>
                        </div>
                        {/* Wallet Summary Card */}
                        <div 
                            onClick={() => setWalletModalOpen(true)}
                            className="glass-card rounded-[2rem] p-6 flex items-center gap-4 min-w-[280px] border border-white/5 bg-[#1c1b1b]/50 cursor-pointer hover:bg-[#1c1b1b] transition-all group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5] group-hover:scale-110 transition-transform">
                                <WalletIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold font-headline transition-all">₹{wallet.walletBalance.toFixed(2)}</div>
                                <div className="text-[10px] text-[#76d6d5] font-black uppercase tracking-widest">Available Balance</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Hero: Report CTA & Stats */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    <div className="lg:col-span-8 relative rounded-[2.5rem] overflow-hidden group min-h-[400px] border border-white/5 bg-[#1c1b1b]">
                        <div className="absolute inset-0 opacity-20 grayscale bg-[url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#131313] via-[#131313]/40 to-transparent"></div>
                        </div>
                        <div className="relative h-full p-8 md:p-12 flex flex-col justify-center max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#76d6d5]/10 text-[#76d6d5] text-xs font-bold uppercase tracking-widest mb-6 w-fit">
                                <span className="w-2 h-2 rounded-full bg-[#76d6d5] animate-pulse"></span>
                                Citizen Guardian
                            </div>
                            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4 leading-tight">Spot an animal in distress?</h2>
                            <p className="text-[#e5e2e1]/70 mb-8 text-lg">Pin the location and upload a photo. Our rapid response team is on standby 24/7.</p>
                            <button 
                                onClick={() => navigate('/user/submit-rescue')}
                                className="w-fit flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-[#76d6d5] to-[#008080] text-[#131313] font-bold rounded-full hover:scale-105 transition-all shadow-xl active:scale-95"
                            >
                                <span className="material-symbols-outlined">campaign</span>
                                Report an Animal
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {stats.map(({ label, value, Icon, color }) => (
                            <div key={label} className="glass-card rounded-[2rem] p-6 border border-white/5 bg-[#1c1b1b]/30 flex items-center gap-5 group hover:bg-[#1c1b1b]/50 transition-all">
                                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-3xl font-headline font-black text-[#e5e2e1]">{value}</p>
                                    <p className="text-xs font-bold text-[#e5e2e1]/40 uppercase tracking-widest">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recent Reports Section */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="font-headline text-2xl font-bold tracking-tight text-[#e5e2e1]">Your Recent Reports</h2>
                        <Link to="/user/reports" className="text-sm font-bold text-[#76d6d5] hover:underline flex items-center gap-2 group">
                            View All <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {rescues.length === 0 ? (
                        <div className="glass-card rounded-[2.5rem] border-2 border-dashed border-white/10 p-12 text-center flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-primary/30 mb-4">
                                <PlusCircleIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No rescue reports yet</h3>
                            <p className="text-[#e5e2e1]/40 mb-8 max-w-sm">Every report matters. Start by submitting your first animal rescue report today.</p>
                            <Link to="/user/submit-rescue" className="px-8 py-3 bg-white/5 border border-white/10 rounded-full font-bold hover:bg-white/10 transition-all">
                                Get Started
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {rescues.slice(0, 3).map((rescue) => (
                                <Link 
                                    key={rescue._id} 
                                    to={`/user/rescue/${rescue._id}`}
                                    className="glass-card rounded-[2.5rem] overflow-hidden group border border-white/5 bg-[#1c1b1b] flex flex-col hover:-translate-y-2 transition-all duration-300"
                                >
                                    <div className="h-56 relative overflow-hidden">
                                        <img 
                                            src={rescue.images?.[0] || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'} 
                                            alt="rescue" 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70" 
                                        />
                                        <div className="absolute top-4 right-4">
                                            <StatusBadge status={rescue.status} />
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#1c1b1b] to-transparent">
                                            <p className="text-xs text-[#76d6d5] font-black uppercase tracking-widest mb-1">
                                                {formatIndianDate(rescue.createdAt)}
                                            </p>
                                            <h4 className="font-headline font-bold text-lg truncate text-[#e5e2e1]">{rescue.description}</h4>
                                        </div>
                                    </div>
                                    <div className="p-6 pt-2 space-y-4">
                                        <div className="flex items-center gap-2 text-xs text-[#e5e2e1]/50">
                                            <span className="material-symbols-outlined">location_on</span>
                                            <span className="truncate">{rescue.location.address || 'Unknown Location'}</span>
                                        </div>
                                         <div className="pt-4 border-t border-white/5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-[#e5e2e1]/30 uppercase tracking-widest leading-none mb-1">Current Milestone</span>
                                                    <span className="text-sm font-bold text-[#76d6d5]">
                                                        {rescue.status === 'hospital_broadcasted' || rescue.status === 'ambulance_pinged' ? 'Help in Progress' : rescue.status.replace(/_/g, ' ').toUpperCase()}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/user/rescue/${rescue._id}`); }}
                                                    className="p-2 rounded-xl bg-white/5 border border-white/5 text-[#e5e2e1]/40 hover:text-[#76d6d5] transition-all"
                                                >
                                                    <ArrowRightIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            <div className="group/timeline relative cursor-help">
                                                <div className="flex items-center gap-1 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                                                    <div className="h-full bg-[#76d6d5] shadow-[0_0_10px_rgba(118,214,213,0.5)] transition-all duration-500" style={{ width: rescue.status === 'completed' ? '100%' : '40%' }} />
                                                </div>
                                                {/* Tooltip hint */}
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#131313] border border-white/10 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-[#76d6d5] opacity-0 group-hover/timeline:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                    Click for Full Progress
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Wallet Modal Override */}
                <Transition appear show={walletModalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50 resqpet-obsidian-theme" onClose={() => setWalletModalOpen(false)}>
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-[#131313]/90 backdrop-blur-xl" />
                        </Transition.Child>

                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-lg rounded-[3rem] bg-[#1c1b1b] p-8 border border-white/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center justify-between mb-8">
                                        <Dialog.Title className="text-2xl font-headline font-extrabold text-[#e5e2e1] flex items-center gap-3">
                                            <WalletIcon className="w-8 h-8 text-[#76d6d5]" />
                                            Unified Wallet
                                        </Dialog.Title>
                                        <button onClick={() => setWalletModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-[#e5e2e1]/40">
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="glass-card bg-gradient-to-br from-[#76d6d5]/20 to-[#008080]/20 rounded-[2.5rem] border border-[#76d6d5]/30 p-8 mb-8 relative overflow-hidden group">
                                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#76d6d5]/10 rounded-full blur-3xl" />
                                        <div className="relative z-10 text-center py-4">
                                            <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Available Balance</span>
                                            <p className="text-5xl font-headline font-black mt-2 mb-2 text-[#e5e2e1]">₹{wallet.walletBalance.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black text-[#e5e2e1]/40 uppercase tracking-widest mb-3 px-2">Quick Top-up</label>
                                            <div className="flex gap-2">
                                                {[50, 100, 200, 500].map((amt) => (
                                                    <button key={amt} onClick={() => handleMockTopup(amt)}
                                                        disabled={mockPaying}
                                                        className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/5 text-[#e5e2e1] text-xs font-bold hover:bg-[#76d6d5]/10 hover:border-[#76d6d5]/30 transition-all active:scale-95 disabled:opacity-50">
                                                        +₹{amt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    ref={topupRef}
                                                    type="number" min="10" placeholder="Custom"
                                                    value={topupAmt}
                                                    onChange={(e) => setTopupAmt(e.target.value)}
                                                    className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/5 text-[#e5e2e1] text-sm focus:outline-none focus:ring-2 focus:ring-[#76d6d5]/20 focus:border-[#76d6d5]/50 transition-all font-bold placeholder:text-[#e5e2e1]/20"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#e5e2e1]/20">INR</span>
                                            </div>
                                            <button onClick={handleTopup} disabled={paying} className="h-14 px-10 bg-[#e5e2e1] text-[#131313] rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-[#e5e2e1]/5 disabled:opacity-50">
                                                {paying ? '...' : 'Top Up'}
                                            </button>
                                        </div>

                                        <div className="pt-6 border-t border-white/5">
                                            <h3 className="font-bold text-[#e5e2e1]/40 text-xs uppercase tracking-widest mb-4 px-2">Transactions</h3>
                                            <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                                {wallet.transactions.length === 0 ? (
                                                    <p className="text-[#e5e2e1]/20 text-xs text-center py-4">No history available</p>
                                                ) : (
                                                    wallet.transactions.slice(0, 10).map((txn) => (
                                                        <div key={txn._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] ${txn.type === 'debit' ? 'bg-red-500/10 text-red-400' : 'bg-[#76d6d5]/10 text-[#76d6d5]'}`}>
                                                                    <span className="material-symbols-outlined text-sm">{txn.type === 'debit' ? 'arrow_downward' : 'arrow_upward'}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-[#e5e2e1] truncate max-w-[200px]">{txn.description}</p>
                                                                    <p className="text-[10px] text-[#e5e2e1]/40">{formatIndianDate(txn.createdAt)}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`text-sm font-black ${txn.type === 'credit' || txn.type === 'refund' ? 'text-[#76d6d5]' : 'text-red-400'}`}>
                                                                {txn.type === 'debit' ? '-' : '+'}₹{txn.amount}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition>
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
                    className="flex items-center gap-2.5 px-4 py-2 bg-surface border border-surface-border rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
                >
                    <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                        <WalletIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-surface-muted uppercase tracking-wider leading-none mb-0.5">Wallet</p>
                        <p className="text-sm font-bold text-on-background leading-none">₹{Number(wallet.walletBalance || 0).toFixed(2)}</p>
                    </div>
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map(({ label, value, Icon, color }) => (
                    <div key={label} className="stat-card border border-surface-border">
                        <div className={`w-10 h-10 bg-primary-50 rounded-btn flex items-center justify-center mb-1`}>
                            <Icon className={`w-5 h-5 text-primary-600`} />
                        </div>
                        <p className="stat-value">{value}</p>
                        <p className="stat-label uppercase tracking-widest text-[10px] font-black">{label}</p>
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
                                            <p className="font-semibold text-on-background truncate">{rescue.description}</p>
                                            <p className="text-xs text-surface-muted mt-0.5">
                                                📍 {rescue.location.address || `${Number(rescue.location.lat).toFixed(4)}, ${Number(rescue.location.lng).toFixed(4)}`}
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
                                    className="flex flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-surface-border bg-surface/80 px-4 py-5 text-sm font-semibold text-on-background transition hover:border-primary-300 hover:bg-surface-hover hover:text-primary-700"
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
                                    <Dialog.Title className="text-xl font-bold text-on-background flex items-center gap-2">
                                        <WalletIcon className="w-6 h-6 text-primary-600" />
                                        My Wallet
                                    </Dialog.Title>
                                    <button onClick={() => setWalletModalOpen(false)} className="p-2 hover:bg-surface-hover rounded-full transition-colors text-surface-muted">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-[24px] overflow-hidden relative p-6 mb-6">
                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
                                    <div className="absolute -right-4 top-8 w-20 h-20 bg-white/5 rounded-full" />
                                    <div className="relative z-10">
                                        <span className="text-primary-100 text-xs font-bold uppercase tracking-widest opacity-80">Available Balance</span>
                                        <p className="text-4xl font-black mt-2 mb-2">₹{wallet.walletBalance.toFixed(2)}</p>
                                        <p className="text-primary-100/60 text-[10px] leading-tight font-medium">
                                            ₹30 service fee per rescue. Refunded only if no work starts.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-surface-muted mb-3">Top-up Wallet</label>
                                        <div className="flex gap-2">
                                            {[50, 100, 200].map((amt) => (
                                                <button key={amt} onClick={() => handleMockTopup(amt)}
                                                    disabled={mockPaying}
                                                    className="flex-1 py-3 rounded-xl bg-surface border border-surface-border text-on-background text-xs font-bold hover:bg-surface-hover hover:border-primary-200 transition-all active:scale-95">
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
