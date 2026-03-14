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
    resolved_on_spot: { label: 'Resolved on Spot', cls: 'badge-completed bg-teal-100 text-teal-700' },
    fundraiser_active: { label: 'Fundraiser Active', cls: 'badge-escalated bg-rose-100 text-rose-700' },
    delivered: { label: 'Delivered', cls: 'badge-completed' },
    completed: { label: 'Completed', cls: 'badge-completed' },
    cancelled: { label: 'Cancelled', cls: 'badge-cancelled' },
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
    ]);

    const isHospitalPath = hospitalPathStatuses.has(status) || rescue.assignedHospital || rescue.assignedAmbulance;
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

    return (
        <div className="mt-4">
            <div className="flex items-center gap-0">
                {steps.map((step, idx) => {
                    const done = idx <= currentIdx;
                    const current = idx === currentIdx;

                    return (
                        <div key={step.key} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                                        w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold
                                        transition-all duration-300 flex-shrink-0
                                        ${done
                                            ? current
                                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110'
                                                : 'bg-primary-100 text-primary-700'
                                            : 'bg-slate-100 text-slate-400'}
                                    `}
                                >
                                    {step.icon}
                                </div>
                                <p className={`text-[9px] mt-1 font-medium text-center max-w-[52px] leading-tight ${done ? 'text-primary-700' : 'text-slate-400'}`}>
                                    {step.label}
                                </p>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${idx < currentIdx ? 'bg-primary-400' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
