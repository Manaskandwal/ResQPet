import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { StatusBadge } from '../../components/StatusComponents';
import { SkeletonCard } from '../../components/Skeleton';
import { formatIndianDateTime } from '../../utils/dateTime';

const Fundraisers = () => {
    const { user } = useAuth();
    const [eligibleCases, setEligibleCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        requestedGoal: '',
        billText: '',
        media: null
    });

    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

    const fetchCases = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/ngo/my-cases');
            const allCases = res.data.cases || [];
            // Filter to only cases that are eligible for fundraiser and not already one
            const filtered = allCases.filter(c => 
                ['completed', 'treating', 'reached', 'resolved_on_spot', 'hospital_broadcasted'].includes(c.status)
            );
            setEligibleCases(filtered);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch cases.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user.isApproved) fetchCases();
    }, [fetchCases, user.isApproved]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCase) return;
        if (!formData.media) {
            toast.error('Please attach the bill estimate image.');
            return;
        }

        setFormLoading(true);
        try {
            const data = new FormData();
            data.append('requestedGoal', formData.requestedGoal);
            data.append('billText', formData.billText);
            data.append('media', formData.media);

            await api.post(`/ngo/rescue/${selectedCase._id}/fundraiser`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Fundraiser request submitted for verification.');
            setSelectedCase(null);
            setFormData({ requestedGoal: '', billText: '', media: null });
            fetchCases();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request fundraiser.');
        } finally {
            setFormLoading(false);
        }
    };

    if (!user.isApproved) {
        return (
            <div className={`min-h-[70vh] flex flex-col items-center justify-center p-8 text-center ${isNewUI ? 'resqpet-obsidian-theme animate-fade-in' : ''}`}>
                <h2 className={`font-bold ${isNewUI ? 'font-headline text-3xl tracking-tight text-[#e5e2e1]' : 'text-2xl text-slate-800'}`}>Awaiting Authorization</h2>
            </div>
        );
    }

    if (!isNewUI) {
        return (
            <div className="mx-auto max-w-4xl space-y-8 p-6">
                <h1 className="text-2xl font-bold text-slate-800">Start a Fundraiser</h1>
                <p className="text-surface-muted">Select an eligible case to request funds. Requires Admin approval.</p>
                {/* Fallback to original UI text/styles if needed */}
                <div className="space-y-4">
                    {loading ? (
                        <p>Loading...</p>
                    ) : eligibleCases.length === 0 ? (
                        <p>No eligible cases. Cases must be at least reached or hospital_broadcasted.</p>
                    ) : (
                        eligibleCases.map(c => (
                            <div key={c._id} className="card p-4 border border-slate-200 shadow-sm flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">{c.description}</h3>
                                    <p className="text-xs text-slate-500">Status: {c.status}</p>
                                    <p className="text-xs mt-1">Fundraiser: {c.fundraiser?.status || 'none'}</p>
                                </div>
                                <button 
                                    className="btn-primary"
                                    onClick={() => setSelectedCase(c)}
                                    disabled={c.fundraiser && c.fundraiser.status !== 'none'}
                                >
                                    {c.fundraiser && c.fundraiser.status !== 'none' ? 'Requested' : 'Start'}
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {selectedCase && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                         <div className="w-full max-w-md bg-white p-6 rounded-card">
                             <h3 className="font-bold text-lg mb-4">Request Fundraiser</h3>
                             <form onSubmit={handleSubmit} className="space-y-4">
                                 <div><label className="label">Requested Amount (₹)</label><input type="number" required min="100" value={formData.requestedGoal} onChange={e => setFormData(c => ({...c, requestedGoal: e.target.value}))} className="input" /></div>
                                 <div><label className="label">Bill/Treatment Estimate Details</label><textarea required value={formData.billText} onChange={e => setFormData(c => ({...c, billText: e.target.value}))} className="textarea" /></div>
                                 <div><label className="label">Upload Proof (Bill/Estimate Image)</label><input type="file" required accept="image/*" onChange={e => setFormData(c => ({...c, media: e.target.files[0]}))} className="input p-2" /></div>
                                 <div className="flex gap-2">
                                     <button type="button" onClick={() => setSelectedCase(null)} className="btn-ghost flex-1">Cancel</button>
                                     <button type="submit" disabled={formLoading} className="btn-primary flex-1">{formLoading ? 'Submitting...' : 'Submit Request'}</button>
                                 </div>
                             </form>
                         </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-12 pb-20">
            {/* Header */}
            <section>
                 <div className="space-y-2">
                     <span className="text-[#fd8b00] text-[10px] font-black uppercase tracking-[0.3em]">Financial Ops</span>
                     <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">Case <span className="text-[#fd8b00]">Fundraisers</span></h1>
                     <p className="text-[#e5e2e1]/50 max-w-md">Raise funds from the community to cover medical bills and treatment costs. Requires admin verification.</p>
                 </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-8">
                {/* Eligible Cases List */}
                <div className="space-y-6">
                    <h3 className="font-headline font-bold text-xl uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#fd8b00]">clinical_notes</span>
                        Eligible Cases
                    </h3>
                    
                    <div className="space-y-4">
                        {loading ? (
                            [1, 2].map(i => <SkeletonCard key={i} />)
                        ) : eligibleCases.length === 0 ? (
                            <div className="py-16 glass-card rounded-[2.5rem] border border-dashed border-white/5 text-center space-y-4">
                                <span className="material-symbols-outlined text-4xl text-white/10">verified</span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No Eligible Cases Available</p>
                            </div>
                        ) : eligibleCases.map(c => {
                            const isRequested = c.fundraiser && c.fundraiser.status !== 'none';
                            const isSelected = selectedCase?._id === c._id;
                            
                            return (
                                <div 
                                    key={c._id} 
                                    onClick={() => !isRequested && setSelectedCase(c)}
                                    className={`glass-card rounded-[2rem] p-6 border transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'border-[#fd8b00] bg-[#fd8b00]/10 shadow-[0_0_30px_rgba(253,139,0,0.1)]' 
                                            : isRequested 
                                                ? 'border-white/5 bg-[#1c1b1b] opacity-60 cursor-not-allowed' 
                                                : 'border-white/5 bg-[#1c1b1b] hover:border-[#fd8b00]/30 hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">ID: {c._id.slice(-6).toUpperCase()}</span>
                                                <StatusBadge status={c.status} />
                                            </div>
                                            <h4 className="font-bold text-lg leading-tight">{c.description}</h4>
                                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest pt-2">
                                                <span className={`${isRequested ? 'text-[#76d6d4]' : 'text-white/30'}`}>
                                                    <span className="material-symbols-outlined text-sm align-middle mr-1.5">payments</span>
                                                    {isRequested ? `Fundraiser: ${c.fundraiser.status}` : 'Not Funded'}
                                                </span>
                                            </div>
                                        </div>
                                        {c.images?.[0] && (
                                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                                                <img src={c.images[0]} alt="Case" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Request Form Panel */}
                <div className="space-y-6">
                    <h3 className="font-headline font-bold text-xl uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#76d6d4]">edit_document</span>
                        Request Details
                    </h3>
                    
                    <div className="glass-card rounded-[2.5rem] bg-[#1c1b1b] border border-white/5 p-8 relative overflow-hidden">
                        {!selectedCase ? (
                            <div className="absolute inset-0 z-10 bg-[#1c1b1b]/80 backdrop-blur-sm flex items-center justify-center p-8 text-center">
                                <div className="space-y-4">
                                    <span className="material-symbols-outlined text-4xl text-white/10">swipe_left</span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Select a case to initiate request</p>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#fd8b00]/5 to-transparent pointer-events-none" />
                        )}
                        
                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10 w-full">
                            {selectedCase && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-8">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#fd8b00] mb-1">Target Case</p>
                                    <p className="font-bold text-sm truncate">{selectedCase.description}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Required Amount (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">₹</span>
                                    <input 
                                        type="number" 
                                        required min="100" 
                                        value={formData.requestedGoal} 
                                        onChange={e => setFormData(c => ({...c, requestedGoal: e.target.value}))} 
                                        className="w-full rounded-2xl bg-[#131313] border border-white/10 pl-10 pr-4 py-4 text-lg font-bold text-[#e5e2e1] outline-none focus:border-[#fd8b00]/50 transition-all appearance-none" 
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Treatment & Bill Justification</label>
                                <textarea 
                                    required 
                                    value={formData.billText} 
                                    onChange={e => setFormData(c => ({...c, billText: e.target.value}))} 
                                    className="w-full h-32 rounded-2xl bg-[#131313] border border-white/10 p-4 text-sm text-[#e5e2e1] outline-none focus:border-[#fd8b00]/50 transition-all resize-none" 
                                    placeholder="Explain the medical procedures and why these funds are necessary..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#e5e2e1]/30">Upload Evidence (Bill/Estimate Image)</label>
                                <div className="relative w-full">
                                    <input 
                                        type="file" 
                                        id="bill-upload" 
                                        required 
                                        accept="image/*" 
                                        onChange={e => setFormData(c => ({...c, media: e.target.files[0]}))} 
                                        className="hidden" 
                                    />
                                    <label 
                                        htmlFor="bill-upload" 
                                        className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#fd8b00]/30 hover:bg-white/5 transition-all cursor-pointer group"
                                    >
                                        <span className={`material-symbols-outlined text-3xl mb-2 transition-colors ${formData.media ? 'text-[#76d6d4]' : 'text-white/20 group-hover:text-[#fd8b00]'}`}>
                                            {formData.media ? 'task_alt' : 'receipt_long'}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                            {formData.media ? formData.media.name : 'Tap to select bill image'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <button 
                                    type="submit" 
                                    disabled={formLoading || !selectedCase} 
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#fd8b00] to-[#ffb77d] text-[#131313] text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(253,139,0,0.2)] hover:shadow-[0_0_30px_rgba(253,139,0,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none disabled:grayscale"
                                >
                                    {formLoading ? 'Transmitting Request...' : 'Submit Fundraiser Workflow'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Fundraisers;
