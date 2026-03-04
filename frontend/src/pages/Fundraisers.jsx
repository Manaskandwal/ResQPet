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
    const { user, updateUser } = useAuth();
    const [fundraisers, setFundraisers] = useState([]);
    const [ngos, setNgos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [donatingId, setDonatingId] = useState(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [activeTab, setActiveTab] = useState('cases'); // 'cases' or 'ngos'
    const [subscribing, setSubscribing] = useState(false);

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
            const { data } = await api.get('/user/ngos'); // Assume this endpoint exists or I will create it
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
            // Simulated subscription flow
            await api.post('/user/subscribe-emergency', { amount: 50 }); // Fixed dummy amount for now
            toast.success('Joined Emergency Fund! You will be notified of its usage. ❤️');
            updateUser({ monthlySubscription: { isSubscribed: true, amount: 50 } });
        } catch (error) {
            toast.error('Failed to join emergency fund.');
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
            toast.success(`Simulated payment of ₹${amount} successful!`);
            // In a real app, logic for order creation and verification would go here
            setDonationAmount('');
            if (!isNgo) fetchFundraisers();
        } catch (error) {
            toast.error('Error initiating donation.');
        } finally {
            setDonatingId(null);
        }
    };

    if (loading) return (
        <div className="max-w-4xl mx-auto space-y-4 px-4 py-8">
            <h1 className="page-title text-2xl mb-6">Fundraisers</h1>
            {[1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Back Button */}
            <button
                onClick={() => window.history.back()}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition mb-6 group"
            >
                <div className="p-1 rounded-full group-hover:bg-surface-hover">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="15 19l-7-7 7-7" />
                    </svg>
                </div>
                <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                    <HeartIcon className="w-8 h-8 text-rose-500 animate-pulse-soft" />
                    <div>
                        <h1 className="page-title text-3xl mb-1">Fundraisers</h1>
                        <p className="text-surface-muted">Your contribution saves lives every single day.</p>
                    </div>
                </div>

                {/* Emergency Fund CTA */}
                {!user?.monthlySubscription?.isSubscribed ? (
                    <button
                        onClick={handleJoinEmergencyFund}
                        disabled={subscribing}
                        className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-rose-200 transition-all hover:scale-105 active:scale-95 text-sm"
                    >
                        <HeartIcon className="w-4 h-4" />
                        Join Emergency Fund
                    </button>
                ) : (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-full border border-rose-200 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        Active Subscriber
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-surface-border mb-6">
                <button
                    onClick={() => setActiveTab('cases')}
                    className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === 'cases' ? 'text-rose-600' : 'text-surface-muted hover:text-slate-700'
                        }`}
                >
                    Active Cases
                    {activeTab === 'cases' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-600 rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('ngos')}
                    className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === 'ngos' ? 'text-rose-600' : 'text-surface-muted hover:text-slate-700'
                        }`}
                >
                    NGO-wise Support
                    {activeTab === 'ngos' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-600 rounded-full" />}
                </button>
            </div>

            {activeTab === 'cases' ? (
                fundraisers.length === 0 ? (
                    <div className="card text-center py-16">
                        <HeartIcon className="w-16 h-16 text-rose-100 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">No Active Case Fundraisers</h3>
                        <p className="text-surface-muted mt-2">All cases are currently supported. Thank you for your kindness!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fundraisers.map(rescue => {
                            const progress = Math.min(((rescue.amountRaised || 0) / (rescue.estimatedCost || 1)) * 100, 100);
                            return (
                                <div key={rescue._id} className="card flex flex-col group hover:shadow-card-hover transition-all duration-300 border-surface-border/50">
                                    <div className="relative overflow-hidden rounded-btn mb-4">
                                        {rescue.images?.[0] ? (
                                            <img src={rescue.images[0]} alt="Animal" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-48 bg-slate-50 flex items-center justify-center text-slate-300">
                                                No Image Available
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 shadow-sm uppercase tracking-wider">
                                            Case ID: {rescue._id.slice(-6).toUpperCase()}
                                        </div>
                                    </div>
                                    <p className="font-bold text-slate-800 mb-2 line-clamp-2 leading-snug">{rescue.description}</p>
                                    <p className="text-[11px] text-surface-muted mb-4 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {rescue.location.address || 'Location provided'}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="mt-auto pt-4 border-t border-surface-border/50">
                                        <div className="flex justify-between text-[11px] font-bold mb-2">
                                            <span className="text-slate-600">Raised: ₹{rescue.amountRaised || 0}</span>
                                            <span className="text-rose-600">Goal: ₹{rescue.estimatedCost}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="bg-gradient-to-r from-rose-500 to-rose-400 h-full rounded-full transition-all duration-1000 shadow-lg"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-right mt-1.5 text-slate-400">{progress.toFixed(0)}% FUNDED</p>

                                        <div className="flex items-center gap-2 mt-4">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    placeholder="100"
                                                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border-none rounded-btn text-sm font-semibold focus:ring-2 focus:ring-rose-500/20 transition-all"
                                                    onChange={(e) => setDonationAmount(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleDonate(rescue._id)}
                                                disabled={donatingId === rescue._id}
                                                className="btn bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 shadow-md shadow-rose-100"
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
                /* NGO TABS */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ngos.filter(ngo => ngo.paymentDetails?.upiId).length === 0 ? (
                        <div className="col-span-full card text-center py-16">
                            <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            <h3 className="text-lg font-bold text-slate-800">No NGOs Available for Donation</h3>
                            <p className="text-surface-muted mt-2">Currently no NGOs have configured their payment details. Please check back later.</p>
                        </div>
                    ) : (
                        ngos.filter(ngo => ngo.paymentDetails?.upiId).map(ngo => (
                            <div key={ngo._id} className="card border-surface-border/50 hover:shadow-card-hover transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-100">
                                        {ngo.orgName?.charAt(0) || 'N'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{ngo.orgName}</h3>
                                        <p className="text-[11px] text-surface-muted uppercase font-bold tracking-wider">Registered NGO</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{ngo.address || 'No specific address provided'}</p>

                                <div className="p-3 bg-slate-50 rounded-btn mb-4 border border-slate-100">
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-slate-500 font-medium">UPI ID</span>
                                        <span className="text-slate-800 font-bold">{ngo.paymentDetails.upiId}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-medium">Bank</span>
                                        <span className="text-slate-800 font-bold">{ngo.paymentDetails.bankName || 'HDFC Bank'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-btn text-sm font-semibold focus:ring-2 focus:ring-primary-500/20"
                                        onChange={(e) => setDonationAmount(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleDonate(ngo._id, true)}
                                        className="btn bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-6"
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
