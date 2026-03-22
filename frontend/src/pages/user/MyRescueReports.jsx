import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { StatusBadge, StatusTimeline } from '../../components/StatusComponents';
import { SkeletonCard } from '../../components/Skeleton';
import { formatIndianDateTime } from '../../utils/dateTime';

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

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

    if (loading) {
        if (isNewUI) return <div className="resqpet-obsidian-theme space-y-4">{[1,2,3].map(i => <div key={i} className="h-48 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>;
        return <div className="space-y-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>;
    }

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
                <section className="space-y-2">
                    <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">My Activity</span>
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight">Rescue <span className="text-[#76d6d5]">Reports</span></h1>
                    <p className="text-[#e5e2e1]/50">All rescue reports submitted from your account.</p>
                </section>

                {rescues.length === 0 ? (
                    <div className="glass-card rounded-[3rem] border border-dashed border-white/10 p-16 text-center space-y-4">
                        <span className="material-symbols-outlined text-5xl text-white/10">pets</span>
                        <p className="text-xs font-black uppercase tracking-widest text-white/20">No rescue reports yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {rescues.map((rescue) => (
                            <Link key={rescue._id} to={`/user/rescue/${rescue._id}`} className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] flex flex-col overflow-hidden group hover:-translate-y-1 transition-all duration-300 p-6 space-y-4 block">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p className="font-bold text-[#e5e2e1] truncate text-lg">{rescue.description}</p>
                                        <p className="text-xs text-[#e5e2e1]/40 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            {rescue.location.address || `${rescue.location.lat.toFixed(4)}, ${rescue.location.lng.toFixed(4)}`}
                                        </p>
                                    </div>
                                    <StatusBadge status={rescue.status} />
                                </div>
                                {rescue.images?.[0] && <img src={rescue.images[0]} alt="rescue" className="h-40 w-full rounded-2xl object-cover opacity-70 group-hover:opacity-100 transition-opacity" />}
                                <div className="border-t border-white/5 pt-4">
                                    <StatusTimeline rescue={rescue} />
                                    <p className="text-[11px] text-white/20 mt-3">Reported {formatIndianDateTime(rescue.createdAt)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

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
