import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { StatusBadge } from '../../components/StatusComponents';
import { SkeletonCard } from '../../components/Skeleton';
import { TruckIcon, XMarkIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

const HospitalDashboard = () => {
    const { user } = useAuth();
    const [cases, setCases] = useState([]);
    const [ambulances, setAmbulances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);
    const [assigning, setAssigning] = useState(false);
    const [selectedAmb, setSelectedAmb] = useState('');

    const fetchData = useCallback(async () => {
        try {
            console.log('[HospitalDashboard] Fetching escalated cases and ambulances...');
            const [casesRes, ambRes] = await Promise.all([
                api.get('/hospital/escalated'),
                api.get('/hospital/ambulances'),
            ]);
            setCases(casesRes.data.cases);
            setAmbulances(ambRes.data.ambulances);
            console.log('[HospitalDashboard] Cases:', casesRes.data.count, 'Ambulances:', ambRes.data.count);
        } catch (error) {
            console.error('[HospitalDashboard] Fetch error:', error.message);
            toast.error('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openAssignModal = (c) => {
        setSelectedCase(c);
        setSelectedAmb('');
        setModalOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedAmb) { toast.error('Please select an ambulance.'); return; }
        setAssigning(true);
        try {
            console.log('[HospitalDashboard] Assigning ambulance:', selectedAmb, 'to rescue:', selectedCase._id);
            await api.put(`/rescue/${selectedCase._id}/assign-ambulance`, { ambulanceId: selectedAmb });
            toast.success('Ambulance assigned! 🚑 Dispatch confirmed.');
            setModalOpen(false);
            setCases((prev) => prev.filter((c) => c._id !== selectedCase._id));
            // Refresh ambulances list
            const ambRes = await api.get('/hospital/ambulances');
            setAmbulances(ambRes.data.ambulances);
        } catch (error) {
            console.error('[HospitalDashboard] Assign error:', error.message);
            toast.error(error.response?.data?.message || 'Failed to assign ambulance.');
        } finally {
            setAssigning(false);
        }
    };

    const availableAmbs = ambulances.filter(a => a.isAvailable);

    if (!user.isApproved) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Awaiting Admin Approval</h2>
                <p className="text-surface-muted max-w-md">Your hospital account is under review.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">Hospital Dashboard 🏥</h1>
                <p className="page-subtitle">Escalated cases needing ambulance dispatch</p>
            </div>

            {/* Capacity row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="w-10 h-10 bg-orange-50 rounded-btn flex items-center justify-center mb-1">
                        <BuildingOffice2Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="stat-value">{cases.length}</p>
                    <p className="stat-label">Escalated Cases</p>
                </div>
                <div className="stat-card">
                    <div className="w-10 h-10 bg-green-50 rounded-btn flex items-center justify-center mb-1">
                        <TruckIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="stat-value">{availableAmbs.length}/{ambulances.length}</p>
                    <p className="stat-label">Available Ambulances</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
            ) : cases.length === 0 ? (
                <div className="card text-center py-14">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-slate-700 font-semibold text-lg">No escalated cases nearby!</p>
                    <p className="text-surface-muted text-sm mt-1">All clear. Cases requiring hospitals will appear here.</p>
                    <button onClick={fetchData} className="btn-outline mt-4">Refresh</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {cases.map((c) => (
                        <div key={c._id} className="card-hover">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{c.description}</p>
                                    <p className="text-xs text-surface-muted mt-0.5">
                                        👤 {c.user?.name}  · 📍 {c.distance} km ·
                                        🕐 Escalated: {c.escalatedAt ? new Date(c.escalatedAt).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <StatusBadge status={c.status} />
                            </div>
                            {c.images?.[0] && (
                                <img src={c.images[0]} alt="rescue" className="w-full h-36 object-cover rounded-btn mb-3 border border-surface-border" />
                            )}
                            <button
                                onClick={() => openAssignModal(c)}
                                disabled={availableAmbs.length === 0}
                                className="btn-accent w-full"
                            >
                                <TruckIcon className="w-4 h-4" />
                                {availableAmbs.length === 0 ? 'No Ambulances Available' : 'Dispatch Ambulance'}
                            </button>
                        </div>
                    ))}
                    <button onClick={fetchData} className="btn-ghost w-full text-sm">🔄 Refresh</button>
                </div>
            )}

            {/* Assign Ambulance Modal */}
            <Transition appear show={modalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setModalOpen(false)}>
                    <Transition.Child as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment}
                            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md bg-white rounded-card shadow-card-hover p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title className="text-lg font-bold text-slate-800">Dispatch Ambulance</Dialog.Title>
                                    <button onClick={() => setModalOpen(false)} className="btn-ghost p-1">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <p className="text-sm text-surface-muted mb-4 truncate">
                                    Case: <span className="text-slate-700 font-medium">{selectedCase?.description}</span>
                                </p>

                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {availableAmbs.map((amb) => (
                                        <button key={amb._id} type="button"
                                            onClick={() => setSelectedAmb(amb._id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-btn border text-left transition-all
                        ${selectedAmb === amb._id
                                                    ? 'border-primary-400 bg-primary-50'
                                                    : 'border-surface-border hover:bg-surface-hover'}`}>
                                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <TruckIcon className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{amb.name}</p>
                                                <p className="text-xs text-surface-muted">🚑 {amb.vehicleNumber || 'No plate'} · {amb.phone || 'No phone'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-2 mt-5">
                                    <button onClick={() => setModalOpen(false)} className="btn-outline flex-1">Cancel</button>
                                    <button onClick={handleAssign} disabled={!selectedAmb || assigning} className="btn-primary flex-1">
                                        {assigning ? (
                                            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Assigning...</>
                                        ) : '🚑 Dispatch Now'}
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

export default HospitalDashboard;
