import { Fragment, useState, useEffect, useRef } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Bars3Icon,
    ChevronDownIcon,
    ArrowRightOnRectangleIcon,
    UserGroupIcon,
    ArrowUturnLeftIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import AdminUserSwitcher from './AdminUserSwitcher';
import {
    BellIcon,
    SunIcon,
    MoonIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

const Navbar = ({ onMenuClick, onNotificationsClick }) => {
    const { user, logout, isImpersonating, stopImpersonating } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMuted, setIsMuted] = useState(localStorage.getItem('isMuted') === 'true');

    useEffect(() => {
        if (user) {
            api.get('/notifications?unreadOnly=true')
                .then(res => setUnreadCount(res.data.unreadCount || 0))
                .catch(err => console.error(err));
            const handleNew = () => setUnreadCount(p => p + 1);
            window.addEventListener('new-notification', handleNew);
            return () => window.removeEventListener('new-notification', handleNew);
        } else {
            setUnreadCount(0);
        }
    }, [user]);

    const handleLogout = () => { logout(); navigate('/login'); };
    const handleBackToAdmin = async () => { await stopImpersonating(); navigate('/admin/dashboard'); };
    const toggleMute = () => {
        const next = !isMuted;
        setIsMuted(next);
        localStorage.setItem('isMuted', next);
        window.dispatchEvent(new Event('mute-change'));
    };

    const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

    return (
        <>
            {/* ── Navbar shell ─────────────────────────────── */}
            <header className="navbar-shell">
                <div className="navbar-inner">

                    {/* Left ─ hamburger + logo */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onMenuClick}
                            className="nb-icon-btn lg:hidden"
                            aria-label="Open sidebar"
                        >
                            <Bars3Icon className="w-[18px] h-[18px]" />
                        </button>

                        {/* Brand logo */}
                        <Link to="/" className="nb-logo-link">
                            <div className="nb-logo-icon">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: '17px', lineHeight: 1 }}>pets</span>
                            </div>
                            <span className="nb-logo-text">VetsCue</span>
                        </Link>
                    </div>

                    {/* Centre spacer */}
                    <div className="flex-1" />

                    {/* Right ─ action row */}
                    <div className="flex items-center gap-1">

                        {/* Impersonating pill */}
                        {isImpersonating && (
                            <div className="nb-warning-pill hidden sm:flex">
                                <span className="nb-pulse-dot bg-amber-400" />
                                <span>Viewing as {user?.impersonating?.name}</span>
                                <button onClick={handleBackToAdmin} className="nb-pill-action">
                                    <ArrowUturnLeftIcon className="w-3 h-3" />
                                    Exit
                                </button>
                            </div>
                        )}

                        {/* Pending approval pill */}
                        {user && !user.isApproved && user.role !== 'user' && user.role !== 'admin' && (
                            <span className="nb-warning-pill hidden sm:flex">
                                <span className="nb-pulse-dot bg-amber-400" />
                                Pending Approval
                            </span>
                        )}

                        {/* Mute */}
                        {(user?.role === 'ngo' || user?.role === 'ambulance') && (
                            <button onClick={toggleMute} className="nb-icon-btn" title={isMuted ? 'Unmute alerts' : 'Mute alerts'}>
                                {isMuted
                                    ? <SpeakerXMarkIcon className="w-[18px] h-[18px] text-red-400" />
                                    : <SpeakerWaveIcon className="w-[18px] h-[18px] text-[var(--brand-primary)]" />
                                }
                            </button>
                        )}

                        {/* Notifications */}
                        <button onClick={onNotificationsClick} className="nb-icon-btn relative" aria-label="Notifications">
                            <BellIcon className="w-[18px] h-[18px]" />
                            {unreadCount > 0 && (
                                <span className="nb-notif-badge">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Admin switch */}
                        {user?.isAdmin && (
                            <button onClick={() => setShowSwitcher(true)} className="nb-chip hidden sm:flex">
                                <UserGroupIcon className="w-3.5 h-3.5" />
                                Switch
                            </button>
                        )}

                        {/* Theme */}
                        <button onClick={toggleTheme} className="nb-icon-btn" aria-label="Toggle theme">
                            {theme === 'dark'
                                ? <SunIcon className="w-[18px] h-[18px]" />
                                : <MoonIcon className="w-[18px] h-[18px]" />
                            }
                        </button>

                        {/* Separator */}
                        <div className="nb-sep" />

                        {/* Profile menu */}
                        <Menu as="div" className="relative">
                            {({ open }) => (
                                <>
                                    <Menu.Button className="nb-profile-trigger group" aria-label="Profile menu">
                                        {/* Avatar */}
                                        <div className="nb-avatar">
                                            <span>{initial}</span>
                                        </div>
                                        {/* Name + role */}
                                        <div className="hidden sm:flex flex-col items-start leading-none min-w-0">
                                            <span className="text-[13px] font-semibold text-[var(--text-main)] truncate max-w-[96px]">{user?.name}</span>
                                            <span className="text-[10px] font-medium text-[var(--text-muted)] capitalize mt-[2px]">
                                                {isImpersonating ? `${user?.role} · admin` : user?.role}
                                            </span>
                                        </div>
                                        {/* Chevron */}
                                        <ChevronDownIcon
                                            className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                                        />
                                    </Menu.Button>

                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-200"
                                        enterFrom="opacity-0 scale-95 translate-y-1"
                                        enterTo="opacity-100 scale-100 translate-y-0"
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100 scale-100 translate-y-0"
                                        leaveTo="opacity-0 scale-95 translate-y-1"
                                    >
                                        <Menu.Items className="nb-dropdown" static>

                                            {/* Profile header */}
                                            <div className="nb-dd-header">
                                                <div className="nb-avatar-lg">{initial}</div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-[var(--text-main)] truncate">{user?.name}</p>
                                                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{user?.email}</p>
                                                    {user?.isAdmin && (
                                                        <span className="nb-role-badge mt-1.5">✦ Admin</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="nb-dd-sep" />

                                            {/* Admin actions */}
                                            {user?.isAdmin && (
                                                <>
                                                    {isImpersonating && (
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button onClick={handleBackToAdmin}
                                                                    className={`nb-dd-item ${active ? 'nb-dd-item--warn' : ''}`}>
                                                                    <ArrowUturnLeftIcon className="nb-dd-icon text-amber-400" />
                                                                    Back to Admin
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    )}
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button onClick={() => setShowSwitcher(true)}
                                                                className={`nb-dd-item ${active ? 'nb-dd-item--active' : ''}`}>
                                                                <UserGroupIcon className="nb-dd-icon text-[var(--brand-primary)]" />
                                                                Switch Account
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                    <div className="nb-dd-sep" />
                                                </>
                                            )}

                                            {/* Role-specific */}
                                            {user?.role === 'user' && (
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link to="/user/payments"
                                                            className={`nb-dd-item ${active ? 'nb-dd-item--active' : ''}`}>
                                                            <CreditCardIcon className="nb-dd-icon text-[var(--brand-primary)]" />
                                                            Payment History
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                            )}

                                            {user?.role === 'ngo' && (
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link to="/ngo/fundraisers"
                                                            className={`nb-dd-item ${active ? 'nb-dd-item--active' : ''}`}>
                                                            <CreditCardIcon className="nb-dd-icon text-[var(--brand-primary)]" />
                                                            Fundraisers
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                            )}

                                            <div className="nb-dd-sep" />

                                            {/* Sign out */}
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button onClick={handleLogout}
                                                        className={`nb-dd-item nb-dd-item--danger ${active ? 'nb-dd-item--danger-active' : ''}`}>
                                                        <ArrowRightOnRectangleIcon className="nb-dd-icon" />
                                                        Sign Out
                                                    </button>
                                                )}
                                            </Menu.Item>

                                        </Menu.Items>
                                    </Transition>
                                </>
                            )}
                        </Menu>
                    </div>
                </div>
            </header>

            {showSwitcher && <AdminUserSwitcher onClose={() => setShowSwitcher(false)} />}
        </>
    );
};

export default Navbar;