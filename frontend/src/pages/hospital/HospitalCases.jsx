import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/StatusComponents';
import { formatIndianDateTime } from '../../utils/dateTime';
import {
    MapPinIcon, TruckIcon, BanknotesIcon, ClipboardDocumentCheckIcon,
    ArrowPathIcon, XMarkIcon, PlusIcon, TrashIcon, ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

const FILTER_TABS = ['all', 'active', 'billed', 'completed'];

const TREATMENT_LABELS = {
    not_started: 'Not Started',
    admitted: 'Admitted',
    under_treatment: 'Under Treatment',
    treatment_complete: 'Treatment Complete',
    discharged: 'Discharged',
};

const TREATMENT_COLORS = {
    not_started: 'text-[#e5e2e1]/30 border-white/10',
    admitted: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    under_treatment: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    treatment_complete: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    discharged: 'text-[#76d6d5] border-[#76d6d5]/30 bg-[#76d6d5]/10',
};

const HospitalCases = () => {
    const { user } = useAuth();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [treatmentModal, setTreatmentModal] = useState(null); // rescue id
    const [treatmentStatus, setTreatmentStatus] = useState('');
    const [hospitalNote, setHospitalNote] = useState('');
    const [treatmentSaving, setTreatmentSaving] = useState(false);
    const [billModal, setBillModal] = useState(null); // rescue object
    const [editMode, setEditMode] = useState(false);
    const [billItems, setBillItems] = useState([{ name: '', amount: '' }]);
    const [billImage, setBillImage] = useState(null);
    const [billImagePreview, setBillImagePreview] = useState('');
    const [estimatedCost, setEstimatedCost] = useState('');
    const [billSubmitting, setBillSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const isGovt = user?.isGovernment;

    const fetchCases = useCallback(async () => {
        try {
            const { data } = await api.get('/hospital/my-cases');
            setCases(data.cases || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load cases.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCases(); }, [fetchCases]);

    const filteredCases = cases.filter((c) => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['hospital_accepted', 'ambulance_pinged', 'ambulance_assigned', 'en_route', 'picked_up'].includes(c.status);
        if (filter === 'billed') return !!c.bill?.createdAt;
        if (filter === 'completed') return ['completed', 'delivered', 'closed_unresolved'].includes(c.status);
        return true;
    });

    // ─── Treatment Status ───────────────────────────────────────────────────────
    const openTreatmentModal = (c) => {
        setTreatmentModal(c._id);
        setTreatmentStatus(c.treatmentStatus || 'admitted');
        setHospitalNote('');
    };

    const handleTreatmentUpdate = async () => {
        if (!treatmentModal) return;
        setTreatmentSaving(true);
        try {
            await api.put(`/hospital/rescue/${treatmentModal}/treatment`, { treatmentStatus, hospitalNote });
            toast.success(`Treatment status updated: ${TREATMENT_LABELS[treatmentStatus]}`);
            setTreatmentModal(null);
            fetchCases();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status.');
        } finally {
            setTreatmentSaving(false);
        }
    };

    // ─── Billing ────────────────────────────────────────────────────────────────
    const openBillModal = (c) => {
        setBillModal(c);
        if (c.bill?.createdAt) {
            setEditMode(true);
            setBillItems(c.bill.items?.length > 0 ? c.bill.items.map(i => ({ name: i.name, amount: i.amount.toString() })) : [{ name: '', amount: '' }]);
            setBillImage(c.bill.prescriptionImageUrl || null);
            setBillImagePreview(c.bill.prescriptionImageUrl || '');
            setEstimatedCost(c.bill.totalAmount?.toString() || '');
        } else {
            setEditMode(false);
            setBillItems([{ name: '', amount: '' }]);
            setBillImage(null);
            setBillImagePreview('');
            setEstimatedCost('');
        }
    };

    const addBillItem = () => setBillItems((p) => [...p, { name: '', amount: '' }]);
    const removeBillItem = (idx) => setBillItems((p) => p.filter((_, i) => i !== idx));
    const updateBillItem = (idx, field, value) => {
        setBillItems((p) => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const totalBill = billItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB.'); return; }
        setBillImagePreview(URL.createObjectURL(file));
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
            const result = await res.json();
            setBillImage(result.secure_url);
            toast.success('Image uploaded.');
        } catch {
            toast.error('Image upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitBill = async () => {
        if (!billModal) return;
        if (isGovt && !estimatedCost) { toast.error('Please enter estimated cost.'); return; }
        if (!isGovt && billItems.every((i) => !i.name && !i.amount)) { toast.error('Add at least one billing item.'); return; }

        setBillSubmitting(true);
        try {
            const payload = isGovt
                ? { estimatedCost: parseFloat(estimatedCost), prescriptionImageUrl: billImage }
                : { items: billItems.filter((i) => i.name && i.amount).map((i) => ({ name: i.name, amount: parseFloat(i.amount) })), totalAmount: totalBill, prescriptionImageUrl: billImage };

            if (editMode) {
                await api.put(`/hospital/rescue/${billModal._id}/bill`, payload);
                toast.success('Bill updated and notification sent.');
            } else {
                await api.post(`/hospital/rescue/${billModal._id}/bill`, payload);
                toast.success('Bill submitted and notification sent.');
            }
            setBillModal(null);
            fetchCases();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'submit'} bill.`);
        } finally {
            setBillSubmitting(false);
        }
    };

    // ─── Ambulance location display ─────────────────────────────────────────────
    const getAmbulanceLastSeen = (c) => {
        if (!c.assignedAmbulance?.location?.lat) return 'Location not shared';
        return `${c.assignedAmbulance.location.lat.toFixed(4)}, ${c.assignedAmbulance.location.lng.toFixed(4)}`;
    };

    return (
        <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-8">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Hospital</span>
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight">My <span className="text-[#76d6d5]">Cases</span></h1>
                    <p className="text-[#e5e2e1]/40 text-sm">Manage accepted cases, treatment status and billing.</p>
                </div>
                <button onClick={fetchCases} className="h-11 w-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all self-start md:self-auto">
                    <ArrowPathIcon className="w-4 h-4 text-[#76d6d5]" />
                </button>
            </section>

            {/* Filter Tabs */}
            <div className="flex gap-2 rounded-2xl bg-white/5 p-1 w-fit">
                {FILTER_TABS.map((tab) => (
                    <button key={tab} onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all capitalize ${filter === tab ? 'bg-[#76d6d5] text-[#131313]' : 'text-[#e5e2e1]/40 hover:text-[#e5e2e1]'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Cases List */}
            {loading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-48 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>
            ) : filteredCases.length === 0 ? (
                <div className="glass-card rounded-[2.5rem] border border-dashed border-white/10 p-16 text-center space-y-3">
                    <ClipboardDocumentCheckIcon className="w-12 h-12 text-[#76d6d5]/20 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-widest text-white/20">No cases found for this filter.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {filteredCases.map((c) => (
                        <div key={c._id} className="glass-card rounded-[2rem] border border-white/5 bg-[#1c1b1b] p-6 space-y-5 hover:border-white/10 transition-all">
                            {/* Case Info */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <p className="font-bold text-[#e5e2e1]">{c.description}</p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#e5e2e1]/30">
                                        <span>{c.user?.name}</span>
                                        {c.user?.phone && <span>📞 {c.user.phone}</span>}
                                        <span>{formatIndianDateTime(c.createdAt)}</span>
                                    </div>
                                    {/* Treatment Status Badge */}
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${TREATMENT_COLORS[c.treatmentStatus || 'not_started']}`}>
                                        <span className="material-symbols-outlined text-sm">local_hospital</span>
                                        {TREATMENT_LABELS[c.treatmentStatus || 'not_started']}
                                    </span>
                                </div>
                                <StatusBadge status={c.status} />
                            </div>

                            {/* Ambulance Tracking */}
                            {c.assignedAmbulance && (
                                <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                            <TruckIcon className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#e5e2e1]">{c.assignedAmbulance.name} · {c.assignedAmbulance.vehicleNumber}</p>
                                            <div className="flex items-center gap-1.5 text-[10px] text-[#e5e2e1]/40 mt-0.5">
                                                <MapPinIcon className="w-3 h-3 text-[#76d6d5]" />
                                                <span>{getAmbulanceLastSeen(c)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {c.assignedAmbulance.phone && (
                                        <a href={`tel:${c.assignedAmbulance.phone}`}
                                            className="px-3 py-1.5 rounded-xl border border-[#76d6d5]/20 text-[10px] font-black uppercase tracking-widest text-[#76d6d5] hover:bg-[#76d6d5]/10 transition-all">
                                            Call
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Bill Status */}
                            {c.bill?.createdAt && (
                                <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <BanknotesIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-amber-300">Bill Sent · ₹{c.bill.totalAmount}</p>
                                            <p className="text-[10px] text-amber-400/50 mt-0.5 capitalize">
                                                To: {c.bill.sentTo} · Status: {c.bill.paidStatus}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${c.bill.paidStatus === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                        {c.bill.paidStatus}
                                    </span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => openTreatmentModal(c)}
                                    className="flex-1 min-w-[140px] py-2.5 rounded-2xl bg-[#76d6d5]/10 border border-[#76d6d5]/20 text-[#76d6d5] text-xs font-black uppercase tracking-widest hover:bg-[#76d6d5]/20 transition-all flex items-center justify-center gap-2">
                                    <ClipboardDocumentCheckIcon className="w-4 h-4" />
                                    Update Treatment
                                </button>
                                {(!c.bill?.createdAt || c.bill?.paidStatus === 'pending') && (
                                    <button onClick={() => openBillModal(c)}
                                        className={`flex-1 min-w-[120px] py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                            c.bill?.createdAt 
                                            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20' 
                                            : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                                        }`}>
                                        <BanknotesIcon className="w-4 h-4" />
                                        {c.bill?.createdAt ? 'Edit Bill' : 'Send Bill'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Treatment Status Modal ─────────────────────────────────── */}
            {treatmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setTreatmentModal(null)}>
                    <div className="w-full max-sm rounded-[2rem] border border-white/10 bg-[#1c1b1b] shadow-2xl p-7 space-y-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-headline text-xl font-bold text-[#e5e2e1]">Update Treatment Status</h3>
                            <button onClick={() => setTreatmentModal(null)} className="p-1.5 rounded-xl hover:bg-white/5 text-white/30 hover:text-[#e5e2e1] transition">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(TREATMENT_LABELS).filter(([k]) => k !== 'not_started').map(([status, label]) => (
                                <button key={status} onClick={() => setTreatmentStatus(status)}
                                    className={`w-full text-left px-4 py-3 rounded-2xl border text-sm font-bold transition-all ${treatmentStatus === status ? 'bg-[#76d6d5]/10 border-[#76d6d5]/30 text-[#76d6d5]' : 'border-white/10 text-[#e5e2e1]/50 hover:border-white/20 hover:text-[#e5e2e1]'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Optional Note</label>
                            <textarea value={hospitalNote} onChange={(e) => setHospitalNote(e.target.value)} rows={2} placeholder="E.g., 'Surgery required at 4PM'..."
                                className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#e5e2e1] placeholder:text-white/20 focus:outline-none focus:border-[#76d6d5]/40 resize-none" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setTreatmentModal(null)} className="flex-1 py-3 rounded-2xl border border-white/10 text-white/30 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">Cancel</button>
                            <button onClick={handleTreatmentUpdate} disabled={treatmentSaving}
                                className="flex-[2] py-3 rounded-2xl bg-[#76d6d5] text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50">
                                {treatmentSaving ? 'Updating...' : 'Update & Notify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Billing Modal ──────────────────────────────────────────── */}
            {billModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setBillModal(null)}>
                    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#1c1b1b] shadow-2xl p-7 space-y-6 my-8" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-headline text-xl font-bold text-[#e5e2e1]">{isGovt ? (editMode ? 'Edit Bill' : 'Upload Bill') : (editMode ? 'Edit Bill' : 'Create Bill')}</h3>
                                <p className="text-xs text-[#e5e2e1]/30 mt-1">{billModal.description}</p>
                            </div>
                            <button onClick={() => setBillModal(null)} className="p-1.5 rounded-xl hover:bg-white/5 text-white/30 hover:text-[#e5e2e1] transition">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Govt: prescription + cost */}
                        {isGovt ? (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#76d6d5]">Estimated Cost (₹)</label>
                                    <input type="number" min="0" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)}
                                        placeholder="Enter estimated amount"
                                        className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-[#e5e2e1] placeholder:text-white/20 focus:outline-none focus:border-[#76d6d5]/40" />
                                </div>
                            </div>
                        ) : (
                            /* Private: line items */
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[#76d6d5]">Bill Items</label>
                                {billItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input value={item.name} onChange={(e) => updateBillItem(idx, 'name', e.target.value)} placeholder="Item name"
                                            className="flex-[2] rounded-xl border border-white/10 bg-transparent px-3 py-2.5 text-xs text-[#e5e2e1] placeholder:text-white/20 focus:outline-none focus:border-[#76d6d5]/40" />
                                        <input type="number" min="0" value={item.amount} onChange={(e) => updateBillItem(idx, 'amount', e.target.value)} placeholder="₹"
                                            className="flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2.5 text-xs text-[#e5e2e1] placeholder:text-white/20 focus:outline-none focus:border-[#76d6d5]/40" />
                                        {billItems.length > 1 && (
                                            <button onClick={() => removeBillItem(idx)} className="p-2 rounded-xl hover:bg-red-500/10 text-white/30 hover:text-red-400 transition">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addBillItem} className="flex items-center gap-1.5 text-xs text-[#76d6d5] hover:text-[#76d6d5]/70 transition">
                                    <PlusIcon className="w-4 h-4" /> Add Item
                                </button>
                                <div className="rounded-2xl bg-[#76d6d5]/5 border border-[#76d6d5]/10 p-3 flex justify-between items-center">
                                    <span className="text-xs text-[#e5e2e1]/50 font-bold uppercase tracking-wider">Total</span>
                                    <span className="font-headline font-black text-xl text-[#76d6d5]">₹{totalBill.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-[#e5e2e1]/30">
                                {isGovt ? 'Prescription / Invoice Image' : 'Attach Image (Optional)'}
                            </label>
                            <label className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 p-5 cursor-pointer hover:border-[#76d6d5]/20 transition-all">
                                {billImagePreview ? (
                                    <img src={billImagePreview} alt="preview" className="w-full h-32 object-cover rounded-xl opacity-80" />
                                ) : (
                                    <>
                                        <ArrowUpTrayIcon className="w-8 h-8 text-white/10" />
                                        <span className="text-xs text-white/20">{uploading ? 'Uploading...' : 'Tap to upload image'}</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        </div>

                        {/* Recipient info */}
                        <div className="rounded-2xl bg-white/5 border border-white/5 p-3">
                            <p className="text-[10px] text-[#e5e2e1]/40 text-center italic">
                                Bill will be sent automatically to {billModal.assignedNGO ? 'the assigned NGO' : 'the user'} who reported the case.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setBillModal(null)} className="flex-1 py-3 rounded-2xl border border-white/10 text-white/30 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">Cancel</button>
                            <button onClick={handleSubmitBill} disabled={billSubmitting || uploading}
                                className={`flex-[2] py-3 rounded-2xl text-[#131313] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 ${editMode ? 'bg-blue-500' : 'bg-amber-500'}`}>
                                {billSubmitting ? 'Sending...' : (editMode ? 'Update Bill' : 'Send Bill')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalCases;
