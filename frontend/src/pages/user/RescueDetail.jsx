import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge, StatusTimeline } from '../../components/StatusComponents';
import { ArrowLeftIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { SkeletonCard } from '../../components/Skeleton';

const RescueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rescue, setRescue] = useState(null);
    const [loading, setLoading] = useState(true);

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
    }, [id, navigate]);

    if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>;
    if (!rescue) return null;

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
            <div className="card">
                <h3 className="font-semibold text-slate-800 mb-4">Rescue Progress</h3>
                <StatusTimeline status={rescue.status} />
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
                    <h3 className="font-semibold text-slate-800 mb-2">Ambulance</h3>
                    <p className="text-slate-700">{rescue.assignedAmbulance.name}</p>
                    <p className="text-xs text-surface-muted">🚑 {rescue.assignedAmbulance.vehicleNumber}</p>
                    {rescue.assignedAmbulance.phone && (
                        <a href={`tel:${rescue.assignedAmbulance.phone}`}
                            className="flex items-center gap-1.5 text-primary-600 text-sm mt-1 hover:underline">
                            <PhoneIcon className="w-4 h-4" />{rescue.assignedAmbulance.phone}
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

export default RescueDetail;
