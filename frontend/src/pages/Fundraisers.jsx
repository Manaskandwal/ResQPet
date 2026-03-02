import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { SkeletonCard } from '../components/Skeleton';

const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const Fundraisers = () => {
    const { user } = useAuth();
    const [fundraisers, setFundraisers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [donatingId, setDonatingId] = useState(null);
    const [donationAmount, setDonationAmount] = useState('');

    const fetchFundraisers = async () => {
        try {
            const { data } = await api.get('/donation/fundraisers');
            setFundraisers(data.fundraisers);
        } catch (error) {
            toast.error('Failed to load active fundraisers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFundraisers();
    }, []);

    const handleDonate = async (rescueId) => {
        if (!user) {
            toast.error('Please log in to donate.');
            return;
        }

        const amount = parseFloat(donationAmount);
        if (!amount || amount < 10) {
            toast.error('Minimum donation is ₹10.');
            return;
        }

        setDonatingId(rescueId);
        try {
            const loaded = await loadRazorpay();
            if (!loaded) { toast.error('Failed to load Razorpay.'); return; }

            const { data } = await api.post('/donation/create-order', {
                amount,
                rescueRequestId: rescueId,
                isGeneral: false,
                message: "Help for " + rescueId
            });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || data.keyId,
                amount: data.order.amount,
                currency: 'INR',
                name: 'PawSaarthi Fundraiser',
                description: `Donation for Rescue ${rescueId}`,
                order_id: data.order.id,
                handler: async (response) => {
                    try {
                        await api.post('/donation/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            donationId: data.donationId,
                        });
                        toast.success(`Thank you for donating ₹${amount}! ❤️`);
                        setDonationAmount('');
                        fetchFundraisers(); // refresh so progress bar updates
                    } catch (err) {
                        toast.error('Payment verification failed.');
                    }
                },
                prefill: { name: user?.name, email: user?.email },
                theme: { color: '#e11d48' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', () => toast.error(`Payment failed.`));
            rzp.open();
        } catch (error) {
            toast.error('Error initiating donation.');
        } finally {
            setDonatingId(null);
        }
    };

    if (loading) return (
        <div className="max-w-4xl mx-auto space-y-4 px-4 py-8">
            <h1 className="page-title text-2xl mb-6">Active Fundraisers</h1>
            {[1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-8">
                <HeartIcon className="w-8 h-8 text-rose-500" />
                <div>
                    <h1 className="page-title text-3xl mb-1">Fundraisers</h1>
                    <p className="text-surface-muted">Help fund private rescue operations for stray animals.</p>
                </div>
            </div>

            {fundraisers.length === 0 ? (
                <div className="card text-center py-16">
                    <HeartIcon className="w-16 h-16 text-rose-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No Active Fundraisers</h3>
                    <p className="text-surface-muted mt-2">Currently all rescue operations are fully funded or using free government services. Thank you for checking!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fundraisers.map(rescue => {
                        const progress = Math.min(((rescue.amountRaised || 0) / (rescue.estimatedCost || 1)) * 100, 100);
                        return (
                            <div key={rescue._id} className="card flex flex-col">
                                {rescue.images?.[0] && (
                                    <img src={rescue.images[0]} alt="Animal" className="w-full h-48 object-cover rounded-btn mb-4" />
                                )}
                                <p className="font-semibold text-slate-800 mb-2">{rescue.description}</p>
                                <p className="text-xs text-surface-muted mb-4">📍 {rescue.location.address || 'Location provided'}</p>

                                {/* Progress Bar */}
                                <div className="mt-auto pt-4 border-t border-surface-border">
                                    <div className="flex justify-between text-xs font-medium mb-1.5">
                                        <span className="text-slate-700">Raised: ₹{rescue.amountRaised || 0}</span>
                                        <span className="text-rose-600">Goal: ₹{rescue.estimatedCost}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-rose-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-right mt-1 text-slate-400">{progress.toFixed(0)}% funded</p>

                                    <div className="flex items-end gap-2 mt-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Amount (₹)</label>
                                            <input
                                                type="number"
                                                min="10"
                                                placeholder="e.g. 100"
                                                className="w-full px-3 py-2 mt-1 border border-surface-border rounded-btn text-sm"
                                                onChange={(e) => setDonationAmount(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleDonate(rescue._id)}
                                            disabled={donatingId === rescue._id}
                                            className="btn bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 w-32"
                                        >
                                            {donatingId === rescue._id ? '...' : 'Donate'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Fundraisers;
