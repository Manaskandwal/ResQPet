/**
 * StatusBadge - maps rescue request status to appropriate badge styling
 */
const statusMap = {
    pending: { label: 'Pending', cls: 'badge-pending' },
    accepted: { label: 'Accepted', cls: 'badge-accepted bg-green-100 text-green-700' },
    scheduled: { label: 'Scheduled', cls: 'badge-accepted bg-blue-100 text-blue-700' },
    on_the_way: { label: 'On The Way', cls: 'badge-accepted bg-indigo-100 text-indigo-700' },
    reached: { label: 'Reached', cls: 'badge-accepted bg-teal-100 text-teal-700' },
    treating: { label: 'Treating', cls: 'badge-accepted bg-emerald-100 text-emerald-700' },
    ngo_accepted: { label: 'NGO Accepted', cls: 'badge-accepted' },
    hospital_broadcasted: { label: 'Pinging Hospitals', cls: 'badge-escalated bg-amber-100 text-amber-700' },
    hospital_accepted: { label: 'Hospital Accepted', cls: 'badge-escalated bg-indigo-100 text-indigo-700' },
    ambulance_pinged: { label: 'Pinging Drivers', cls: 'badge-escalated bg-purple-100 text-purple-700' },
    ambulance_assigned: { label: 'Driver Assigned', cls: 'badge-assigned' },
    en_route: { label: 'En Route', cls: 'badge-enroute' },
    enroute: { label: 'En Route', cls: 'badge-enroute' },
    picked_up: { label: 'Picked Up', cls: 'badge-pickedup' },
    resolved_on_spot: { label: 'On-Spot Treated', cls: 'badge-completed bg-teal-100 text-teal-700' },
    fundraiser_active: { label: 'Fundraiser Active', cls: 'badge-escalated bg-rose-100 text-rose-700' },
    delivered: { label: 'Delivered', cls: 'badge-completed' },
    completed: { label: 'Completed', cls: 'badge-completed' },
    closed_unresolved: { label: 'Closed Unresolved', cls: 'badge-cancelled bg-slate-200 text-slate-700' },
    cancelled: { label: 'Cancelled', cls: 'badge-cancelled' },
    manual_transport_accepted: { label: 'Manual Transport', cls: 'badge-escalated bg-orange-100 text-orange-700' },
    ready_for_return: { label: 'Ready for Return', cls: 'badge-completed bg-indigo-100 text-indigo-700' },
};

export const StatusBadge = ({ status }) => {
    const { label, cls } = statusMap[status] || { label: status, cls: 'badge bg-slate-100 text-slate-600' };
    return <span className={cls}>{label}</span>;
};

const timelineDefinitions = {
    ngo: {
        steps: [
            { key: 'pending', label: 'Reported', icon: 'R' },
            { key: 'accepted', label: 'NGO Accepted', icon: 'N' },
            { key: 'on_the_way', label: 'On The Way', icon: 'W' },
            { key: 'reached', label: 'Reached', icon: 'L' },
            { key: 'treating', label: 'Treatment', icon: 'T' },
            { key: 'resolved_on_spot', label: 'Recovered', icon: 'S' },
        ],
        aliases: {
            pending: 'pending',
            accepted: 'accepted',
            scheduled: 'accepted',
            ngo_accepted: 'accepted',
            on_the_way: 'on_the_way',
            reached: 'reached',
            treating: 'treating',
            resolved_on_spot: 'resolved_on_spot',
            completed: 'resolved_on_spot',
        },
    },
    hospital: {
        steps: [
            { key: 'pending', label: 'Reported', icon: 'R' },
            { key: 'accepted', label: 'NGO Accepted', icon: 'N' },
            { key: 'hospital_broadcasted', label: 'Hospital Help', icon: 'H' },
            { key: 'ambulance_pinged', label: 'Dispatch', icon: 'D' },
            { key: 'ambulance_assigned', label: 'Driver', icon: 'A' },
            { key: 'en_route', label: 'En Route', icon: 'E' },
            { key: 'picked_up', label: 'Picked Up', icon: 'P' },
            { key: 'completed', label: 'Safe', icon: 'S' },
        ],
        aliases: {
            pending: 'pending',
            accepted: 'accepted',
            scheduled: 'accepted',
            ngo_accepted: 'accepted',
            on_the_way: 'accepted',
            reached: 'accepted',
            treating: 'accepted',
            hospital_escalated: 'hospital_broadcasted',
            hospital_broadcasted: 'hospital_broadcasted',
            hospital_accepted: 'hospital_broadcasted',
            fundraiser_active: 'hospital_broadcasted',
            ambulance_pinged: 'ambulance_pinged',
            ambulance_assigned: 'ambulance_assigned',
            en_route: 'en_route',
            enroute: 'en_route',
            picked_up: 'picked_up',
            delivered: 'completed',
            completed: 'completed',
            manual_transport_accepted: 'ambulance_pinged', // Show it at the dispatch step
        },
    },
};

