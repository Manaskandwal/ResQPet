import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
} from '@heroicons/react/24/outline';

const navConfig = {
    user: [
        { to: '/user/dashboard', label: 'Dashboard', Icon: HomeIcon },
        { to: '/user/submit-rescue', label: 'Report Animal', Icon: PlusCircleIcon },
    ],
    ngo: [
        { to: '/ngo/dashboard', label: 'Dashboard', Icon: HomeIcon },
        { to: '/ngo/dashboard', label: 'Nearby Cases', Icon: MapPinIcon },
    ],
    hospital: [
        { to: '/hospital/dashboard', label: 'Dashboard', Icon: HomeIcon },
        { to: '/hospital/dashboard', label: 'Escalated Cases', Icon: HeartIcon },
    ],
    ambulance: [
        { to: '/ambulance/dashboard', label: 'Dashboard', Icon: HomeIcon },
        { to: '/ambulance/dashboard', label: 'My Assignment', Icon: TruckIcon },
    ],
    admin: [
        { to: '/admin/dashboard', label: 'Dashboard', Icon: HomeIcon },
        { to: '/admin/dashboard', label: 'Analytics', Icon: ClipboardDocumentListIcon },
        { to: '/admin/dashboard', label: 'Approvals', Icon: ShieldCheckIcon },
        { to: '/admin/dashboard', label: 'Users', Icon: UsersIcon },
    ],
};

const roleLabels = {
    user: 'Citizen',
    ngo: 'NGO',
    hospital: 'Hospital',
    ambulance: 'Ambulance',
    admin: 'Admin',
};

const roleIcons = {
    user: HeartIcon,
    ngo: MapPinIcon,
    hospital: BuildingOffice2Icon,
    ambulance: TruckIcon,
    admin: ShieldCheckIcon,
};

const Sidebar = ({ open, onClose }) => {
    const { user } = useAuth();
    const links = navConfig[user?.role] || [];
    const RoleIcon = roleIcons[user?.role] || HomeIcon;

    return (
        <aside
            className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-surface-border z-30
        flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
        >
            {/* Logo */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-surface-border">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[10px] flex items-center justify-center shadow-sm">
                        <span className="text-white text-lg">🐾</span>
                    </div>
                    <div>
                        <p className="text-base font-bold text-slate-800 leading-none">PawSaarthi</p>
                        <p className="text-xs text-surface-muted mt-0.5">Rescue Platform</p>
                    </div>
                </div>
                <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-surface-hover">
                    <XMarkIcon className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            {/* Role badge */}
            <div className="px-4 py-3 mx-3 mt-4 rounded-btn bg-primary-50 border border-primary-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <RoleIcon className="w-4 h-4 text-primary-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary-700 truncate">{user?.name}</p>
                    <p className="text-[11px] text-primary-500">{roleLabels[user?.role]}</p>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-3 mt-4 flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-widest text-surface-muted font-semibold px-3 mb-1">
                    Navigation
                </p>
                {links.map(({ to, label, Icon }) => (
                    <NavLink
                        key={`${to}-${label}`}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
                        end
                    >
                        <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-surface-border">
                <p className="text-[11px] text-surface-muted text-center">
                    PawSaarthi © {new Date().getFullYear()}
                </p>
            </div>
        </aside>
    );
};

export default Sidebar;
