import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, reset } from '../../features/auth/authSlice';
import { fetchDashboardStats } from '../../features/emergency/emergencySlice';
import { Menu, Bell, User, LogOut, ChevronDown, Search, Sun, Moon, Settings, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ toggleSidebar, sidebarCollapsed = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { dashboardStats } = useSelector((state) => state.emergency);
    const { theme, toggleTheme, roleTheme } = useTheme();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Handle scroll for blur effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        dispatch(fetchDashboardStats());
    }, [dispatch]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showProfileMenu || showNotifications) {
                setShowProfileMenu(false);
                setShowNotifications(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showProfileMenu, showNotifications]);

    const handleLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/login');
    };

    // Get page title from route
    const getPageTitle = useCallback(() => {
        const path = location.pathname;
        const titles = {
            '/dashboard': 'Dashboard',
            '/dashboard/patients': 'Patients',
            '/dashboard/appointments': 'Appointments',
            '/dashboard/sentinel': 'Sentinel Alerts',
            '/dashboard/opd-queue': 'OPD Queue',
            '/dashboard/ipd': 'IPD / Wards',
            '/dashboard/lab': 'Laboratory',
            '/dashboard/radiology': 'Radiology',
            '/dashboard/pharmacy': 'Pharmacy',
            '/dashboard/emergency': 'Emergency',
            '/dashboard/billing': 'Billing',
            '/admin': 'Admin Dashboard',
            '/admin/users': 'User Management',
            '/admin/audit-logs': 'Audit Logs',
        };
        return titles[path] || 'Overview';
    }, [location.pathname]);

    const activeEmergencyCount = dashboardStats?.activeCount || 0;

    // Mock notifications
    const notifications = [
        { id: 1, title: 'Lab Results Ready', message: 'Patient John Doe - Blood work complete', time: '5 min ago', unread: true },
        { id: 2, title: 'Appointment Reminder', message: 'Dr. Smith - 3 appointments today', time: '1 hour ago', unread: true },
        { id: 3, title: 'System Update', message: 'Scheduled maintenance tonight', time: '2 hours ago', unread: false },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header 
            className={`
                h-16 flex items-center justify-between px-4 md:px-6 
                sticky top-0 z-30 
                transition-all duration-300 ease-out
                ${isScrolled 
                    ? 'bg-surface/80 backdrop-blur-xl border-b border-border shadow-theme-sm' 
                    : 'bg-surface border-b border-border'
                }
            `}
        >
            {/* Left: Mobile Toggle & Page Title */}
            <div className="flex items-center gap-4">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 rounded-xl text-text-secondary hover:bg-surface-highlight hover:text-text-primary md:hidden transition-colors"
                >
                    <Menu size={20} />
                </motion.button>

                {/* Page Title with breadcrumb style */}
                <div className="hidden md:flex items-center gap-2">
                    <motion.h2 
                        key={getPageTitle()}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-bold text-text-primary"
                    >
                        {getPageTitle()}
                    </motion.h2>
                </div>
            </div>

            {/* Center: Global Search */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
                <motion.div 
                    className={`
                        relative w-full rounded-xl overflow-hidden
                        transition-all duration-300
                        ${searchFocused 
                            ? 'ring-2 ring-role/30 shadow-role' 
                            : ''
                        }
                    `}
                    animate={{ scale: searchFocused ? 1.02 : 1 }}
                >
                    <Search 
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                            searchFocused ? 'text-role' : 'text-text-muted'
                        }`} 
                        size={18} 
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Search patients, records, or actions..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border 
                            bg-surface-secondary/50 hover:bg-surface-secondary
                            focus:bg-surface focus:border-transparent
                            outline-none transition-all duration-200
                            text-sm text-text-primary placeholder:text-text-muted"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-highlight text-text-muted hover:text-text-primary transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </motion.div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Emergency Alert Badge - Only for clinical staff */}
                {activeEmergencyCount > 0 && ['doctor', 'nurse', 'head_nurse', 'receptionist'].includes(user?.role) && (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard/emergency')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-error/20 to-error/10 text-error rounded-full border border-error/30 hover:border-error/50 transition-all mr-1 shadow-sm"
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
                        </span>
                        <span className="text-xs font-bold tracking-wide">ER: {activeEmergencyCount}</span>
                    </motion.button>
                )}

                {/* Theme Toggle */}
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="relative p-2.5 rounded-xl text-text-secondary hover:bg-surface-highlight hover:text-role transition-all group"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    <motion.div
                        key={theme}
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </motion.div>
                </motion.button>

                {/* Notifications */}
                <div className="relative">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowNotifications(!showNotifications);
                            setShowProfileMenu(false);
                        }}
                        className="relative p-2.5 rounded-xl text-text-secondary hover:bg-surface-highlight hover:text-role transition-all"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface"
                            >
                                {unreadCount}
                            </motion.span>
                        )}
                    </motion.button>

                    {/* Notifications Dropdown */}
                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-2xl shadow-theme-xl border border-border overflow-hidden z-50"
                            >
                                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                                    <h3 className="font-semibold text-text-primary">Notifications</h3>
                                    <button className="text-xs text-role hover:underline">Mark all read</button>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.map((notif) => (
                                        <motion.div
                                            key={notif.id}
                                            whileHover={{ backgroundColor: 'var(--surface-highlight)' }}
                                            className={`px-4 py-3 border-b border-border/50 cursor-pointer transition-colors ${
                                                notif.unread ? 'bg-role/5' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {notif.unread && (
                                                    <span className="w-2 h-2 mt-2 rounded-full bg-role shrink-0" />
                                                )}
                                                <div className={notif.unread ? '' : 'ml-5'}>
                                                    <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                                                    <p className="text-xs text-text-muted mt-0.5">{notif.message}</p>
                                                    <p className="text-[10px] text-text-muted mt-1">{notif.time}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="px-4 py-2 border-t border-border">
                                    <button className="w-full text-center text-sm text-role hover:underline py-1">
                                        View all notifications
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowProfileMenu(!showProfileMenu);
                            setShowNotifications(false);
                        }}
                        className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-border hover:border-role/30 hover:bg-surface-highlight transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-role flex items-center justify-center text-white font-semibold text-sm shadow-role">
                            {user?.profile?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </div>
                        <div className="hidden lg:block text-left">
                            <p className="text-sm font-medium text-text-primary leading-none group-hover:text-role transition-colors">
                                {user?.profile?.firstName || user?.username || 'User'}
                            </p>
                            <p className="text-[10px] text-role leading-none mt-1 uppercase font-semibold tracking-wide">
                                {user?.role?.replace(/_/g, ' ') || 'Staff'}
                            </p>
                        </div>
                        <ChevronDown 
                            size={14} 
                            className={`text-text-muted transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} 
                        />
                    </motion.button>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-2xl shadow-theme-xl border border-border overflow-hidden z-50"
                            >
                                {/* User Info Header */}
                                <div className="px-4 py-4 border-b border-border bg-gradient-to-br from-role/10 to-transparent">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-role flex items-center justify-center text-white font-bold shadow-role">
                                            {user?.profile?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-text-primary">
                                                {user?.profile?.firstName} {user?.profile?.lastName || user?.username}
                                            </p>
                                            <p className="text-xs text-text-muted">{user?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <motion.button 
                                        whileHover={{ x: 4 }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-highlight hover:text-role flex items-center gap-3 transition-colors"
                                    >
                                        <User size={16} /> My Profile
                                    </motion.button>
                                    <motion.button 
                                        whileHover={{ x: 4 }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-highlight hover:text-role flex items-center gap-3 transition-colors"
                                    >
                                        <Settings size={16} /> Settings
                                    </motion.button>
                                    <motion.button 
                                        whileHover={{ x: 4 }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-highlight hover:text-role flex items-center gap-3 transition-colors"
                                    >
                                        <HelpCircle size={16} /> Help & Support
                                    </motion.button>
                                </div>

                                {/* Logout */}
                                <div className="border-t border-border py-2">
                                    <motion.button
                                        whileHover={{ x: 4 }}
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 flex items-center gap-3 transition-colors"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default Header;
