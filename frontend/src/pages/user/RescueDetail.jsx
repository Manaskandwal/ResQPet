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

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

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

    if (loading) {
        if (isNewUI) return <div className="resqpet-obsidian-theme space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>;
        return <div className="space-y-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>;
    }
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

    // Shared modals (same for both UI modes)
    const modals = (
        <>
            <Transition appear show={fundraiserModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setFundraiserModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className={`fixed inset-0 ${isNewUI ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/40 backdrop-blur-sm'}`} />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className={isNewUI ? 'w-full max-w-md rounded-[2rem] bg-[#1c1b1b] border border-white/5 p-6 shadow-2xl' : 'w-full max-w-md rounded-card bg-white p-6 shadow-card-hover'}>
                                <div className="mb-4 flex items-center justify-between">
                                    <Dialog.Title className={`flex items-center gap-2 text-lg font-bold ${isNewUI ? 'text-[#e5e2e1]' : 'text-slate-800'}`}>
                                        <HeartIcon className={`h-6 w-6 ${isNewUI ? 'text-[#76d6d5]' : 'text-rose-500'}`} /> Start Fundraiser
                                    </Dialog.Title>
                                    <button onClick={() => setFundraiserModalOpen(false)} className={`p-1 ${isNewUI ? 'text-white/30 hover:text-white' : 'btn-ghost text-slate-400'}`}><XMarkIcon className="h-6 w-6" /></button>
                                </div>
                                <p className={`mb-4 text-sm ${isNewUI ? 'text-[#e5e2e1]/50' : 'text-slate-600'}`}>If you cannot cover private hospital or ambulance costs, turn this rescue into a public fundraiser so support can be collected around the case.</p>
                                <div className="mb-5">
                                    <label className={`mb-2 block text-sm font-semibold ${isNewUI ? 'text-[#e5e2e1]/60' : 'text-slate-700'}`}>Estimated Cost (Rs)</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><CurrencyRupeeIcon className={`h-5 w-5 ${isNewUI ? 'text-[#76d6d5]' : 'text-surface-muted'}`} /></div>
                                        <input type="number" min="1" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm ${isNewUI ? 'bg-white/5 border border-white/5 text-[#e5e2e1] outline-none focus:border-[#76d6d5]/30' : 'input-field bg-slate-50'}`} placeholder="e.g. 5000" autoFocus />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setFundraiserModalOpen(false)} className={`flex-1 py-3 rounded-2xl ${isNewUI ? 'border border-white/10 text-[#e5e2e1]/40 hover:text-[#e5e2e1] text-xs font-black uppercase' : 'btn-outline'}`}>Cancel</button>
                                    <button onClick={handleMakeFundraiser} disabled={makingFundraiser || !estimatedCost} className={`flex-1 py-3 rounded-2xl ${isNewUI ? 'bg-[#76d6d5] text-[#131313] text-xs font-black uppercase disabled:opacity-50' : 'btn bg-rose-500 font-semibold text-white hover:bg-rose-600'}`}>{makingFundraiser ? 'Processing...' : 'Make Public'}</button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={logsOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setLogsOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className={`fixed inset-0 ${isNewUI ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/40 backdrop-blur-sm'}`} />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className={isNewUI ? 'w-full max-w-2xl rounded-[2rem] bg-[#1c1b1b] border border-white/5 p-6 shadow-2xl' : 'w-full max-w-2xl rounded-card bg-white p-6 shadow-card-hover'}>
                                <div className="mb-4 flex items-center justify-between">
                                    <Dialog.Title className={`text-lg font-bold ${isNewUI ? 'text-[#e5e2e1]' : 'text-slate-800'}`}>Detailed Status Log</Dialog.Title>
                                    <button onClick={() => setLogsOpen(false)} className={`p-1 ${isNewUI ? 'text-white/30 hover:text-white' : 'btn-ghost text-slate-400'}`}><XMarkIcon className="h-6 w-6" /></button>
                                </div>
                                <div className="max-h-[70vh] space-y-3 overflow-y-auto">
                                    {(rescue.statusLogs || []).length === 0 ? (
                                        <p className={`text-sm ${isNewUI ? 'text-white/30' : 'text-slate-500'}`}>No detailed logs yet.</p>
                                    ) : rescue.statusLogs.slice().reverse().map((log, index) => (
                                        <div key={`${log.timestamp}-${index}`} className={`rounded-2xl p-4 ${isNewUI ? 'bg-white/5 border border-white/5' : 'border border-slate-100 bg-slate-50'}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${isNewUI ? 'text-[#76d6d5]' : 'text-slate-500'}`}>{log.status.replaceAll('_', ' ')}</p>
                                                <p className={`text-[11px] ${isNewUI ? 'text-white/20' : 'text-slate-400'}`}>{formatIndianDateTime(log.timestamp)}</p>
                                            </div>
                                            <p className={`mt-2 text-sm ${isNewUI ? 'text-[#e5e2e1]/60' : 'text-slate-700'}`}>{log.message}</p>
                                            {log.images?.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto">{log.images.map((img, imgIndex) => <img key={imgIndex} src={img} alt="status log" className="h-20 w-24 rounded-xl object-cover" />)}</div>}
                                            {log.video && <video src={log.video} controls className="mt-3 w-full rounded-xl" />}
                                        </div>
                                    ))}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </>
    );

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-6 animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#e5e2e1]/30 hover:text-[#76d6d5] transition-colors text-[10px] font-black uppercase tracking-widest mb-2">
                            <ArrowLeftIcon className="w-3 h-3" /> Back
                        </button>
                        <h1 className="font-headline text-2xl font-extrabold">Rescue <span className="text-[#76d6d5]">Details</span></h1>
                        <p className="text-[10px] text-white/20">ID: {rescue._id}</p>
                    </div>
                    <StatusBadge status={rescue.status} />
                </div>

                {/* Progress */}
                <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[#e5e2e1]">Rescue Progress</h3>
                        {canMakeFundraiser && (
                            <button onClick={() => setFundraiserModalOpen(true)} className="rounded-full border border-[#76d6d5]/20 bg-[#76d6d5]/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#76d6d5] hover:scale-105 transition-all">
                                Need Funds? Start Fundraiser
                            </button>
                        )}
                    </div>
                    <StatusTimeline rescue={rescue} />
                    {rescue.isFundraiser && (
                        <div className="rounded-2xl border border-[#76d6d5]/20 bg-[#76d6d5]/5 p-4 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[#76d6d5] text-sm"><HeartIcon className="h-5 w-5" /> Public Fundraiser Active</div>
                            <div className="flex justify-between text-xs"><span className="text-[#e5e2e1]/50">Generated Funds:</span><span className="text-[#76d6d5] font-bold">Rs {rescue.amountRaised} / Rs {rescue.estimatedCost}</span></div>
                            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden"><div className="h-1.5 rounded-full bg-[#76d6d5] transition-all" style={{ width: `${Math.min((rescue.amountRaised / rescue.estimatedCost) * 100, 100)}%` }} /></div>
                        </div>
                    )}
                    {rescue.depositRefunded && <div className="rounded-2xl border border-[#76d6d5]/20 bg-[#76d6d5]/5 p-3 text-xs text-[#76d6d5]">Rs 30 service fee has been refunded because the rescue could not proceed.</div>}
                </div>

                {/* Description */}
                <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-4">
                    <h3 className="font-bold text-[#e5e2e1]">Description</h3>
                    <p className="text-sm text-[#e5e2e1]/60">{rescue.description}</p>
                    <div className="border-t border-white/5" />
                    <p className="text-xs text-white/30">Animal: <span className="text-[#e5e2e1]/60 capitalize">{rescue.animalType === 'other' ? rescue.animalTypeOther : rescue.animalType}</span></p>
                    <p className="text-xs text-white/20">{rescue.location.address || `${rescue.location.lat.toFixed(5)}, ${rescue.location.lng.toFixed(5)}`}</p>
                    <p className="text-xs text-white/20">Reported: {formatIndianDateTime(rescue.createdAt)}</p>
                    {rescue.transportType && rescue.transportType !== 'na' && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-white/20 font-medium">Transport Mode:</span>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#76d6d5]/10 border border-[#76d6d5]/20">
                                <span className="material-symbols-outlined text-[14px] text-[#76d6d5]">
                                    {rescue.transportType === 'self' ? 'person' : 'ambulance'}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5]">
                                    {rescue.transportType === 'self' ? 'NGO Self Transport' : 'Hospital Ambulance'}
                                </span>
                            </div>
                        </div>
                    )}
                    <button type="button" onClick={() => setLogsOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#e5e2e1]/40 hover:text-[#76d6d5] hover:border-[#76d6d5]/20 transition-all">
                        <ClipboardDocumentListIcon className="h-4 w-4" />View Detailed Status Log
                    </button>
                    <SocialShare rescue={rescue} />
                </div>

                {/* Treatment Results */}
                {showTreatmentResults && (
                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-5">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="h-5 w-5 text-[#76d6d5]" />
                            <div>
                                <h3 className="font-bold text-[#e5e2e1]">Before and After Treatment Results</h3>
                                <p className="text-xs text-white/30">{treatmentStory.summary}</p>
                                {rescue.outcome === 'on_spot_treated' && <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#76d6d5]">Completed through on-spot treatment</p>}
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-[1.5rem] border border-red-500/10 bg-red-500/5 p-4 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Before</p>
                                {treatmentStory.beforeImage ? <img src={treatmentStory.beforeImage} alt="Before" className="h-48 w-full rounded-2xl object-cover" /> : <div className="flex h-48 items-center justify-center rounded-2xl bg-white/5 text-sm text-white/20">No before image.</div>}
                            </div>
                            <div className="rounded-[1.5rem] border border-[#76d6d5]/10 bg-[#76d6d5]/5 p-4 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5]">After</p>
                                {treatmentStory.afterImage ? <img src={treatmentStory.afterImage} alt="After" className="h-48 w-full rounded-2xl object-cover" /> : <div className="flex h-48 items-center justify-center rounded-2xl bg-white/5 text-center text-sm text-white/20">No after-treatment media yet.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Media */}
                {(rescue.images?.length > 0 || rescue.video) && (
                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-4">
                        <h3 className="font-bold text-[#e5e2e1]">Media</h3>
                        {rescue.images?.length > 0 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{rescue.images.map((url, i) => <img key={i} src={url} alt={`media-${i}`} className="h-28 w-full rounded-2xl object-cover opacity-70" />)}</div>}
                        {rescue.video && <video src={rescue.video} controls className="w-full rounded-2xl" />}
                    </div>
                )}

                {/* NGO */}
                {rescue.assignedNGO && (
                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-3">
                        <h3 className="font-bold text-[#e5e2e1]">Assigned NGO</h3>
                        <p className="text-[#e5e2e1]/60">{rescue.assignedNGO.orgName || rescue.assignedNGO.name}</p>
                        {rescue.assignedNGO.phone && <a href={`tel:${rescue.assignedNGO.phone}`} className="flex items-center gap-2 text-sm text-[#76d6d5]"><PhoneIcon className="h-4 w-4" />{rescue.assignedNGO.phone}</a>}
                    </div>
                )}

                {/* Ambulance */}
                {rescue.assignedAmbulance && (
                    <div className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-3">
                        <h3 className="font-bold text-[#e5e2e1]">Ambulance Dispatch</h3>
                        <p className="text-[#e5e2e1]/60">{rescue.assignedAmbulance.name}</p>
                        <p className="text-xs text-white/30">{rescue.assignedAmbulance.vehicleNumber}</p>
                        {rescue.assignedAmbulance.phone && <a href={`tel:${rescue.assignedAmbulance.phone}`} className="flex items-center gap-2 text-sm text-[#76d6d5]"><PhoneIcon className="h-4 w-4" />{rescue.assignedAmbulance.phone}</a>}
                        {liveLocation && (
                            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                                <div className="flex items-center gap-2"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" /></span><span className="text-xs font-black uppercase tracking-widest text-blue-400">Live Location</span></div>
                                <p className="text-[11px] text-blue-400/60">Updated at {formatIndianTime(liveLocation.timestamp)}</p>
                                <a href={`https://www.google.com/maps?q=${liveLocation.lat},${liveLocation.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-600 py-3 text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
                                    <MapPinIcon className="h-4 w-4" /> Track on Map
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {modals}
            </div>
        );
    }

    return (

        <div className="space-y-5 animate-slide-up">
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <h1 className="page-title text-xl">Rescue Details</h1>
                    <p className="text-xs text-surface-muted">Report ID: {rescue._id}</p>
                </div>
                <StatusBadge status={rescue.status} />
            </div>

            <div className="card">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="mb-0 font-semibold text-on-background">Rescue Progress</h3>
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
                <h3 className="mb-2 font-bold text-on-background">Description</h3>
                <p className="text-sm text-on-background font-medium">{rescue.description}</p>
                <div className="divider" />
                <p className="text-xs text-surface-muted">
                    Animal: <span className="font-bold text-on-background capitalize">{rescue.animalType === 'other' ? rescue.animalTypeOther : rescue.animalType}</span>
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
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-hover px-4 py-2 text-sm font-bold text-on-background transition-all hover:scale-105"
                >
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                    View Detailed Status Log
                </button>

                <SocialShare rescue={rescue} />
            </div>

            {showTreatmentResults && (
                <div className="card overflow-hidden">
                    <div className="mb-4 flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-emerald-600" />
                        <div>
                            <h3 className="font-bold text-on-background">Before and After Treatment Results</h3>
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
                    <h3 className="mb-2 font-bold text-on-background">Assigned NGO</h3>
                    <p className="font-medium text-on-background">{rescue.assignedNGO.orgName || rescue.assignedNGO.name}</p>
                    {rescue.assignedNGO.phone && (
                        <a href={`tel:${rescue.assignedNGO.phone}`} className="mt-2 flex items-center gap-2 text-sm text-primary-600 font-bold hover:underline">
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
