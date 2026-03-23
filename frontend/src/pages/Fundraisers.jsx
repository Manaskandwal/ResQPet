import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SkeletonCard } from '../components/Skeleton';

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

const defaultSupportForm = {
    amount: '50',
    cardName: 'VetsCue Test User',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/29',
    cvv: '123',
};

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
    const [supportModalOpen, setSupportModalOpen] = useState(false);
    const [supportForm, setSupportForm] = useState(defaultSupportForm);

    const fetchFundraisers = async () => {
        try {
            const { data } = await api.get('/donation/fundraisers');
            setFundraisers(data.fundraisers);
        } catch {
            toast.error('Failed to load active fundraisers.');
        }
    };

    const fetchNgos = async () => {
        try {
            const { data } = await api.get('/user/ngos');
            setNgos(data.ngos || []);
        } catch {
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
            const { data } = await api.post('/user/subscribe-emergency', { amount: Number(supportForm.amount) });
            toast.success('Monthly emergency support started from your wallet in test mode.');
            updateUser({
                monthlySubscription: data.monthlySubscription,
                walletBalance: data.walletBalance,
            });
            setPaymentHistoryMessage('Payment History now shows subscription start date, next payment date, wallet deductions, and pause/cancel controls.');
            setSupportModalOpen(false);
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
            toast.error('Minimum donation is Rs 10.');
            return;
        }

        setDonatingId(id);
        try {
            toast.success(`Simulated payment of Rs ${amount} successful.`);
            setDonationAmount('');
            if (!isNgo) fetchFundraisers();
        } finally {
            setDonatingId(null);
        }
    };

    if (loading) {
        if (isNewUI) return <div className="resqpet-obsidian-theme space-y-4">{[1,2].map(i => <div key={i} className="h-48 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>;
        return (
            <div className="space-y-6">
                <h1 className="page-title">Fundraisers</h1>
                {[1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
                {/* Header & Tabs */}
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Community</span>
                        <h1 className="font-headline text-4xl font-extrabold tracking-tight">Fund<span className="text-[#76d6d5]">raisers</span></h1>
                        <p className="text-[#e5e2e1]/50">Your contribution saves lives every single day.</p>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-4">
                        <div className="flex gap-1 rounded-2xl bg-white/5 p-1 w-full md:w-fit">
                            <button onClick={() => setActiveTab('cases')} className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cases' ? 'bg-[#76d6d5] text-[#131313]' : 'text-[#e5e2e1]/40 hover:text-[#e5e2e1]'}`}>Active Cases</button>
                            <button onClick={() => setActiveTab('ngos')} className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ngos' ? 'bg-[#76d6d5] text-[#131313]' : 'text-[#e5e2e1]/40 hover:text-[#e5e2e1]'}`}>NGO-wise</button>
                        </div>
                        
                        {!user?.monthlySubscription?.isSubscribed ? (
                            <button onClick={() => setSupportModalOpen(true)} className="flex items-center gap-2 rounded-full bg-gradient-to-br from-[#76d6d5] to-[#008080] text-[#131313] px-6 py-3 text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                                <HeartIcon className="h-4 w-4" /> Monthly Support
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 rounded-full border border-[#76d6d5]/20 bg-[#76d6d5]/10 px-4 py-2 text-[10px] font-black text-[#76d6d5] uppercase tracking-widest">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#76d6d5]" /> Active Subscriber
                            </div>
                        )}
                    </div>
                </section>

                {/* Mode notice */}
                <div className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] px-6 py-4">
                    <p className="text-xs text-white/30 font-medium">Current testing flow uses wallet balance for recurring emergency contributions.</p>
                    {paymentHistoryMessage && <p className="mt-2 text-xs text-[#76d6d5] font-bold">{paymentHistoryMessage}</p>}
                </div>

                {/* Content */}
                {activeTab === 'cases' ? (
                    fundraisers.length === 0 ? (
                        <div className="glass-card rounded-[3rem] border border-dashed border-white/10 p-16 text-center space-y-4">
                            <HeartIcon className="mx-auto h-12 w-12 text-white/10" />
                            <p className="text-xs font-black uppercase tracking-widest text-white/20">No active fundraisers.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {fundraisers.map((rescue) => {
                                const progress = Math.min(((rescue.amountRaised || 0) / (rescue.estimatedCost || 1)) * 100, 100);
                                return (
                                    <div key={rescue._id} className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300">
                                        <div className="relative overflow-hidden">
                                            {rescue.images?.[0] ? <img src={rescue.images[0]} alt="Animal" className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70" /> : <div className="flex h-48 w-full items-center justify-center bg-white/5 text-white/20 text-sm">No Image Available</div>}
                                            <div className="absolute left-3 top-3 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Case #{rescue._id.slice(-6).toUpperCase()}</div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col space-y-4">
                                            <p className="font-bold text-[#e5e2e1] line-clamp-2">{rescue.description}</p>
                                            <p className="text-xs text-white/30">{rescue.location.address || 'Location provided'}</p>
                                            <div className="mt-auto space-y-3">
                                                <div className="flex justify-between text-xs font-black">
                                                    <span className="text-[#76d6d5]">Raised: ₹{rescue.amountRaised || 0}</span>
                                                    <span className="text-[#ffb77d]">Goal: ₹{rescue.estimatedCost}</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-[#76d6d5] to-[#008080] transition-all duration-1000 shadow-[0_0_8px_rgba(118,214,213,0.4)]" style={{ width: `${progress}%` }} />
                                                </div>
                                                <p className="text-right text-[10px] font-black text-white/20">{Number(progress || 0).toFixed(0)}% FUNDED</p>
                                                <div className="flex gap-2">
                                                    <input type="number" min="10" placeholder="Amount" className="flex-1 rounded-2xl bg-white/5 border border-white/5 px-4 py-2.5 text-sm text-[#e5e2e1] outline-none focus:border-[#76d6d5]/30 transition-all" onChange={(e) => setDonationAmount(e.target.value)} />
                                                    <button onClick={() => handleDonate(rescue._id)} disabled={donatingId === rescue._id} className="rounded-2xl bg-[#76d6d5] text-[#131313] px-5 py-2.5 text-xs font-black uppercase disabled:opacity-50 hover:scale-105 transition-all">{donatingId === rescue._id ? '...' : 'Help'}</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {ngos.filter((ngo) => ngo.paymentDetails?.upiId).map((ngo) => (
                            <div key={ngo._id} className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center text-2xl font-black text-[#76d6d5]">{ngo.orgName?.charAt(0) || 'N'}</div>
                                    <div>
                                        <p className="font-headline font-bold text-lg text-[#e5e2e1]">{ngo.orgName}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Registered NGO</p>
                                    </div>
                                </div>
                                <p className="text-sm text-white/40 line-clamp-2">{ngo.address || 'No address provided'}</p>
                                <div className="rounded-2xl bg-white/5 border border-white/5 p-4 space-y-2 text-xs">
                                    <div className="flex justify-between"><span className="text-white/30">UPI ID</span><span className="font-bold text-[#e5e2e1]">{ngo.paymentDetails.upiId}</span></div>
                                    <div className="flex justify-between"><span className="text-white/30">Bank</span><span className="font-bold text-[#e5e2e1]">{ngo.paymentDetails.bankName || 'HDFC Bank'}</span></div>
                                </div>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Amount" className="flex-1 rounded-2xl bg-white/5 border border-white/5 px-4 py-2.5 text-sm text-[#e5e2e1] outline-none focus:border-[#76d6d5]/30 transition-all" onChange={(e) => setDonationAmount(e.target.value)} />
                                    <button onClick={() => handleDonate(ngo._id, true)} className="rounded-2xl bg-[#76d6d5] text-[#131313] px-5 py-2.5 text-xs font-black uppercase hover:scale-105 transition-all">Donate</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Monthly Support Modal */}
                {supportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-[2rem] border border-white/5 bg-[#1c1b1b] shadow-2xl">
                            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5]/60">Monthly Support</span>
                                    <h3 className="font-headline font-bold text-xl text-[#e5e2e1]">Join Emergency Fund</h3>
                                </div>
                                <button onClick={() => setSupportModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white transition-all">
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Monthly amount (₹)</label>
                                    <input className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3 text-[#e5e2e1] text-sm outline-none focus:border-[#76d6d5]/30 transition-all" type="number" min="10" placeholder="Enter monthly amount" value={supportForm.amount} onChange={(e) => setSupportForm((cur) => ({ ...cur, amount: e.target.value }))} />
                                    <p className="text-xs text-white/20">Amount charged monthly from wallet in test mode.</p>
                                </div>
                                <div className="rounded-2xl border border-[#ffb77d]/20 bg-[#ffb77d]/5 p-4 text-xs text-[#ffb77d]/70">This is a test mode payment. Amount is deducted from wallet balance.</div>
                                <button onClick={handleJoinEmergencyFund} disabled={subscribing} className="w-full py-4 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50">{subscribing ? 'Processing...' : 'Complete & Join Monthly Support'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <HeartIcon className="h-8 w-8 animate-pulse-soft text-rose-500" />
                    <div>
                        <h1 className="mb-1 text-3xl page-title">Fundraisers</h1>
                        <p className="text-surface-muted">Your contribution saves lives every single day.</p>
                    </div>
                </div>

                {!user?.monthlySubscription?.isSubscribed ? (
                    <button onClick={() => setSupportModalOpen(true)} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-200 transition-all hover:scale-105 active:scale-95 hover:from-rose-700 hover:to-rose-600">
                        <HeartIcon className="h-4 w-4" />
                        Monthly Support
                    </button>
                ) : (
                    <div className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                        Active Subscriber
                    </div>
                )}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recurring Support Mode</p>
                <p className="mt-2 text-sm text-slate-600">Current testing flow uses wallet balance for recurring emergency contributions. Wallet top-up works now, and UPI autopay can replace it later without changing the history view.</p>
                {paymentHistoryMessage && <p className="mt-3 text-sm font-medium text-emerald-700">{paymentHistoryMessage}</p>}
            </div>

            <div className="flex items-center border-b border-surface-border">
                <button onClick={() => setActiveTab('cases')} className={`relative px-6 py-3 text-sm font-bold transition-all ${activeTab === 'cases' ? 'text-rose-600' : 'text-surface-muted hover:text-slate-700'}`}>Active Cases{activeTab === 'cases' && <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-rose-600" />}</button>
                <button onClick={() => setActiveTab('ngos')} className={`relative px-6 py-3 text-sm font-bold transition-all ${activeTab === 'ngos' ? 'text-rose-600' : 'text-surface-muted hover:text-slate-700'}`}>NGO-wise Support{activeTab === 'ngos' && <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-rose-600" />}</button>
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
                                        {rescue.images?.[0] ? <img src={rescue.images[0]} alt="Animal" className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-48 w-full items-center justify-center bg-slate-50 text-slate-300">No Image Available</div>}
                                        <div className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm backdrop-blur-sm">Case ID: {rescue._id.slice(-6).toUpperCase()}</div>
                                    </div>
                                    <p className="mb-2 line-clamp-2 font-bold leading-snug text-slate-800">{rescue.description}</p>
                                    <p className="mb-4 flex items-center gap-1 text-[11px] text-surface-muted">{rescue.location.address || 'Location provided'}</p>
                                    <div className="mt-auto border-t border-surface-border/50 pt-4">
                                        <div className="mb-2 flex justify-between text-[11px] font-bold"><span className="text-slate-600">Raised: Rs {rescue.amountRaised || 0}</span><span className="text-rose-600">Goal: Rs {rescue.estimatedCost}</span></div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner"><div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 shadow-lg transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
                                        <p className="mt-1.5 text-right text-[10px] font-bold text-slate-400">{Number(progress || 0).toFixed(0)}% FUNDED</p>
                                        <div className="mt-4 flex items-center gap-2">
                                            <input type="number" min="10" placeholder="100" className="w-full rounded-btn border-none bg-slate-50 px-3 py-2 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20" onChange={(e) => setDonationAmount(e.target.value)} />
                                            <button onClick={() => handleDonate(rescue._id)} disabled={donatingId === rescue._id} className="btn bg-rose-500 px-6 py-2 font-bold text-white shadow-md shadow-rose-100 hover:bg-rose-600">{donatingId === rescue._id ? '...' : 'Help'}</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {ngos.filter((ngo) => ngo.paymentDetails?.upiId).map((ngo) => (
                        <div key={ngo._id} className="card border-surface-border/50 transition-all hover:shadow-card-hover">
                            <div className="mb-4 flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-2xl font-bold text-white shadow-lg shadow-primary-100">{ngo.orgName?.charAt(0) || 'N'}</div>
                                <div>
                                    <h3 className="text-lg font-bold leading-tight text-slate-800">{ngo.orgName}</h3>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-surface-muted">Registered NGO</p>
                                </div>
                            </div>
                            <p className="mb-4 line-clamp-2 text-sm text-slate-600">{ngo.address || 'No specific address provided'}</p>
                            <div className="mb-4 rounded-btn border border-slate-100 bg-slate-50 p-3">
                                <div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-slate-500">UPI ID</span><span className="font-bold text-slate-800">{ngo.paymentDetails.upiId}</span></div>
                                <div className="flex items-center justify-between text-xs"><span className="font-medium text-slate-500">Bank</span><span className="font-bold text-slate-800">{ngo.paymentDetails.bankName || 'HDFC Bank'}</span></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="number" placeholder="Amount" className="w-full rounded-btn border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20" onChange={(e) => setDonationAmount(e.target.value)} />
                                <button onClick={() => handleDonate(ngo._id, true)} className="btn bg-primary-600 px-6 py-2 font-bold text-white hover:bg-primary-700">Donate</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {supportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Monthly Support</p>
                                <h3 className="text-2xl font-bold text-slate-900">Complete test payment</h3>
                            </div>
                            <button onClick={() => setSupportModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Support Summary</p>
                                <div className="mt-3">
                                    <label htmlFor="support-amount" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Monthly support amount (Rs)
                                    </label>
                                    <input
                                        id="support-amount"
                                        className="input-field"
                                        type="number"
                                        min="10"
                                        placeholder="Enter monthly amount"
                                        value={supportForm.amount}
                                        onChange={(e) => setSupportForm((current) => ({ ...current, amount: e.target.value }))}
                                    />
                                    <p className="mt-1 text-xs text-slate-500">This is the amount that will be charged each month in the current test flow.</p>
                                </div>
                            </div>
                            <div className="rounded-[24px] border border-slate-200 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Test Card Details</p>
                                <div className="mt-3 space-y-4">
                                    <div>
                                        <label htmlFor="support-card-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                            Cardholder name
                                        </label>
                                        <input
                                            id="support-card-name"
                                            className="input-field"
                                            placeholder="Name on card"
                                            value={supportForm.cardName}
                                            onChange={(e) => setSupportForm((current) => ({ ...current, cardName: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="support-card-number" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                            Card number
                                        </label>
                                        <input
                                            id="support-card-number"
                                            className="input-field"
                                            inputMode="numeric"
                                            placeholder="1234 5678 9012 3456"
                                            value={supportForm.cardNumber}
                                            onChange={(e) => setSupportForm((current) => ({ ...current, cardNumber: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="support-expiry" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                                Expiry date
                                            </label>
                                            <input
                                                id="support-expiry"
                                                className="input-field"
                                                placeholder="MM/YY"
                                                value={supportForm.expiry}
                                                onChange={(e) => setSupportForm((current) => ({ ...current, expiry: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="support-cvv" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                                CVV
                                            </label>
                                            <input
                                                id="support-cvv"
                                                className="input-field"
                                                inputMode="numeric"
                                                placeholder="3-digit CVV"
                                                value={supportForm.cvv}
                                                onChange={(e) => setSupportForm((current) => ({ ...current, cvv: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">This is a dummy test payment form. The amount is still deducted from wallet balance in the current test setup.</div>
                            <button onClick={handleJoinEmergencyFund} disabled={subscribing} className="btn w-full bg-rose-500 py-3 font-semibold text-white hover:bg-rose-600">{subscribing ? 'Processing...' : 'Complete Payment & Join Monthly Support'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fundraisers;
