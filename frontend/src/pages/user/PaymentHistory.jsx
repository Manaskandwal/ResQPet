import { useEffect, useState } from 'react';
import { ArrowLeftIcon, PauseCircleIcon, StopCircleIcon, WalletIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatIndianDateTime } from '../../utils/dateTime';
import { useAuth } from '../../context/AuthContext';

const PaymentHistory = () => {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('subscription');
    const [data, setData] = useState({
        walletBalance: 0,
        monthlySubscription: null,
        subscriptionPayments: [],
        walletTransactions: [],
        paymentModeMessage: '',
    });
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);

    const loadHistory = async () => {
        try {
            const response = await api.get('/user/payment-history');
            setData(response.data);
            updateUser({
                walletBalance: response.data.walletBalance,
                monthlySubscription: response.data.monthlySubscription,
            });
        } catch (error) {
            toast.error('Failed to load payment history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleAction = async (endpoint, successMessage) => {
        setActing(true);
        try {
            const response = await api.post(endpoint);
            toast.success(successMessage || response.data.message);
            await loadHistory();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed.');
        } finally {
            setActing(false);
        }
    };

    const subscription = data.monthlySubscription;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
            </button>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Payment History</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-900">Recurring support and wallet activity</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600">{data.paymentModeMessage}</p>
                    </div>
                    <div className="rounded-[24px] bg-slate-900 px-5 py-4 text-white">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Wallet Balance</p>
                        <p className="mt-2 text-3xl font-bold">₹{Number(data.walletBalance || 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex gap-2 rounded-full bg-slate-100 p-1">
                        <button
                            onClick={() => setActiveTab('subscription')}
                            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${activeTab === 'subscription' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Subscription History
                        </button>
                        <button
                            onClick={() => setActiveTab('wallet')}
                            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${activeTab === 'wallet' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Wallet History
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-sm text-slate-500">Loading history...</p>
                    ) : activeTab === 'subscription' ? (
                        <div className="space-y-3">
                            {data.subscriptionPayments.length === 0 ? (
                                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No recurring payment records yet.</p>
                            ) : data.subscriptionPayments.map((payment) => (
                                <div key={payment._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-800">₹{payment.amount} recurring contribution</p>
                                            <p className="mt-1 text-xs text-slate-500">{payment.note || 'Emergency fund contribution'}</p>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${payment.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : payment.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {payment.status}
                                        </span>
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
                    ) : (
                        <div className="space-y-3">
                            {data.walletTransactions.length === 0 ? (
                                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No wallet transactions yet.</p>
                            ) : data.walletTransactions.map((txn) => (
                                <div key={txn._id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div>
                                        <p className="font-semibold text-slate-800">{txn.description}</p>
                                        <p className="mt-1 text-xs text-slate-500">{formatIndianDateTime(txn.createdAt)}</p>
                                        <p className="mt-1 text-xs text-slate-400">Balance after: ₹{txn.balanceAfter}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${txn.type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {txn.type === 'debit' ? '-' : '+'}₹{txn.amount}
                                    </span>
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
                                <h2 className="text-xl font-bold text-slate-900">
                                    {subscription?.isSubscribed ? `₹${subscription.amount}/month` : 'Not active'}
                                </h2>
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
                        <p className="mt-1 text-sm text-slate-500">Pause the next billing cycle or cancel recurring support entirely.</p>
                        <div className="mt-5 flex flex-col gap-3">
                            <button
                                onClick={() => handleAction('/user/subscription/pause', 'Subscription paused for one month.')}
                                disabled={acting || !subscription?.isSubscribed || subscription?.status !== 'active'}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <PauseCircleIcon className="h-5 w-5" />
                                Pause for One Month
                            </button>
                            <button
                                onClick={() => handleAction('/user/subscription/cancel', 'Subscription cancelled.')}
                                disabled={acting || !subscription?.isSubscribed}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <StopCircleIcon className="h-5 w-5" />
                                Cancel Subscription
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentHistory;
