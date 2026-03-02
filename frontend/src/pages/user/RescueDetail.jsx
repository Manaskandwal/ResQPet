import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge, StatusTimeline } from '../../components/StatusComponents';
import { useAuth } from '../../context/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowLeftIcon, PhoneIcon, MapPinIcon, CurrencyRupeeIcon, XMarkIcon, HeartIcon } from '@heroicons/react/24/outline';
import { SkeletonCard } from '../../components/Skeleton';
import socket from '../../socket';
import { Fragment } from 'react';

const RescueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [rescue, setRescue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liveLocation, setLiveLocation] = useState(null);

    // Fundraiser Modal
    const [fundraiserModalOpen, setFundraiserModalOpen] = useState(false);
    const [estimatedCost, setEstimatedCost] = useState('');
    const [makingFundraiser, setMakingFundraiser] = useState(false);

    useEffect(() => {
        const fetchRescue = async () => {
            try {
                console.log('[RescueDetail] Fetching rescue:', id);
                const { data } = await api.get(`/rescue/${id}`);
                setRescue(data.rescue);
                console.log('[RescueDetail] Rescue loaded, status:', data.rescue.status);
            } catch (error) {
                console.error('[RescueDetail] Fetch error:', error.message);
                toast.error('Failed to load rescue details.');
                navigate('/user/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchRescue();

        // Join socket room
        socket.connect();
        socket.emit('join_rescue_room', { rescueRequestId: id });

        socket.on('location_update', (data) => {
            console.log('[RescueDetail] Live location update:', data);
            setLiveLocation(data);
        });

        // Simple polling for status updates if active
        const pollInterval = setInterval(() => {
            if (!loading && rescue && !['completed', 'cancelled', 'resolved_on_spot', 'delivered'].includes(rescue.status)) {
                fetchRescue();
            }
        }, 10000); // 10s

        return () => {
            socket.off('location_update');
            clearInterval(pollInterval);
        };
    }, [id, navigate]);

    if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>;
    if (!rescue) return null;

    const handleMakeFundraiser = async () => {
        const cost = parseFloat(estimatedCost);
        if (!cost || cost <= 0) {
            toast.error('Please enter a valid estimated cost.');
            return;
        }

        setMakingFundraiser(true);
        try {
            const { data } = await api.put(`/rescue/${id}/fundraiser`, { estimatedCost: cost });
            toast.success(data.message);
            setRescue(data.rescue);
            setFundraiserModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to convert to fundraiser.');
        } finally {
            setMakingFundraiser(false);
        }
    };

    const isOwner = user?._id === rescue?.user?._id;
    const canMakeFundraiser = isOwner && !rescue.isFundraiser && !['completed', 'cancelled', 'resolved_on_spot', 'delivered'].includes(rescue.status);

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="btn-ghost p-2">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="page-title text-xl">Rescue Details</h1>
                    <p className="text-xs text-surface-muted">Report ID: {rescue._id}</p>
                </div>
                <StatusBadge status={rescue.status} />
            </div>

            {/* Status Timeline */}
            <div className="card text-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-800 mb-0">Rescue Progress</h3>
                    {canMakeFundraiser && (
                        <button onClick={() => setFundraiserModalOpen(true)} className="btn-outline text-xs py-1.5 px-3 border-teal-200 text-teal-700 hover:bg-teal-50">
                            📣 Need Funds? Start Fundraiser
                        </button>
                    )}
                </div>
                <StatusTimeline status={rescue.status} />

                {rescue.isFundraiser && (
                    <div className="mt-4 p-3 bg-teal-50 border border-teal-100 rounded-btn">
                        <div className="flex items-center gap-2 text-teal-800 font-bold mb-1">
                            <HeartIcon className="w-5 h-5 text-teal-600" /> Public Fundraiser Active
                        </div>
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-slate-600">Generated Funds:</span>
                            <span className="text-teal-700">₹{rescue.amountRaised} / ₹{rescue.estimatedCost}</span>
                        </div>
                        <div className="w-full bg-teal-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((rescue.amountRaised / rescue.estimatedCost) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                )}

                {rescue.depositRefunded && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-btn text-xs text-green-700 font-medium">
                        ✅ ₹20 deposit has been refunded to your wallet!
                    </div>
                )}
            </div>

            {/* Description & Location */}
            <div className="card">
                <h3 className="font-semibold text-slate-800 mb-2">Description</h3>
                <p className="text-slate-700 text-sm">{rescue.description}</p>
                <div className="divider" />
                <p className="text-xs text-surface-muted">
                    📍 {rescue.location.address || `${rescue.location.lat.toFixed(5)}, ${rescue.location.lng.toFixed(5)}`}
                </p>
                <p className="text-xs text-surface-muted mt-1">
                    🕐 Reported: {new Date(rescue.createdAt).toLocaleString()}
                </p>
            </div>

            {/* Media */}
            {(rescue.images?.length > 0 || rescue.video) && (
                <div className="card">
                    <h3 className="font-semibold text-slate-800 mb-3">Media</h3>
                    {rescue.images?.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                            {rescue.images.map((url, i) => (
                                <img key={i} src={url} alt={`media-${i}`}
                                    className="w-full h-28 object-cover rounded-btn border border-surface-border" />
                            ))}
                        </div>
                    )}
                    {rescue.video && (
                        <video src={rescue.video} controls className="w-full rounded-btn border border-surface-border" />
                    )}
                </div>
            )}

            {/* Assigned entities */}
            {rescue.assignedNGO && (
                <div className="card">
                    <h3 className="font-semibold text-slate-800 mb-2">Assigned NGO</h3>
                    <p className="text-slate-700">{rescue.assignedNGO.orgName || rescue.assignedNGO.name}</p>
                    {rescue.assignedNGO.phone && (
                        <a href={`tel:${rescue.assignedNGO.phone}`}
                            className="flex items-center gap-1.5 text-primary-600 text-sm mt-1 hover:underline">
                            <PhoneIcon className="w-4 h-4" />{rescue.assignedNGO.phone}
                        </a>
                    )}
                </div>
            )}

            {rescue.assignedAmbulance && (
                <div className="card">
                    <h3 className="font-semibold text-slate-800 mb-2">Ambulance Dispatch</h3>
                    <p className="text-slate-700">{rescue.assignedAmbulance.name}</p>
                    <p className="text-xs text-surface-muted">🚑 {rescue.assignedAmbulance.vehicleNumber}</p>
                    {rescue.assignedAmbulance.phone && (
                        <a href={`tel:${rescue.assignedAmbulance.phone}`}
                            className="flex items-center gap-1.5 text-primary-600 text-sm mt-1 hover:underline">
                            <PhoneIcon className="w-4 h-4" />{rescue.assignedAmbulance.phone}
                        </a>
                    )}

                    {liveLocation && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-btn">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                <span className="text-blue-800 text-xs font-bold uppercase tracking-wider">Live Location</span>
                            </div>
                            <p className="text-[11px] text-blue-600/80 mb-2">
                                Updated at {new Date(liveLocation.timestamp).toLocaleTimeString()}
                            </p>
                            <a
                                href={`https://www.google.com/maps?q=${liveLocation.lat},${liveLocation.lng}`}
                                target="_blank" rel="noopener noreferrer"
                                className="btn bg-blue-600 hover:bg-blue-700 text-white btn-sm py-1.5 w-full flex justify-center"
                            >
                                <MapPinIcon className="w-4 h-4" /> Track on Map
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Fundraiser Modal */}
            <Transition appear show={fundraiserModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setFundraiserModalOpen(false)}>
                    <Transition.Child as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment}
                            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md bg-white rounded-card shadow-card-hover p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <HeartIcon className="w-6 h-6 text-rose-500" /> Start Fundraiser
                                    </Dialog.Title>
                                    <button onClick={() => setFundraiserModalOpen(false)} className="btn-ghost p-1 text-slate-400">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>
                                <p className="text-slate-600 text-sm mb-4">
                                    If you cannot cover the fees for the private hospital or ambulance, you can turn this rescue into a public fundraiser. Donations will go directly towards resolving this case.
                                </p>
                                <div className="mb-5">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated Cost (₹)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <CurrencyRupeeIcon className="h-5 w-5 text-surface-muted" />
                                        </div>
                                        <input
                                            type="number" min="1"
                                            value={estimatedCost}
                                            onChange={(e) => setEstimatedCost(e.target.value)}
                                            className="input-field pl-10 bg-slate-50"
                                            placeholder="e.g. 5000"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setFundraiserModalOpen(false)} className="btn-outline flex-1 py-2">
                                        Cancel
                                    </button>
                                    <button onClick={handleMakeFundraiser} disabled={makingFundraiser || !estimatedCost} className="btn bg-rose-500 hover:bg-rose-600 text-white flex-1 py-2 font-semibold">
                                        {makingFundraiser ? 'Processing...' : 'Make Public'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default RescueDetail;
