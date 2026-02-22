import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Main app shell: fixed sidebar + top navbar + scrollable content area.
 * Sidebar collapses on mobile via hamburger toggle.
 */
const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Sidebar — desktop always visible, mobile overlay */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full animate-fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
