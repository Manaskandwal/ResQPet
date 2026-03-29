import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, TruckIcon, ArrowPathIcon, SignalIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import { formatIndianDateTime } from '../../utils/dateTime';

const HospitalFleet = () => {
    const { user } = useAuth();
    const [ambulances, setAmbulances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOnboard, setShowOnboard] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', vehicleNumber: '', phone: '',
    });

    const isGovt = user?.isGovernment;

    const fetchAmbulances = async () => {
        try {
            setLoading(true);
            const res = await api.get('/hospital/ambulances');
            setAmbulances(res.data.ambulances || []);
            setErrorMsg('');
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to load fleet.';
            setErrorMsg(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAmbulances(); }, []);

    const handleOnboard = async (e) => {
        e.preventDefault();
        try {
            await api.post('/hospital/onboard-ambulance', formData);
            toast.success('Ambulance unit onboarded and linked to your hospital.');
            setShowOnboard(false);
            setFormData({ name: '', email: '', password: '', vehicleNumber: '', phone: '' });
            fetchAmbulances();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to onboard ambulance.');
        }
    };

    return (
        <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Fleet Command</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${isGovt ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                            {isGovt ? 'Government Fleet' : 'Private Fleet'}
                        </span>
                    </div>
                    <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">
                        Hospital <span className="text-[#76d6d5]">Fleet</span>
                    </h1>
                    <p className="text-[#e5e2e1]/40 max-w-md text-sm">
                        Manage and onboard {isGovt ? 'government' : 'private'} ambulances dedicated to your facility.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchAmbulances}
                        className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                        <ArrowPathIcon className="w-4 h-4 text-[#76d6d5]" />
                    </button>
                    <button onClick={() => setShowOnboard(true)}
                        className="h-12 px-6 bg-[#76d6d5] text-[#131313] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Onboard Unit
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Units', value: ambulances.length },
                    { label: 'Available', value: ambulances.filter(a => a.isAvailable).length },
                    { label: 'On Mission', value: ambulances.filter(a => !a.isAvailable).length },
                ].map(({ label, value }) => (
                    <div key={label} className="glass-card rounded-2xl border border-white/5 bg-[#1c1b1b] p-4 text-center">
                        <p className="font-headline font-black text-2xl text-[#76d6d5]">{value}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Error */}
            {errorMsg && (
                <div className="glass-card rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-300 flex items-center justify-between gap-3">
                    <span>{errorMsg}</span>
                    <button onClick={fetchAmbulances} className="px-3 py-1.5 rounded-xl border border-red-400/20 text-[10px] font-black uppercase tracking-widest hover:border-red-400/40">Retry</button>
                </div>
            )}

            {/* Fleet Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-52 rounded-[2.5rem] bg-white/5 animate-pulse" />)
                ) : ambulances.length === 0 ? (
                    <div className="col-span-full py-32 glass-card rounded-[3rem] text-center border border-dashed border-white/5 space-y-4">
                        <span className="material-symbols-outlined text-5xl text-white/10">minor_crash</span>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">No linked units found.</p>
                        <button onClick={() => setShowOnboard(true)}
                            className="rounded-2xl border border-white/10 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#e5e2e1]/40 hover:text-[#76d6d5] hover:border-[#76d6d5]/20 transition-all">
                            Add First Unit
                        </button>
                    </div>
                ) : ambulances.map(amb => {
                    const lastSeenText = amb.locationUpdatedAt
                        ? formatIndianDateTime(amb.locationUpdatedAt)
                        : null;
                    return (
                        <div key={amb._id} className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b] p-7 space-y-5 hover:border-[#76d6d5]/20 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-[#76d6d5]/10 flex items-center justify-center">
                                    <TruckIcon className="w-6 h-6 text-[#76d6d5]" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${amb.isAvailable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                    {amb.isAvailable ? '✦ Ready' : 'On Mission'}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-[#e5e2e1]">{amb.name}</h3>
                                <p className="text-[10px] font-black text-[#76d6d5] uppercase tracking-[0.2em] mt-0.5">{amb.vehicleNumber}</p>
                            </div>
                            <div className="pt-4 border-t border-white/5 space-y-2">
                                <div className="flex items-center justify-between text-xs text-white/40">
                                    <span>📞 {amb.phone || 'No phone'}</span>
                                    <span className="font-mono text-[10px]">#{amb._id.slice(-4).toUpperCase()}</span>
                                </div>
                                {lastSeenText && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#76d6d5]/50">
                                        <SignalIcon className="w-3 h-3" />
                                        <span>Last pinged: {lastSeenText}</span>
                                    </div>
                                )}
                                {amb.location?.lat && (
                                    <div className="text-[9px] font-mono text-white/20">
                                        {amb.location.lat.toFixed(4)}, {amb.location.lng.toFixed(4)}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Onboard Modal ───────────────────────────────────────────────── */}
            {showOnboard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#1c1b1b] shadow-2xl p-8 space-y-7">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-headline font-bold text-[#e5e2e1]">Onboard Ambulance Unit</h3>
                            <p className="text-sm text-[#e5e2e1]/40">
                                This unit will be linked exclusively to your {isGovt ? 'government' : 'private'} hospital.
                            </p>
                        </div>
                        <form onSubmit={handleOnboard} className="space-y-4">
                            {[
                                { label: 'Driver / Unit Name', name: 'name', type: 'text' },
                                { label: 'Login Email', name: 'email', type: 'email' },
                                { label: 'Access Password', name: 'password', type: 'password', minLength: 6 },
                            ].map(({ label, name, type, minLength }) => (
                                <div key={name} className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">{label}</label>
                                    <input required type={type} minLength={minLength}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-[#e5e2e1] focus:border-[#76d6d5]/30 outline-none transition-all placeholder:text-white/20"
                                        value={formData[name]} onChange={e => setFormData({ ...formData, [name]: e.target.value })} />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Vehicle Number</label>
                                    <input required type="text"
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-[#e5e2e1] focus:border-[#76d6d5]/30 outline-none transition-all"
                                        value={formData.vehicleNumber} onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Phone</label>
                                    <input required type="tel"
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-[#e5e2e1] focus:border-[#76d6d5]/30 outline-none transition-all"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#76d6d5]/5 border border-[#76d6d5]/10">
                                <p className="text-[10px] text-[#76d6d5]/60 leading-relaxed text-center italic">
                                    This unit will be auto-approved and classified as a {isGovt ? 'government' : 'private'} ambulance matching your hospital type.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowOnboard(false)}
                                    className="flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest text-white/20 hover:bg-white/5 rounded-xl transition-all">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-[2] py-3.5 bg-[#76d6d5] text-[#131313] rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                    Onboard Unit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalFleet;
