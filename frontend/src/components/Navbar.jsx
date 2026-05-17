import { Fragment, useState, useEffect } from 'react';
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
import { BellIcon, SunIcon, MoonIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
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

            const handleNewNotification = () => {
                setUnreadCount(prev => prev + 1);
            };
            window.addEventListener('new-notification', handleNewNotification);
            return () => window.removeEventListener('new-notification', handleNewNotification);
        } else {
            setUnreadCount(0);
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleBackToAdmin = async () => {
        await stopImpersonating();
        navigate('/admin/dashboard');
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        localStorage.setItem('isMuted', newMuted);
        window.dispatchEvent(new Event('mute-change'));
    };

    return (
        <>
            <header className="sticky top-0 z-10 transition-all duration-300 bg-[var(--bg-surface)]/90 backdrop-blur-xl border-b border-[var(--border-surface)]">
                <div className="flex items-center justify-between px-5 md:px-8 h-16">
                    {/* Mobile hamburger */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-btn transition hover:bg-[var(--hover-surface)] text-[var(--text-muted)]"
                        aria-label="Open menu"
                    >
                        <Bars3Icon className="w-5 h-5" />
                    </button>

                    {/* Logo */}
                    <Link to="/" className="flex items-center ml-2 lg:ml-0">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[var(--brand-primary)] text-2xl">pets</span>
                            <p className="text-xl font-headline font-black text-[var(--brand-primary)] tracking-tight">VetsCue</p>
                        </div>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-3 ml-auto">
                        {/* Impersonating banner */}
                        {isImpersonating && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border bg-[var(--hover-bg-overlay)] border-[var(--border-surface)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] animate-pulse" />
                                <span className="text-xs font-semibold text-[var(--color-warning)]">
                                    Viewing as {user?.impersonating?.name}
                                </span>
                                <button
                                    onClick={handleBackToAdmin}
                                    className="ml-1 flex items-center gap-1 text-xs font-bold transition text-[var(--color-warning)] hover:opacity-80"
                                    title="Return to admin view"
                                >
                                    <ArrowUturnLeftIcon className="w-3 h-3" />
                                    Back
                                </button>
                            </div>
                        )}

                        {/* Approval pending banner */}
                        {user && !user.isApproved && user.role !== 'user' && user.role !== 'admin' && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 border text-xs font-semibold rounded-full bg-[var(--hover-bg-overlay)] border-[var(--border-surface)] text-[var(--color-warning)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] animate-pulse-soft" />
                                Pending Approval
                            </span>
                        )}

                        {/* Mute Toggle */}
                        {(user?.role === 'ngo' || user?.role === 'ambulance') && (
                            <button
                                onClick={toggleMute}
                                className="p-2 rounded-full transition-all hover:bg-[var(--hover-surface)] text-[var(--text-muted)]"
                                title={isMuted ? "Unmute alerts" : "Mute alerts"}
                            >
                                {isMuted ? (
                                    <SpeakerXMarkIcon className="w-5 h-5 text-[var(--color-error)]" />
                                ) : (
                                    <SpeakerWaveIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                                )}
                            </button>
                        )}

                        {/* Notification Bell */}
                        <button
                            onClick={onNotificationsClick}
                            className="p-2 rounded-full transition-all relative hover:bg-[var(--hover-surface)] text-[var(--text-muted)]"
                        >
                            <BellIcon className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border animate-pulse bg-[var(--brand-primary)] border-[var(--bg-surface)]"></span>
                            )}
                        </button>

                        {/* Admin account switcher button */}
                        {user?.isAdmin && (
                            <button
                                onClick={() => setShowSwitcher(true)}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all rounded-full border text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/20"
                            >
                                <UserGroupIcon className="w-3.5 h-3.5" />
                                Switch Account
                            </button>
                        )}

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full transition-all hover:bg-[var(--hover-surface)] text-[var(--text-muted)]"
                        >
                            {theme === 'dark' ? (
                                <SunIcon className="w-5 h-5" />
                            ) : (
                                <MoonIcon className="w-5 h-5" />
                            )}
                        </button>

                        {/* Profile dropdown */}
                        <div className="relative flex items-center gap-1">
                            <Menu as="div" className="relative">
                                <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-btn transition-all duration-150 hover:bg-[var(--hover-surface)]">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[var(--border-surface)] text-[var(--text-on-surface)] transition-transform duration-300 hover:scale-105 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)]">
                                        <span className="text-white text-sm font-bold">
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-extrabold leading-none text-[var(--text-main)]">{user?.name}</p>
                                        <p className="text-[10px] uppercase font-black tracking-tight text-[var(--text-muted)]">
                                            {isImpersonating ? `${user?.role} (admin)` : user?.role}
                                        </p>
                                    </div>
                                    <ChevronDownIcon className="w-4 h-4 text-[var(--text-muted)]" />
                                </Menu.Button>

                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-card focus:outline-none z-50 transition-all border bg-[var(--bg-surface)] border-[var(--border-surface)] shadow-[var(--shadow-card-hover)]">
                                        <div className="p-2">
                                            <div className="px-3 py-2 mb-1 border-b border-[var(--border-surface)]">
                                                <p className="text-sm font-semibold truncate text-[var(--text-main)]">{user?.name}</p>
                                                <p className="text-xs truncate text-[var(--text-muted)]">{user?.email}</p>
                                                {user?.isAdmin && (
                                                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-[var(--brand-primary)] bg-[var(--brand-primary)]/10">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>

                                            {/* Admin-only quick actions */}
                                            {user?.isAdmin && (
                                                <div className="py-1 border-b mb-1 border-[var(--border-surface)]">
                                                    {isImpersonating && (
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={handleBackToAdmin}
                                                                    className={`${active ? 'bg-[var(--hover-surface)] text-[var(--color-warning)]' : 'text-[var(--color-warning)]'} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
                                                                >
                                                                    <ArrowUturnLeftIcon className="w-4 h-4" />
                                                                    Back to Admin View
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    )}
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={() => setShowSwitcher(true)}
                                                                className={`${active ? 'bg-[var(--hover-surface)] text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
                                                            >
                                                                <UserGroupIcon className="w-4 h-4" />
                                                                Switch Account
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                </div>
                                            )}

                                            {user?.role === 'user' && (
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/user/payments"
                                                            className={`${active ? 'bg-[var(--hover-surface)] text-[var(--text-main)]' : 'text-[var(--text-muted)]'} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
                                                        >
                                                            <CreditCardIcon className="w-4 h-4" />
                                                            Payment History
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                            )}

                                            {user?.role === 'ngo' && (
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/ngo/fundraisers"
                                                            className={`${active ? 'bg-[var(--hover-surface)] text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
                                                        >
                                                            <CreditCardIcon className="w-4 h-4" />
                                                            Fundraisers
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                            )}

                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={handleLogout}
                                                        className={`${active ? 'bg-[var(--hover-surface)] text-[var(--color-error)]' : 'text-[var(--text-muted)]'} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
                                                    >
                                                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                                        Sign Out
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    </div>
                </div>
            </header>

            {/* Account Switcher Modal */}
            {showSwitcher && <AdminUserSwitcher onClose={() => setShowSwitcher(false)} />}
        </>
    );
};

export default Navbar;