import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const DashboardLayout = () => {
    const { user } = useSelector((state) => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Sync sidebar collapsed state from localStorage
    useEffect(() => {
        const checkCollapsed = () => {
            const saved = localStorage.getItem('sidebarCollapsed');
            if (saved) setSidebarCollapsed(JSON.parse(saved));
        };
        
        checkCollapsed();
        // Listen for storage changes (in case sidebar updates it)
        window.addEventListener('storage', checkCollapsed);
        
        // Also check periodically for same-tab updates
        const interval = setInterval(checkCollapsed, 500);
        
        return () => {
            window.removeEventListener('storage', checkCollapsed);
            clearInterval(interval);
        };
    }, []);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-background flex font-sans text-text-primary transition-colors duration-300">
            {/* Sidebar (Fixed width on desktop, overlay on mobile) */}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content Area */}
            <div 
                className={`
                    flex-1 flex flex-col min-w-0 
                    transition-all duration-300 ease-out
                    ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-72'}
                `}
            >
                {/* Sticky Header */}
                <Header 
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
                    sidebarCollapsed={sidebarCollapsed}
                />

                {/* Page Content Scrollable */}
                <main className="flex-1 p-4 md:p-6 overflow-x-hidden bg-background">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
