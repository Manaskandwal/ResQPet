import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BuildingOffice2Icon, PlusIcon, TruckIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';

const HospitalFleet = () => {
    const [ambulances, setAmbulances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOnboard, setShowOnboard] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        vehicleNumber: '',
        phone: '',
    });

    const fetchAmbulances = async () => {
        try {
            setLoading(true);
            const res = await api.get('/hospital/ambulances');
            setAmbulances(res.data.ambulances || []);
            setErrorMsg('');
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to load fleet data.';
            setErrorMsg(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAmbulances();
    }, []);

    const handleOnboard = async (e) => {
        e.preventDefault();
        try {
            await api.post('/hospital/onboard-ambulance', formData);
            toast.success('Ambulance onboarded and linked to your hospital.');
            setShowOnboard(false);
            setFormData({ name: '', email: '', password: '', vehicleNumber: '', phone: '' });
            fetchAmbulances();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to onboard ambulance.');
        }
    };

    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

    if (isNewUI) return (
        <div className="resqpet-obsidian-theme w-full space-y-12 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Fleet Command</span>
                    <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">Hospital <span className="text-[#76d6d5]">Fleet</span></h1>
                    <p className="text-[#e5e2e1]/50 max-w-md">Manage and onboard linked ambulances dedicated to your facility.</p>
                </div>
                <button 
                    onClick={() => setShowOnboard(true)}
                    className="h-14 px-8 bg-[#76d6d5] text-[#131313] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#76d6d5]/10 flex items-center gap-3"
                >
                    <PlusIcon className="w-4 h-4" /> Onboard New Unit
                </button>
            </header>

            {errorMsg && (
                <div className="glass-card rounded-[2rem] border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-300 flex items-center justify-between gap-3">
                    <span>{errorMsg}</span>
                    <button
                        onClick={fetchAmbulances}
                        className="px-3 py-1.5 rounded-xl border border-red-400/20 text-[10px] font-black uppercase tracking-widest hover:border-red-400/40"
                    >
                        Retry
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 rounded-[2rem] bg-white/5 animate-pulse" />)
                ) : ambulances.length === 0 ? (
                    <div className="col-span-full py-32 glass-card rounded-[3rem] text-center border border-dashed border-white/5 space-y-4">
                        <span className="material-symbols-outlined text-5xl text-white/10">minor_crash</span>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">No linked units found in fleet</p>
                    </div>
                ) : ambulances.map(amb => (
                    <div key={amb._id} className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b] p-8 space-y-6 hover:border-[#76d6d5]/30 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5]">
                                <TruckIcon className="w-6 h-6" />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${amb.isAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                {amb.isAvailable ? 'Ready' : 'Busy'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">{amb.name}</h3>
                            <p className="text-[10px] font-black text-[#76d6d5] uppercase tracking-[0.2em]">{amb.vehicleNumber}</p>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                            <span>{amb.phone}</span>
                            <span>Unit #{amb._id.slice(-4).toUpperCase()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {showOnboard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2.5rem] border border-white/5 bg-[#1c1b1b] shadow-2xl p-8 space-y-8">
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-headline font-bold text-[#e5e2e1]">Unit Onboarding</h3>
                            <p className="text-sm text-[#e5e2e1]/40">Add a dedicated ambulance to your fleet.</p>
                        </div>
                        <form onSubmit={handleOnboard} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 px-2">Driver/Unit Name</label>
                                <input required type="text" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#76d6d5]/30 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 px-2">Login Email</label>
                                <input required type="email" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#76d6d5]/30 outline-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 px-2">Access Password</label>
                                <input required type="password" minLength={6} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#76d6d5]/30 outline-none transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 px-2">Vehicle #</label>
                                    <input required type="text" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#76d6d5]/30 outline-none transition-all" value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30 px-2">Phone</label>
                                    <input required type="tel" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#76d6d5]/30 outline-none transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-[#76d6d5]/5 border border-[#76d6d5]/10 mt-4">
                                <p className="text-[10px] text-[#76d6d5]/60 leading-relaxed italic text-center">
                                    By onboarding, this unit will be exclusively linked to your hospital. They cannot accept cases from other facilities.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowOnboard(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:bg-white/5 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-[#76d6d5] text-[#131313] rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">Onboard Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title text-slate-800">Fleet Management</h1>
                    <p className="page-subtitle">Onboard and manage your linked ambulances.</p>
                </div>
                <button onClick={() => setShowOnboard(true)} className="btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Ambulance
                </button>
            </div>

            {errorMsg && (
                <div className="card border border-red-200 bg-red-50 text-red-700 text-sm flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <button onClick={fetchAmbulances} className="btn-outline">Retry</button>
                </div>
            )}
            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-card bg-slate-100" />)}
                </div>
            ) : ambulances.length === 0 ? (
                <div className="card py-16 text-center">
                    <TruckIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-4 text-slate-500 font-medium">No linked ambulances found.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {ambulances.map(amb => (
                        <div key={amb._id} className="card-hover border-l-4 border-l-primary-500 p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800">{amb.name}</h3>
                                <StatusBadge status={amb.isAvailable ? 'available' : 'busy'} />
                            </div>
                            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">{amb.vehicleNumber}</p>
                            <p className="mt-2 text-sm text-surface-muted">📞 {amb.phone}</p>
                        </div>
                    ))}
                </div>
            )}

            {showOnboard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-card bg-white p-6 shadow-card-hover">
                        <h2 className="mb-4 text-xl font-bold text-slate-800">Onboard New Ambulance</h2>
                        <form onSubmit={handleOnboard} className="space-y-4">
                            <div className="form-group">
                                <label className="label">Driver/Unit Name</label>
                                <input required type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="label">Login Email</label>
                                <input required type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="label">Password</label>
                                <input required type="password" minLength={6} className="input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="label">Vehicle #</label>
                                    <input required type="text" className="input" value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Phone</label>
                                    <input required type="tel" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded-md">
                                Note: This ambulance will be automatically linked to your hospital and can only handle your cases.
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowOnboard(false)} className="btn-ghost flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Create Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for status badge in standard UI
const StatusBadge = ({ status }) => {
    const colors = {
        available: 'bg-green-50 text-green-700 border-green-200',
        busy: 'bg-amber-50 text-amber-700 border-amber-200'
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[status]}`}>
            {status.toUpperCase()}
        </span>
    );
};

export default HospitalFleet;
