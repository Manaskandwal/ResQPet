import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    MapPinIcon,
    CheckIcon,
    XMarkIcon,
    ClockIcon,
    ClipboardDocumentListIcon,
    ChartBarIcon,
    CheckCircleIcon,
    PhoneIcon,
    ArrowUpTrayIcon,
    WalletIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { StatusBadge } from '../../components/StatusComponents';
import { SkeletonCard, SkeletonStatCard } from '../../components/Skeleton';
import { formatIndianDate, formatIndianDateTime, toDateInputValue, toTimeInputValue } from '../../utils/dateTime';

const ScheduleModal = ({ rescue, open, onClose, onConfirm, submitting, title = 'Schedule Rescue' }) => {
    const initialDate = rescue?.scheduleDate ? new Date(rescue.scheduleDate) : new Date(Date.now() + 30 * 60 * 1000);
    const [date, setDate] = useState(toDateInputValue(initialDate));
    const [time, setTime] = useState(toTimeInputValue(initialDate));
    const [notes, setNotes] = useState('');
    useEffect(() => {
        if (!open) return;
        const base = rescue?.scheduleDate ? new Date(rescue.scheduleDate) : new Date(Date.now() + 30 * 60 * 1000);
        setDate(toDateInputValue(base));
        setTime(toTimeInputValue(base));
        setNotes('');
    }, [open, rescue]);
    if (!open || !rescue) return null;
    const handleSubmit = () => {
        const selectedDate = new Date(`${date}T${time}:00`);
        if (Number.isNaN(selectedDate.getTime()) || selectedDate.getTime() <= Date.now()) {
            toast.error('Please select a valid future date and time.');
            return;
        }
        onConfirm(selectedDate.toISOString(), notes);
    };
    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';
    if (isNewUI) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2rem] border border-surface-border bg-surface shadow-2xl">
                <div className="flex items-center justify-between border-b border-surface-border px-6 py-5">
                    <div>
                        <h3 className="font-headline font-bold text-on-surface">{title}</h3>
                        <p className="mt-1 truncate text-xs text-on-surface/40">{rescue.description}</p>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 hover:bg-surface-hover text-on-surface/40 hover:text-on-surface transition-all"><XMarkIcon className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30">Date</label><input type="date" className="w-full rounded-xl bg-surface-hover border border-surface-border p-3 text-sm text-on-surface outline-none focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 transition-all" value={date} min={toDateInputValue(new Date())} onChange={(e) => setDate(e.target.value)} /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30">Time</label><input type="time" className="w-full rounded-xl bg-surface-hover border border-surface-border p-3 text-sm text-on-surface outline-none focus:border-[#76d6d5]/30 transition-all" value={time} onChange={(e) => setTime(e.target.value)} /></div>
                    </div>
                    <textarea className="w-full rounded-xl bg-surface-hover border border-surface-border p-4 text-sm text-on-surface h-24 outline-none focus:border-[#76d6d5]/30 transition-all" placeholder="Optional note for this visit" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="flex gap-3 border-t border-surface-border px-6 py-5">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-surface-border text-[10px] font-black uppercase tracking-widest text-on-surface/40 hover:bg-surface-hover transition-all">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 rounded-xl bg-[#76d6d5] text-[#131313] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50">{submitting ? 'Saving...' : 'Confirm'}</button>
                </div>
            </div>
        </div>
    );
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-card border border-surface-border bg-white shadow-card-hover">
                <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
                    <div><h3 className="font-bold text-slate-800">{title}</h3><p className="mt-1 truncate text-xs text-surface-muted">{rescue.description}</p></div>
                    <button onClick={onClose} className="rounded p-1.5 hover:bg-surface-hover"><XMarkIcon className="h-5 w-5 text-slate-500" /></button>
                </div>
                <div className="space-y-4 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={date} min={toDateInputValue(new Date())} onChange={(e) => setDate(e.target.value)} /></div>
                        <div className="form-group"><label className="label">Time</label><input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
                    </div>
                    <textarea className="textarea h-24" placeholder="Optional note for this visit" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="flex gap-2 border-t border-surface-border px-5 py-4">
                    <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">{submitting ? 'Saving...' : 'Confirm'}</button>
                </div>
            </div>
        </div>
    );
};

