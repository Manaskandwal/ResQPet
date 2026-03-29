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
    ],
    hospital: [
        { to: '/hospital/dashboard?tab=overview', label: 'Overview', Icon: HomeIcon },
        { to: '/hospital/dashboard?tab=escalated', label: 'Escalated Cases', Icon: HeartIcon },
        { to: '/hospital/fleet', label: 'Fleet', Icon: TruckIcon },
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
    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';
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
                ${isNewUI ? 'bg-surface border-r border-surface-border' : 'bg-surface border-r border-surface-border'}
                ${open ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            <div className={`flex items-center justify-between px-4 py-4 border-b ${isNewUI ? 'border-surface-border' : 'border-surface-border'}`}>
                {isNewUI ? (
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">pets</span>
                        <span className="text-lg font-black text-primary tracking-tighter font-headline leading-none">VetsCue</span>
                    </div>
                ) : (
                    <img src="/logo.svg" alt="VetsCue" className="h-8" />
                )}
                <button onClick={onClose} className={`lg:hidden p-1.5 rounded transition ${isNewUI ? 'hover:bg-surface-hover text-on-background/40' : 'hover:bg-surface-hover text-slate-500'}`}>
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>

            <div className={`px-3 py-2.5 mx-3 mt-3 rounded-btn border flex items-center gap-2 transition-all ${
                isNewUI 
                ? 'bg-surface border-surface-border' 
                : 'bg-primary-50 border-primary-100'
            }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isNewUI ? 'bg-primary/10' : 'bg-primary-100'
                }`}>
                    <RoleIcon className={`w-3.5 h-3.5 ${isNewUI ? 'text-primary' : 'text-primary-600'}`} />
                </div>
                <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate leading-tight ${isNewUI ? 'text-on-background' : 'text-primary-700'}`}>{user?.name}</p>
                    <p className={`text-[10px] leading-tight ${isNewUI ? 'text-on-background/50' : 'text-primary-500'}`}>{roleLabels[user?.role]}</p>
                </div>
            </div>

            <nav className="flex-1 px-2 mt-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <p className={`text-[11px] uppercase tracking-widest font-bold px-5 mb-1 ${isNewUI ? 'text-primary' : 'text-surface-muted'}`}>
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
                            const base = "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap overflow-hidden w-full text-left active:scale-[0.98] active:bg-surface-hover";
                            // For links with query params, check both path and query
                            const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
                            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
                            const active = toQuery
                                ? currentPath === toPath && currentSearch.includes(toQuery.split('=')[1])
                                : (isNotification ? false : isActive);
                            if (isNewUI) {
                                return active 
                                    ? `${base} bg-primary-600 text-white shadow-[0_10px_20px_rgba(var(--brand-primary-rgb),0.3)]` 
                                    : `${base} text-on-background/60 hover:bg-surface-hover hover:text-on-background`;
                            }
                            return active ? 'nav-link-active flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold' : 'nav-link flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold';
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
                            <p className={`text-[11px] uppercase tracking-widest font-bold ${isNewUI ? 'text-primary' : 'text-surface-muted'}`}>
                                Coming Soon
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                isNewUI ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary-50 border border-primary-100 text-primary-700'
                            }`}>
                                Phase 2
                            </span>
                        </div>
                        {comingSoon.map(({ tag, label }) => (
                            <button
                                key={label}
                                onClick={() => handleComingSoon(label)}
                                className={`w-full text-left opacity-60 group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                                    isNewUI ? 'text-on-background/60 hover:bg-surface-hover hover:text-on-background' : 'nav-link'
                                }`}
                            >
                                <span className={`text-[10px] leading-none flex-shrink-0 font-bold uppercase tracking-wider text-surface-muted`}>
                                    {tag}
                                </span>
                                <span className="truncate text-slate-400">{label}</span>
                                <LockClosedIcon className="w-3 h-3 text-slate-300 ml-auto flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </nav>

            <div className={`px-4 py-4 border-t flex items-center justify-between ${isNewUI ? 'border-surface-border' : 'border-surface-border'}`}>
                <div className="flex flex-col">
                    <p className={`text-[9px] uppercase tracking-widest font-black ${isNewUI ? 'text-on-background/20' : 'text-slate-400'}`}>
                        VetsCue Platform
                    </p>
                    <p className={`text-[10px] ${isNewUI ? 'text-on-background/40 font-medium' : 'text-slate-500'}`}>
                        © {new Date().getFullYear()} · Core v1
                    </p>
                </div>

            </div>
        </aside>
    );
};

export default Sidebar;
