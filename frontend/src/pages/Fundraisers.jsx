import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SkeletonCard } from '../components/Skeleton';

const Fundraisers = () => {
    const { user, updateUser } = useAuth();
    const [fundraisers, setFundraisers] = useState([]);
    const [ngos, setNgos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [donatingId, setDonatingId] = useState(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [activeTab, setActiveTab] = useState('cases');
    const [subscribing, setSubscribing] = useState(false);
    const [paymentHistoryMessage, setPaymentHistoryMessage] = useState('');

    const fetchFundraisers = async () => {
        try {
            const { data } = await api.get('/donation/fundraisers');
            setFundraisers(data.fundraisers);
        } catch (error) {
            toast.error('Failed to load active fundraisers.');
        }
    };

    const fetchNgos = async () => {
        try {
            const { data } = await api.get('/user/ngos');
            setNgos(data.ngos || []);
        } catch (error) {
            console.error('Failed to load NGOs');
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchFundraisers(), fetchNgos()]);
            setLoading(false);
        };
        init();
    }, []);

    const handleJoinEmergencyFund = async () => {
        setSubscribing(true);
        try {
            const { data } = await api.post('/user/subscribe-emergency', { amount: 50 });
            toast.success('Monthly emergency support started from your wallet in test mode.');
            updateUser({
                monthlySubscription: data.monthlySubscription,
                walletBalance: data.walletBalance,
            });
            setPaymentHistoryMessage('Payment History in the profile menu now shows subscription start date, next payment date, wallet deductions, and pause/cancel controls.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join emergency fund.');
        } finally {
            setSubscribing(false);
        }
    };

    const handleDonate = async (id, isNgo = false) => {
        if (!user) {
            toast.error('Please log in to donate.');
            return;
        }

        const amount = parseFloat(donationAmount);
        if (!amount || amount < 10) {
            toast.error('Minimum donation is ₹10.');
            return;
        }

        setDonatingId(id);
        try {
            toast.success(`Simulated payment of ₹${amount} successful.`);
            setDonationAmount('');
            if (!isNgo) fetchFundraisers();
        } catch (error) {
            toast.error('Error initiating donation.');
        } finally {
            setDonatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
                <h1 className="mb-6 text-2xl page-title">Fundraisers</h1>
                {[1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <button
                onClick={() => window.history.back()}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back</span>
            </button>

            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <HeartIcon className="h-8 w-8 animate-pulse-soft text-rose-500" />
                    <div>
                        <h1 className="mb-1 text-3xl page-title">Fundraisers</h1>
                        <p className="text-surface-muted">Your contribution saves lives every single day.</p>
                    </div>
                </div>

                {!user?.monthlySubscription?.isSubscribed ? (
                    <button
                        onClick={handleJoinEmergencyFund}
                        disabled={subscribing}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-200 transition-all hover:scale-105 active:scale-95 hover:from-rose-700 hover:to-rose-600"
                    >
                        <HeartIcon className="h-4 w-4" />
                        Join Emergency Fund
                    </button>
                ) : (
                    <div className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                        Active Subscriber
                    </div>
                )}
            </div>

            <div className="mb-8 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recurring Support Mode</p>
                <p className="mt-2 text-sm text-slate-600">
                    Current testing flow uses wallet balance for recurring emergency contributions. Wallet top-up works now, and UPI autopay can replace it later without changing the history view.
                </p>
                {paymentHistoryMessage && <p className="mt-3 text-sm font-medium text-emerald-700">{paymentHistoryMessage}</p>}
            </div>

            <div className="mb-6 flex items-center border-b border-surface-border">
                <button
                    onClick={() => setActiveTab('cases')}
                    className={`relative px-6 py-3 text-sm font-bold transition-all ${activeTab === 'cases' ? 'text-rose-600' : 'text-surface-muted hover:text-slate-700'}`}
                >
                    Active Cases
                    {activeTab === 'cases' && <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-rose-600" />}
                </button>
                <button
                    onClick={() => setActiveTab('ngos')}
                    className={`relative px-6 py-3 text-sm font-bold transition-all ${activeTab === 'ngos' ? 'text-rose-600' : 'text-surface-muted hover:text-slate-700'}`}
                >
                    NGO-wise Support
                    {activeTab === 'ngos' && <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-rose-600" />}
                </button>
            </div>

            {activeTab === 'cases' ? (
                fundraisers.length === 0 ? (
                    <div className="card py-16 text-center">
                        <HeartIcon className="mx-auto mb-4 h-16 w-16 text-rose-100" />
                        <h3 className="text-lg font-bold text-slate-800">No Active Case Fundraisers</h3>
                        <p className="mt-2 text-surface-muted">All cases are currently supported. Thank you for your kindness.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {fundraisers.map((rescue) => {
                            const progress = Math.min(((rescue.amountRaised || 0) / (rescue.estimatedCost || 1)) * 100, 100);
                            return (
                                <div key={rescue._id} className="card group flex flex-col border-surface-border/50 transition-all duration-300 hover:shadow-card-hover">
                                    <div className="relative mb-4 overflow-hidden rounded-btn">
                                        {rescue.images?.[0] ? (
                                            <img src={rescue.images[0]} alt="Animal" className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="flex h-48 w-full items-center justify-center bg-slate-50 text-slate-300">
                                                No Image Available
                                            </div>
                                        )}
                                        <div className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm backdrop-blur-sm">
                                            Case ID: {rescue._id.slice(-6).toUpperCase()}
                                        </div>
                                    </div>
                                    <p className="mb-2 line-clamp-2 font-bold leading-snug text-slate-800">{rescue.description}</p>
                                    <p className="mb-4 flex items-center gap-1 text-[11px] text-surface-muted">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {rescue.location.address || 'Location provided'}
                                    </p>

                                    <div className="mt-auto border-t border-surface-border/50 pt-4">
                                        <div className="mb-2 flex justify-between text-[11px] font-bold">
                                            <span className="text-slate-600">Raised: ₹{rescue.amountRaised || 0}</span>
                                            <span className="text-rose-600">Goal: ₹{rescue.estimatedCost}</span>
                                        </div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                                            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 shadow-lg transition-all duration-1000" style={{ width: `${progress}%` }} />
                                        </div>
                                        <p className="mt-1.5 text-right text-[10px] font-bold text-slate-400">{progress.toFixed(0)}% FUNDED</p>

                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">₹</span>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    placeholder="100"
                                                    className="w-full rounded-btn border-none bg-slate-50 py-2 pl-7 pr-3 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20"
                                                    onChange={(e) => setDonationAmount(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleDonate(rescue._id)}
                                                disabled={donatingId === rescue._id}
                                                className="btn bg-rose-500 px-6 py-2 font-bold text-white shadow-md shadow-rose-100 hover:bg-rose-600"
                                            >
                                                {donatingId === rescue._id ? '...' : 'Help'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {ngos.filter((ngo) => ngo.paymentDetails?.upiId).length === 0 ? (
                        <div className="card col-span-full py-16 text-center">
                            <svg className="mx-auto mb-4 h-16 w-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            <h3 className="text-lg font-bold text-slate-800">No NGOs Available for Donation</h3>
                            <p className="mt-2 text-surface-muted">Currently no NGOs have configured their payment details. Please check back later.</p>
                        </div>
                    ) : (
                        ngos.filter((ngo) => ngo.paymentDetails?.upiId).map((ngo) => (
                            <div key={ngo._id} className="card border-surface-border/50 transition-all hover:shadow-card-hover">
                                <div className="mb-4 flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-2xl font-bold text-white shadow-lg shadow-primary-100">
                                        {ngo.orgName?.charAt(0) || 'N'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold leading-tight text-slate-800">{ngo.orgName}</h3>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-surface-muted">Registered NGO</p>
                                    </div>
                                </div>
                                <p className="mb-4 line-clamp-2 text-sm text-slate-600">{ngo.address || 'No specific address provided'}</p>

                                <div className="mb-4 rounded-btn border border-slate-100 bg-slate-50 p-3">
                                    <div className="mb-2 flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-500">UPI ID</span>
                                        <span className="font-bold text-slate-800">{ngo.paymentDetails.upiId}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-500">Bank</span>
                                        <span className="font-bold text-slate-800">{ngo.paymentDetails.bankName || 'HDFC Bank'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        className="w-full rounded-btn border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20"
                                        onChange={(e) => setDonationAmount(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleDonate(ngo._id, true)}
                                        className="btn bg-primary-600 px-6 py-2 font-bold text-white hover:bg-primary-700"
                                    >
                                        Donate
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Fundraisers;