const getTimelineConfig = (rescueOrStatus) => {
    const rescue = typeof rescueOrStatus === 'string'
        ? { status: rescueOrStatus }
        : (rescueOrStatus || {});

    const status = rescue.status;
    const hospitalPathStatuses = new Set([
        'hospital_escalated',
        'hospital_broadcasted',
        'hospital_accepted',
        'ambulance_pinged',
        'ambulance_assigned',
        'en_route',
        'enroute',
        'picked_up',
        'delivered',
        'completed',
        'fundraiser_active',
        'manual_transport_accepted',
    ]);

    const isOnSpotCompletion = status === 'completed' && rescue.outcome === 'on_spot_treated' && !rescue.assignedHospital && !rescue.assignedAmbulance;
    const isHospitalPath = !isOnSpotCompletion && (hospitalPathStatuses.has(status) || rescue.assignedHospital || rescue.assignedAmbulance);
    const definition = isHospitalPath ? timelineDefinitions.hospital : timelineDefinitions.ngo;
    const effectiveStatus = definition.aliases[status] || status;
    const currentIdx = definition.steps.findIndex((step) => step.key === effectiveStatus);

    return {
        steps: definition.steps,
        currentIdx: currentIdx === -1 ? 0 : currentIdx,
    };
};

export const StatusTimeline = ({ status, rescue }) => {
    const { steps, currentIdx } = getTimelineConfig(rescue || status);
    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

    return (
        <div className="mt-4 w-full overflow-hidden">
            <div className="flex items-start gap-0 overflow-x-auto pb-6 pt-2 no-scrollbar scroll-smooth flex-nowrap px-1">
                {steps.map((step, idx) => {
                    const done = idx <= currentIdx;
                    const current = idx === currentIdx;

                    return (
                        <div key={step.key} className="flex items-center min-w-[85px] shrink-0">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                                        w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black
                                        transition-all duration-300 flex-shrink-0 border
                                        ${done
                                            ? current
                                                ? isNewUI 
                                                    ? 'bg-[#76d6d4] border-[#76d6d4] text-[#131313] shadow-[0_0_20px_rgba(118,214,213,0.3)] scale-110'
                                                    : 'bg-primary-600 border-primary-600 text-white shadow-lg scale-110'
                                                : isNewUI
                                                    ? 'bg-[#76d6d4]/10 border-[#76d6d4]/20 text-[#76d6d4]'
                                                    : 'bg-primary-50 border-primary-100 text-primary-700'
                                            : isNewUI
                                                ? 'bg-white/5 border-white/5 text-white/20'
                                                : 'bg-slate-50 border-slate-100 text-slate-300'}
                                    `}
                                >
                                    {step.icon}
                                </div>
                                <p className={`text-[8px] mt-2 font-black uppercase tracking-widest text-center max-w-[70px] leading-tight transition-colors ${
                                    done 
                                        ? (isNewUI ? 'text-[#e5e2e1]' : 'text-slate-700') 
                                        : (isNewUI ? 'text-white/20' : 'text-slate-400')
                                }`}>
                                    {step.label}
                                </p>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`h-[1px] w-8 mx-1 rounded-full transition-all duration-500 mt-5 shrink-0 ${
                                    idx < currentIdx 
                                        ? (isNewUI ? 'bg-[#76d6d4]/40' : 'bg-primary-300') 
                                        : (isNewUI ? 'bg-white/5' : 'bg-slate-100')
                                }`} />
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Scroll hint for mobile */}
            <div className="md:hidden flex justify-center mt-[-10px] pb-4">
                 <div className="w-8 h-1 bg-slate-200/30 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isNewUI ? 'bg-[#76d6d4]/20' : 'bg-primary-500/20'}`} style={{ width: `${((currentIdx + 1) / steps.length) * 100}%` }} />
                 </div>
            </div>
        </div>
    );
};
