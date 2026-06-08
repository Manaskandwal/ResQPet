import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SkeletonCard } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusComponents';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'cases';
    const setActiveTab = (tab) => setSearchParams({ tab });

    const [subscribing, setSubscribing] = useState(false);
    const [paymentHistoryMessage, setPaymentHistoryMessage] = useState('');
    const [supportModalOpen, setSupportModalOpen] = useState(false);
    const [supportForm, setSupportForm] = useState(defaultSupportForm);
    const [detailsFundraiser, setDetailsFundraiser] = useState(null);

    // NGO specific state
    const [eligibleCases, setEligibleCases] = useState([]);
    const [myFundraisers, setMyFundraisers] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        requestedGoal: '',
        billText: '',
        storyText: '',
        caption: '',
        billImage: null,
        mediaFiles: []
    });

    const [editingGoalId, setEditingGoalId] = useState(null);
    const [newGoalValue, setNewGoalValue] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);

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

    const fetchNgoCases = useCallback(async () => {
        try {
            const res = await api.get('/ngo/my-cases');
            const allCases = res.data.cases || [];
            
            // Cases eligible to request a new fundraiser (must be in valid treatment status and have no existing fundraiser)
            const eligible = allCases.filter(c => 
                ['completed', 'treating', 'reached', 'resolved_on_spot', 'hospital_broadcasted'].includes(c.status) &&
                (!c.fundraiser || c.fundraiser.status === 'none')
            );
            
            // Cases that already have fundraiser campaigns requested (pending, approved, rejected, or completed)
            const requested = allCases.filter(c => 
                c.fundraiser && c.fundraiser.status !== 'none'
            );

            setEligibleCases(eligible);
            setMyFundraisers(requested);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch cases.');
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const promises = [fetchFundraisers(), fetchNgos()];
            if (user?.role === 'ngo' && user.isApproved) {
                promises.push(fetchNgoCases());
            }
            await Promise.all(promises);
            setLoading(false);
        };
        init();
    }, [user, fetchNgoCases]);

    const handleNgoSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCase) return;
        if (!formData.billImage) {
            toast.error('Please attach the bill estimate image.');
            return;
        }

        setFormLoading(true);
        try {
            const data = new FormData();
            data.append('requestedGoal', formData.requestedGoal);
            data.append('billText', formData.billText);
            data.append('storyText', formData.storyText || '');
            data.append('caption', formData.caption || '');
            data.append('billImage', formData.billImage);

            if (formData.mediaFiles && formData.mediaFiles.length > 0) {
                formData.mediaFiles.forEach((file) => {
                    data.append('media', file);
                });
            }

            await api.post(`/ngo/rescue/${selectedCase._id}/fundraiser`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Fundraiser request submitted for verification.');
            setSelectedCase(null);
            setFormData({ requestedGoal: '', billText: '', storyText: '', caption: '', billImage: null, mediaFiles: [] });
            fetchNgoCases();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request fundraiser.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditGoalSubmit = async (caseId) => {
        if (!newGoalValue || Number(newGoalValue) < 100) {
            toast.error('Minimum goal is ₹100.');
            return;
        }
        setActionLoadingId(caseId);
        try {
            await api.put(`/ngo/rescue/${caseId}/fundraiser/edit-goal`, { newGoal: Number(newGoalValue) });
            toast.success('Fundraiser goal updated!');
            setEditingGoalId(null);
            setNewGoalValue('');
            await fetchNgoCases();
            await fetchFundraisers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update goal.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleAddMedia = async (caseId, files) => {
        if (!files || files.length === 0) return;
        const formDataObj = new FormData();
        Array.from(files).forEach(file => {
            formDataObj.append('media', file);
        });

        setActionLoadingId(caseId);
        const toastId = toast.loading('Uploading additional proof/media...');
        try {
            await api.post(`/ngo/rescue/${caseId}/fundraiser/add-media`, formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Proofs successfully uploaded!', { id: toastId });
            await fetchNgoCases();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload media.', { id: toastId });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleTogglePause = async (caseId) => {
        setActionLoadingId(caseId);
        try {
            const res = await api.put(`/ngo/rescue/${caseId}/fundraiser/toggle-pause`);
            toast.success(res.data.message || 'Campaign status updated.');
            await fetchNgoCases();
            await fetchFundraisers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update campaign status.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCancelCampaign = async (caseId) => {
        if (!window.confirm('Are you sure you want to cancel this fundraiser campaign? This action is irreversible.')) {
            return;
        }
        setActionLoadingId(caseId);
        try {
            await api.put(`/ngo/rescue/${caseId}/fundraiser/cancel`);
            toast.success('Fundraiser campaign cancelled.');
            await fetchNgoCases();
            await fetchFundraisers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel campaign.');
        } finally {
            setActionLoadingId(null);
        }
    };

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
            return false;
        }
        const amount = parseFloat(donationAmount);
        if (!amount || amount < 10) {
            toast.error('Minimum donation is Rs 10.');
            return false;
        }

        if (isNgo) {
            // General NGO simulation mode
            setDonatingId(id);
            setTimeout(() => {
                toast.success(`Simulated payment of Rs ${amount} to NGO successful.`);
                setDonationAmount('');
                setDonatingId(null);
            }, 1000);
            return true;
        }

        setDonatingId(id);
        try {
            const { data } = await api.post('/donation/donate-wallet', {
                rescueId: id,
                amount: amount
            });
            
            toast.success(data.message);
            updateUser({ walletBalance: data.walletBalance });
            setDonationAmount('');
            fetchFundraisers();
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process donation.');
            return false;
        } finally {
            setDonatingId(null);
        }
    };

    if (loading) {
        if (isNewUI) return <div className="resqpet-obsidian-theme space-y-4">{[1,2].map(i => <div key={i} className="h-48 rounded-[2rem] bg-surface-hover animate-pulse" />)}</div>;
        return (
            <div className="space-y-6">
                <h1 className="page-title">Fundraisers</h1>
                {[1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    const isOwnerView = detailsFundraiser && user && user.role === 'ngo' && (
        detailsFundraiser.assignedNGO?._id === user._id || 
        detailsFundraiser.assignedNGO === user._id
    );
    const isActive = detailsFundraiser && (
        !detailsFundraiser.fundraiser || 
        detailsFundraiser.fundraiser?.status === 'approved'
    );

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-on-surface space-y-8">
                {/* Header & Tabs */}
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <span className="text-brand text-[10px] font-black uppercase tracking-[0.3em]">Community</span>
                        <h1 className="font-headline text-4xl font-extrabold tracking-tight">Fund<span className="text-brand">raisers</span></h1>
                        <p className="text-on-surface/50">Your contribution saves lives every single day.</p>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-4">
                        <div className="flex gap-1 rounded-2xl bg-surface-hover p-1 w-full md:w-fit overflow-x-auto no-scrollbar">
                            <button onClick={() => setActiveTab('cases')} className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'cases' ? 'bg-brand text-background' : 'text-on-surface/40 hover:text-on-surface'}`}>Active Cases</button>
                            <button onClick={() => setActiveTab('ngos')} className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'ngos' ? 'bg-brand text-background' : 'text-on-surface/40 hover:text-on-surface'}`}>NGO-wise</button>
                            {user?.role === 'ngo' && (
                                <>
                                    <button onClick={() => setActiveTab('my_fundraisers')} className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'my_fundraisers' ? 'bg-brand text-background' : 'text-on-surface/40 hover:text-on-surface'}`}>My Fundraisers</button>
                                    <button onClick={() => setActiveTab('manage')} className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'manage' ? 'bg-brand text-background' : 'text-on-surface/40 hover:text-on-surface'}`}>Request Fundraiser</button>
                                </>
                            )}
                        </div>
                        
                        {!user?.monthlySubscription?.isSubscribed ? (
                            <button onClick={() => setSupportModalOpen(true)} className="flex items-center gap-2 rounded-full bg-gradient-to-br from-brand to-brand-dark text-background px-6 py-3 text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                                <HeartIcon className="h-4 w-4" /> Monthly Support
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-[10px] font-black text-brand uppercase tracking-widest">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> Active Subscriber
                            </div>
                        )}
                    </div>
                </section>

                {/* Mode notice */}
                <div className="glass-card rounded-2xl border border-surface-border bg-surface px-6 py-4">
                    <p className="text-xs text-on-surface/30 font-medium">Current testing flow uses wallet balance for recurring emergency contributions.</p>
                    {paymentHistoryMessage && <p className="mt-2 text-xs text-brand font-bold">{paymentHistoryMessage}</p>}
                </div>

                {/* Content */}
                {activeTab === 'cases' ? (
                    fundraisers.length === 0 ? (
                        <div className="glass-card rounded-[3rem] border border-dashed border-surface-border p-16 text-center space-y-4">
                            <HeartIcon className="mx-auto h-12 w-12 text-on-surface/10" />
                            <p className="text-xs font-black uppercase tracking-widest text-on-surface/20">No active fundraisers.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {fundraisers.map((rescue) => {
                                const progress = Math.min(((rescue.amountRaised || 0) / (rescue.estimatedCost || 1)) * 100, 100);
                                return (
                                    <div key={rescue._id} className="glass-card rounded-[2rem] border border-surface-border bg-surface overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300">
                                        <div className="relative overflow-hidden">
                                            {rescue.images?.[0] ? <img src={rescue.images[0]} alt="Animal" className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70" /> : <div className="flex h-48 w-full items-center justify-center bg-surface-hover text-on-surface/20 text-sm">No Image Available</div>}
                                            <div className="absolute left-3 top-3 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Case #{rescue._id.slice(-6).toUpperCase()}</div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col space-y-4">
                                            <p className="font-bold text-on-surface line-clamp-2">{rescue.description}</p>
                                            <p className="text-xs text-on-surface/30">{rescue.location.address || 'Location provided'}</p>
                                            <div className="mt-auto space-y-3">
                                                <div className="flex justify-between text-xs font-black">
                                                    <span className="text-brand">Raised: ₹{rescue.amountRaised || 0}</span>
                                                    <span className="text-[#ffb77d]">Goal: ₹{rescue.estimatedCost}</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark transition-all duration-1000 shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.4)]" style={{ width: `${progress}%` }} />
                                                </div>
                                                <p className="text-right text-[10px] font-black text-on-surface/20">{Number(progress || 0).toFixed(0)}% FUNDED</p>
                                                <div className="flex flex-col gap-2 pt-2">
                                                    <button onClick={() => setDetailsFundraiser(rescue)} className="w-full rounded-2xl bg-white/5 hover:bg-white/10 border border-surface-border text-on-surface py-2.5 text-xs font-black uppercase transition-all">Read Story & Donate</button>
                                                    <div className="flex gap-2">
                                                        <input type="number" min="10" placeholder="Amount" className="flex-1 rounded-2xl bg-surface-hover border border-surface-border px-4 py-2.5 text-sm text-on-surface outline-none focus:border-brand/30 transition-all" onChange={(e) => setDonationAmount(e.target.value)} />
                                                        <button onClick={() => handleDonate(rescue._id)} disabled={donatingId === rescue._id} className="rounded-2xl bg-brand text-background px-5 py-2.5 text-xs font-black uppercase disabled:opacity-50 hover:scale-105 transition-all">{donatingId === rescue._id ? '...' : 'Help'}</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : activeTab === 'ngos' ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {ngos.filter((ngo) => ngo.paymentDetails?.upiId).map((ngo) => (
                            <div key={ngo._id} className="glass-card rounded-[2rem] border border-surface-border bg-surface p-6 space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-2xl font-black text-brand">{ngo.orgName?.charAt(0) || 'N'}</div>
                                    <div>
                                        <p className="font-headline font-bold text-lg text-on-surface">{ngo.orgName}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface/30">Registered NGO</p>
                                    </div>
                                </div>
                                <p className="text-sm text-on-surface/40 line-clamp-2">{ngo.address || 'No address provided'}</p>
                                <div className="rounded-2xl bg-surface-hover border border-surface-border p-4 space-y-2 text-xs">
                                    <div className="flex justify-between"><span className="text-on-surface/30">UPI ID</span><span className="font-bold text-on-surface">{ngo.paymentDetails.upiId}</span></div>
                                    <div className="flex justify-between"><span className="text-on-surface/30">Bank</span><span className="font-bold text-on-surface">{ngo.paymentDetails.bankName || 'HDFC Bank'}</span></div>
                                </div>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Amount" className="flex-1 rounded-2xl bg-surface-hover border border-surface-border px-4 py-2.5 text-sm text-on-surface outline-none focus:border-brand/30 transition-all" onChange={(e) => setDonationAmount(e.target.value)} />
                                    <button onClick={() => handleDonate(ngo._id, true)} className="rounded-2xl bg-brand text-background px-5 py-2.5 text-xs font-black uppercase hover:scale-105 transition-all">Donate</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activeTab === 'my_fundraisers' && user?.role === 'ngo' ? (
                    <div className="space-y-6">
                        <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Our Fundraising Campaigns</h2>
                        <p className="text-sm text-on-surface/50">Track the progress and verification status of fundraisers initiated by your organization.</p>
                        
                        {myFundraisers.length === 0 ? (
                            <div className="py-16 glass-card rounded-[2.5rem] border border-dashed border-white/5 text-center space-y-4">
                                <span className="material-symbols-outlined text-4xl text-white/10">campaign</span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No Fundraisers Initiated Yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {myFundraisers.map((c) => {
                                    const progress = Math.min(((c.amountRaised || 0) / (c.fundraiser.requestedGoal || 1)) * 100, 100);
                                    return (
                                        <div key={c._id} className="glass-card rounded-[2rem] border border-surface-border bg-surface p-6 flex flex-col justify-between group hover:border-brand/30 transition-all">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#76d6d4]/50">Case #{c._id.slice(-6).toUpperCase()}</span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                                c.fundraiser.status === 'approved' ? 'bg-[#76d6d4]/10 text-[#76d6d4]' :
                                                                c.fundraiser.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                                c.fundraiser.status === 'paused' ? 'bg-amber-500/10 text-amber-400' :
                                                                c.fundraiser.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                                                'bg-[#ffb77d]/10 text-[#ffb77d]'
                                                            }`}>
                                                                {c.fundraiser.status}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-lg text-on-surface mt-1 leading-tight">{c.description}</h4>
                                                    </div>
                                                    {c.images?.[0] && (
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                                                            <img src={c.images[0]} alt="Subject" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-black">
                                                        <span className="text-on-surface/40">Goal: ₹{c.fundraiser.requestedGoal}</span>
                                                        <span className="text-brand">Raised: ₹{c.amountRaised || 0}</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-brand to-brand-dark" style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <p className="text-right text-[9px] font-black text-on-surface/20">{Number(progress).toFixed(0)}% FUNDED</p>
                                                </div>

                                                <div className="pt-4 border-t border-white/5 space-y-3 text-xs text-on-surface/60">
                                                    {c.fundraiser.caption && <p><span className="font-bold text-on-surface/30 uppercase text-[9px] tracking-widest block mb-0.5">Caption</span> {c.fundraiser.caption}</p>}
                                                    <p><span className="font-bold text-on-surface/30 uppercase text-[9px] tracking-widest block mb-0.5">Justification</span> {c.fundraiser.billText}</p>
                                                    {c.fundraiser.adminNotes && (
                                                        <div className="p-3 rounded-xl bg-red-950/10 border border-red-500/10 text-red-300">
                                                            <span className="font-bold text-red-400 uppercase text-[9px] tracking-widest block mb-0.5">Admin Notes</span>
                                                            {c.fundraiser.adminNotes}
                                                        </div>
                                                    )}

                                                    {editingGoalId === c._id ? (
                                                        <div className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/5">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand">Edit Goal Amount</p>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="number"
                                                                    value={newGoalValue}
                                                                    onChange={(e) => setNewGoalValue(e.target.value)}
                                                                    placeholder="New goal"
                                                                    className="flex-1 rounded-lg bg-surface border border-surface-border px-3 py-1.5 text-xs text-on-surface outline-none"
                                                                />
                                                                <button
                                                                    onClick={() => handleEditGoalSubmit(c._id)}
                                                                    disabled={actionLoadingId === c._id}
                                                                    className="px-3 py-1.5 rounded-lg bg-brand text-background text-[10px] font-black uppercase"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingGoalId(null)}
                                                                    className="px-3 py-1.5 rounded-lg bg-white/5 text-on-surface text-[10px] font-black uppercase border border-surface-border"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                                        <button 
                                                            onClick={() => setDetailsFundraiser(c)} 
                                                            className="rounded-xl bg-white/5 hover:bg-white/10 text-white py-2 text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all text-center"
                                                        >
                                                            Preview Campaign
                                                        </button>

                                                        {['pending', 'approved', 'paused'].includes(c.fundraiser.status) && (
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingGoalId(c._id);
                                                                    setNewGoalValue(c.fundraiser.requestedGoal);
                                                                }}
                                                                className="rounded-xl bg-white/5 hover:bg-white/10 text-white py-2 text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all text-center"
                                                            >
                                                                Edit Goal
                                                            </button>
                                                        )}

                                                        {['pending', 'approved', 'paused'].includes(c.fundraiser.status) && (
                                                            <>
                                                                <input 
                                                                    type="file" 
                                                                    id={`add-media-input-${c._id}`} 
                                                                    multiple 
                                                                    accept="image/*,video/*" 
                                                                    className="hidden" 
                                                                    onChange={(e) => handleAddMedia(c._id, e.target.files)} 
                                                                />
                                                                <button 
                                                                    onClick={() => document.getElementById(`add-media-input-${c._id}`).click()}
                                                                    className="rounded-xl bg-white/5 hover:bg-white/10 text-white py-2 text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all text-center"
                                                                >
                                                                    Add Proofs
                                                                </button>
                                                            </>
                                                        )}

                                                        {c.fundraiser.status === 'approved' && (
                                                            <button 
                                                                onClick={() => handleTogglePause(c._id)}
                                                                className="rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 py-2 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 transition-all text-center"
                                                            >
                                                                Pause
                                                            </button>
                                                        )}

                                                        {c.fundraiser.status === 'paused' && (
                                                            <button 
                                                                onClick={() => handleTogglePause(c._id)}
                                                                className="rounded-xl bg-[#76d6d4]/10 hover:bg-[#76d6d4]/20 text-[#76d6d4] py-2 text-[9px] font-black uppercase tracking-widest border border-[#76d6d4]/20 transition-all text-center"
                                                            >
                                                                Resume
                                                            </button>
                                                        )}

                                                        {['pending', 'approved', 'paused'].includes(c.fundraiser.status) && (
                                                            <button 
                                                                onClick={() => handleCancelCampaign(c._id)}
                                                                className="col-span-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 text-[9px] font-black uppercase tracking-widest border border-red-500/20 transition-all text-center"
                                                            >
                                                                Cancel Fundraiser
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {c.fundraiser.billImage && (
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <a href={c.fundraiser.billImage} target="_blank" rel="noopener noreferrer" className="block w-full h-32 rounded-2xl overflow-hidden border border-white/10 relative group">
                                                        <img src={c.fundraiser.billImage} alt="Estimate bill" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/80 px-3 py-1.5 rounded-xl">View Uploaded Bill</span>
                                                        </div>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'manage' && user?.role === 'ngo' ? (
                    <section className="grid lg:grid-cols-2 gap-8">
                        {/* Eligible Cases List */}
                        <div className="space-y-6">
                            <h3 className="font-headline font-bold text-xl uppercase tracking-tight flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#fd8b00]">clinical_notes</span>
                                Eligible Cases
                            </h3>
                            
                            <div className="space-y-4">
                                {eligibleCases.length === 0 ? (
                                    <div className="py-16 glass-card rounded-[2.5rem] border border-dashed border-white/5 text-center space-y-4">
                                        <span className="material-symbols-outlined text-4xl text-white/10">verified</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No Eligible Cases Available</p>
                                    </div>
                                ) : eligibleCases.map(c => {
                                    const isRequested = c.fundraiser && c.fundraiser.status !== 'none';
                                    const isSelected = selectedCase?._id === c._id;
                                    
                                    return (
                                        <div 
                                            key={c._id} 
                                            onClick={() => setSelectedCase(c)}
                                            className={`glass-card rounded-[2rem] p-6 border transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'border-[#fd8b00] bg-[#fd8b00]/10 shadow-[0_0_30px_rgba(253,139,0,0.1)]' 
                                                    : isRequested 
                                                        ? 'border-white/5 bg-[#1c1b1b] opacity-80 hover:border-[#fd8b00]/30 hover:bg-white/5' 
                                                        : 'border-white/5 bg-[#1c1b1b] hover:border-[#fd8b00]/30 hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30">ID: {c._id.slice(-6).toUpperCase()}</span>
                                                        <StatusBadge status={c.status} />
                                                    </div>
                                                    <h4 className="font-bold text-lg leading-tight">{c.description}</h4>
                                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest pt-2">
                                                        {isRequested ? (
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                                c.fundraiser.status === 'approved' ? 'bg-[#76d6d4]/10 text-[#76d6d4]' :
                                                                c.fundraiser.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                                'bg-[#ffb77d]/10 text-[#ffb77d]'
                                                            }`}>
                                                                Fundraiser: {c.fundraiser.status}
                                                            </span>
                                                        ) : (
                                                            <span className="text-white/30 flex items-center">
                                                                <span className="material-symbols-outlined text-sm align-middle mr-1.5">payments</span>
                                                                Not Funded
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {c.images?.[0] && (
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                                                        <img src={c.images[0]} alt="Case" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Request Form Panel */}
                        <div className="space-y-6">
                            <h3 className="font-headline font-bold text-xl uppercase tracking-tight flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#76d6d4]">edit_document</span>
                                Request Details
                            </h3>
                            
                            <div className="glass-card rounded-[2.5rem] bg-[#1c1b1b] border border-white/5 p-8 relative overflow-hidden">
                                {!selectedCase ? (
                                    <div className="absolute inset-0 z-10 bg-[#1c1b1b]/80 backdrop-blur-sm flex items-center justify-center p-8 text-center">
                                        <div className="space-y-4">
                                            <span className="material-symbols-outlined text-4xl text-white/10">swipe_left</span>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Select a case to initiate request</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#fd8b00]/5 to-transparent pointer-events-none" />
                                )}
                                
                                {selectedCase && selectedCase.fundraiser && selectedCase.fundraiser.status !== 'none' ? (
                                    <div className="space-y-6 relative z-10 w-full text-sm text-[#e5e2e1]">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#fd8b00] mb-1">Target Case</p>
                                            <p className="font-bold text-sm truncate">{selectedCase.description}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">ID: {selectedCase._id}</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Request Status</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                    selectedCase.fundraiser.status === 'approved' ? 'bg-[#76d6d4]/10 text-[#76d6d4]' :
                                                    selectedCase.fundraiser.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-[#ffb77d]/10 text-[#ffb77d]'
                                                }`}>
                                                    {selectedCase.fundraiser.status}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Fundraising Goal</span>
                                                <span className="text-lg font-black text-on-surface">₹{selectedCase.fundraiser.requestedGoal}</span>
                                            </div>

                                            {selectedCase.fundraiser.status === 'approved' && (
                                                <div className="space-y-2 border-b border-white/5 pb-3">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-[#76d6d4]">Raised: ₹{selectedCase.amountRaised || 0}</span>
                                                        <span className="text-white/30">Progress: {Math.min(((selectedCase.amountRaised || 0) / selectedCase.fundraiser.requestedGoal) * 100, 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                                                        <div className="h-full rounded-full bg-gradient-to-r from-[#fd8b00] to-[#ffb77d]" style={{ width: `${Math.min(((selectedCase.amountRaised || 0) / selectedCase.fundraiser.requestedGoal) * 100, 100)}%` }} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Justification Details</span>
                                                <p className="text-xs text-white/60 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{selectedCase.fundraiser.billText || 'No detailed treatment explanation was provided.'}</p>
                                            </div>

                                            {selectedCase.fundraiser.adminNotes && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Admin Remarks</span>
                                                    <p className="text-xs text-red-200 leading-relaxed bg-red-950/10 p-4 rounded-xl border border-red-500/10">{selectedCase.fundraiser.adminNotes}</p>
                                                </div>
                                            )}

                                            {selectedCase.fundraiser.billImage && (
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Uploaded Bill Estimate</span>
                                                    <a href={selectedCase.fundraiser.billImage} target="_blank" rel="noopener noreferrer" className="block w-full h-32 rounded-2xl overflow-hidden border border-white/10 relative group">
                                                        <img src={selectedCase.fundraiser.billImage} alt="Bill estimate" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-xl">View Original Bill</span>
                                                        </div>
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-6 border-t border-white/5">
                                            <button 
                                                type="button"
                                                onClick={() => setSelectedCase(null)}
                                                className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                                            >
                                                Clear Selection
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleNgoSubmit} className="space-y-6 relative z-10 w-full">
                                        {selectedCase && (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-8">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#fd8b00] mb-1">Target Case</p>
                                                <p className="font-bold text-sm truncate">{selectedCase.description}</p>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Required Amount (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">₹</span>
                                                <input 
                                                    type="number" 
                                                    required min="100" 
                                                    value={formData.requestedGoal} 
                                                    onChange={e => setFormData(c => ({...c, requestedGoal: e.target.value}))} 
                                                    className="w-full rounded-2xl bg-[#131313] border border-white/10 pl-10 pr-4 py-4 text-lg font-bold text-[#e5e2e1] outline-none focus:border-[#fd8b00]/50 transition-all appearance-none" 
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Short Campaign Caption/Title</label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={formData.caption} 
                                                onChange={e => setFormData(c => ({...c, caption: e.target.value}))} 
                                                className="w-full rounded-2xl bg-[#131313] border border-white/10 px-4 py-4 text-sm text-[#e5e2e1] outline-none focus:border-[#fd8b00]/50 transition-all" 
                                                placeholder="e.g. Save Bruno: Help him walk again!"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Detailed Case Story & Treatment Diagnosis</label>
                                            <textarea 
                                                required 
                                                value={formData.storyText} 
                                                onChange={e => setFormData(c => ({...c, storyText: e.target.value}))} 
                                                className="w-full h-32 rounded-2xl bg-[#131313] border border-white/10 p-4 text-sm text-[#e5e2e1] outline-none focus:border-[#fd8b00]/50 transition-all resize-none" 
                                                placeholder="Share details about the rescue, recovery process, animal behavior, and how these funds will directly make an impact..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Treatment & Bill Justification</label>
                                            <textarea 
                                                required 
                                                value={formData.billText} 
                                                onChange={e => setFormData(c => ({...c, billText: e.target.value}))} 
                                                className="w-full h-24 rounded-2xl bg-[#131313] border border-white/10 p-4 text-sm text-[#e5e2e1] outline-none focus:border-[#fd8b00]/50 transition-all resize-none" 
                                                placeholder="Explain the medical procedures and why these funds are necessary..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Upload Evidence (Bill/Estimate Image)</label>
                                            <div className="relative w-full">
                                                <input 
                                                    type="file" 
                                                    id="bill-upload" 
                                                    required 
                                                    accept="image/*" 
                                                    onChange={e => setFormData(c => ({...c, billImage: e.target.files[0]}))} 
                                                    className="hidden" 
                                                />
                                                <label 
                                                    htmlFor="bill-upload" 
                                                    className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#fd8b00]/30 hover:bg-white/5 transition-all cursor-pointer group"
                                                >
                                                    <span className={`material-symbols-outlined text-3xl mb-2 transition-colors ${formData.billImage ? 'text-[#76d6d4]' : 'text-white/20 group-hover:text-[#fd8b00]'}`}>
                                                        {formData.billImage ? 'task_alt' : 'receipt_long'}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                                        {formData.billImage ? formData.billImage.name : 'Tap to select bill image'}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Additional Photos & Videos (Optional)</label>
                                            <div className="relative w-full">
                                                <input 
                                                    type="file" 
                                                    id="media-upload" 
                                                    multiple 
                                                    accept="image/*,video/*" 
                                                    onChange={e => setFormData(c => ({...c, mediaFiles: Array.from(e.target.files)}))} 
                                                    className="hidden" 
                                                />
                                                <label 
                                                    htmlFor="media-upload" 
                                                    className="flex flex-col items-center justify-center w-full h-24 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#fd8b00]/30 hover:bg-white/5 transition-all cursor-pointer group"
                                                >
                                                    <span className={`material-symbols-outlined text-2xl mb-1 transition-colors ${formData.mediaFiles && formData.mediaFiles.length > 0 ? 'text-[#76d6d4]' : 'text-white/20 group-hover:text-[#fd8b00]'}`}>
                                                        {formData.mediaFiles && formData.mediaFiles.length > 0 ? 'task_alt' : 'add_a_photo'}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                                                        {formData.mediaFiles && formData.mediaFiles.length > 0 ? `${formData.mediaFiles.length} files selected` : 'Select images/videos'}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5">
                                            <button 
                                                type="submit" 
                                                disabled={formLoading || !selectedCase} 
                                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#fd8b00] to-[#ffb77d] text-[#131313] text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(253,139,0,0.2)] hover:shadow-[0_0_30px_rgba(253,139,0,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none disabled:grayscale"
                                            >
                                                {formLoading ? 'Transmitting Request...' : 'Submit Fundraiser Workflow'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </section>
                ) : null}

                {/* Monthly Support Modal */}
                {supportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-[2rem] border border-surface-border bg-surface shadow-2xl">
                            <div className="flex items-center justify-between border-b border-surface-border px-6 py-5">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand/60">Monthly Support</span>
                                    <h3 className="font-headline font-bold text-xl text-on-surface">Join Emergency Fund</h3>
                                </div>
                                <button onClick={() => setSupportModalOpen(false)} className="p-2 hover:bg-surface-hover rounded-xl text-on-surface/30 hover:text-white transition-all">
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30">Monthly amount (₹)</label>
                                    <input className="w-full rounded-2xl bg-surface-hover border border-surface-border px-4 py-3 text-on-surface text-sm outline-none focus:border-brand/30 transition-all" type="number" min="10" placeholder="Enter monthly amount" value={supportForm.amount} onChange={(e) => setSupportForm((cur) => ({ ...cur, amount: e.target.value }))} />
                                    <p className="text-xs text-on-surface/20">Amount charged monthly from wallet in test mode.</p>
                                </div>
                                <div className="rounded-2xl border border-[#ffb77d]/20 bg-[#ffb77d]/5 p-4 text-xs text-[#ffb77d]/70">This is a test mode payment. Amount is deducted from wallet balance.</div>
                                <button onClick={handleJoinEmergencyFund} disabled={subscribing} className="w-full py-4 rounded-2xl bg-brand text-background text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50">{subscribing ? 'Processing...' : 'Complete & Join Monthly Support'}</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Details Fundraiser Modal */}
                {detailsFundraiser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4 overflow-y-auto">
                        <div className="w-full max-w-4xl rounded-[2.5rem] border border-surface-border bg-[#131313] p-6 md:p-8 shadow-2xl text-[#e5e2e1] max-h-[90vh] overflow-y-auto no-scrollbar space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand">Fundraiser Campaign Details</span>
                                    <h3 className="font-headline font-black text-xl text-on-surface mt-1">Case #{detailsFundraiser._id.slice(-6).toUpperCase()}</h3>
                                </div>
                                <button onClick={() => setDetailsFundraiser(null)} className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white transition-all">
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                {/* Left Column: Story, Title, Gallery */}
                                <div className="md:col-span-7 space-y-6">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-2xl text-[#fd8b00] leading-tight">
                                            {detailsFundraiser.fundraiser?.caption || detailsFundraiser.description}
                                        </h4>
                                        <p className="text-xs text-on-surface/40 flex items-center gap-1.5 mt-1">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            {detailsFundraiser.location?.address || 'Location provided'}
                                        </p>
                                    </div>

                                    {/* Media Gallery */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Campaign Photos & Videos</p>
                                        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x">
                                            {[
                                                ...(detailsFundraiser.images || []),
                                                ...(detailsFundraiser.fundraiser?.media || [])
                                            ].map((url, idx) => {
                                                const isVideo = url.includes('.mp4') || url.includes('/video/');
                                                return (
                                                    <div key={idx} className="w-80 h-56 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative bg-black snap-start">
                                                        {isVideo ? (
                                                            <video src={url} controls className="w-full h-full object-cover" />
                                                        ) : (
                                                            <img src={url} alt={`Campaign Media ${idx + 1}`} className="w-full h-full object-cover" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {detailsFundraiser.video && (
                                                <div className="w-80 h-56 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative bg-black snap-start">
                                                    <video src={detailsFundraiser.video} controls className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#fd8b00]">The Story</p>
                                        <p className="text-sm leading-relaxed text-[#e5e2e1]/80 whitespace-pre-wrap bg-white/5 p-5 rounded-2xl border border-white/5">
                                            {detailsFundraiser.fundraiser?.storyText || 'No detailed case story has been uploaded by the NGO yet.'}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Diagnosis & Justification</p>
                                        <p className="text-xs leading-relaxed text-white/60 bg-white/5 p-4 rounded-xl border border-white/5">
                                            {detailsFundraiser.fundraiser?.billText || detailsFundraiser.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Column: Stats, Donation form, NGO info */}
                                <div className="md:col-span-5 space-y-6">
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Fundraising Progress</p>
                                            <div className="flex justify-between items-baseline mt-2">
                                                <span className="text-3xl font-black text-brand">₹{detailsFundraiser.amountRaised || 0}</span>
                                                <span className="text-sm font-bold text-white/50">of ₹{detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost}</span>
                                            </div>
                                        </div>

                                        <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-brand to-brand-dark rounded-full shadow-[0_0_12px_rgba(var(--brand-primary-rgb),0.5)]" 
                                                style={{ width: `${Math.min(((detailsFundraiser.amountRaised || 0) / (detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost || 1)) * 100, 100)}%` }} 
                                            />
                                        </div>

                                        <div className="flex justify-between text-xs font-black text-on-surface/40">
                                            <span>{Math.min(((detailsFundraiser.amountRaised || 0) / (detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost || 1)) * 100, 100).toFixed(0)}% FUNDED</span>
                                            <span className="text-brand">₹{Math.max((detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost || 0) - (detailsFundraiser.amountRaised || 0), 0)} NEEDED</span>
                                        </div>
                                    </div>

                                    {/* Quick Donate Form / Owner Progress / Inactive View */}
                                    {isOwnerView ? (
                                        <div className="p-6 rounded-3xl bg-brand/10 border border-brand/20 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-brand">campaign</span>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-brand">Owner Progress View</p>
                                            </div>
                                            <div className="space-y-3 text-xs leading-relaxed text-[#e5e2e1]/80">
                                                <p className="font-bold text-sm text-on-surface">Campaign Status: <span className="text-brand uppercase">{detailsFundraiser.fundraiser?.status || 'approved'}</span></p>
                                                <p>
                                                    {detailsFundraiser.fundraiser?.status === 'pending' && 'This fundraiser is currently pending admin approval. Once approved, it will be visible to the public for donations.'}
                                                    {(detailsFundraiser.fundraiser?.status === 'approved' || !detailsFundraiser.fundraiser?.status) && 'This fundraiser is active and currently accepting donations from the public.'}
                                                    {detailsFundraiser.fundraiser?.status === 'paused' && 'This fundraiser is paused. It is temporarily hidden from the public and not accepting donations.'}
                                                    {detailsFundraiser.fundraiser?.status === 'completed' && 'This fundraiser is successfully completed! Thank you for your support.'}
                                                    {detailsFundraiser.fundraiser?.status === 'cancelled' && 'This fundraiser has been cancelled.'}
                                                    {detailsFundraiser.fundraiser?.status === 'rejected' && `This fundraiser request was rejected. Admin notes: ${detailsFundraiser.fundraiser?.adminNotes || 'None'}`}
                                                </p>
                                                <div className="pt-2 border-t border-white/5 flex flex-col gap-1 text-[10px] text-white/40 uppercase tracking-widest">
                                                    <p>Goal: ₹{detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost}</p>
                                                    <p>Raised: ₹{detailsFundraiser.amountRaised || 0}</p>
                                                    <p>Remaining: ₹{Math.max((detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost || 0) - (detailsFundraiser.amountRaised || 0), 0)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : isActive ? (
                                        <div className="p-6 rounded-3xl bg-brand/5 border border-brand/10 space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand">Support this Fundraiser</p>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold text-sm">₹</span>
                                                    <input 
                                                        type="number" 
                                                        min="10" 
                                                        placeholder="Amount" 
                                                        className="w-full rounded-2xl bg-[#131313] border border-white/10 pl-8 pr-4 py-3 text-sm text-[#e5e2e1] outline-none focus:border-brand/30 transition-all" 
                                                        onChange={(e) => setDonationAmount(e.target.value)} 
                                                    />
                                                </div>
                                                <button 
                                                    onClick={async () => {
                                                        const amt = parseFloat(donationAmount);
                                                        if (!amt || amt < 10) {
                                                            toast.error('Minimum donation is Rs 10.');
                                                            return;
                                                        }
                                                        const success = await handleDonate(detailsFundraiser._id);
                                                        if (success) {
                                                            setDetailsFundraiser(prev => ({
                                                                ...prev,
                                                                amountRaised: (prev.amountRaised || 0) + amt
                                                            }));
                                                        }
                                                    }} 
                                                    disabled={donatingId === detailsFundraiser._id} 
                                                    className="rounded-2xl bg-brand text-background px-6 py-3 text-xs font-black uppercase disabled:opacity-50 hover:scale-105 transition-all"
                                                >
                                                    {donatingId === detailsFundraiser._id ? '...' : 'Donate'}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-white/20">All contributions are deducted directly from your ResQPet wallet in test mode.</p>
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-3xl bg-[#fd8b00]/5 border border-[#fd8b00]/20 text-center space-y-2">
                                            <span className="material-symbols-outlined text-2xl text-[#fd8b00]">lock</span>
                                            <p className="text-xs font-bold text-on-surface">Donations Closed</p>
                                            <p className="text-[10px] text-on-surface/50 leading-relaxed">This fundraiser is no longer active (Status: {detailsFundraiser.fundraiser?.status || 'inactive'}) and is not accepting donations.</p>
                                        </div>
                                    )}

                                    {detailsFundraiser.fundraiser?.billImage && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Uploaded Bill Estimate Proof</p>
                                            <a href={detailsFundraiser.fundraiser.billImage} target="_blank" rel="noopener noreferrer" className="block w-full h-32 rounded-2xl overflow-hidden border border-white/10 relative group">
                                                <img src={detailsFundraiser.fundraiser.billImage} alt="Bill estimate" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/80 px-3 py-1.5 rounded-xl">View Original Bill</span>
                                                </div>
                                            </a>
                                        </div>
                                    )}

                                    {detailsFundraiser.assignedNGO && (
                                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-xs">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Assigned Rescue NGO</p>
                                            <p className="font-bold text-sm text-on-surface">{detailsFundraiser.assignedNGO.orgName || detailsFundraiser.assignedNGO.name}</p>
                                            <p className="text-white/50">{detailsFundraiser.assignedNGO.email || 'No email provided'}</p>
                                        </div>
                                    )}
                                </div>
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
                {user?.role === 'ngo' && (
                    <>
                        <button onClick={() => setActiveTab('my_fundraisers')} className={`relative px-6 py-3 text-sm font-bold transition-all ${activeTab === 'my_fundraisers' ? 'text-rose-600' : 'text-surface-muted hover:text-slate-700'}`}>My Fundraisers{activeTab === 'my_fundraisers' && <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-rose-600" />}</button>
                        <button onClick={() => setActiveTab('manage')} className={`relative px-6 py-3 text-sm font-bold transition-all ${activeTab === 'manage' ? 'text-rose-600' : 'text-surface-muted hover:text-slate-700'}`}>Request Fundraiser{activeTab === 'manage' && <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-rose-600" />}</button>
                    </>
                )}
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
                                        <div className="mt-4 flex flex-col gap-2">
                                            <button onClick={() => setDetailsFundraiser(rescue)} className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 font-bold w-full transition-all">Read Story & Donate</button>
                                            <div className="flex items-center gap-2">
                                                <input type="number" min="10" placeholder="100" className="w-full rounded-btn border-none bg-slate-50 px-3 py-2 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20" onChange={(e) => setDonationAmount(e.target.value)} />
                                                <button onClick={() => handleDonate(rescue._id)} disabled={donatingId === rescue._id} className="btn bg-rose-500 px-6 py-2 font-bold text-white shadow-md shadow-rose-100 hover:bg-rose-600">{donatingId === rescue._id ? '...' : 'Help'}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : activeTab === 'ngos' ? (
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
            ) : activeTab === 'my_fundraisers' && user?.role === 'ngo' ? (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800">Our Fundraising Campaigns</h2>
                    <p className="text-sm text-surface-muted">Track the progress and verification status of fundraisers initiated by your organization.</p>
                    
                    {myFundraisers.length === 0 ? (
                        <div className="card py-16 text-center text-surface-muted">
                            No fundraisers requested yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {myFundraisers.map((c) => {
                                const progress = Math.min(((c.amountRaised || 0) / (c.fundraiser.requestedGoal || 1)) * 100, 100);
                                return (
                                    <div key={c._id} className="card border-surface-border/50 p-6 flex flex-col justify-between transition-all hover:shadow-card-hover">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Case ID: {c._id.slice(-6).toUpperCase()}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                                            c.fundraiser.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                            c.fundraiser.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                                            c.fundraiser.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                                                            c.fundraiser.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                                            'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {c.fundraiser.status}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-lg leading-snug">{c.description}</h4>
                                                    <p className="text-[11px] text-surface-muted">{c.location?.address || 'Location provided'}</p>
                                                </div>
                                                {c.images?.[0] && (
                                                    <img src={c.images[0]} alt="Animal" className="w-16 h-16 object-cover rounded-md shrink-0" />
                                                )}
                                            </div>

                                            <div className="space-y-2 pt-2">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-slate-600">Goal: ₹{c.fundraiser.requestedGoal}</span>
                                                    <span className="text-rose-600">Raised: ₹{c.amountRaised || 0}</span>
                                                </div>
                                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400" style={{ width: `${progress}%` }} />
                                                </div>
                                                <p className="text-right text-[10px] font-bold text-slate-400">{Number(progress).toFixed(0)}% FUNDED</p>
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 space-y-3 text-sm text-slate-600">
                                                {c.fundraiser.caption && <p><span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-0.5">Caption</span> {c.fundraiser.caption}</p>}
                                                <p><span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-0.5">Justification</span> {c.fundraiser.billText}</p>
                                                {c.fundraiser.adminNotes && (
                                                    <div className="p-3 rounded-md bg-rose-50 border border-rose-100 text-rose-800">
                                                        <span className="font-bold text-rose-600 uppercase text-[10px] tracking-wider block mb-0.5">Admin Notes</span>
                                                        {c.fundraiser.adminNotes}
                                                    </div>
                                                )}

                                                {editingGoalId === c._id ? (
                                                    <div className="space-y-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                                                        <p className="text-xs font-bold text-slate-700">Edit Goal Amount (₹)</p>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                value={newGoalValue}
                                                                onChange={(e) => setNewGoalValue(e.target.value)}
                                                                placeholder="New goal"
                                                                className="flex-1 rounded border border-slate-300 px-3 py-1 text-sm bg-white text-slate-800 outline-none"
                                                            />
                                                            <button
                                                                onClick={() => handleEditGoalSubmit(c._id)}
                                                                disabled={actionLoadingId === c._id}
                                                                className="px-3 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingGoalId(null)}
                                                                className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <button 
                                                        onClick={() => setDetailsFundraiser(c)} 
                                                        className="rounded bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 text-xs font-bold transition-all text-center"
                                                    >
                                                        Preview Campaign
                                                    </button>

                                                    {['pending', 'approved', 'paused'].includes(c.fundraiser.status) && (
                                                        <button 
                                                            onClick={() => {
                                                                setEditingGoalId(c._id);
                                                                setNewGoalValue(c.fundraiser.requestedGoal);
                                                            }}
                                                            className="rounded bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 text-xs font-bold transition-all text-center"
                                                        >
                                                            Edit Goal
                                                        </button>
                                                    )}

                                                    {['pending', 'approved', 'paused'].includes(c.fundraiser.status) && (
                                                        <>
                                                            <input 
                                                                type="file" 
                                                                id={`classic-add-media-input-${c._id}`} 
                                                                multiple 
                                                                accept="image/*,video/*" 
                                                                className="hidden" 
                                                                onChange={(e) => handleAddMedia(c._id, e.target.files)} 
                                                            />
                                                            <button 
                                                                onClick={() => document.getElementById(`classic-add-media-input-${c._id}`).click()}
                                                                className="rounded bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 text-xs font-bold transition-all text-center"
                                                            >
                                                                Add Proofs
                                                            </button>
                                                        </>
                                                    )}

                                                    {c.fundraiser.status === 'approved' && (
                                                        <button 
                                                            onClick={() => handleTogglePause(c._id)}
                                                            className="rounded bg-amber-50 hover:bg-amber-100 text-amber-700 py-2 text-xs font-bold border border-amber-200 transition-all text-center"
                                                        >
                                                            Pause
                                                        </button>
                                                    )}

                                                    {c.fundraiser.status === 'paused' && (
                                                        <button 
                                                            onClick={() => handleTogglePause(c._id)}
                                                            className="rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 text-xs font-bold border border-emerald-200 transition-all text-center"
                                                        >
                                                            Resume
                                                        </button>
                                                    )}

                                                    {['pending', 'approved', 'paused'].includes(c.fundraiser.status) && (
                                                        <button 
                                                            onClick={() => handleCancelCampaign(c._id)}
                                                            className="col-span-2 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 text-xs font-bold border border-rose-200 transition-all text-center"
                                                        >
                                                            Cancel Fundraiser
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {c.fundraiser.billImage && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Uploaded Bill Estimate</span>
                                                <a href={c.fundraiser.billImage} target="_blank" rel="noopener noreferrer" className="block w-full h-32 rounded-lg overflow-hidden border border-slate-200 relative group">
                                                    <img src={c.fundraiser.billImage} alt="Estimate bill" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded">View Uploaded Bill</span>
                                                    </div>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : activeTab === 'manage' && user?.role === 'ngo' ? (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800">Start or Manage Fundraisers</h2>
                    <p className="text-sm text-surface-muted">Select an eligible case below to initiate a community fundraiser for medical bill coverage.</p>
                    
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Case list */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Eligible Rescue Cases</h3>
                            {eligibleCases.length === 0 ? (
                                <div className="card p-8 text-center text-surface-muted">
                                    No eligible cases found for fundraiser creation.
                                </div>
                            ) : (
                                eligibleCases.map((c) => {
                                    const isRequested = c.fundraiser && c.fundraiser.status !== 'none';
                                    const isSelected = selectedCase?._id === c._id;
                                    return (
                                        <div
                                            key={c._id}
                                            onClick={() => setSelectedCase(c)}
                                            className={`card cursor-pointer p-4 border transition-all ${
                                                isSelected
                                                    ? 'border-rose-500 bg-rose-50/30'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">ID: {c._id.slice(-6).toUpperCase()}</span>
                                                        <StatusBadge status={c.status} />
                                                    </div>
                                                    <h4 className="font-bold text-slate-800">{c.description}</h4>
                                                    <p className="text-xs text-slate-500 mt-1">{c.location?.address || 'Location provided'}</p>
                                                    
                                                    {isRequested ? (
                                                        <div className="mt-2">
                                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                                c.fundraiser.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                                c.fundraiser.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                                                'bg-amber-100 text-amber-800'
                                                            }`}>
                                                                Status: {c.fundraiser.status}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] text-slate-400 mt-2">No fundraiser requested yet</p>
                                                    )}
                                                </div>
                                                {c.images?.[0] && (
                                                    <img src={c.images[0]} alt="Case" className="w-12 h-12 object-cover rounded-md" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Request Form / Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Request Details</h3>
                            <div className="card p-5 border border-slate-200 bg-white relative">
                                {!selectedCase ? (
                                    <div className="text-center text-surface-muted py-12">
                                        Select a case from the list to view details or start a fundraiser request.
                                    </div>
                                ) : selectedCase.fundraiser && selectedCase.fundraiser.status !== 'none' ? (
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 p-3 rounded-btn border border-slate-100">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Selected Case</p>
                                            <p className="font-bold text-slate-800 text-sm truncate">{selectedCase.description}</p>
                                            <p className="text-[9px] text-slate-400 mt-0.5">ID: {selectedCase._id}</p>
                                        </div>
                                        
                                        <div className="flex justify-between items-center border-b pb-2 text-sm">
                                            <span className="text-slate-500 font-medium">Request Status</span>
                                            <span className={`font-bold capitalize ${
                                                selectedCase.fundraiser.status === 'approved' ? 'text-emerald-600' :
                                                selectedCase.fundraiser.status === 'rejected' ? 'text-rose-600' :
                                                'text-amber-600'
                                            }`}>{selectedCase.fundraiser.status}</span>
                                        </div>

                                        <div className="flex justify-between items-center border-b pb-2 text-sm">
                                            <span className="text-slate-500 font-medium">Requested Goal</span>
                                            <span className="font-bold text-slate-800">₹{selectedCase.fundraiser.requestedGoal}</span>
                                        </div>

                                        {selectedCase.fundraiser.status === 'approved' && (
                                            <div className="space-y-1 pb-2 border-b">
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span className="text-rose-600">Raised: ₹{selectedCase.amountRaised || 0}</span>
                                                    <span className="text-slate-400">Progress: {Math.min(((selectedCase.amountRaised || 0) / selectedCase.fundraiser.requestedGoal) * 100, 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                                                    <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400" style={{ width: `${Math.min(((selectedCase.amountRaised || 0) / selectedCase.fundraiser.requestedGoal) * 100, 100)}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Justification Details</span>
                                            <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-3 rounded-btn border border-slate-100">{selectedCase.fundraiser.billText || 'No treatment explanation was provided.'}</p>
                                        </div>

                                        {selectedCase.fundraiser.adminNotes && (
                                            <div>
                                                <span className="text-xs text-rose-500 font-bold uppercase tracking-wider">Admin Remarks</span>
                                                <p className="text-sm text-rose-700 mt-1 bg-rose-50 p-3 rounded-btn border border-rose-100">{selectedCase.fundraiser.adminNotes}</p>
                                            </div>
                                        )}

                                        {selectedCase.fundraiser.billImage && (
                                            <div>
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Uploaded Bill Estimate</span>
                                                <a href={selectedCase.fundraiser.billImage} target="_blank" rel="noopener noreferrer" className="block w-full h-32 rounded-lg overflow-hidden border border-slate-200">
                                                    <img src={selectedCase.fundraiser.billImage} alt="Bill estimate" className="w-full h-full object-cover" />
                                                </a>
                                            </div>
                                        )}

                                        <button type="button" onClick={() => setSelectedCase(null)} className="btn-ghost w-full py-2.5 mt-2">Clear Selection</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleNgoSubmit} className="space-y-4">
                                        <div className="bg-slate-50 p-3 rounded-btn border border-slate-100">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Initiating For</p>
                                            <p className="font-bold text-slate-800 text-sm truncate">{selectedCase.description}</p>
                                        </div>
                                        
                                        <div>
                                            <label className="label">Requested Amount (₹)</label>
                                            <input
                                                type="number"
                                                required
                                                min="100"
                                                value={formData.requestedGoal}
                                                onChange={(e) => setFormData((c) => ({ ...c, requestedGoal: e.target.value }))}
                                                className="input"
                                                placeholder="Enter goal amount"
                                            />
                                        </div>

                                        <div>
                                            <label className="label">Short Campaign Caption/Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.caption}
                                                onChange={(e) => setFormData((c) => ({ ...c, caption: e.target.value }))}
                                                className="input"
                                                placeholder="e.g. Help Bruno walk again!"
                                            />
                                        </div>

                                        <div>
                                            <label className="label">Detailed Case Story & Treatment Diagnosis</label>
                                            <textarea
                                                required
                                                value={formData.storyText}
                                                onChange={(e) => setFormData((c) => ({ ...c, storyText: e.target.value }))}
                                                className="textarea h-24"
                                                placeholder="Share details about the rescue, recovery process..."
                                            />
                                        </div>

                                        <div>
                                            <label className="label">Treatment & Bill Justification</label>
                                            <textarea
                                                required
                                                value={formData.billText}
                                                onChange={(e) => setFormData((c) => ({ ...c, billText: e.target.value }))}
                                                className="textarea h-24"
                                                placeholder="Explain the diagnosis and required procedures..."
                                            />
                                        </div>

                                        <div>
                                            <label className="label">Upload Bill/Estimate Image (Required)</label>
                                            <input
                                                type="file"
                                                required
                                                accept="image/*"
                                                onChange={(e) => setFormData((c) => ({ ...c, billImage: e.target.files[0] }))}
                                                className="input p-2"
                                            />
                                        </div>

                                        <div>
                                            <label className="label">Additional Photos & Videos (Optional)</label>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,video/*"
                                                onChange={(e) => setFormData((c) => ({ ...c, mediaFiles: Array.from(e.target.files) }))}
                                                className="input p-2"
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button type="button" onClick={() => setSelectedCase(null)} className="btn-ghost flex-1">Cancel</button>
                                            <button type="submit" disabled={formLoading} className="btn-primary flex-1">
                                                {formLoading ? 'Submitting...' : 'Submit Request'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

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

            {detailsFundraiser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4 overflow-y-auto">
                    <div className="w-full max-w-4xl rounded-[28px] bg-white p-6 md:p-8 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Fundraiser Campaign Details</p>
                                <h3 className="text-xl font-bold text-slate-900 mt-1">Case #{detailsFundraiser._id.slice(-6).toUpperCase()}</h3>
                            </div>
                            <button onClick={() => setDetailsFundraiser(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            {/* Left Column: Story, Title, Gallery */}
                            <div className="md:col-span-7 space-y-6">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-2xl text-slate-900 leading-tight">
                                        {detailsFundraiser.fundraiser?.caption || detailsFundraiser.description}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {detailsFundraiser.location?.address || 'Location provided'}
                                    </p>
                                </div>

                                {/* Media Gallery */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Campaign Photos & Videos</p>
                                    <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x">
                                        {[
                                            ...(detailsFundraiser.images || []),
                                            ...(detailsFundraiser.fundraiser?.media || [])
                                        ].map((url, idx) => {
                                            const isVideo = url.includes('.mp4') || url.includes('/video/');
                                            return (
                                                <div key={idx} className="w-80 h-56 rounded-lg overflow-hidden shrink-0 border border-slate-200 relative bg-black snap-start">
                                                    {isVideo ? (
                                                        <video src={url} controls className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={url} alt={`Campaign Media ${idx + 1}`} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {detailsFundraiser.video && (
                                            <div className="w-80 h-56 rounded-lg overflow-hidden shrink-0 border border-slate-200 relative bg-black snap-start">
                                                <video src={detailsFundraiser.video} controls className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-rose-500">The Story</p>
                                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap bg-slate-50 p-5 rounded-xl border border-slate-100">
                                        {detailsFundraiser.fundraiser?.storyText || 'No detailed case story has been uploaded by the NGO yet.'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnosis & Justification</p>
                                    <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        {detailsFundraiser.fundraiser?.billText || detailsFundraiser.description}
                                    </p>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="md:col-span-5 space-y-6">
                                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Fundraising Progress</p>
                                        <div className="flex justify-between items-baseline mt-2">
                                            <span className="text-3xl font-bold text-rose-600">₹{detailsFundraiser.amountRaised || 0}</span>
                                            <span className="text-sm font-medium text-slate-500">of ₹{detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost}</span>
                                        </div>
                                    </div>

                                    <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden shadow-inner">
                                        <div 
                                            className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full" 
                                            style={{ width: `${Math.min(((detailsFundraiser.amountRaised || 0) / (detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost || 1)) * 100, 100)}%` }} 
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs font-bold text-slate-500">
                                        <span>{Math.min(((detailsFundraiser.amountRaised || 0) / (detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost || 1)) * 100, 100).toFixed(0)}% FUNDED</span>
                                        <span className="text-rose-600">₹{Math.max((detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost || 0) - (detailsFundraiser.amountRaised || 0), 0)} NEEDED</span>
                                    </div>
                                </div>

                                {/* Quick Donate Form / Owner Progress / Inactive View */}
                                {isOwnerView ? (
                                    <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 space-y-4 text-xs leading-relaxed text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-rose-600 text-sm">campaign</span>
                                            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Owner Progress View</p>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="font-bold text-slate-800">Campaign Status: <span className="text-rose-600 uppercase">{detailsFundraiser.fundraiser?.status || 'approved'}</span></p>
                                            <p>
                                                {detailsFundraiser.fundraiser?.status === 'pending' && 'This fundraiser is currently pending admin approval. Once approved, it will be visible to the public for donations.'}
                                                {(detailsFundraiser.fundraiser?.status === 'approved' || !detailsFundraiser.fundraiser?.status) && 'This fundraiser is active and currently accepting donations from the public.'}
                                                {detailsFundraiser.fundraiser?.status === 'paused' && 'This fundraiser is paused. It is temporarily hidden from the public and not accepting donations.'}
                                                {detailsFundraiser.fundraiser?.status === 'completed' && 'This fundraiser is successfully completed! Thank you for your support.'}
                                                {detailsFundraiser.fundraiser?.status === 'cancelled' && 'This fundraiser has been cancelled.'}
                                                {detailsFundraiser.fundraiser?.status === 'rejected' && `This fundraiser request was rejected. Admin notes: ${detailsFundraiser.fundraiser?.adminNotes || 'None'}`}
                                            </p>
                                            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-[10px] text-slate-400 uppercase tracking-wider">
                                                <p>Goal: ₹{detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost}</p>
                                                <p>Raised: ₹{detailsFundraiser.amountRaised || 0}</p>
                                                <p>Remaining: ₹{Math.max((detailsFundraiser.fundraiser?.requestedGoal || detailsFundraiser.estimatedCost || 0) - (detailsFundraiser.amountRaised || 0), 0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : isActive ? (
                                    <div className="p-6 rounded-2xl border border-rose-100 bg-rose-50/50 space-y-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Support this Fundraiser</p>
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" 
                                                min="10" 
                                                placeholder="Amount" 
                                                className="w-full rounded-btn border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-rose-500/20"
                                                onChange={(e) => setDonationAmount(e.target.value)} 
                                            />
                                            <button 
                                                onClick={async () => {
                                                    const amt = parseFloat(donationAmount);
                                                    if (!amt || amt < 10) {
                                                        toast.error('Minimum donation is Rs 10.');
                                                        return;
                                                    }
                                                    const success = await handleDonate(detailsFundraiser._id);
                                                    if (success) {
                                                        setDetailsFundraiser(prev => ({
                                                            ...prev,
                                                            amountRaised: (prev.amountRaised || 0) + amt
                                                        }));
                                                    }
                                                }} 
                                                disabled={donatingId === detailsFundraiser._id} 
                                                className="btn bg-rose-500 px-6 py-2 font-bold text-white hover:bg-rose-600"
                                            >
                                                {donatingId === detailsFundraiser._id ? '...' : 'Donate'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50 text-center space-y-2">
                                        <span className="material-symbols-outlined text-2xl text-amber-600">lock</span>
                                        <p className="text-sm font-bold text-slate-800">Donations Closed</p>
                                        <p className="text-xs text-slate-500">This fundraiser is no longer active (Status: {detailsFundraiser.fundraiser?.status || 'inactive'}) and is not accepting donations.</p>
                                    </div>
                                )}

                                {detailsFundraiser.fundraiser?.billImage && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Uploaded Bill Estimate Proof</p>
                                        <a href={detailsFundraiser.fundraiser.billImage} target="_blank" rel="noopener noreferrer" className="block w-full h-32 rounded-lg overflow-hidden border border-slate-200 relative group">
                                            <img src={detailsFundraiser.fundraiser.billImage} alt="Bill estimate" className="w-full h-full object-cover" />
                                        </a>
                                    </div>
                                )}

                                {detailsFundraiser.assignedNGO && (
                                    <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-1 text-xs">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Rescue NGO</p>
                                        <p className="font-bold text-slate-800">{detailsFundraiser.assignedNGO.orgName || detailsFundraiser.assignedNGO.name}</p>
                                        <p className="text-slate-500">{detailsFundraiser.assignedNGO.email}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fundraisers;
