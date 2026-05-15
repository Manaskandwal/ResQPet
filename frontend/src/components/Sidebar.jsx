import { NavLink, useLocation } from 'react-router-dom';
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
    BellIcon,
    MoonIcon,
    SunIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

const navConfig = {
    user: [
        { to: '/user/dashboard', label: 'Home', Icon: HomeIcon },
        { to: '/user/submit-rescue', label: 'Report Animal', Icon: PlusCircleIcon },
        { to: '/user/reports', label: 'My Reports', Icon: ClipboardDocumentListIcon },
        { to: '/fundraisers', label: 'Fundraisers', Icon: HeartIcon },
        { to: '/impact', label: 'Impact', Icon: ClipboardDocumentListIcon },
    ],
    ngo: [
        { to: '/ngo/dashboard?tab=overview', label: 'Overview', Icon: HomeIcon },
        { to: '/ngo/dashboard?tab=nearby', label: 'Nearby Cases', Icon: MapPinIcon },
        { to: '/ngo/dashboard?tab=my_cases', label: 'My Cases', Icon: ClipboardDocumentListIcon },
        { to: '/fundraisers', label: 'Fundraisers', Icon: HeartIcon },
    ],
    hospital: [
        { to: '/hospital/dashboard', label: 'Dashboard', Icon: HomeIcon },
        { to: '/hospital/cases', label: 'My Cases', Icon: ClipboardDocumentListIcon },
        { to: '/hospital/fleet', label: 'Fleet', Icon: TruckIcon },
        { to: '/hospital/history', label: 'History', Icon: HeartIcon },
    ],
    ambulance: [
        { to: '/ambulance/dashboard', label: 'Dashboard', Icon: HomeIcon },
        { to: '/ambulance/history', label: 'My History', Icon: ClipboardDocumentListIcon },
    ],
    admin: [
        { to: '/admin/dashboard?tab=overview', label: 'Home', Icon: HomeIcon },
        { to: '/admin/dashboard?tab=approvals', label: 'Approvals', Icon: ShieldCheckIcon },
        { to: '/admin/dashboard?tab=finances', label: 'Finances', Icon: BanknotesIcon },
        { to: '/admin/dashboard?tab=users', label: 'Users', Icon: UsersIcon },
        { to: '/admin/dashboard?tab=rescues', label: 'Rescues', Icon: ClipboardDocumentListIcon },
    ],
};


const comingSoon = [
    { tag: 'EMS', label: 'Emergency Ambulance' },
    { tag: 'Vet', label: 'Consult a Vet' },
    { tag: 'Shop', label: 'Pet Marketplace' },
];

const phaseTwoRoles = new Set(['admin', 'user', 'hospital']);

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

const Sidebar = ({ open, onClose, onNotificationsClick }) => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const links = navConfig[user?.role] || [];
    const RoleIcon = roleIcons[user?.role] || HomeIcon;
    const showComingSoon = phaseTwoRoles.has(user?.role);

    const handleComingSoon = (label) => {
        toast(`${label} is coming in Phase 2!`, { icon: '⏳' });
    };

    return (
        <aside
            className={`
                fixed top-0 left-0 h-full w-60 z-30
                flex flex-col transition-transform duration-300 overflow-x-hidden
                bg-[var(--bg-surface)] border-r border-[var(--border-surface)]
                ${open ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-surface)]">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--brand-primary)] text-xl">pets</span>
                    <span className="text-lg font-black text-[var(--brand-primary)] tracking-tighter font-headline leading-none">VetsCue</span>
                </div>
                <button onClick={onClose} className="lg:hidden p-1.5 rounded transition hover:bg-[var(--hover-surface)] text-[var(--text-muted)]">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="px-3 py-2.5 mx-3 mt-3 rounded-btn border flex items-center gap-2 bg-[var(--bg-surface)] border-[var(--border-surface)]">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--brand-primary)]/10">
                    <RoleIcon className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight text-[var(--text-main)]">{user?.name}</p>
                    <p className="text-[10px] leading-tight text-[var(--text-muted)]">{roleLabels[user?.role]}</p>
                </div>
            </div>

            <nav className="flex-1 px-2 mt-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <p className="text-[11px] uppercase tracking-widest font-bold px-5 mb-1 text-[var(--brand-primary)]">
                    Menu
                </p>
                {links.map(({ to, label, Icon }) => {
                    const toPath = to.split('?')[0];
                    const toQuery = to.includes('?') ? to.split('?')[1] : null;
                    const isNotification = to.includes('notifications');
                    const Component = isNotification ? 'button' : NavLink;
                    const props = isNotification
                        ? { onClick: (e) => { e.preventDefault(); onNotificationsClick(); onClose(); }, type: 'button' }
                        : {
                            to,
                            onClick: (e) => {
                                if (location.pathname === toPath) {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                                onClose();
                            }
                        };

                    return (
                    <Component
                        key={`${to}-${label}`}
                        {...props}
                        className={(navProps) => {
                            const isActive = navProps?.isActive || false;
                            const base = "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap overflow-hidden w-full text-left active:scale-[0.98] active:bg-[var(--bg-surface-hover)]";
                            const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
                            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
                            const active = toQuery
                                ? currentPath === toPath && currentSearch.includes(toQuery.split('=')[1])
                                : (isNotification ? false : isActive);
                            return active
                                ? `${base} bg-[var(--brand-primary)] text-white shadow-[0_10px_20px_rgba(var(--brand-primary-rgb),0.3)]`
                                : `${base} text-[var(--text-muted)] hover:bg-[var(--hover-surface)] hover:text-[var(--text-main)]`;
                        }}
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate tracking-tight">{label}</span>
                    </Component>
                    );
                })}


                {showComingSoon && (
                    <div className="mt-3">
                        <div className="flex items-center gap-2 px-2 mb-1">
                            <p className="text-[11px] uppercase tracking-widest font-bold text-[var(--brand-primary)]">
                                Coming Soon
                            </p>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
                                Phase 2
                            </span>
                        </div>
                        {comingSoon.map(({ tag, label }) => (
                            <button
                                key={label}
                                onClick={() => handleComingSoon(label)}
                                className="w-full text-left opacity-60 group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-[var(--text-muted)] hover:bg-[var(--hover-surface)] hover:text-[var(--text-main)]"
                            >
                                <span className="text-[10px] leading-none flex-shrink-0 font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                    {tag}
                                </span>
                                <span className="truncate text-[var(--text-muted)]">{label}</span>
                                <LockClosedIcon className="w-3 h-3 text-[var(--text-muted)] ml-auto flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </nav>

            <div className="px-4 py-4 border-t flex items-center justify-between border-[var(--border-surface)]">
                <div className="flex flex-col">
                    <p className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                        VetsCue Platform
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                        © {new Date().getFullYear()} · Core v1
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;