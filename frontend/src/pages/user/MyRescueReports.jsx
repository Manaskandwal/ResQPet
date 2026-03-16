import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { StatusBadge, StatusTimeline } from '../../components/StatusComponents';
import { SkeletonCard } from '../../components/Skeleton';
import { formatIndianDateTime } from '../../utils/dateTime';

const MyRescueReports = () => {
    const [rescues, setRescues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get('/rescue/mine');
                setRescues(data.rescues || []);
            } catch (error) {
                toast.error('Failed to load rescue reports.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="space-y-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="page-title">My Rescue Reports</h1>
                <p className="page-subtitle">All rescue reports submitted from your account.</p>
            </div>
            {rescues.length === 0 ? (
                <div className="card py-12 text-center text-slate-500">No rescue reports yet.</div>
            ) : rescues.map((rescue) => (
                <Link key={rescue._id} to={`/user/rescue/${rescue._id}`} className="card-hover block">
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-800">{rescue.description}</p>
                            <p className="mt-0.5 text-xs text-surface-muted">{rescue.location.address || `${rescue.location.lat.toFixed(4)}, ${rescue.location.lng.toFixed(4)}`}</p>
                        </div>
                        <StatusBadge status={rescue.status} />
                    </div>
                    {rescue.images?.[0] && <img src={rescue.images[0]} alt="rescue" className="mb-3 h-32 w-full rounded-btn object-cover" />}
                    <div className="divider" />
                    <StatusTimeline rescue={rescue} />
                    <p className="mt-3 text-[11px] text-surface-muted">Reported {formatIndianDateTime(rescue.createdAt)}</p>
                </Link>
            ))}
        </div>
    );
};

export default MyRescueReports;
