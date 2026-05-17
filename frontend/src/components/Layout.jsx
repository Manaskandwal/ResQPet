import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import NotificationModal from './NotificationModal';
import AudioAlert from './AudioAlert';

/**
 * Main app shell: fixed sidebar + top navbar + scrollable content area.
 * Sidebar collapses on mobile via hamburger toggle.
 */
const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen flex bg-[var(--bg-main)] transition-colors duration-300">
            <AudioAlert />
            {/* Sidebar — desktop always visible, mobile overlay */}
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onNotificationsClick={() => setShowNotifications(true)}
            />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
                <Navbar
                    onMenuClick={() => setSidebarOpen(true)}
                    onNotificationsClick={() => setShowNotifications(true)}
                />
                <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full animate-fade-in">
                    <Outlet />
                </main>
            </div>

            {/* Global Notification Modal */}
            <NotificationModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
        </div>
    );
};

export default Layout;