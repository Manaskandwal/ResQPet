import { useState, useEffect, useCallback } from 'react';
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
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { StatusBadge } from '../../components/StatusComponents';
import { SkeletonCard, SkeletonStatCard } from '../../components/Skeleton';
import { formatIndianDateTime, toDateInputValue, toTimeInputValue } from '../../utils/dateTime';

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-card border border-surface-border bg-white shadow-card-hover">
                <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
                    <div>
                        <h3 className="font-bold text-slate-800">{title}</h3>
                        <p className="mt-1 truncate text-xs text-surface-muted">{rescue.description}</p>
                    </div>
                    <button onClick={onClose} className="rounded p-1.5 hover:bg-surface-hover">
                        <XMarkIcon className="h-5 w-5 text-slate-500" />
                    </button>
                </div>
                <div className="space-y-4 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="form-group">
                            <label className="label">Date</label>
                            <input type="date" className="input" value={date} min={toDateInputValue(new Date())} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="label">Time</label>
                            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
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

const NGODashboard = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const activeList = searchParams.get('list') || 'active';
    const [analytics, setAnalytics] = useState(null);
    const [nearbyCases, setNearbyCases] = useState([]);
    const [myCases, setMyCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState({});
    const [locationSet, setLocationSet] = useState(true);
    const [scheduleCase, setScheduleCase] = useState(null);
    const [followUpCase, setFollowUpCase] = useState(null);
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
            const [analyticsRes, nearbyRes, mycasesRes] = await Promise.all([
                api.get('/ngo/analytics'),
                api.get(nearbyUrl),
                api.get('/ngo/my-cases'),
            ]);
            setAnalytics(analyticsRes.data.analytics);
            setNearbyCases(nearbyRes.data.cases || []);
            setLocationSet(nearbyRes.data.locationSet ?? true);
            setMyCases(mycasesRes.data.cases || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load panel data.');
        } finally {
            setLoading(false);
        }
    }, [gpsCoords]);

    useEffect(() => {
        if (user.isApproved) fetchAll();
    }, [fetchAll, user.isApproved]);

    const withActing = async (id, state, action) => {
        setActing((prev) => ({ ...prev, [id]: state }));
        try {
            await action();
        } finally {
            setActing((prev) => ({ ...prev, [id]: null }));
        }
    };

    const handleAccept = async (id, type = 'immediate', scheduleDate = null) => {
        await withActing(id, 'accepting', async () => {
            await api.put(`/rescue/${id}/accept-ngo`, { type, scheduleDate });
            toast.success(type === 'schedule' ? 'Case scheduled successfully.' : 'Case accepted successfully.');
            setScheduleCase(null);
            fetchAll();
        }).catch((error) => toast.error(error.response?.data?.message || 'Failed to accept case.'));
    };

    const handleUpdateStatus = async (id, status, files = []) => {
        await withActing(id, 'updating', async () => {
            const formData = new FormData();
            formData.append('status', status);
            formData.append('message', mediaComments[id] || `NGO updated the case to ${status}.`);
            files.forEach((file) => formData.append('media', file));
            await api.put(`/rescue/${id}/ngo-status`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMediaComments((prev) => ({ ...prev, [id]: '' }));
            toast.success(`Status updated to ${status}.`);
            fetchAll();
        }).catch((error) => toast.error(error.response?.data?.message || 'Failed to update status.'));
    };

    const handleReject = async (id) => {
        await withActing(id, 'rejecting', async () => {
            await api.put(`/rescue/${id}/reject-ngo`);
            toast.success('Case passed to other responders.');
            fetchAll();
        }).catch((error) => toast.error(error.response?.data?.message || 'Failed to reject case.'));
    };

    const handleTreatOnSpot = async (id) => {
        await withActing(id, 'resolving', async () => {
            await api.put(`/rescue/${id}/resolve-ngo`);
            toast.success('On-spot treatment recorded.');
            fetchAll();
        }).catch((error) => toast.error(error.response?.data?.message || 'Failed to treat on spot.'));
    };

    const handleComplete = async (id) => {
        await withActing(id, 'completing', async () => {
            await api.put(`/rescue/${id}/complete-ngo`);
            toast.success('Case marked completed.');
            fetchAll();
        }).catch((error) => toast.error(error.response?.data?.message || 'Failed to complete case.'));
    };

    const handleEscalate = async (id) => {
        await withActing(id, 'escalating', async () => {
            await api.put(`/rescue/${id}/escalate-ngo`);
            toast.success('Case escalated to hospitals.');
            fetchAll();
        }).catch((error) => toast.error(error.response?.data?.message || 'Failed to escalate case.'));
    };

    const handleFollowUp = async (id, scheduleDate, notes) => {
        await withActing(id, 'followup', async () => {
            await api.post(`/rescue/${id}/followup`, { scheduleDate, notes });
            toast.success('Follow-up scheduled.');
            setFollowUpCase(null);
            fetchAll();
        }).catch((error) => toast.error(error.response?.data?.message || 'Failed to schedule follow-up.'));
    };

    if (!user.isApproved) {
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
                                <button onClick={() => handleEscalate(c._id)} className="btn bg-rose-500 px-3 py-1 text-xs text-white">Escalate to Hospital</button>
                            </>
                        )}
                        {c.status === 'resolved_on_spot' && (
                            <>
                                <button onClick={() => handleComplete(c._id)} className="btn bg-emerald-600 px-3 py-1 text-xs text-white">Mark Case Completed</button>
                                <button onClick={() => setFollowUpCase(c)} className="btn bg-amber-500 px-3 py-1 text-xs text-white">Add Follow-up Schedule</button>
                                <button onClick={() => handleEscalate(c._id)} className="btn bg-rose-500 px-3 py-1 text-xs text-white">Escalate to Hospital</button>
                            </>
                        )}
                    </div>

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