const TransportModal = ({ open, onClose, onConfirm, actionType }) => {
    const [cannotPay, setCannotPay] = useState(false);
    
    useEffect(() => {
        if (open) setCannotPay(false);
    }, [open]);

    if (!open) return null;
    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

    const handleConfirm = (transportType) => {
        onConfirm(transportType, cannotPay);
    };

    if (isNewUI) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2.5rem] border border-surface-border bg-surface shadow-2xl p-8 space-y-8 animate-scale-in">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5]">
                        <span className="material-symbols-outlined text-3xl">local_hospital</span>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-headline font-bold text-on-surface">Hospital Transport</h3>
                        <p className="text-sm text-on-surface/40">How would you like to transport the animal to the hospital?</p>
                    </div>
                </div>
                <div className="grid gap-4">
                    <button 
                        onClick={() => handleConfirm('self')}
                        className="group flex items-center gap-4 p-5 rounded-2xl bg-surface-hover border border-surface-border hover:border-[#76d6d5]/30 hover:bg-[#76d6d5]/5 transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center text-on-surface/40 group-hover:text-[#76d6d5] transition-colors">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-on-surface">Take by Yourself</p>
                            <p className="text-[10px] text-on-surface/30 uppercase font-black tracking-widest">Direct to Hospital Flow</p>
                        </div>
                    </button>
                    <button 
                        onClick={() => handleConfirm('ambulance')}
                        className="group flex items-center gap-4 p-5 rounded-2xl bg-surface-hover border border-surface-border hover:border-[#76d6d5]/30 hover:bg-[#76d6d5]/5 transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center text-on-surface/40 group-hover:text-[#76d6d5] transition-colors">
                            <span className="material-symbols-outlined">ambulance</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-on-surface">Request Ambulance</p>
                            <p className="text-[10px] text-on-surface/30 uppercase font-black tracking-widest">Procedural Dispatch Flow</p>
                        </div>
                    </button>
                    
                    <label className="flex items-start gap-4 p-4 mt-2 rounded-2xl bg-[#fd8b00]/5 border border-[#fd8b00]/20 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={cannotPay}
                            onChange={(e) => setCannotPay(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-on-surface/10 bg-black/50 text-[#fd8b00] focus:ring-[#fd8b00] focus:ring-offset-0"
                        />
                        <div className="flex-1 space-y-1">
                            <div className="text-sm font-bold text-on-surface group-hover:text-white transition-colors">I cannot cover hospital fees</div>
                            <div className="text-[10px] text-on-surface/50 font-medium leading-relaxed">
                                Checking this lets the system know it needs to find alternative funding (User or Platform Fund) for the hospital bill.
                            </div>
                        </div>
                    </label>
                </div>
                <button onClick={onClose} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/20 hover:text-on-surface transition-all">Cancel Request</button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-card border border-surface-border bg-white shadow-card-hover p-6">
                <h3 className="mb-2 text-center text-xl font-bold text-slate-800">Hospital Transport</h3>
                <p className="mb-6 text-center text-sm text-surface-muted">How will the animal reach the hospital?</p>
                <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer p-2 mb-2 bg-amber-50 rounded">
                        <input 
                            type="checkbox" 
                            checked={cannotPay}
                            onChange={(e) => setCannotPay(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-600"
                        />
                        <div className="text-sm">
                            <span className="font-medium text-amber-800">I cannot cover hospital fees</span>
                            <p className="text-xs text-amber-600">Checking this lets the system attempt to fund the case via User or Platform Fund.</p>
                        </div>
                    </label>

                    <button onClick={() => handleConfirm('self')} className="btn-primary w-full py-3">Take by Yourself</button>
                    <button onClick={() => handleConfirm('ambulance')} className="btn-outline w-full py-3">Request Ambulance</button>
                    <button onClick={onClose} className="btn-ghost w-full py-2 text-xs">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const NGODashboard = () => {
    const { user, updateUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const activeList = searchParams.get('list') || 'active';
    const [analytics, setAnalytics] = useState(null);
    const [nearbyCases, setNearbyCases] = useState([]);
    const [myCases, setMyCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wallet, setWallet] = useState({ walletBalance: user?.walletBalance || 0, transactions: [] });
    const [topupAmt, setTopupAmt] = useState('');
    const [paying, setPaying] = useState(false);
    const [mockPaying, setMockPaying] = useState(false);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const topupRef = useRef(null);
    const [acting, setActing] = useState({});
    const [locationSet, setLocationSet] = useState(true);
    const [scheduleCase, setScheduleCase] = useState(null);
    const [followUpCase, setFollowUpCase] = useState(null);
    const [transportCase, setTransportCase] = useState(null); // { id, actionType: 'accept' | 'escalate' }
    const [gpsCoords, setGpsCoords] = useState(null);
    const [mediaComments, setMediaComments] = useState({});

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => undefined,
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
    }, []);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const nearbyUrl = gpsCoords ? `/ngo/nearby?lat=${gpsCoords.lat}&lng=${gpsCoords.lng}` : '/ngo/nearby';
            const [analyticsRes, nearbyRes, mycasesRes, walletRes] = await Promise.all([
                api.get('/ngo/analytics'),
                api.get(nearbyUrl),
                api.get('/ngo/my-cases'),
                api.get('/user/wallet'),
            ]);
            setAnalytics(analyticsRes.data.analytics);
            setNearbyCases(nearbyRes.data.cases || []);
            setLocationSet(nearbyRes.data.locationSet ?? true);
            setMyCases(mycasesRes.data.cases || []);
            setWallet({ walletBalance: walletRes.data.walletBalance, transactions: walletRes.data.transactions });
            updateUser({ walletBalance: walletRes.data.walletBalance });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load panel data.');
        } finally {
            setLoading(false);
        }
    }, [gpsCoords]);

    useEffect(() => { if (user.isApproved) fetchAll(); }, [fetchAll, user.isApproved]);

    const withActing = async (id, state, action) => {
        setActing((prev) => ({ ...prev, [id]: state }));
        try { await action(); } finally { setActing((prev) => ({ ...prev, [id]: null })); }
    };

    const handleTopup = async () => {
        const amount = parseFloat(topupAmt);
        if (!amount || amount < 10) { toast.error('Minimum top-up is ₹10.'); return; }
        if (amount > 100000) { toast.error('Maximum top-up amount is ₹1,00,000.'); return; }

        setPaying(true);
        try {
            console.log('[NGODashboard] Initiating Razorpay top-up for ₹', amount);
            const loaded = await loadRazorpay();
            if (!loaded) { toast.error('Failed to load Razorpay. Check your internet connection.'); return; }

            const { data } = await api.post('/payment/create-order', { amount });

            if (!data.success || !data.order) {
                throw new Error(data.message || 'Failed to create payment order');
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || data.keyId,
                amount: data.order.amount,
                currency: 'INR',
                name: 'VetsCue',
                description: 'Wallet Top-up',
                order_id: data.order.id,
                handler: async (response) => {
                    try {
                        console.log('[NGODashboard] Razorpay payment successful, verifying...');
                        const verifyRes = await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount,
                        });
                        toast.success(`₹${amount} added to wallet!`);
                        updateUser({ walletBalance: verifyRes.data.walletBalance });
                        setWallet((p) => ({ ...p, walletBalance: verifyRes.data.walletBalance }));
                        setTopupAmt('');
                        fetchAll();
                    } catch (verifyErr) {
                        console.error('[NGODashboard] Payment verification failed:', verifyErr.message);
                        toast.error('Payment verification failed. Contact support.');
                    }
                },
                prefill: { name: user?.name, email: user?.email },
                theme: { color: '#0d9488' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (resp) => {
                console.error('[NGODashboard] Razorpay payment failed:', resp.error);
                toast.error(`Payment failed: ${resp.error.description}`);
            });
            rzp.open();
        } catch (error) {
            console.error('[NGODashboard] Top-up error:', error);
            toast.error(error.message || 'Failed to add amount to wallet.');
        } finally {
            setPaying(false);
        }
    };

    // NOTE: Real Razorpay payment function (use when keys are configured)
    // const handleRealTopup = async () => {
    //     const amount = parseFloat(topupAmt);
    //     if (!amount || amount < 10) { toast.error('Minimum top-up is ₹10.'); return; }
    //     if (amount > 100000) { toast.error('Maximum top-up amount is ₹1,00,000.'); return; }
    //
    //     setPaying(true);
    //     try {
    //         console.log('[NGODashboard] Initiating Razorpay top-up for ₹', amount);
    //         const loaded = await loadRazorpay();
    //         if (!loaded) { toast.error('Failed to load Razorpay. Check your internet connection.'); return; }
    //
    //         const { data } = await api.post('/payment/create-order', { amount });
    //         
    //         if (!data.success || !data.order) {
    //             throw new Error(data.message || 'Failed to create payment order');
    //         }
    //
    //         const options = {
    //             key: import.meta.env.VITE_RAZORPAY_KEY_ID || data.keyId,
    //             amount: data.order.amount,
    //             currency: 'INR',
    //             name: 'VetsCue',
    //             description: 'Wallet Top-up',
    //             order_id: data.order.id,
    //             handler: async (response) => {
    //                 try {
    //                     console.log('[NGODashboard] Razorpay payment successful, verifying...');
    //                     const verifyRes = await api.post('/payment/verify', {
    //                         razorpay_order_id: response.razorpay_order_id,
    //                         razorpay_payment_id: response.razorpay_payment_id,
    //                         razorpay_signature: response.razorpay_signature,
    //                         amount,
    //                     });
    //                     toast.success(`₹${amount} added to wallet! 🎉`);
    //                     updateUser({ walletBalance: verifyRes.data.walletBalance });
    //                     setWallet((p) => ({ ...p, walletBalance: verifyRes.data.walletBalance }));
    //                     setTopupAmt('');
    //                     fetchAll();
    //                 } catch (verifyErr) {
    //                     console.error('[NGODashboard] Payment verification failed:', verifyErr.message);
    //                     toast.error('Payment verification failed. Contact support.');
    //                 }
    //             },
    //             prefill: { name: user?.name, email: user?.email },
    //             theme: { color: '#0d9488' },
    //         };
    //
    //         const rzp = new window.Razorpay(options);
    //         rzp.on('payment.failed', (resp) => {
    //             console.error('[NGODashboard] Razorpay payment failed:', resp.error);
    //             toast.error(`Payment failed: ${resp.error.description}`);
    //         });
    //         rzp.open();
    //     } catch (error) {
    //         console.error('[NGODashboard] Top-up error:', error);
    //         const errorMsg = error.response?.data?.message || error.message || 'Failed to initiate payment.';
    //         toast.error(errorMsg);
    //     } finally {
    //         setPaying(false);
    //     }
    // };

    const handleMockTopup = async (amount) => {
        setMockPaying(true);
        try {
            console.log('[Mock] crediting ₹', amount);
            const { data } = await api.post('/payment/mock-topup', { amount });
            toast.success(data.message);
            updateUser({ walletBalance: data.walletBalance });
            setWallet((p) => ({ ...p, walletBalance: data.walletBalance }));
            fetchAll();
        } catch (error) {
            console.error('[Mock] mockTopup error:', error.message);
            toast.error(error.response?.data?.message || 'Mock top-up failed.');
        } finally {
            setMockPaying(false);
        }
    };

    const handleAccept = async (id, type = 'immediate', scheduleDate = null, transportType = 'na', ngoCannotPay = false) => {
        await withActing(id, 'accepting', async () => {
            await api.put(`/rescue/${id}/accept-ngo`, { type, scheduleDate, transportType, ngoCannotPay });
            toast.success(type === 'hospital' ? 'Escalated to Hospital.' : type === 'schedule' ? 'Case scheduled.' : 'Case accepted.');
            setScheduleCase(null);
            setTransportCase(null);
            fetchAll();
        }).catch((e) => toast.error(e.response?.data?.message || 'Failed.'));
    };

    const handleEscalate = async (id, transportType = 'ambulance', ngoCannotPay = false) => {
        await withActing(id, 'escalating', async () => {
            await api.put(`/rescue/${id}/escalate-ngo`, { transportType, ngoCannotPay });
            toast.success('Escalated to Hospital.');
            setTransportCase(null);
            fetchAll();
        }).catch((e) => toast.error(e.response?.data?.message || 'Failed.'));
    };
    const handleUpdateStatus = async (id, status, files = []) => {
        await withActing(id, 'updating', async () => {
            const fd = new FormData();
            fd.append('status', status);
            fd.append('message', mediaComments[id] || `NGO updated to ${status}.`);
            files.forEach((f) => fd.append('media', f));
            await api.put(`/rescue/${id}/ngo-status`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMediaComments((prev) => ({ ...prev, [id]: '' }));
            toast.success(`Status updated to ${status}.`);
            fetchAll();
        }).catch((e) => toast.error(e.response?.data?.message || 'Failed.'));
    };
    const handleReject = async (id) => {
        await withActing(id, 'rejecting', async () => { await api.put(`/rescue/${id}/reject-ngo`); toast.success('Case passed on.'); fetchAll(); }).catch((e) => toast.error(e.response?.data?.message || 'Failed.'));
    };
    const handleTreatOnSpot = async (id) => {
        await withActing(id, 'resolving', async () => { await api.put(`/rescue/${id}/resolve-ngo`); toast.success('On-spot treatment recorded.'); fetchAll(); }).catch((e) => toast.error(e.response?.data?.message || 'Failed.'));
    };
    const handleComplete = async (id) => {
        await withActing(id, 'completing', async () => { await api.put(`/rescue/${id}/complete-ngo`); toast.success('Case completed.'); fetchAll(); }).catch((e) => toast.error(e.response?.data?.message || 'Failed.'));
    };
    const handleFollowUp = async (id, scheduleDate, notes) => {
        await withActing(id, 'followup', async () => { await api.post(`/rescue/${id}/followup`, { scheduleDate, notes }); toast.success('Follow-up scheduled.'); setFollowUpCase(null); fetchAll(); }).catch((e) => toast.error(e.response?.data?.message || 'Failed.'));
    };

    const handleManualResponse = async (id, accept) => {
        await withActing(id, 'acting', async () => {
            await api.post(`/rescue/${id}/manual-transport-response`, { accept });
            toast.success('Response recorded.');
            fetchAll();
        }).catch((e) => toast.error(e.response?.data?.message || 'Action failed'));
    };

    const handlePayBill = async (id) => {
        await withActing(id, 'acting', async () => {
            await api.post(`/rescue/${id}/pay-bill`);
            toast.success('Bill paid.');
            fetchAll();
        }).catch((e) => toast.error(e.response?.data?.message || 'Payment failed'));
    };

    const handleReturnTransport = async (id, takeManually) => {
         await withActing(id, 'acting', async () => {
            await api.post(`/rescue/${id}/return-transport`, { takeManually });
            toast.success('Return transport requested.');
            fetchAll();
        }).catch((e) => toast.error(e.response?.data?.message || 'Request failed'));
    };

    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

    if (!user.isApproved) {
        if (isNewUI) {
            return (
                <div className="resqpet-obsidian-theme min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-8 animate-fade-in">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-[2rem] bg-[#ffb77d]/10 flex items-center justify-center text-[#ffb77d] border border-[#ffb77d]/20 shadow-[0_0_50px_rgba(255,183,125,0.1)]">
                            <span className="material-symbols-outlined text-5xl animate-pulse">pending_actions</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border border-surface-border flex items-center justify-center text-[#ffb77d]">
                            <span className="material-symbols-outlined text-sm">lock</span>
                        </div>
                    </div>
                    <div className="space-y-4 max-w-md">
                        <span className="text-[#ffb77d] text-[10px] font-black uppercase tracking-[0.3em]">Verification Protocol Active</span>
                        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Awaiting <span className="text-[#76d6d5]">Admin Authorization</span></h2>
                        <p className="text-on-surface/40 text-sm leading-relaxed">Your organization credentials are being verified by the central command. You will receive dispatch clearance once the review is complete.</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="px-8 py-4 rounded-2xl bg-surface-hover border border-surface-border text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 hover:text-[#76d6d5] hover:border-[#76d6d5]/20 transition-all">
                        Check Status Sync
                    </button>
                </div>
            );
        }
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 text-6xl">⌛</div>
                <h2 className="mb-2 text-2xl font-bold text-slate-800">Awaiting Admin Approval</h2>
                <p className="max-w-md text-surface-muted">Your NGO account is under review. Once approved, you will be able to see and accept nearby rescue cases.</p>
            </div>
        );
    }

    const scheduledCases = myCases.filter((c) => c.status === 'scheduled' || (c.followUps || []).some((follow) => follow.status === 'scheduled'));
    const completedCases = myCases.filter((c) => c.status === 'completed');
    const activeCases = myCases.filter((c) => !['completed', 'scheduled', 'cancelled', 'closed_unresolved'].includes(c.status));
    const visibleCases = activeList === 'scheduled_list' ? scheduledCases : activeList === 'completed_list' ? completedCases : activeCases;

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-on-surface space-y-12 pb-20">
                <ScheduleModal 
                    rescue={scheduleCase} 
                    open={!!scheduleCase} 
                    onClose={() => setScheduleCase(null)} 
                    onConfirm={(isoDate) => handleAccept(scheduleCase._id, 'schedule', isoDate)} 
                    submitting={scheduleCase ? acting[scheduleCase._id] === 'accepting' : false} 
                />
                <ScheduleModal 
                    rescue={followUpCase} 
                    open={!!followUpCase} 
                    onClose={() => setFollowUpCase(null)} 
                    onConfirm={(isoDate, notes) => handleFollowUp(followUpCase._id, isoDate, notes)} 
                    submitting={followUpCase ? acting[followUpCase._id] === 'followup' : false} 
                    title="Setup Follow-up Logic" 
                />
                <TransportModal 
                    open={!!transportCase} 
                    onClose={() => setTransportCase(null)} 
                    onConfirm={(transportType, cannotPay) => {
                        if (transportCase.actionType === 'accept') {
                            handleAccept(transportCase.id, 'hospital', null, transportType, cannotPay);
                        } else {
                            handleEscalate(transportCase.id, transportType, cannotPay);
                        }
                    }} 
                    actionType={transportCase?.actionType}
                />

                {/* Wallet Modal Override */}
                <Transition appear show={walletModalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50 resqpet-obsidian-theme" onClose={() => setWalletModalOpen(false)}>
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-background/90 backdrop-blur-xl" />
                        </Transition.Child>

                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-lg bg-surface p-6 md:p-8 border border-surface-border shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[90vh]">
                                    <div className="flex items-center justify-between mb-8">
                                        <Dialog.Title className="text-2xl font-headline font-extrabold text-on-surface flex items-center gap-3">
                                            <WalletIcon className="w-8 h-8 text-[#76d6d5]" />
                                            Unified Wallet
                                        </Dialog.Title>
                                        <button onClick={() => setWalletModalOpen(false)} className="p-2 hover:bg-surface-hover rounded-full transition-colors text-on-surface/40">
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="glass-card bg-gradient-to-br from-[#76d6d5]/20 to-[#008080]/20 border border-[#76d6d5]/30 p-8 mb-8 relative overflow-hidden group">
                                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#76d6d5]/10 rounded-full blur-3xl" />
                                        <div className="relative z-10 text-center py-4">
                                            <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Available Balance</span>
                                            <p className="text-5xl font-headline font-black mt-2 mb-2 text-on-surface">₹{wallet?.walletBalance?.toFixed(2) || '0.00'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black text-on-surface/40 uppercase tracking-widest mb-3 px-2">Quick Top-up</label>
                                            <div className="flex gap-2">
                                                {[50, 100, 200, 500].map((amt) => (
                                                    <button key={amt} onClick={() => handleMockTopup(amt)}
                                                        disabled={mockPaying}
                                                        className="flex-1 py-3 rounded-2xl bg-surface-hover border border-surface-border text-on-surface text-xs font-bold hover:bg-[#76d6d5]/10 hover:border-[#76d6d5]/30 transition-all active:scale-95 disabled:opacity-50">
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
                                                    className="w-full h-14 px-6 rounded-2xl bg-surface-hover border border-surface-border text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-[#76d6d5]/20 focus:border-[#76d6d5]/50 transition-all font-bold placeholder:text-on-surface/20"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface/20">INR</span>
                                            </div>
                                            <button onClick={handleTopup} disabled={paying} className="h-14 px-10 bg-[#e5e2e1] text-[#131313] rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-[#e5e2e1]/5 disabled:opacity-50">
                                                {paying ? '...' : 'Top Up'}
                                            </button>
                                        </div>

                                        <div className="pt-6 border-t border-surface-border">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-on-surface/40 text-xs uppercase tracking-widest px-2">Transactions</h3>
                                                <button
                                                    onClick={() => { setWalletModalOpen(false); navigate('/user/payments?tab=all'); }}
                                                    className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5] hover:underline"
                                                >
                                                    View All
                                                </button>
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {wallet?.transactions?.length === 0 ? (
                                                        <p className="text-on-surface/20 text-xs text-center py-4">No history available</p>
                                                    ) : (
                                                        wallet.transactions.slice(0, 10).map((txn) => (
                                                            <div key={txn._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-hover transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] ${txn.type === 'debit' ? 'bg-red-500/10 text-red-400' : 'bg-[#76d6d5]/10 text-[#76d6d5]'}`}>
                                                                        <span className="material-symbols-outlined text-sm">{txn.type === 'debit' ? 'arrow_downward' : 'arrow_upward'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-on-surface truncate max-w-[200px]">{txn.description}</p>
                                                                        <p className="text-[10px] text-on-surface/40">{formatIndianDate(txn.createdAt)}</p>
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
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition>

                {/* Dashboard Title Section */}
                <section>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-12">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Rescue Center</span>
                                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">NGO <span className="text-[#76d6d5]">Dashboard</span></h1>
                                <p className="text-on-surface/50 max-w-md">Help animals in need and manage your rescue tasks.</p>
                            </div>
                            {/* Wallet Summary Card */}
                            <div 
                                onClick={() => setWalletModalOpen(true)}
                                className="glass-card rounded-[2rem] p-6 flex items-center gap-4 w-fit border border-surface-border bg-surface/50 cursor-pointer hover:bg-surface transition-all group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5] group-hover:scale-110 transition-transform">
                                    <WalletIcon className="w-6 h-6" />
                                </div>
                                <div className="pr-12">
                                    <div className="text-2xl font-bold font-headline transition-all">₹{wallet?.walletBalance?.toFixed(2) || '0.00'}</div>
                                    <div className="text-[10px] text-[#76d6d5] font-black uppercase tracking-widest">Available Balance</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex bg-surface/50 p-1 rounded-2xl border border-surface-border backdrop-blur-xl overflow-x-auto no-scrollbar scroll-smooth flex-nowrap">
                            {[
                                { id: 'overview', label: 'Overview' },
                                { id: 'nearby', label: 'Nearby' },
                                { id: 'my_cases', label: 'My Cases' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSearchParams({ tab: t.id })}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                                        activeTab === t.id 
                                        ? 'bg-[#76d6d5] text-[#131313] shadow-[0_0_20px_rgba(118,214,213,0.3)]' 
                                        : 'text-on-surface/40 hover:text-on-surface'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {activeTab === 'overview' && (
                    <div className="space-y-12 animate-fade-in">
                        {/* Summary Stats Grid */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {loading ? (
                                [1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)
                            ) : analytics && (
                                <>
                                    <div className="glass-card rounded-[2rem] p-6 sm:p-8 border border-surface-border bg-surface/30 group hover:border-[#ffb77d]/30 transition-all flex flex-col justify-between h-52">
                                        <div className="w-14 h-14 rounded-2xl bg-[#ffb77d]/10 flex items-center justify-center text-[#ffb77d] group-hover:scale-110 transition-transform">
                                            <ClockIcon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-4xl font-headline font-black text-on-surface tracking-tighter">{analytics.nearby_pending}</p>
                                            <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">Nearby Requests</p>
                                        </div>
                                    </div>
                                    <div className="glass-card rounded-[2rem] p-8 border border-surface-border bg-surface/30 group hover:border-blue-400/30 transition-all flex flex-col justify-between h-52">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                            <ClipboardDocumentListIcon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-4xl font-headline font-black text-on-surface tracking-tighter">{analytics.accepted_count}</p>
                                            <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">My Tasks</p>
                                        </div>
                                    </div>
                                    <div className="glass-card rounded-[2rem] p-8 border border-surface-border bg-surface/30 group hover:border-[#76d6d5]/30 transition-all flex flex-col justify-between h-52">
                                        <div className="w-14 h-14 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5] group-hover:scale-110 transition-transform">
                                            <CheckCircleIcon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-4xl font-headline font-black text-on-surface tracking-tighter">{analytics.completed_count}</p>
                                            <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">Animals Saved</p>
                                        </div>
                                    </div>
                                    <div className="glass-card rounded-[2rem] p-8 border border-surface-border bg-surface/30 group hover:border-indigo-400/30 transition-all flex flex-col justify-between h-52">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                            <ChartBarIcon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-4xl font-headline font-black text-on-surface tracking-tighter">{analytics.acceptance_rate}%</p>
                                            </div>
                                            <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">Work Score</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                             {/* Central Alerts Feed */}
                             <div className="lg:col-span-8 space-y-8">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="font-headline text-xl font-bold">New Rescue Requests</h3>
                                    <button onClick={() => setSearchParams({ tab: 'nearby' })} className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5] hover:underline">View All</button>
                                </div>
                                <div className="space-y-4">
                                    {nearbyCases.slice(0, 3).map(c => (
                                        <div key={c._id} className="glass-card rounded-[2rem] border border-surface-border bg-surface/50 p-5 sm:p-6 flex flex-col md:flex-row gap-6 hover:border-[#76d6d5]/20 transition-all">
                                            <div className="w-full md:w-32 aspect-[4/3] rounded-2xl overflow-hidden bg-surface-hover shrink-0 relative">
                                                {c.images?.[0] ? (
                                                    <img src={c.images[0]} alt="Subject" className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/5">
                                                        <span className="material-symbols-outlined text-4xl">image</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-2 left-2 text-[8px] font-black uppercase tracking-widest text-[#76d6d5]">
                                                    {c.distance !== null && c.distance !== undefined ? `${c.distance.toFixed(1)}km` : 'Location unknown'}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">ID: {c._id.slice(-6).toUpperCase()}</span>
                                                        <StatusBadge status={c.status} />
                                                    </div>
                                                    <h4 className="font-bold text-lg mb-1 truncate">{c.description}</h4>
                                                    <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                                        {c.location.address || 'Geo-Locked Area'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 pt-4">
                                                    <button onClick={() => handleAccept(c._id, 'immediate')} className="flex-1 py-3 bg-[#76d6d5] text-[#131313] rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">Accept Now</button>
                                                    <button onClick={() => setTransportCase({ id: c._id, actionType: 'accept' })} className="flex-1 py-3 bg-[#ffb77d] text-[#131313] rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">Accept & Hospital</button>
                                                    <button onClick={() => setScheduleCase(c)} className="px-4 py-3 bg-surface-hover border border-surface-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-hover transition-all">
                                                        <ClockIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {nearbyCases.length === 0 && (
                                        <div className="p-12 glass-card rounded-[2.5rem] border border-dashed border-surface-border text-center space-y-4">
                                            <span className="material-symbols-outlined text-4xl text-[#76d6d5]/20">satellite_alt</span>
                                            <p className="text-xs font-black uppercase tracking-widest text-white/20">Sector Clear - No Active Distress Signals</p>
                                        </div>
                                    )}
                                </div>
                             </div>

                             {/* Sector Stats & Map Quickview */}
                             <div className="lg:col-span-4 space-y-8">
                                <div className="glass-card rounded-[2.5rem] border border-surface-border bg-surface p-6 sm:p-8 space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5]">
                                            <span className="material-symbols-outlined text-2xl">radar</span>
                                        </div>
                                        <div>
                                            <h3 className="font-headline font-bold text-lg leading-tight uppercase tracking-tight">Rescue Status</h3>
                                            <p className="text-[10px] text-[#76d6d5] font-black uppercase tracking-widest">Live Updates On</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end px-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Team Capacity</span>
                                                <span className="text-sm font-bold text-[#76d6d5]">Active</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-[#76d6d5] to-blue-500 w-3/4 animate-pulse-slow" />
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-[#76d6d5]/5 border border-[#76d6d5]/10 space-y-2">
                                            <p className="text-[10px] font-black text-[#76d6d5] uppercase tracking-widest">Active Volunteers</p>
                                            <p className="text-2xl font-headline font-black text-on-surface">128 HEROES</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card rounded-[2.5rem] border border-surface-border bg-surface p-6 text-center space-y-4">
                                    <button onClick={fetchAll} className="w-full py-4 rounded-2xl border border-surface-border hover:bg-surface-hover transition-all text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/30">Refresh List</button>
                                </div>
                             </div>
                        </section>
                    </div>
                )}

                {activeTab === 'nearby' && (
                    <section className="space-y-8 animate-fade-in w-full">
                        {!locationSet && (
                             <div className="p-6 rounded-[2rem] bg-[#fd8b00]/10 border border-[#fd8b00]/20 flex items-center gap-4 text-[#fd8b00]">
                                <span className="material-symbols-outlined text-3xl">location_off</span>
                                <div className="space-y-1">
                                    <p className="text-sm font-black uppercase tracking-widest">Sector HQ Off-Grid</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Admin authorization required to calibrate base coordinates.</p>
                                </div>
                             </div>
                        )}

                        <div className="flex items-center justify-between px-2">
                             <div className="flex items-center gap-3">
                                <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Active Transmissions</h2>
                                <span className="px-3 py-1 bg-surface-hover rounded-full text-[10px] font-black text-[#76d6d5] uppercase tracking-widest">{nearbyCases.length}</span>
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-[#76d6d5] animate-ping" />
                                Real-time Sector Scan
                             </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {nearbyCases.length === 0 ? (
                                <div className="py-32 glass-card rounded-[3rem] text-center border border-dashed border-surface-border space-y-6">
                                     <div className="mx-auto w-20 h-20 rounded-full bg-surface-hover flex items-center justify-center text-white/10 uppercase tracking-widest text-[10px] font-black">Scanning</div>
                                     <h3 className="text-on-surface/40 uppercase tracking-[0.3em] font-black">All Sectors Clear</h3>
                                </div>
                            ) : nearbyCases.map(c => (
                                <div key={c._id} className="glass-card rounded-[2.5rem] border border-surface-border bg-surface overflow-hidden group hover:border-[#76d6d5]/30 transition-all">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="w-full md:w-64 aspect-square bg-background relative overflow-hidden group">
                                             {c.images?.[0] ? (
                                                <img src={c.images[0]} alt="Reporting" className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                                             ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/5">
                                                    <span className="material-symbols-outlined text-4xl">broken_image</span>
                                                </div>
                                             )}
                                             <div className="absolute top-4 left-4">
                                                <StatusBadge status={c.status} />
                                             </div>
                                             <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-[#76d6d5] uppercase tracking-widest border border-surface-border">
                                                {c.distance !== null && c.distance !== undefined ? `${c.distance.toFixed(1)}km Reach` : 'Unknown SCTR'}
                                             </div>
                                        </div>
                                        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Distress Signal ID #{c._id.slice(-6).toUpperCase()}</p>
                                                    <h3 className="font-headline text-2xl font-bold text-on-surface leading-tight">{c.description}</h3>
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center gap-3 text-sm text-white/40">
                                                        <span className="material-symbols-outlined text-lg text-[#76d6d5]">location_on</span>
                                                        <span className="font-medium truncate">{c.location.address || 'Geo-Location Locked'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-white/40">
                                                        <span className="material-symbols-outlined text-lg text-[#ffb77d]">person</span>
                                                        <span className="font-medium">{c.user?.name || 'Anonymous Civilian'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4 pt-8 mt-8 border-t border-surface-border">
                                                <button onClick={() => handleAccept(c._id, 'immediate')} className="flex-1 min-w-[180px] h-14 bg-[#76d6d5] text-[#131313] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#76d6d5]/10">Immediate Dispatch</button>
                                                <button onClick={() => setScheduleCase(c)} className="w-14 h-14 bg-surface-hover border border-surface-border rounded-2xl flex items-center justify-center hover:bg-surface-hover transition-all active:scale-90">
                                                    <ClockIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleReject(c._id)} className="w-14 h-14 bg-surface-hover border border-surface-border rounded-2xl flex items-center justify-center hover:bg-red-500/20 text-red-400 group transition-all active:scale-90">
                                                    <XMarkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === 'my_cases' && (
                    <section className="space-y-10 animate-fade-in w-full">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-card p-6 rounded-[2rem] border border-blue-500/20 bg-blue-500/5 flex flex-col justify-between h-40">
                                <p className="text-5xl font-headline font-black text-on-surface px-2">{activeCases.length}</p>
                            </div>
                            <div className="glass-card p-6 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between h-40">
                                <p className="text-5xl font-headline font-black text-on-surface px-2">{scheduledCases.length}</p>
                            </div>
                            <div className="glass-card p-6 rounded-[2rem] border border-[#76d6d5]/20 bg-[#76d6d5]/5 flex flex-col justify-between h-40">
                                <h4 className="text-[10px] font-black text-[#76d6d5] uppercase tracking-widest px-2">Successful Rescues</h4>
                                <p className="text-5xl font-headline font-black text-on-surface px-2">{completedCases.length}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Desktop List Tabs */}
                                <div className="hidden md:flex bg-surface/50 p-1.5 rounded-2xl border border-surface-border backdrop-blur-xl w-fit">
                                     {[
                                         { id: 'active', label: 'Current Rescues', count: activeCases.length },
                                         { id: 'scheduled_list', label: 'Planned Tasks', count: scheduledCases.length },
                                         { id: 'completed_list', label: 'Archive', count: completedCases.length },
                                     ].map((t) => (
                                         <button
                                             key={t.id}
                                             onClick={() => setSearchParams({ tab: 'my_cases', list: t.id })}
                                             className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                                                 activeList === t.id 
                                                 ? 'bg-surface-hover text-[#76d6d4]' 
                                                 : 'text-on-surface/40 hover:text-on-surface'
                                             }`}
                                         >
                                             {t.label}
                                             <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeList === t.id ? 'bg-[#76d6d4] text-[#131313]' : 'bg-surface-hover text-white/30'}`}>{t.count}</span>
                                         </button>
                                     ))}
                                 </div>

                                 {/* Mobile Dropdown */}
                                 <div className="md:hidden relative w-full px-2">
                                    <div className="relative">
                                        <select
                                            value={activeList}
                                            onChange={(e) => setSearchParams({ tab: 'my_cases', list: e.target.value })}
                                            className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#76d6d4] outline-none focus:ring-2 focus:ring-[#76d6d4]/20 transition-all appearance-none cursor-pointer"
                                        >
                                            {[
                                                { id: 'active', label: 'Current Rescues' },
                                                { id: 'scheduled_list', label: 'Planned Tasks' },
                                                { id: 'completed_list', label: 'Archive' },
                                            ].map((t) => (
                                                <option key={t.id} value={t.id} className="bg-surface">
                                                    {t.label.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#76d6d4]">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                 </div>
                            </div>

                            <div className="space-y-6">
                                {loading ? (
                                    [1, 2].map(i => <SkeletonCard key={i} />)
                                ) : visibleCases.length === 0 ? (
                                    <div className="py-32 glass-card rounded-[3rem] text-center border border-dashed border-surface-border space-y-4">
                                         <span className="material-symbols-outlined text-5xl text-white/10">inventory_2</span>
                                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Empty Transaction Queue</p>
                                    </div>
                                ) : visibleCases.map(c => (
                                    <div key={c._id} className="glass-card rounded-[2rem] sm:rounded-[3rem] border border-surface-border bg-surface p-6 sm:p-8 space-y-8 group hover:border-[#76d6d5]/30 transition-all">
                                         <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                 <div className="flex items-center gap-3">
                                                     <StatusBadge status={c.status} />
                                                     <span className="text-[9px] font-black uppercase tracking-widest text-white/20">SCTR-ID: {c._id.slice(-6).toUpperCase()}</span>
                                                 </div>
                                                 <h3 className="font-headline text-2xl font-bold leading-tight max-w-2xl">{c.description}</h3>
                                                 <div className="flex items-center gap-6 pt-2">
                                                     <div className="flex items-center gap-2 text-xs font-bold text-white/40">
                                                         <span className="material-symbols-outlined text-sm text-[#76d6d5]">calendar_today</span>
                                                         {formatIndianDateTime(c.acceptedAt || c.updatedAt)}
                                                     </div>
                                                     {c.scheduleDate && (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-[#76d6d5]">
                                                            <span className="material-symbols-outlined text-sm">alarm</span>
                                                            {formatIndianDateTime(c.scheduleDate)}
                                                        </div>
                                                     )}
                                                 </div>
                                            </div>
                                            <div className="flex -space-x-3">
                                                 <div className="w-12 h-12 rounded-2xl bg-surface-hover border-2 border-[#1c1b1b] flex items-center justify-center font-bold text-xs uppercase tracking-widest text-[#76d6d5]">{c.user?.name?.charAt(0) || 'A'}</div>
                                            </div>
                                         </div>

                                         {c.status === 'manual_transport_accepted' && (
                                             <div className="p-6 rounded-[2rem] bg-[#ffb77d]/10 border border-[#ffb77d]/20 space-y-3 mb-6">
                                                 <div className="flex items-center gap-2 font-bold text-[#ffb77d] text-sm">
                                                     <span className="material-symbols-outlined">hail</span>
                                                     Manual Transport Mode
                                                 </div>
                                                 <p className="text-xs text-on-surface/60 leading-relaxed">
                                                     No ambulance responded to this critical dispatch. The hospital has already accepted. 
                                                     Please coordinate manual transport for the subject to <strong>{c.assignedHospital?.name || 'Assigned Hospital'}</strong> immediately.
                                                 </p>
                                                 <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                                     <button
                                                         onClick={() => handleManualResponse(c._id, true)}
                                                         disabled={acting[c._id]}
                                                         className="flex-1 py-3 rounded-xl bg-[#ffb77d]/20 hover:bg-[#ffb77d]/30 text-[#ffb77d] text-[10px] font-black uppercase tracking-widest transition-all"
                                                     >
                                                         I Will Transport
                                                     </button>
                                                     <button
                                                         onClick={() => handleManualResponse(c._id, false)}
                                                         disabled={acting[c._id]}
                                                         className="flex-1 py-3 rounded-xl border border-surface-border hover:bg-surface-hover text-white/50 text-[10px] font-black uppercase tracking-widest transition-all"
                                                     >
                                                         Cannot Transport
                                                     </button>
                                                 </div>
                                             </div>
                                         )}

                                         {c.bill?.paidStatus === 'pending' && c.bill?.sentTo === 'ngo' && (
                                             <div className="p-6 rounded-[2rem] bg-[#76d6d5]/10 border border-[#76d6d5]/30 shadow-[0_0_20px_rgba(118,214,213,0.1)] mb-6 space-y-4">
                                                 <div className="flex items-center justify-between">
                                                     <div className="flex items-center gap-2 font-bold text-[#76d6d5] text-sm">
                                                         <span className="material-symbols-outlined">payments</span>
                                                         Hospital Bill Pending
                                                     </div>
                                                     <span className="text-2xl font-headline font-black text-white">₹{c.bill.totalAmount}</span>
                                                 </div>
                                                 <p className="text-xs text-on-surface/60">The hospital has submitted the estimated diagnosis and bill. Please pay to continue treatment.</p>
                                                 <button
                                                     onClick={() => handlePayBill(c._id)}
                                                     disabled={acting[c._id]}
                                                     className="w-full py-4 rounded-xl bg-[#76d6d5] shadow-[0_0_15px_rgba(118,214,213,0.3)] text-[#131313] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                                                 >
                                                     {acting[c._id] ? 'Processing...' : 'Pay Bill from Wallet'}
                                                 </button>
                                             </div>
                                         )}

                                         {c.treatmentStatus === 'discharged' && c.status !== 'completed' && c.status !== 'ambulance_pinged' && c.status !== 'closed_unresolved' && (!c.bill || c.bill.paidStatus === 'paid') && (
                                             <div className="p-6 rounded-[2rem] bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 mb-6 space-y-4">
                                                 <div className="flex items-center gap-2 font-bold text-[#8b5cf6] text-sm">
                                                     <span className="material-symbols-outlined">moving</span>
                                                     Animal Discharged!
                                                 </div>
                                                 <p className="text-xs text-on-surface/70">Treatment is complete. How would you like to return the animal?</p>
                                                 <div className="flex flex-col sm:flex-row gap-3">
                                                     <button
                                                         onClick={() => handleReturnTransport(c._id, false)}
                                                         disabled={acting[c._id]}
                                                         className="flex-1 py-3 rounded-xl bg-[#8b5cf6] text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                                                     >
                                                         Request Return Ambulance
                                                     </button>
                                                     <button
                                                         onClick={() => handleReturnTransport(c._id, true)}
                                                         disabled={acting[c._id]}
                                                         className="flex-1 py-3 rounded-xl border border-[#8b5cf6]/30 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 text-[10px] font-black uppercase tracking-widest transition-all"
                                                     >
                                                         Take Manually & Complete
                                                     </button>
                                                 </div>
                                             </div>
                                         )}

                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                             <div className="p-6 rounded-[2rem] bg-surface-hover border border-surface-border space-y-4">
                                                  <div className="flex items-center gap-3 mb-2">
                                                      <div className="w-8 h-8 rounded-lg bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5]">
                                                          <MapPinIcon className="w-4 h-4" />
                                                      </div>
                                                       <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Rescue Location</span>
                                                  </div>
                                                  <div className="flex items-center justify-between gap-4">
                                                      <p className="text-sm font-bold leading-relaxed flex-1">{c.location.address || 'Address withheld by civilian'}</p>
                                                      <a 
                                                          href={`geo:${c.location.lat},${c.location.lng}?q=${c.location.lat},${c.location.lng}`}
                                                          className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/30 transition-all flex items-center gap-1 shrink-0"
                                                      >
                                                          <span className="material-symbols-outlined text-xs">navigation</span>
                                                          Navigate
                                                      </a>
                                                  </div>
                                             </div>
                                             <div className="p-6 rounded-[2rem] bg-surface-hover border border-surface-border space-y-4">
                                                  <div className="flex items-center gap-3 mb-2">
                                                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                          <PhoneIcon className="w-4 h-4" />
                                                      </div>
                                                       <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Reporter Contact</span>
                                                  </div>
                                                  <div className="flex items-center justify-between">
                                                      <div className="min-w-0">
                                                          <p className="text-sm font-bold truncate">{c.user?.name || 'Anonymous User'}</p>
                                                          {c.user?.phone && <p className="text-[10px] font-bold text-white/40 mt-0.5">{c.user.phone}</p>}
                                                      </div>
                                                      {c.user?.phone && (
                                                           <a href={`tel:${c.user.phone}`} className="px-4 py-2 rounded-xl bg-[#76d6d5] text-[#131313] text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Call Now</a>
                                                       )}
                                                  </div>
                                             </div>
                                         </div>

                                         {!['completed', 'cancelled', 'closed_unresolved'].includes(c.status) && (
                                             <div className="pt-8 border-t border-surface-border space-y-8">
                                                 <div className="flex flex-wrap gap-3">                                                      {c.status === 'accepted' && <button onClick={() => handleUpdateStatus(c._id, 'on_the_way')} className="px-6 py-4 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Start Going</button>}
                                                      {c.status === 'scheduled' && <button onClick={() => handleUpdateStatus(c._id, 'on_the_way')} className="px-6 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Start Rescue</button>}
                                                      {c.status === 'on_the_way' && <button onClick={() => handleUpdateStatus(c._id, 'reached')} className="px-6 py-4 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">I Have Reached</button>}
                                                      {c.status === 'reached' && <button onClick={() => handleUpdateStatus(c._id, 'treating')} className="px-6 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Start Treatment</button>}
                                                     {c.status === 'treating' && (
                                                        <>
                                                            <button onClick={() => handleTreatOnSpot(c._id)} className="px-6 py-4 bg-teal-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Immediate Resolution</button>
                                                            <button onClick={() => setTransportCase({ id: c._id, actionType: 'escalate' })} className="px-6 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Escalate: Critical</button>
                                                        </>
                                                     )}
                                                     {c.status === 'resolved_on_spot' && (
                                                        <>
                                                            <button onClick={() => handleComplete(c._id)} className="px-6 py-4 bg-[#76d6d5] text-[#131313] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Decommission Mission</button>
                                                            <button onClick={() => setFollowUpCase(c)} className="px-6 py-4 bg-surface-hover border border-surface-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-hover transition-all">Schedule Follow-up</button>
                                                        </>
                                                     )}
                                                 </div>

                                                 <div className="glass-card rounded-[2.5rem] bg-background border border-surface-border p-8 space-y-6">
                                                     <div className="flex items-center gap-3 mb-2">
                                                         <div className="w-10 h-10 rounded-xl bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5]">
                                                             <ArrowUpTrayIcon className="w-6 h-6" />
                                                         </div>
                                                         <h4 className="text-xl font-headline font-bold uppercase tracking-tight">Mission Log Analytics</h4>
                                                     </div>
                                                     <textarea 
                                                         className="w-full h-24 bg-surface-hover border border-surface-border rounded-2xl p-6 font-bold text-sm text-on-surface focus:ring-2 focus:ring-[#76d6d5]/20 outline-none transition-all"
                                                         placeholder="Append tactical observation or field notes..."
                                                         value={mediaComments[c._id] || ''} 
                                                         onChange={(e) => setMediaComments((prev) => ({ ...prev, [c._id]: e.target.value }))}
                                                     />
                                                     <div className="flex items-center gap-4">
                                                         <input
                                                             type="file" id={`media-upload-${c._id}`} multiple accept="image/*,video/*" className="hidden"
                                                             onChange={(e) => {
                                                                 const files = Array.from(e.target.files || []);
                                                                 if (files.length > 0) handleUpdateStatus(c._id, c.status, files);
                                                                 e.target.value = '';
                                                             }}
                                                         />
                                                         <label htmlFor={`media-upload-${c._id}`} className="px-8 h-14 bg-[#76d6d5] text-[#131313] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-lg hover:scale-105 transition-all cursor-pointer">Append Intel Media</label>
                                                         <button onClick={() => handleUpdateStatus(c._id, c.status)} className="px-8 h-14 rounded-xl border border-surface-border text-[10px] font-black uppercase tracking-widest hover:bg-surface-hover transition-all">Save Notes Only</button>
                                                     </div>
                                                 </div>
                                             </div>
                                         )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* FAB */}
                <button 
                    onClick={() => setSearchParams({ tab: 'nearby' })}
                    className="fixed right-32 bottom-8 w-16 h-16 bg-gradient-to-br from-[#fd8b00] to-[#ffb77d] text-[#131313] rounded-[1.5rem] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(253,139,0,0.4)] z-40 active:scale-90 transition-all group"
                >
                    <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">emergency_share</span>
                </button>
            </div>
        );
    }

    const renderCaseCard = (c) => (
        <div key={c._id} className="card border-l-4 border-l-primary-500">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">ID: {c._id.slice(-6).toUpperCase()}</span>
                        <StatusBadge status={c.status} />
                    </div>
                    <h3 className="text-lg font-bold leading-tight text-slate-800">{c.description}</h3>
                    <p className="mt-1 text-sm text-surface-muted">Accepted: {formatIndianDateTime(c.acceptedAt || c.updatedAt)}</p>
                    {c.scheduleDate && <p className="mt-1 text-sm text-primary-600">Scheduled for: {formatIndianDateTime(c.scheduleDate)}</p>}
                </div>
            </div>

            <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-btn border border-surface-border bg-slate-50 p-3">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Location</h4>
                    <p className="flex items-start gap-1 text-sm font-medium text-slate-800">
                        <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                        {c.location.address || 'Address provided via coordinates'}
                    </p>
                </div>
                <div className="rounded-btn border border-surface-border bg-slate-50 p-3">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Reporter Details</h4>
                    <p className="text-sm font-medium text-slate-800">👤 {c.user?.name || 'Anonymous User'}</p>
                    {c.user?.phone && (
                        <p className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-800">
                            <PhoneIcon className="h-4 w-4 text-slate-400" />
                            <a href={`tel:${c.user.phone}`} className="hover:text-primary-600">{c.user.phone}</a>
                        </p>
                    )}
                </div>
            </div>

            {!['completed', 'cancelled', 'closed_unresolved'].includes(c.status) && (
                <div className="mt-5 space-y-3 border-t border-surface-border pt-4">
                    <div className="flex flex-wrap gap-2">
                        {c.status === 'accepted' && <button onClick={() => handleUpdateStatus(c._id, 'on_the_way')} className="btn bg-blue-500 px-3 py-1 text-xs text-white">Go Out for Treatment</button>}
                        {c.status === 'scheduled' && <button onClick={() => handleUpdateStatus(c._id, 'on_the_way')} className="btn bg-blue-500 px-3 py-1 text-xs text-white">Start Scheduled Visit</button>}
                        {c.status === 'on_the_way' && <button onClick={() => handleUpdateStatus(c._id, 'reached')} className="btn bg-indigo-500 px-3 py-1 text-xs text-white">Mark Reached</button>}
                        {c.status === 'reached' && <button onClick={() => handleUpdateStatus(c._id, 'treating')} className="btn bg-emerald-500 px-3 py-1 text-xs text-white">Start Treatment</button>}
                        {c.status === 'treating' && (
                            <>
                                <button onClick={() => handleTreatOnSpot(c._id)} className="btn bg-teal-500 px-3 py-1 text-xs text-white">Treat on Spot</button>
                                <button onClick={() => setTransportCase({ id: c._id, actionType: 'escalate' })} className="btn bg-rose-500 px-3 py-1 text-xs text-white">Escalate to Hospital</button>
                            </>
                        )}
                        {c.status === 'resolved_on_spot' && (
                            <>
                                <button onClick={() => handleComplete(c._id)} className="btn bg-emerald-600 px-3 py-1 text-xs text-white">Mark Case Completed</button>
                                <button onClick={() => setFollowUpCase(c)} className="btn bg-amber-500 px-3 py-1 text-xs text-white">Add Follow-up Schedule</button>
                                <button onClick={() => setTransportCase({ id: c._id, actionType: 'escalate' })} className="btn bg-rose-500 px-3 py-1 text-xs text-white">Escalate to Hospital</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {c.status === 'manual_transport_accepted' && (
                <div className="mt-4 rounded-btn border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-2 flex items-center gap-2 font-bold text-amber-800">
                         Manual Transport Required
                    </div>
                    <p className="text-sm text-amber-700 mb-3">
                        No ambulance could be found. <strong>{c.assignedHospital?.name || 'A hospital'}</strong> has accepted the case. 
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => handleManualResponse(c._id, true)} disabled={acting[c._id]} className="flex-1 btn bg-amber-600 text-white hover:bg-amber-700 py-2 text-xs">
                            I Will Transport
                        </button>
                        <button onClick={() => handleManualResponse(c._id, false)} disabled={acting[c._id]} className="flex-1 btn-outline border-amber-300 text-amber-700 hover:bg-amber-100 py-2 text-xs">
                            Cannot Transport
                        </button>
                    </div>
                </div>
            )}

            {c.bill?.paidStatus === 'pending' && c.bill?.sentTo === 'ngo' && (
                <div className="mt-4 rounded-btn border border-teal-200 bg-teal-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-bold text-teal-800">
                            Hospital Bill Pending
                        </div>
                        <span className="text-lg font-black text-slate-800">₹{c.bill.totalAmount}</span>
                    </div>
                    <button onClick={() => handlePayBill(c._id)} disabled={acting[c._id]} className="w-full btn bg-teal-600 text-white hover:bg-teal-700 py-2.5 text-sm mt-2">
                        {acting[c._id] ? 'Processing...' : 'Pay Bill from Wallet'}
                    </button>
                </div>
            )}

            {c.treatmentStatus === 'discharged' && c.status !== 'completed' && c.status !== 'ambulance_pinged' && c.status !== 'closed_unresolved' && (!c.bill || c.bill.paidStatus === 'paid') && (
                <div className="mt-4 rounded-btn border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-indigo-800 mb-2">
                        Animal Discharged!
                    </div>
                    <p className="text-xs text-slate-600 mb-3">Treatment is complete. How would you like to return the animal?</p>
                    <div className="flex gap-2">
                        <button onClick={() => handleReturnTransport(c._id, false)} disabled={acting[c._id]} className="flex-1 btn bg-indigo-600 text-white hover:bg-indigo-700 py-2 text-xs">
                            Return Ambulance
                        </button>
                        <button onClick={() => handleReturnTransport(c._id, true)} disabled={acting[c._id]} className="flex-1 btn-outline border-indigo-300 text-indigo-700 hover:bg-indigo-100 py-2 text-xs">
                            Take Manually
                        </button>
                    </div>
                </div>
            )}

            {!['completed', 'cancelled', 'closed_unresolved'].includes(c.status) && (
                <div className="mt-4 space-y-3">
                    <div className="rounded-[20px] border border-primary-100 bg-gradient-to-r from-primary-50 to-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <ArrowUpTrayIcon className="h-5 w-5 text-primary-600" />
                            <p className="text-sm font-bold text-primary-700">Upload Progress Media</p>
                        </div>
                        <textarea className="textarea h-20" placeholder="Add a note about this photo or video update" value={mediaComments[c._id] || ''} onChange={(e) => setMediaComments((prev) => ({ ...prev, [c._id]: e.target.value }))} />
                        <div className="mt-3 flex items-center gap-3">
                            <input
                                type="file"
                                id={`media-upload-${c._id}`}
                                multiple
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0) handleUpdateStatus(c._id, c.status, files);
                                    e.target.value = '';
                                }}
                            />
                            <label htmlFor={`media-upload-${c._id}`} className="cursor-pointer rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white">Add Media Update</label>
                            <button onClick={() => handleUpdateStatus(c._id, c.status)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Save Comment Only</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <ScheduleModal rescue={scheduleCase} open={!!scheduleCase} onClose={() => setScheduleCase(null)} onConfirm={(isoDate) => handleAccept(scheduleCase._id, 'schedule', isoDate)} submitting={scheduleCase ? acting[scheduleCase._id] === 'accepting' : false} />
            <ScheduleModal rescue={followUpCase} open={!!followUpCase} onClose={() => setFollowUpCase(null)} onConfirm={(isoDate, notes) => handleFollowUp(followUpCase._id, isoDate, notes)} submitting={followUpCase ? acting[followUpCase._id] === 'followup' : false} title="Schedule Follow-up" />

            <div>
                <h1 className="page-title">NGO Dashboard</h1>
                <p className="page-subtitle">Manage operations and respond to rescue alerts.</p>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="border-b border-surface-border pb-2 text-lg font-bold text-slate-800">Operational Analytics</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {loading && !analytics ? [1, 2, 3, 4].map((i) => <SkeletonStatCard key={i} />) : analytics && (
                            <>
                                <div className="stat-card"><div className="mb-1 flex h-10 w-10 items-center justify-center rounded-btn bg-amber-50"><ClockIcon className="h-5 w-5 text-amber-600" /></div><p className="stat-value">{analytics.nearby_pending}</p><p className="stat-label">Nearby Pending</p></div>
                                <div className="stat-card"><div className="mb-1 flex h-10 w-10 items-center justify-center rounded-btn bg-blue-50"><ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" /></div><p className="stat-value">{analytics.accepted_count}</p><p className="stat-label">Total Accepted</p></div>
                                <div className="stat-card"><div className="mb-1 flex h-10 w-10 items-center justify-center rounded-btn bg-green-50"><CheckCircleIcon className="h-5 w-5 text-green-600" /></div><p className="stat-value">{analytics.completed_count}</p><p className="stat-label">Completed</p></div>
                                <div className="stat-card"><div className="mb-1 flex h-10 w-10 items-center justify-center rounded-btn bg-indigo-50"><ChartBarIcon className="h-5 w-5 text-indigo-600" /></div><p className="stat-value">{analytics.acceptance_rate}%</p><p className="stat-label">Acceptance Rate</p></div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'nearby' && (
                <div className="space-y-4 animate-fade-in">
                    {!locationSet && <div className="mb-4 flex items-start gap-2 rounded-btn border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700"><span className="text-lg leading-none">📍</span><span><strong>NGO base location missing:</strong> ask admin to set your NGO location.</span></div>}
                    {loading ? <div className="space-y-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div> : nearbyCases.length === 0 ? (
                        <div className="card py-14 text-center"><div className="mb-3 text-5xl">🌟</div><p className="text-lg font-semibold text-slate-700">No pending cases nearby.</p><button onClick={fetchAll} className="btn-outline mt-4">Refresh Dashboard</button></div>
                    ) : nearbyCases.map((c) => (
                        <div key={c._id} className="card-hover">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-slate-800">{c.description}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-3">
                                        <span className="text-xs text-surface-muted">👤 {c.user?.name}</span>
                                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">{c.distance !== null && c.distance !== undefined ? `${c.distance.toFixed(1)} km away` : 'Distance unknown'}</span>
                                    </div>
                                </div>
                                <StatusBadge status={c.status} />
                            </div>
                            {c.images?.[0] && <img src={c.images[0]} alt="rescue" className="mb-3 h-36 w-full rounded-btn border border-surface-border object-cover" />}
                            <p className="mb-4 text-xs text-surface-muted">{c.location.address || `${c.location.lat.toFixed(4)}, ${c.location.lng.toFixed(4)}`} · {formatIndianDateTime(c.createdAt)}</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleAccept(c._id, 'immediate')} disabled={!!acting[c._id]} className="btn-primary flex-1">{acting[c._id] === 'accepting' ? '...' : <><CheckIcon className="h-4 w-4" /> Accept Now</>}</button>
                                <button onClick={() => setScheduleCase(c)} disabled={!!acting[c._id]} className="btn-outline flex-1"><ClockIcon className="h-4 w-4" /> Schedule</button>
                                <button onClick={() => handleReject(c._id)} disabled={!!acting[c._id]} className="btn-outline">{acting[c._id] === 'rejecting' ? '...' : <XMarkIcon className="h-4 w-4" />}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'my_cases' && (
                <div className="space-y-5 animate-fade-in">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center"><p className="text-2xl font-bold text-blue-700">{activeCases.length}</p><p className="text-sm font-semibold text-blue-700">Active Cases</p></div>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center"><p className="text-2xl font-bold text-amber-700">{scheduledCases.length}</p><p className="text-sm font-semibold text-amber-700">Scheduled Cases</p></div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center"><p className="text-2xl font-bold text-emerald-700">{completedCases.length}</p><p className="text-sm font-semibold text-emerald-700">Completed Cases</p></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            ['active', `Active (${activeCases.length})`],
                            ['scheduled_list', `Scheduled (${scheduledCases.length})`],
                            ['completed_list', `Completed (${completedCases.length})`],
                        ].map(([id, label]) => (
                            <button key={id} onClick={() => setSearchParams({ tab: 'my_cases', list: id })} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeList === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>
                        ))}
                    </div>
                    {loading ? <div className="space-y-4">{[1, 2].map((i) => <SkeletonCard key={i} />)}</div> : visibleCases.length === 0 ? <div className="card py-14 text-center"><div className="mb-3 text-4xl">📋</div><p className="font-semibold text-slate-700">No cases in this section</p></div> : visibleCases.map(renderCaseCard)}
                </div>
            )}
        </div>
    );
};

export default NGODashboard;
