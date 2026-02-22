import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    HomeIcon,
    PlusCircleIcon,
    ClipboardDocumentListIcon,
    MapPinIcon,
    TruckIcon,
    HeartIcon,
    BuildingOffice2Icon,
    UsersIcon,
    ShieldCheckIcon,
    XMarkIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';

const navConfig = {
    user: [
        { to: '/user/dashboard', label: 'Home', Icon: HomeIcon },
        { to: '/user/submit-rescue', label: 'Report Animal', Icon: PlusCircleIcon },
    ],
    ngo: [
        { to: '/ngo/dashboard?tab=overview', label: 'Overview', Icon: HomeIcon },
        { to: '/ngo/dashboard?tab=nearby', label: 'Nearby Cases', Icon: MapPinIcon },
        { to: '/ngo/dashboard?tab=my_cases', label: 'My Cases', Icon: ClipboardDocumentListIcon },
    ],
    hospital: [
        { to: '/hospital/dashboard?tab=overview', label: 'Overview', Icon: HomeIcon },
        { to: '/hospital/dashboard?tab=escalated', label: 'Escalated Cases', Icon: HeartIcon },
    ],
    ambulance: [
        { to: '/ambulance/dashboard?tab=overview', label: 'Overview', Icon: HomeIcon },
        { to: '/ambulance/dashboard?tab=assignments', label: 'My Assignments', Icon: TruckIcon },
    ],
    admin: [
        { to: '/admin/dashboard?tab=overview', label: 'Home', Icon: HomeIcon },
        { to: '/admin/dashboard?tab=approvals', label: 'Approvals', Icon: ShieldCheckIcon },
        { to: '/admin/dashboard?tab=users', label: 'Users', Icon: UsersIcon },
        { to: '/admin/dashboard?tab=rescues', label: 'Rescues', Icon: ClipboardDocumentListIcon },
    ],
};

const comingSoon = [
    { icon: '🚑', label: 'Emergency Ambulance' },
    { icon: '👨‍⚕️', label: 'Consult a Vet' },
    { icon: '🛍️', label: 'Pet Marketplace' },
];

const roleLabels = {
    user: 'Citizen', ngo: 'NGO', hospital: 'Hospital',
    ambulance: 'Ambulance', admin: 'Admin',
};

const roleIcons = {
    user: HeartIcon, ngo: MapPinIcon, hospital: BuildingOffice2Icon,
    ambulance: TruckIcon, admin: ShieldCheckIcon,
};

const Sidebar = ({ open, onClose }) => {
    const { user } = useAuth();
    const links = navConfig[user?.role] || [];
    const RoleIcon = roleIcons[user?.role] || HomeIcon;

    const handleComingSoon = (label) => {
        toast(`${label} is coming in Phase 2! 🚀`, { icon: '⏳' });
    };

    return (
        <aside
            className={`
                fixed top-0 left-0 h-full w-60 bg-white border-r border-surface-border z-30
                flex flex-col transition-transform duration-300 overflow-x-hidden
                ${open ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            {/* Logo */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-surface-border">
                <img src="/logo.svg" alt="PawSaarthi" className="h-8" />
                <button onClick={onClose} className="lg:hidden p-1.5 rounded hover:bg-surface-hover">
                    <XMarkIcon className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            {/* Role badge */}
            <div className="px-3 py-2.5 mx-3 mt-3 rounded-btn bg-primary-50 border border-primary-100 flex items-center gap-2">
                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <RoleIcon className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary-700 truncate leading-tight">{user?.name}</p>
                    <p className="text-[10px] text-primary-500 leading-tight">{roleLabels[user?.role]}</p>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-2 mt-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
                <p className="text-[10px] uppercase tracking-widest text-surface-muted font-semibold px-2 mb-1">
                    Menu
                </p>
                {links.map(({ to, label, Icon }) => (
                    <NavLink
                        key={`${to}-${label}`}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
                        end
                    >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{label}</span>
                    </NavLink>
                ))}

                {/* ── Coming Soon ─────────────────────────────────── */}
                <div className="mt-3">
                    <div className="flex items-center gap-2 px-2 mb-1">
                        <p className="text-[10px] uppercase tracking-widest text-surface-muted font-semibold">
                            Coming Soon
                        </p>
                        <span className="px-1.5 py-0.5 bg-violet-50 border border-violet-200 rounded-full text-[9px] text-violet-600 font-bold uppercase">
                            Phase 2
                        </span>
                    </div>
                    {comingSoon.map(({ icon, label }) => (
                        <button
                            key={label}
                            onClick={() => handleComingSoon(label)}
                            className="nav-link w-full text-left opacity-50 group"
                        >
                            <span className="text-sm leading-none flex-shrink-0">{icon}</span>
                            <span className="truncate text-slate-400">{label}</span>
                            <LockClosedIcon className="w-3 h-3 text-slate-300 ml-auto flex-shrink-0" />
                        </button>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div className="px-3 py-3 border-t border-surface-border">
                <p className="text-[10px] text-surface-muted text-center">
                    PawSaarthi © {new Date().getFullYear()} · Phase 1
                </p>
            </div>
        </aside>
    );
};

export default Sidebar;
