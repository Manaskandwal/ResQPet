import { useEffect, useState } from 'react';
import { ArrowLeftIcon, PauseCircleIcon, PlayCircleIcon, StopCircleIcon, WalletIcon, PencilSquareIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatIndianDateTime } from '../../utils/dateTime';
import { useAuth } from '../../context/AuthContext';

const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const PaymentHistory = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';
    const [searchParams, setSearchParams] = useSearchParams();
    const [editingAmount, setEditingAmount] = useState(false);
    const [monthlyAmount, setMonthlyAmount] = useState('50');
    const [topupAmt, setTopupAmt] = useState('');
    const [paying, setPaying] = useState(false);
    const [mockPaying, setMockPaying] = useState(false);
    const [data, setData] = useState({
        walletBalance: 0,
        monthlySubscription: null,
        subscriptionPayments: [],
        walletTransactions: [],
        paymentModeMessage: '',
    });
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const activeTab = searchParams.get('tab') || 'all';

    const loadHistory = async () => {
        try {
            const response = await api.get('/user/payment-history');
            setData(response.data);
            setMonthlyAmount(String(response.data.monthlySubscription?.amount || 50));
            updateUser({
                walletBalance: response.data.walletBalance,
                monthlySubscription: response.data.monthlySubscription,
            });
        } catch {
            toast.error('Failed to load payment history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleAction = async (method, endpoint, body, successMessage) => {
        setActing(true);
        try {
            const response = await api[method](endpoint, body);
            toast.success(successMessage || response.data.message);
            await loadHistory();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed.');
        } finally {
            setActing(false);
        }
    };

    const handleTopup = async () => {
        const amount = parseFloat(topupAmt);
        if (!amount || amount < 10) { toast.error('Minimum top-up is ₹10.'); return; }
        if (amount > 100000) { toast.error('Maximum top-up amount is ₹1,00,000.'); return; }

        setPaying(true);
        try {
            console.log('[PaymentHistory] Initiating Razorpay top-up for ₹', amount);
            const loaded = await loadRazorpay();
            if (!loaded) { toast.error('Failed to load Razorpay. Check your internet connection.'); return; }

            const { data: resData } = await api.post('/payment/create-order', { amount });

            if (!resData.success || !resData.order) {
                throw new Error(resData.message || 'Failed to create payment order');
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || resData.keyId,
                amount: resData.order.amount,
                currency: 'INR',
                name: 'VetsCue',
                description: 'Wallet Top-up',
                order_id: resData.order.id,
                handler: async (response) => {
                    try {
                        console.log('[PaymentHistory] Razorpay payment successful, verifying...');
                        const verifyRes = await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount,
                        });
                        toast.success(`₹${amount} added to wallet!`);
                        updateUser({ walletBalance: verifyRes.data.walletBalance });
                        setTopupAmt('');
                        loadHistory();
                    } catch (verifyErr) {
                        console.error('[PaymentHistory] Payment verification failed:', verifyErr.message);
                        toast.error('Payment verification failed. Contact support.');
                    }
                },
                prefill: { name: user?.name, email: user?.email },
                theme: { color: '#0d9488' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (resp) => {
                console.error('[PaymentHistory] Razorpay payment failed:', resp.error);
                toast.error(`Payment failed: ${resp.error.description}`);
            });
            rzp.open();
        } catch (error) {
            console.error('[PaymentHistory] Top-up error:', error);
            toast.error(error.message || 'Failed to add amount to wallet.');
        } finally {
            setPaying(false);
        }
    };

    const handleMockTopup = async (amount) => {
        setMockPaying(true);
        try {
            console.log('[Mock] crediting ₹', amount);
            const { data: resData } = await api.post('/payment/mock-topup', { amount });
            toast.success(resData.message);
            updateUser({ walletBalance: resData.walletBalance });
            loadHistory();
        } catch (error) {
            console.error('[Mock] mockTopup error:', error.message);
            toast.error(error.response?.data?.message || 'Mock top-up failed.');
        } finally {
            setMockPaying(false);
        }
    };

    const subscription = data.monthlySubscription;
    const isActiveMember = subscription?.isSubscribed && subscription?.status === 'active';
    const isPausedMember = subscription?.isSubscribed && subscription?.status === 'paused';
    const allTransactions = [
        ...(data.subscriptionPayments || []).map((item) => ({
            ...item,
            kind: 'subscription',
            occurredAt: item.createdAt,
            title: `Recurring contribution Rs ${item.amount}`,
            amountLabel: `Rs ${item.amount}`,
        })),
        ...(data.walletTransactions || []).map((item) => ({
            ...item,
            kind: 'wallet',
            occurredAt: item.createdAt,
            title: item.description,
            amountLabel: `${item.type === 'debit' ? '-' : '+'}Rs ${item.amount}`,
        })),
        ...(data.rescueBills || []).map((item) => ({
            ...item,
            kind: 'bill',
            occurredAt: item.bill.createdAt,
            title: `Hospital Bill: ${item.assignedHospital?.orgName || 'Unknown Hospital'}`,
            amountLabel: `-Rs ${item.bill.totalAmount || item.bill.estimatedCost || 0}`,
        })),
    ].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
                {/* Header */}
                <section className="space-y-2">
                    <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Payments</span>
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight">Payment <span className="text-[#76d6d5]">History</span></h1>
                    <p className="text-[#e5e2e1]/50">{data.paymentModeMessage}</p>
                </section>

                {/* Wallet Balance & Top-Up Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Wallet Balance Card */}
                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-8 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#76d6d5]/5 rounded-full blur-3xl" />
                        <div className="space-y-1 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5]/60">Wallet Balance</span>
                            <p className="text-5xl font-headline font-black text-[#e5e2e1] mt-2">₹{Number(data.walletBalance || 0).toFixed(2)}</p>
                        </div>
                        <div className="mt-8 flex items-center gap-3 text-xs text-white/30 relative z-10">
                            <span className="material-symbols-outlined text-xl text-[#76d6d5]">account_balance_wallet</span>
                            Secure Platform Wallet
                        </div>
                    </div>

                    {/* Quick Top-Up Card */}
                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-8 space-y-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Quick Top-up</span>
                            <div className="flex gap-2 mt-2">
                                {[100, 200, 500, 1000].map((amt) => (
                                    <button 
                                        key={amt} 
                                        onClick={() => handleMockTopup(amt)}
                                        disabled={mockPaying}
                                        className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-black uppercase text-[#e5e2e1] hover:bg-[#76d6d5]/10 hover:border-[#76d6d5]/30 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        +₹{amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="number" 
                                    min="10" 
                                    placeholder="Custom" 
                                    value={topupAmt} 
                                    onChange={(e) => setTopupAmt(e.target.value)}
                                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/5 text-[#e5e2e1] text-xs font-bold focus:outline-none focus:border-[#76d6d5]/30 focus:ring-1 focus:ring-[#76d6d5]/30 transition-all placeholder:text-white/20"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20">INR</span>
                            </div>
                            <button 
                                onClick={handleTopup} 
                                disabled={paying}
                                className="h-11 px-6 bg-[#76d6d5] text-[#131313] rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {paying ? '...' : 'Top Up'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* Transactions panel */}
                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-6">
                        <div className="flex gap-2 rounded-2xl bg-white/5 p-1 overflow-x-auto no-scrollbar">
                            {[['all','All'],['subscription','Subscription'],['wallet','Wallet'],['rescues', 'Hospital Bills']].map(([id, label]) => (
                                <button key={id} onClick={() => setSearchParams({ tab: id })} className={`flex-1 min-w-max rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === id ? 'bg-[#76d6d5] text-[#131313]' : 'text-[#e5e2e1]/40 hover:text-[#e5e2e1]'}`}>{label}</button>
                            ))}
                        </div>

                        {loading ? <p className="text-sm text-white/20">Loading...</p> : activeTab === 'subscription' ? (
                            <div className="space-y-3">
                                {data.subscriptionPayments.length === 0 ? <div className="rounded-2xl bg-white/5 p-6 text-sm text-white/20 text-center">No recurring records yet.</div> : data.subscriptionPayments.map((p) => (
                                    <div key={p._id} className="rounded-2xl bg-white/5 border border-white/5 p-4 space-y-3">
                                        <div className="flex justify-between">
                                            <p className="font-bold text-[#e5e2e1]">₹{p.amount} recurring contribution</p>
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${p.status === 'active' ? 'bg-[#76d6d5]/10 text-[#76d6d5]' : p.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/40'}`}>{p.status}</span>
                                        </div>
                                        <div className="grid gap-2 text-xs text-white/40 md:grid-cols-2">
                                            <p>Started: {p.subscriptionStartedAt ? formatIndianDateTime(p.subscriptionStartedAt) : 'Not set'}</p>
                                            <p>Recorded: {formatIndianDateTime(p.createdAt)}</p>
                                            <p>Next: {p.nextPaymentDate ? formatIndianDateTime(p.nextPaymentDate) : 'Not scheduled'}</p>
                                            <p>Source: {p.paymentSource === 'wallet_test' ? 'Wallet test mode' : p.paymentSource}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'wallet' ? (
                            <div className="space-y-3">
                                {data.walletTransactions.length === 0 ? <div className="rounded-2xl bg-white/5 p-6 text-sm text-white/20 text-center">No transactions yet.</div> : data.walletTransactions.map((txn) => (
                                    <div key={txn._id} className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 p-4">
                                        <div>
                                            <p className="font-bold text-[#e5e2e1]">{txn.description}</p>
                                            <p className="text-xs text-white/30 mt-1">{formatIndianDateTime(txn.createdAt)}</p>
                                            <p className="text-xs text-white/20">Balance after: ₹{txn.balanceAfter}</p>
                                        </div>
                                        <span className={`text-sm font-black ${txn.type === 'debit' ? 'text-red-400' : 'text-[#76d6d5]'}`}>{txn.type === 'debit' ? '-' : '+'}₹{txn.amount}</span>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'rescues' ? (
                            <div className="space-y-3">
                                {!data.rescueBills || data.rescueBills.length === 0 ? <div className="rounded-2xl bg-white/5 p-6 text-sm text-white/20 text-center">No hospital bills found.</div> : data.rescueBills.map((r) => (
                                    <div key={r._id} className="rounded-2xl bg-white/5 border border-white/5 p-4 space-y-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-[#e5e2e1]">{r.assignedHospital?.orgName || 'Hospital Bill'}</p>
                                                    {r.assignedHospital?.isGovernment && <span className="bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-blue-500/20">Govt</span>}
                                                </div>
                                                <p className="text-xs text-[#e5e2e1]/40">{r.description?.substring(0, 50)}...</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <span className="font-headline font-bold text-[#e5e2e1] text-lg">₹{r.bill.totalAmount || r.bill.estimatedCost || 0}</span>
                                                <span className={`px-2 py-0.5 rounded w-max text-[8px] font-black uppercase tracking-widest ${r.bill.paidStatus === 'paid' ? 'bg-[#76d6d5]/10 text-[#76d6d5]' : r.bill.paidStatus === 'waived' ? 'bg-purple-500/10 text-purple-400' : 'bg-red-500/10 text-red-400'}`}>{r.bill.paidStatus || 'pending'}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-widest pt-3 border-t border-white/5">
                                            <span>{formatIndianDateTime(r.bill.createdAt)}</span>
                                            <button onClick={() => window.open(`/rescue/${r._id}`, '_blank')} className="text-[#76d6d5] hover:text-[#76d6d5]/70 flex items-center gap-1 transition-colors">
                                                View Details <ArrowLeftIcon className="w-3 h-3 rotate-135" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allTransactions.map((item) => (
                                    <div key={`${item.kind}-${item._id}`} className="rounded-2xl bg-white/5 border border-white/5 p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="font-bold text-[#e5e2e1] flex-1 min-w-0 break-words">{item.title}</p>
                                            <span className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase flex-shrink-0 whitespace-nowrap ${item.kind === 'wallet' ? 'bg-white/5 text-white/40' : 'bg-[#76d6d5]/10 text-[#76d6d5]'}`}>{item.kind}</span>
                                        </div>
                                        <p className="text-xs text-white/30">{formatIndianDateTime(item.occurredAt)}</p>
                                        <p className="text-sm font-bold text-[#e5e2e1]/70">{item.amountLabel}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Subscription control */}
                    <div className="space-y-6">
                        <div className="glass-card rounded-[2rem] border border-[#76d6d5]/10 bg-[#1c1b1b] p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#76d6d5]">favorite</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5]/60">Monthly Support</span>
                                    <p className="font-headline font-bold text-xl text-[#e5e2e1]">{subscription?.isSubscribed ? `₹${subscription.amount}/month` : 'Not active'}</p>
                                </div>
                            </div>
                            <div className="space-y-1 text-xs text-white/40">
                                <p>Status: <span className="text-[#e5e2e1]/70 font-bold capitalize">{subscription?.status || 'inactive'}</span></p>
                                <p>Started: {subscription?.startedAt ? formatIndianDateTime(subscription.startedAt) : 'Not started'}</p>
                                <p>Last: {subscription?.lastDeductedAt ? formatIndianDateTime(subscription.lastDeductedAt) : 'Not yet charged'}</p>
                                <p>Next: {subscription?.nextPaymentDate ? formatIndianDateTime(subscription.nextPaymentDate) : 'Not scheduled'}</p>
                            </div>
                        </div>

                        <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/40">Subscription Controls</p>
                                <p className="text-xs text-white/30">Choose the monthly amount, then start, pause, resume, or cancel.</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 block mb-2">Monthly amount</label>
                                {editingAmount ? (
                                    <div className="flex gap-2">
                                        <input type="number" min="10" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} className="flex-1 rounded-2xl bg-white/5 border border-white/5 px-4 py-3 text-[#e5e2e1] text-sm outline-none focus:border-[#76d6d5]/30" />
                                        <button onClick={() => handleAction('put', '/user/subscription/amount', { amount: Number(monthlyAmount) }, 'Amount updated.').then(() => setEditingAmount(false))} disabled={acting} className="px-4 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase">
                                            <CheckIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
                                        <span className="font-bold text-[#e5e2e1]">₹{monthlyAmount}</span>
                                        <button onClick={() => setEditingAmount(true)} className="text-white/30 hover:text-[#76d6d5] transition-colors">
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                {!subscription?.isSubscribed ? (
                                    <button onClick={() => handleAction('post', '/user/subscribe-emergency', { amount: Number(monthlyAmount) }, 'Monthly support started.')} disabled={acting} className="w-full py-3 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50">Start Monthly Support</button>
                                ) : (
                                    <>
                                        {isActiveMember && <button onClick={() => handleAction('post', '/user/subscription/pause', {}, 'Subscription paused.')} disabled={acting} className="w-full py-3 rounded-2xl bg-[#ffb77d]/10 border border-[#ffb77d]/20 text-[#ffb77d] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"><PauseCircleIcon className="h-4 w-4 inline mr-2" />Pause for One Month</button>}
                                        {isPausedMember && <button onClick={() => handleAction('post', '/user/subscription/resume', {}, 'Resumed.')} disabled={acting} className="w-full py-3 rounded-2xl bg-[#76d6d5]/10 border border-[#76d6d5]/20 text-[#76d6d5] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"><PlayCircleIcon className="h-4 w-4 inline mr-2" />Resume Support</button>}
                                        <button onClick={() => handleAction('post', '/user/subscription/cancel', {}, 'Cancelled.')} disabled={acting} className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-400 text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"><StopCircleIcon className="h-4 w-4 inline mr-2" />Cancel Subscription</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Payment History & Balance</p>
                        <h1 className="mt-2 text-2xl font-bold text-slate-900">Secure Platform Wallet</h1>
                        <p className="mt-2 text-sm text-slate-600">{data.paymentModeMessage}</p>
                    </div>
                    <div className="mt-6 rounded-[24px] bg-slate-900 px-5 py-4 text-white w-fit">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Wallet Balance</p>
                        <p className="mt-2 text-3xl font-bold">Rs {Number(data.walletBalance || 0).toFixed(2)}</p>
                    </div>
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Quick Wallet Top-up</p>
                        <div className="flex gap-2 mt-4">
                            {[100, 200, 500, 1000].map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => handleMockTopup(amt)}
                                    disabled={mockPaying}
                                    className="flex-1 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    +Rs {amt}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                min="10"
                                placeholder="Custom amount"
                                value={topupAmt}
                                onChange={(e) => setTopupAmt(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <button
                            onClick={handleTopup}
                            disabled={paying}
                            className="btn bg-slate-900 hover:bg-slate-800 px-6 py-2.5 font-bold text-white shadow-md rounded-full transition-all disabled:opacity-50"
                        >
                            {paying ? '...' : 'Top Up'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex gap-2 rounded-full bg-slate-100 p-1">
                        {[
                            ['all', 'All Transactions'],
                            ['subscription', 'Subscription History'],
                            ['wallet', 'Wallet History'],
                        ].map(([id, label]) => (
                            <button key={id} onClick={() => setSearchParams({ tab: id })} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${activeTab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}</button>
                        ))}
                    </div>

                    {loading ? <p className="text-sm text-slate-500">Loading history...</p> : activeTab === 'subscription' ? (
                        <div className="space-y-3">
                            {data.subscriptionPayments.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No recurring payment records yet.</p> : data.subscriptionPayments.map((payment) => (
                                <div key={payment._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-800">Rs {payment.amount} recurring contribution</p>
                                            <p className="mt-1 text-xs text-slate-500">{payment.note || 'Emergency fund contribution'}</p>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${payment.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : payment.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{payment.status}</span>
                                    </div>
                                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                                        <p>Started: {payment.subscriptionStartedAt ? formatIndianDateTime(payment.subscriptionStartedAt) : 'Not set'}</p>
                                        <p>Recorded: {formatIndianDateTime(payment.createdAt)}</p>
                                        <p>Next payment: {payment.nextPaymentDate ? formatIndianDateTime(payment.nextPaymentDate) : 'Not scheduled'}</p>
                                        <p>Source: {payment.paymentSource === 'wallet_test' ? 'Wallet test mode' : payment.paymentSource}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'wallet' ? (
                        <div className="space-y-3">
                            {data.walletTransactions.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No wallet transactions yet.</p> : data.walletTransactions.map((txn) => (
                                <div key={txn._id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div>
                                        <p className="font-semibold text-slate-800">{txn.description}</p>
                                        <p className="mt-1 text-xs text-slate-500">{formatIndianDateTime(txn.createdAt)}</p>
                                        <p className="mt-1 text-xs text-slate-400">Balance after: Rs {txn.balanceAfter}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${txn.type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>{txn.type === 'debit' ? '-' : '+'}Rs {txn.amount}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allTransactions.map((item) => (
                                <div key={`${item.kind}-${item._id}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-slate-800 break-words">{item.title}</p>
                                            <p className="mt-1 text-xs text-slate-500">{formatIndianDateTime(item.occurredAt)}</p>
                                        </div>
                                        <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase flex-shrink-0 whitespace-nowrap ${item.kind === 'wallet' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.kind}</span>
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-slate-700">{item.amountLabel}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-white p-3 shadow-sm">
                                <WalletIcon className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Monthly Support</p>
                                <h2 className="text-xl font-bold text-slate-900">{subscription?.isSubscribed ? `Rs ${subscription.amount}/month` : 'Not active'}</h2>
                            </div>
                        </div>
                        <div className="mt-5 space-y-2 text-sm text-slate-600">
                            <p>Status: <span className="font-semibold capitalize text-slate-900">{subscription?.status || 'inactive'}</span></p>
                            <p>Started: {subscription?.startedAt ? formatIndianDateTime(subscription.startedAt) : 'Not started'}</p>
                            <p>Last payment: {subscription?.lastDeductedAt ? formatIndianDateTime(subscription.lastDeductedAt) : 'Not yet charged'}</p>
                            <p>Next payment: {subscription?.nextPaymentDate ? formatIndianDateTime(subscription.nextPaymentDate) : 'Not scheduled'}</p>
                            <p>Mode: {subscription?.paymentSource === 'wallet_test' ? 'Wallet test mode' : 'Future UPI mode'}</p>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900">Subscription Controls</h3>
                        <p className="mt-1 text-sm text-slate-500">Choose the monthly amount, then start, pause, resume, or cancel support from here.</p>
                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Monthly amount</label>
                                <div className="flex items-center gap-2">
                                    {editingAmount ? (
                                        <>
                                            <input type="number" min="10" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} className="input-field" />
                                            <button onClick={() => handleAction('put', '/user/subscription/amount', { amount: Number(monthlyAmount) }, 'Monthly support amount updated.').then(() => setEditingAmount(false))} disabled={acting} className="rounded-full bg-emerald-600 p-2 text-white">
                                                <CheckIcon className="h-4 w-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <span className="font-semibold text-slate-800">Rs {monthlyAmount}</span>
                                            <button onClick={() => setEditingAmount(true)} className="rounded-full p-1 text-slate-500 hover:bg-white">
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!subscription?.isSubscribed ? (
                                <button onClick={() => handleAction('post', '/user/subscribe-emergency', { amount: Number(monthlyAmount) }, 'Monthly support started.')} disabled={acting} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                                    Start Monthly Support
                                </button>
                            ) : (
                                <>
                                    {isActiveMember && (
                                        <button onClick={() => handleAction('post', '/user/subscription/pause', {}, 'Subscription paused for one month.')} disabled={acting} className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                            <PauseCircleIcon className="h-5 w-5" />
                                            Pause for One Month
                                        </button>
                                    )}
                                    {isPausedMember && (
                                        <button onClick={() => handleAction('put', '/user/subscription/amount', { amount: Number(monthlyAmount) }, 'Monthly support amount updated.').then(() => handleAction('post', '/user/subscription/resume', {}, 'Monthly support resumed.'))} disabled={acting} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                                            <PlayCircleIcon className="h-5 w-5" />
                                            Resume Support
                                        </button>
                                    )}
                                    <button onClick={() => handleAction('post', '/user/subscription/cancel', {}, 'Subscription cancelled.')} disabled={acting} className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                                        <StopCircleIcon className="h-5 w-5" />
                                        Cancel Subscription
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentHistory;
