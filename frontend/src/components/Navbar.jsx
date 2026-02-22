import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Bars3Icon,
    ChevronDownIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        try {
            logout();
            navigate('/login');
        } catch (error) {
            console.error('[Navbar] Logout error:', error.message);
        }
    };

    return (
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

                {/* Page context (desktop) */}
                <div className="hidden lg:flex items-center gap-2">
                    <span className="text-xl">🐾</span>
                    <span className="text-sm text-surface-muted font-medium">PawSaarthi Rescue Platform</span>
                </div>

                {/* Right side: approval warning + user menu */}
                <div className="flex items-center gap-3 ml-auto">
                    {/* Approval pending banner */}
                    {user && !user.isApproved && user.role !== 'user' && user.role !== 'admin' && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-soft" />
                            Pending Approval
                        </span>
                    )}

                    {/* Profile dropdown */}
                    <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-btn hover:bg-surface-hover transition-all duration-150">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-semibold text-slate-700 leading-none">{user?.name}</p>
                                <p className="text-[11px] text-surface-muted capitalize">{user?.role}</p>
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
                            <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right bg-white rounded-card shadow-card-hover border border-surface-border focus:outline-none z-50">
                                <div className="p-2">
                                    <div className="px-3 py-2 mb-1 border-b border-surface-border">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                                        <p className="text-xs text-surface-muted truncate">{user?.email}</p>
                                    </div>
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
    );
};

export default Navbar;
