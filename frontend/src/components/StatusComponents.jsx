/**
 * StatusBadge - maps rescue request status to appropriate badge styling
 */
const statusMap = {
    pending: { label: 'Pending', cls: 'badge-pending' },
    ngo_accepted: { label: 'NGO Accepted', cls: 'badge-accepted' },
    hospital_broadcasted: { label: 'Pinging Hospitals', cls: 'badge-escalated bg-amber-100 text-amber-700' },
    hospital_accepted: { label: 'Hospital Accepted', cls: 'badge-escalated bg-indigo-100 text-indigo-700' },
    ambulance_pinged: { label: 'Pinging Drivers', cls: 'badge-escalated bg-purple-100 text-purple-700' },
    ambulance_assigned: { label: 'Driver Assigned', cls: 'badge-assigned' },
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

/**
 * StatusTimeline - visual stepper for rescue request progress
 */
const steps = [
    { key: 'pending', label: 'Reported', emoji: '📍' },
    { key: 'ngo_accepted', label: 'NGO', emoji: '🤝' },
    { key: 'hospital_broadcasted', label: 'Hospital', emoji: '🏥' },
    { key: 'ambulance_pinged', label: 'Dispatch', emoji: '📡' },
    { key: 'ambulance_assigned', label: 'Driver Assigned', emoji: '🚑' },
    { key: 'enroute', label: 'En Route', emoji: '🛣️' },
    { key: 'picked_up', label: 'Picked Up', emoji: '🐾' },
    { key: 'completed', label: 'Safe!', emoji: '✅' },
];

const statusOrder = steps.map((s) => s.key);

export const StatusTimeline = ({ status }) => {
    const currentIdx = statusOrder.indexOf(status);

    return (
        <div className="mt-4">
            <div className="flex items-center gap-0">
                {steps.map((step, idx) => {
                    // For UI simplicity, map some intermediate states to a single visual step
                    let effectiveStatus = status;
                    if (status === 'hospital_accepted') effectiveStatus = 'hospital_broadcasted';
                    if (status === 'fundraiser_active') effectiveStatus = 'hospital_broadcasted';
                    if (status === 'resolved_on_spot') effectiveStatus = 'completed';
                    if (status === 'delivered') effectiveStatus = 'completed';

                    const currentIdx = statusOrder.indexOf(effectiveStatus);
                    const done = idx <= currentIdx;
                    const current = idx === currentIdx;
                    return (
                        <div key={step.key} className="flex items-center flex-1 last:flex-none">
                            {/* Step dot */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-base
                    transition-all duration-300 flex-shrink-0
                    ${done
                                            ? current
                                                ? 'bg-primary-600 shadow-lg shadow-primary-200 scale-110'
                                                : 'bg-primary-100'
                                            : 'bg-slate-100'
                                        }
                  `}
                                >
                                    {step.emoji}
                                </div>
                                <p className={`text-[9px] mt-1 font-medium text-center max-w-[50px] leading-tight
                  ${done ? 'text-primary-700' : 'text-slate-400'}`}>
                                    {step.label}
                                </p>
                            </div>
                            {/* Connector line */}
                            {idx < steps.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500
                  ${idx < currentIdx ? 'bg-primary-400' : 'bg-slate-200'}`}
                                />
                            )}
                        </div>
                    );
                })
                }
            </div>
        </div>
    );
};
