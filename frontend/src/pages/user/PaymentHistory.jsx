import { useEffect, useState } from 'react';
import { ArrowLeftIcon, PauseCircleIcon, PlayCircleIcon, StopCircleIcon, WalletIcon, PencilSquareIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatIndianDateTime } from '../../utils/dateTime';
import { useAuth } from '../../context/AuthContext';

const PaymentHistory = () => {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';
    const [searchParams, setSearchParams] = useSearchParams();
    const [editingAmount, setEditingAmount] = useState(false);
    const [monthlyAmount, setMonthlyAmount] = useState('50');
    const [data, setData] = useState({
        walletBalance: 0,
        monthlySubscription: null,
        subscriptionPayments: [],
        walletTransactions: [],
        paymentModeMessage: '',
    });
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const activeTab = searchParams.get('tab') || 'subscription';

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

                {/* Wallet Balance */}
                <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-8 flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5]/60">Wallet Balance</span>
                        <p className="text-4xl font-headline font-black text-[#e5e2e1]">₹{Number(data.walletBalance || 0).toFixed(2)}</p>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-[#76d6d5]/20">account_balance_wallet</span>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* Transactions panel */}
                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-6">
                        <div className="flex gap-2 rounded-2xl bg-white/5 p-1">
                            {[['subscription','Subscription'],['wallet','Wallet'],['all','All']].map(([id, label]) => (
                                <button key={id} onClick={() => setSearchParams({ tab: id })} className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === id ? 'bg-[#76d6d5] text-[#131313]' : 'text-[#e5e2e1]/40 hover:text-[#e5e2e1]'}`}>{label}</button>
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
                        ) : (
                            <div className="space-y-3">
                                {allTransactions.map((item) => (
                                    <div key={`${item.kind}-${item._id}`} className="rounded-2xl bg-white/5 border border-white/5 p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <p className="font-bold text-[#e5e2e1]">{item.title}</p>
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${item.kind === 'wallet' ? 'bg-white/5 text-white/40' : 'bg-[#76d6d5]/10 text-[#76d6d5]'}`}>{item.kind}</span>
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
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Payment History</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-900">Recurring support and wallet activity</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600">{data.paymentModeMessage}</p>
                    </div>
                    <div className="rounded-[24px] bg-slate-900 px-5 py-4 text-white">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Wallet Balance</p>
                        <p className="mt-2 text-3xl font-bold">Rs {Number(data.walletBalance || 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex gap-2 rounded-full bg-slate-100 p-1">
                        {[
                            ['subscription', 'Subscription History'],
                            ['wallet', 'Wallet History'],
                            ['all', 'All Transactions'],
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
                                        <div>
                                            <p className="font-semibold text-slate-800">{item.title}</p>
                                            <p className="mt-1 text-xs text-slate-500">{formatIndianDateTime(item.occurredAt)}</p>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${item.kind === 'wallet' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.kind}</span>
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
