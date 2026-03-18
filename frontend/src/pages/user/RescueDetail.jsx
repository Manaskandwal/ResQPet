import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
    ArrowLeftIcon,
    PhoneIcon,
    MapPinIcon,
    CurrencyRupeeIcon,
    XMarkIcon,
    HeartIcon,
    SparklesIcon,
    ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import socket from '../../socket';
import { StatusBadge, StatusTimeline } from '../../components/StatusComponents';
import { SkeletonCard } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import SocialShare from '../../components/SocialShare';
import { formatIndianDateTime, formatIndianTime } from '../../utils/dateTime';

const getTreatmentStory = (rescue) => {
    const logs = Array.isArray(rescue?.statusLogs) ? rescue.statusLogs : [];
    const beforeImage = rescue?.images?.[0] || null;
    const afterLog = [...logs].reverse().find((log) => (log.images && log.images.find((image) => image !== beforeImage)) || log.video);
    const fallbackAfter = [...(rescue?.images || [])].reverse().find((image) => image && image !== beforeImage) || null;

    return {
        beforeImage,
        afterImage: afterLog?.images?.find((image) => image !== beforeImage) || fallbackAfter || null,
        notes: logs
            .filter((log) => ['treating', 'reached', 'resolved_on_spot', 'completed'].includes(log.status))
            .slice(-4)
            .reverse(),
        summary: afterLog?.message || (rescue?.outcome === 'on_spot_treated'
            ? 'The NGO treated the animal on the spot and completed the case.'
            : 'The rescue reached safe completion.'),
    };
};

const RescueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [rescue, setRescue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liveLocation, setLiveLocation] = useState(null);
    const [fundraiserModalOpen, setFundraiserModalOpen] = useState(false);
    const [estimatedCost, setEstimatedCost] = useState('');
    const [makingFundraiser, setMakingFundraiser] = useState(false);
    const [logsOpen, setLogsOpen] = useState(false);

    useEffect(() => {
        const fetchRescue = async () => {
            try {
                const { data } = await api.get(`/rescue/${id}`);
                setRescue(data.rescue);
            } catch (error) {
                toast.error('Failed to load rescue details.');
                navigate('/user/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchRescue();
        socket.connect();
        socket.emit('join_rescue_room', { rescueRequestId: id });
        socket.on('location_update', (data) => setLiveLocation(data));

        return () => {
            socket.off('location_update');
        };
    }, [id, navigate]);

    useEffect(() => {
        if (!rescue || ['completed', 'cancelled', 'closed_unresolved'].includes(rescue.status)) {
            return undefined;
        }

        const pollInterval = setInterval(async () => {
            try {
                const { data } = await api.get(`/rescue/${id}`);
                setRescue(data.rescue);
            } catch (error) {
                console.error('[RescueDetail] Poll error:', error.message);
            }
        }, 10000);

        return () => clearInterval(pollInterval);
    }, [id, rescue]);

    if (loading) return <div className="space-y-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>;
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
    const canMakeFundraiser = isOwner && !rescue.isFundraiser && !['completed', 'cancelled', 'closed_unresolved'].includes(rescue.status);
    const showTreatmentResults = ['completed', 'resolved_on_spot'].includes(rescue.status) || rescue.outcome === 'on_spot_treated';
    const treatmentStory = getTreatmentStory(rescue);

    return (
        <div className="space-y-5 animate-slide-up">
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <h1 className="page-title text-xl">Rescue Details</h1>
                    <p className="text-xs text-surface-muted">Report ID: {rescue._id}</p>
                </div>
                <StatusBadge status={rescue.status} />
            </div>

            <div className="card text-slate-800">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="mb-0 font-semibold text-slate-800">Rescue Progress</h3>
                    {canMakeFundraiser && (
                        <button onClick={() => setFundraiserModalOpen(true)} className="btn-outline border-teal-200 px-3 py-1.5 text-xs text-teal-700 hover:bg-teal-50">
                            Need Funds? Start Fundraiser
                        </button>
                    )}
                </div>
                <StatusTimeline rescue={rescue} />

                {rescue.isFundraiser && (
                    <div className="mt-4 rounded-btn border border-teal-100 bg-teal-50 p-3">
                        <div className="mb-1 flex items-center gap-2 font-bold text-teal-800">
                            <HeartIcon className="h-5 w-5 text-teal-600" /> Public Fundraiser Active
                        </div>
                        <div className="mb-1 flex justify-between text-sm font-medium">
                            <span className="text-slate-600">Generated Funds:</span>
                            <span className="text-teal-700">Rs {rescue.amountRaised} / Rs {rescue.estimatedCost}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-teal-200">
                            <div className="h-1.5 rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min((rescue.amountRaised / rescue.estimatedCost) * 100, 100)}%` }} />
                        </div>
                    </div>
                )}

                {rescue.depositRefunded && (
                    <div className="mt-4 rounded-btn border border-green-100 bg-green-50 p-3 text-xs font-medium text-green-700">
                        Rs 30 service fee has been refunded because the rescue could not proceed.
                    </div>
                )}
            </div>

            <div className="card">
                <h3 className="mb-2 font-semibold text-slate-800">Description</h3>
                <p className="text-sm text-slate-700">{rescue.description}</p>
                <div className="divider" />
                <p className="text-xs text-surface-muted">
                    Animal: <span className="font-semibold text-slate-700 capitalize">{rescue.animalType === 'other' ? rescue.animalTypeOther : rescue.animalType}</span>
                </p>
                <p className="text-xs text-surface-muted">
                    {rescue.location.address || `${rescue.location.lat.toFixed(5)}, ${rescue.location.lng.toFixed(5)}`}
                </p>
                <p className="mt-1 text-xs text-surface-muted">
                    Reported: {formatIndianDateTime(rescue.createdAt)}
                </p>
                <button
                    type="button"
                    onClick={() => setLogsOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                    View Detailed Status Log
                </button>

                <SocialShare rescue={rescue} />
            </div>

            {showTreatmentResults && (
                <div className="card overflow-hidden">
                    <div className="mb-4 flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-emerald-500" />
                        <div>
                            <h3 className="font-semibold text-slate-800">Before and After Treatment Results</h3>
                            <p className="text-xs text-surface-muted">{treatmentStory.summary}</p>
                            {rescue.outcome === 'on_spot_treated' && (
                                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Completed through on-spot treatment</p>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[22px] border border-rose-100 bg-rose-50 p-3">
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Before</p>
                            {treatmentStory.beforeImage ? (
                                <img src={treatmentStory.beforeImage} alt="Before treatment" className="h-56 w-full rounded-[18px] object-cover" />
                            ) : (
                                <div className="flex h-56 items-center justify-center rounded-[18px] bg-white text-sm text-slate-500">No before image uploaded.</div>
                            )}
                        </div>
                        <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 p-3">
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">After</p>
                            {treatmentStory.afterImage ? (
                                <img src={treatmentStory.afterImage} alt="After treatment" className="h-56 w-full rounded-[18px] object-cover" />
                            ) : (
                                <div className="flex h-56 items-center justify-center rounded-[18px] bg-white text-center text-sm text-slate-500">
                                    No after-treatment media uploaded yet. The status captures the outcome.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {(rescue.images?.length > 0 || rescue.video) && (
                <div className="card">
                    <h3 className="mb-3 font-semibold text-slate-800">Media</h3>
                    {rescue.images?.length > 0 && (
                        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {rescue.images.map((url, i) => (
                                <img key={i} src={url} alt={`media-${i}`} className="h-28 w-full rounded-btn border border-surface-border object-cover" />
                            ))}
                        </div>
                    )}
                    {rescue.video && (
                        <video src={rescue.video} controls className="w-full rounded-btn border border-surface-border" />
                    )}
                </div>
            )}

            {rescue.assignedNGO && (
                <div className="card">
                    <h3 className="mb-2 font-semibold text-slate-800">Assigned NGO</h3>
                    <p className="text-slate-700">{rescue.assignedNGO.orgName || rescue.assignedNGO.name}</p>
                    {rescue.assignedNGO.phone && (
                        <a href={`tel:${rescue.assignedNGO.phone}`} className="mt-1 flex items-center gap-1.5 text-sm text-primary-600 hover:underline">
                            <PhoneIcon className="h-4 w-4" />{rescue.assignedNGO.phone}
                        </a>
                    )}
                </div>
            )}

            {rescue.assignedAmbulance && (
                <div className="card">
                    <h3 className="mb-2 font-semibold text-slate-800">Ambulance Dispatch</h3>
                    <p className="text-slate-700">{rescue.assignedAmbulance.name}</p>
                    <p className="text-xs text-surface-muted">{rescue.assignedAmbulance.vehicleNumber}</p>
                    {rescue.assignedAmbulance.phone && (
                        <a href={`tel:${rescue.assignedAmbulance.phone}`} className="mt-1 flex items-center gap-1.5 text-sm text-primary-600 hover:underline">
                            <PhoneIcon className="h-4 w-4" />{rescue.assignedAmbulance.phone}
                        </a>
                    )}

                    {liveLocation && (
                        <div className="mt-4 rounded-btn border border-blue-100 bg-blue-50 p-3">
                            <div className="mb-1 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Live Location</span>
                            </div>
                            <p className="mb-2 text-[11px] text-blue-600/80">
                                Updated at {formatIndianTime(liveLocation.timestamp)}
                            </p>
                            <a
                                href={`https://www.google.com/maps?q=${liveLocation.lat},${liveLocation.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm flex w-full justify-center bg-blue-600 py-1.5 text-white hover:bg-blue-700"
                            >
                                <MapPinIcon className="h-4 w-4" /> Track on Map
                            </a>
                        </div>
                    )}
                </div>
            )}

            <Transition appear show={fundraiserModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setFundraiserModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md rounded-card bg-white p-6 shadow-card-hover">
                                <div className="mb-4 flex items-center justify-between">
                                    <Dialog.Title className="flex items-center gap-2 text-lg font-bold text-slate-800">
                                        <HeartIcon className="h-6 w-6 text-rose-500" /> Start Fundraiser
                                    </Dialog.Title>
                                    <button onClick={() => setFundraiserModalOpen(false)} className="btn-ghost p-1 text-slate-400">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <p className="mb-4 text-sm text-slate-600">
                                    If you cannot cover private hospital or ambulance costs, turn this rescue into a public fundraiser so support can be collected around the case.
                                </p>
                                <div className="mb-5">
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Estimated Cost (Rs)</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <CurrencyRupeeIcon className="h-5 w-5 text-surface-muted" />
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            value={estimatedCost}
                                            onChange={(e) => setEstimatedCost(e.target.value)}
                                            className="input-field bg-slate-50 pl-10"
                                            placeholder="e.g. 5000"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setFundraiserModalOpen(false)} className="btn-outline flex-1 py-2">
                                        Cancel
                                    </button>
                                    <button onClick={handleMakeFundraiser} disabled={makingFundraiser || !estimatedCost} className="btn flex-1 bg-rose-500 py-2 font-semibold text-white hover:bg-rose-600">
                                        {makingFundraiser ? 'Processing...' : 'Make Public'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={logsOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setLogsOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-2xl rounded-card bg-white p-6 shadow-card-hover">
                                <div className="mb-4 flex items-center justify-between">
                                    <Dialog.Title className="text-lg font-bold text-slate-800">Detailed Status Log</Dialog.Title>
                                    <button onClick={() => setLogsOpen(false)} className="btn-ghost p-1 text-slate-400">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="max-h-[70vh] space-y-3 overflow-y-auto">
                                    {(rescue.statusLogs || []).length === 0 ? (
                                        <p className="text-sm text-slate-500">No detailed logs yet.</p>
                                    ) : rescue.statusLogs.slice().reverse().map((log, index) => (
                                        <div key={`${log.timestamp}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{log.status.replaceAll('_', ' ')}</p>
                                                <p className="text-[11px] text-slate-400">{formatIndianDateTime(log.timestamp)}</p>
                                            </div>
                                            <p className="mt-2 text-sm text-slate-700">{log.message}</p>
                                            {log.images?.length > 0 && (
                                                <div className="mt-3 flex gap-2 overflow-x-auto">
                                                    {log.images.map((img, imgIndex) => (
                                                        <img key={imgIndex} src={img} alt="status log" className="h-20 w-24 rounded-xl object-cover" />
                                                    ))}
                                                </div>
                                            )}
                                            {log.video && <video src={log.video} controls className="mt-3 w-full rounded-xl" />}
                                        </div>
                                    ))}
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
