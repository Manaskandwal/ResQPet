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
import { BellIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';

const Navbar = ({ onMenuClick }) => {
    const { user, logout, isImpersonating, stopImpersonating } = useAuth();
    const navigate = useNavigate();
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

    useEffect(() => {
        if (user) {
            api.get('/notifications?unreadOnly=true')
                .then(res => setUnreadCount(res.data.unreadCount || 0))
                .catch(err => console.error(err));
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

    return (
        <>
            <header className={`sticky top-0 z-10 transition-all duration-300 ${
                isNewUI 
                ? 'bg-[#131313]/70 backdrop-blur-xl border-b border-white/5' 
                : 'bg-white border-b border-surface-border'
            }`}>
                <div className="flex items-center justify-between px-5 md:px-8 h-16">
                    {/* Mobile hamburger */}
                    <button
                        onClick={onMenuClick}
                        className={`lg:hidden p-2 rounded-btn transition ${
                            isNewUI ? 'hover:bg-white/5 text-[#e5e2e1]/70' : 'hover:bg-surface-hover text-slate-600'
                        }`}
                        aria-label="Open menu"
                    >
                        <Bars3Icon className="w-5 h-5" />
                    </button>

                    {/* Logo */}
                    <Link to="/" className="flex items-center ml-2 lg:ml-0">
                        {isNewUI ? (
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#76d6d5] text-2xl">pets</span>
                                <p className="text-xl font-headline font-black text-[#76d6d5] tracking-tight">VetsCue</p>
                            </div>
                        ) : (
                            <img src="/logo.svg" alt="VetsCue" className="h-8" />
                        )}
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-3 ml-auto">
                        {/* Impersonating banner */}
                        {isImpersonating && (
                            <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
                                isNewUI 
                                ? 'bg-amber-900/20 border-amber-500/30' 
                                : 'bg-amber-50 border-amber-200'
                            }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className={`text-xs font-semibold ${isNewUI ? 'text-amber-200' : 'text-amber-700'}`}>
                                    Viewing as {user?.impersonating?.name}
                                </span>
                                <button
                                    onClick={handleBackToAdmin}
                                    className={`ml-1 flex items-center gap-1 text-xs font-bold transition ${
                                        isNewUI ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-800'
                                    }`}
                                    title="Return to admin view"
                                >
                                    <ArrowUturnLeftIcon className="w-3 h-3" />
                                    Back
                                </button>
                            </div>
                        )}

                        {/* Approval pending banner (for non-admin, non-approved) */}
                        {user && !user.isApproved && user.role !== 'user' && user.role !== 'admin' && (
                            <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 border text-xs font-semibold rounded-full transition-all ${
                                isNewUI
                                ? 'bg-amber-900/20 border-amber-500/30 text-amber-200'
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-soft" />
                                Pending Approval
                            </span>
                        )}

                        {/* Notification Bell */}
                        <button 
                            onClick={() => navigate('/notifications')}
                            className={`p-2 rounded-full transition-all relative ${
                                isNewUI ? 'hover:bg-white/10 text-[#e5e2e1]/70' : 'hover:bg-surface-hover text-slate-600'
                            }`}
                        >
                            <BellIcon className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#131313] animate-pulse"></span>
                            )}
                        </button>

                        {/* Admin account switcher button */}
                        {user?.isAdmin && (
                            <button
                                onClick={() => setShowSwitcher(true)}
                                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all rounded-full border ${
                                    isNewUI 
                                    ? 'text-[#76d6d5] bg-[#008080]/10 border-[#008080]/30 hover:bg-[#008080]/20' 
                                    : 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                                }`}
                            >
                                <UserGroupIcon className="w-3.5 h-3.5" />
                                Switch Account
                            </button>
                        )}

                        {/* Profile dropdown */}
                        <Menu as="div" className="relative">
                            <Menu.Button className={`flex items-center gap-2 px-3 py-2 rounded-btn transition-all duration-150 ${
                                isNewUI ? 'hover:bg-white/5' : 'hover:bg-surface-hover'
                            }`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                                    isNewUI ? 'border-white/10' : 'border-transparent'
                                } ${user?.isAdmin ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 'bg-gradient-to-br from-primary-400 to-primary-600'}`}>
                                    <span className="text-white text-sm font-bold">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className={`text-sm font-semibold leading-none ${isNewUI ? 'text-[#e5e2e1]' : 'text-slate-700'}`}>{user?.name}</p>
                                    <p className={`text-[11px] capitalize ${isNewUI ? 'text-[#e5e2e1]/50' : 'text-surface-muted'}`}>
                                        {isImpersonating ? `${user?.role} (admin)` : user?.role}
                                    </p>
                                </div>
                                <ChevronDownIcon className={`w-4 h-4 ${isNewUI ? 'text-[#e5e2e1]/30' : 'text-slate-400'}`} />
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
                                <Menu.Items className={`absolute right-0 mt-2 w-56 origin-top-right rounded-card focus:outline-none z-50 transition-all border ${
                                    isNewUI 
                                    ? 'bg-[#1c1b1b] border-white/5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.8)]' 
                                    : 'bg-white border-surface-border shadow-card-hover'
                                }`}>
                                    <div className="p-2">
                                        <div className={`px-3 py-2 mb-1 border-b transition-all ${isNewUI ? 'border-white/5' : 'border-surface-border'}`}>
                                            <p className={`text-sm font-semibold truncate ${isNewUI ? 'text-[#e5e2e1]' : 'text-slate-800'}`}>{user?.name}</p>
                                            <p className={`text-xs truncate ${isNewUI ? 'text-[#e5e2e1]/50' : 'text-surface-muted'}`}>{user?.email}</p>
                                            {user?.isAdmin && (
                                                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                                                    isNewUI ? 'text-[#76d6d5] bg-[#008080]/10' : 'text-indigo-600 bg-indigo-50'
                                                }`}>
                                                    Admin
                                                </span>
                                            )}
                                        </div>

                                        {/* Admin-only quick actions */}
                                        {user?.isAdmin && (
                                            <div className={`py-1 border-b mb-1 transition-all ${isNewUI ? 'border-white/5' : 'border-surface-border'}`}>
                                                {isImpersonating && (
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={handleBackToAdmin}
                                                                className={`${active 
                                                                    ? (isNewUI ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-50 text-amber-700') 
                                                                    : (isNewUI ? 'text-amber-400/80' : 'text-amber-600')} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
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
                                                            className={`${active 
                                                                ? (isNewUI ? 'bg-primary/20 text-primary' : 'bg-indigo-50 text-indigo-700') 
                                                                : (isNewUI ? 'text-[#e5e2e1]/80' : 'text-indigo-600')} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
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
                                                        className={`${active 
                                                            ? (isNewUI ? 'bg-primary/20 text-primary' : 'bg-emerald-50 text-emerald-700') 
                                                            : (isNewUI ? 'text-[#e5e2e1]/70' : 'text-slate-600')} flex w-full items-center gap-2 rounded-btn px-3 py-2 text-sm font-medium transition-all`}
                                                    >
                                                        <CreditCardIcon className="w-4 h-4" />
                                                        Payment History
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                        )}

                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleLogout}
                                                    className={`${active 
                                                        ? (isNewUI ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600') 
                                                        : (isNewUI ? 'text-[#e5e2e1]/70' : 'text-slate-600')} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
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
            </header>

            {/* Account Switcher Modal */}
            {showSwitcher && <AdminUserSwitcher onClose={() => setShowSwitcher(false)} />}
        </>
    );
};

export default Navbar;
