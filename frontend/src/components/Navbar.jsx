import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Bars3Icon,
    ChevronDownIcon,
    ArrowRightOnRectangleIcon,
    UserGroupIcon,
    ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import AdminUserSwitcher from './AdminUserSwitcher';

const Navbar = ({ onMenuClick }) => {
    const { user, logout, isImpersonating, stopImpersonating } = useAuth();
    const navigate = useNavigate();
    const [showSwitcher, setShowSwitcher] = useState(false);

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
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-surface-border">
                <div className="flex items-center justify-between px-5 md:px-8 h-16">
                    {/* Mobile hamburger */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-btn hover:bg-surface-hover transition"
                        aria-label="Open menu"
                    >
                        <Bars3Icon className="w-5 h-5 text-slate-600" />
                    </button>

                    {/* Logo */}
                    <div className="hidden lg:flex items-center">
                        <img src="/logo.svg" alt="PawSaarthi" className="h-8" />
                    </div>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-6 ml-4">
                        <Link to="/fundraisers" className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-btn transition-colors">
                            Fundraisers
                        </Link>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3 ml-auto">
                        {/* Impersonating banner */}
                        {isImpersonating && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-semibold text-amber-700">
                                    Viewing as {user?.impersonating?.name}
                                </span>
                                <button
                                    onClick={handleBackToAdmin}
                                    className="ml-1 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-bold transition"
                                    title="Return to admin view"
                                >
                                    <ArrowUturnLeftIcon className="w-3 h-3" />
                                    Back
                                </button>
                            </div>
                        )}

                        {/* Approval pending banner (for non-admin, non-approved) */}
                        {user && !user.isApproved && user.role !== 'user' && user.role !== 'admin' && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-soft" />
                                Pending Approval
                            </span>
                        )}

                        {/* Admin account switcher button */}
                        {user?.isAdmin && (
                            <button
                                onClick={() => setShowSwitcher(true)}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 transition"
                            >
                                <UserGroupIcon className="w-3.5 h-3.5" />
                                Switch Account
                            </button>
                        )}

                        {/* Profile dropdown */}
                        <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-btn hover:bg-surface-hover transition-all duration-150">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.isAdmin ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 'bg-gradient-to-br from-primary-400 to-primary-600'
                                    }`}>
                                    <span className="text-white text-sm font-bold">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-semibold text-slate-700 leading-none">{user?.name}</p>
                                    <p className="text-[11px] text-surface-muted capitalize">
                                        {isImpersonating ? `${user?.role} (admin)` : user?.role}
                                    </p>
                                </div>
                                <ChevronDownIcon className="w-4 h-4 text-slate-400" />
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
                                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-card shadow-card-hover border border-surface-border focus:outline-none z-50">
                                    <div className="p-2">
                                        <div className="px-3 py-2 mb-1 border-b border-surface-border">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                                            <p className="text-xs text-surface-muted truncate">{user?.email}</p>
                                            {user?.isAdmin && (
                                                <span className="inline-block mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                    Admin
                                                </span>
                                            )}
                                        </div>

                                        {/* Admin-only quick actions */}
                                        {user?.isAdmin && (
                                            <div className="py-1 border-b border-surface-border mb-1">
                                                {isImpersonating && (
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={handleBackToAdmin}
                                                                className={`${active ? 'bg-amber-50 text-amber-700' : 'text-amber-600'} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
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
                                                            className={`${active ? 'bg-indigo-50 text-indigo-700' : 'text-indigo-600'} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
                                                        >
                                                            <UserGroupIcon className="w-4 h-4" />
                                                            Switch Account
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                            </div>
                                        )}

                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleLogout}
                                                    className={`${active ? 'bg-red-50 text-red-600' : 'text-slate-600'} w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all`}
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
