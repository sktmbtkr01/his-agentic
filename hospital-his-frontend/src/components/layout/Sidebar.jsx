import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    LayoutDashboard, Users, Calendar, Stethoscope,
    FlaskConical, Pill, FileText, Settings,
    Menu, X, Activity, ShieldCheck, Database,
    Banknote, ScanLine, Siren, Scissors, ClipboardList, BedDouble, Ambulance,
    FileCode, CheckSquare, AlertCircle, UserPlus, Package, Moon, Sun,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import systemSettingsService from '../../services/systemSettings.service';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user } = useSelector((state) => state.auth);
    const { theme, toggleTheme, roleTheme } = useTheme();
    const location = useLocation();
    const role = user?.role || 'guest';
    const [clinicalCodingEnabled, setClinicalCodingEnabled] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);

    // Check if clinical coding is enabled
    useEffect(() => {
        const checkCodingStatus = async () => {
            try {
                const status = await systemSettingsService.getClinicalCodingStatus();
                setClinicalCodingEnabled(status.enabled);
            } catch (error) {
                console.log('Could not fetch coding status');
                setClinicalCodingEnabled(true);
            }
        };
        if (user) {
            checkCodingStatus();
        }
    }, [user]);

    // Load collapsed state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved) setIsCollapsed(JSON.parse(saved));
    }, []);

    // Save collapsed state
    const handleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    };

    // Navigation Config based on Roles
    const allNavItems = [
        // CLINICAL MODULES
        { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_tech', 'radiologist', 'billing', 'head_nurse'] },
        { title: 'Patients', path: '/dashboard/patients', icon: Users, roles: ['doctor', 'nurse', 'receptionist', 'head_nurse'] },
        { title: 'Appointments', path: '/dashboard/appointments', icon: Calendar, roles: ['doctor', 'nurse', 'receptionist'] },
        { title: 'Sentinel Alerts', path: '/dashboard/sentinel', icon: ShieldCheck, roles: ['doctor', 'head_nurse'], alert: true },
        { title: 'OPD Queue', path: '/dashboard/opd-queue', icon: Stethoscope, roles: ['doctor', 'nurse', 'receptionist'] },
        { title: 'IPD / Wards', path: '/dashboard/ipd', icon: Activity, roles: ['doctor', 'nurse', 'receptionist', 'head_nurse'] },
        { title: 'Nurse Vitals Entry', path: '/dashboard/nurse-opd-queue', icon: Activity, roles: ['nurse', 'head_nurse'] },
        { title: 'Bed Management', path: '/dashboard/bed-management', icon: BedDouble, roles: ['doctor', 'nurse', 'receptionist', 'head_nurse', 'admin'] },
        { title: 'Emergency', path: '/dashboard/emergency', icon: Ambulance, roles: ['doctor', 'nurse', 'receptionist', 'head_nurse', 'admin'] },
        { title: 'Laboratory', path: '/dashboard/lab', icon: FlaskConical, roles: ['doctor', 'lab_tech'] },
        { title: 'Radiology', path: '/dashboard/radiology', icon: ScanLine, roles: ['doctor', 'radiologist'] },
        { title: 'Pharmacy', path: '/dashboard/pharmacy', icon: Pill, roles: ['pharmacist'] },
        { title: 'Operation Theatre', path: '/dashboard/ot', icon: Scissors, roles: ['doctor', 'nurse'] },
        { title: 'Nursing', path: '/dashboard/nursing', icon: Activity, roles: ['nurse', 'head_nurse'] },
        { title: 'Doctor Rounds', path: '/dashboard/doctor-rounds', icon: ClipboardList, roles: ['doctor'] },
        { title: 'Lab Test Results', path: '/dashboard/doctor-lab-tests', icon: FlaskConical, roles: ['doctor'] },
        { title: 'Radiology Test Results', path: '/dashboard/doctor-radiology-tests', icon: ScanLine, roles: ['doctor'] },
        { title: 'Duty Roster', path: '/dashboard/duty-roster', icon: Calendar, roles: ['head_nurse'] },
        { title: 'Billing', path: '/dashboard/billing', icon: Banknote, roles: ['billing'] },
        { title: 'Insurance', path: '/dashboard/insurance', icon: ShieldCheck, roles: ['insurance', 'billing'] },
        { title: 'Report Incident', path: '/dashboard/report-incident', icon: AlertCircle, roles: ['doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_tech', 'radiologist', 'billing', 'head_nurse', 'insurance', 'coder', 'senior_coder', 'compliance'] },
        { title: 'My Reports', path: '/dashboard/my-incidents', icon: FileText, roles: ['doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_tech', 'radiologist', 'billing', 'head_nurse', 'insurance', 'coder', 'senior_coder', 'compliance'] },
        { title: 'Incident Review Queue', path: '/dashboard/department-incidents', icon: Database, roles: ['head_nurse', 'compliance', 'admin'] },
        // INVENTORY MANAGER
        { title: 'Inventory Dashboard', path: '/inventory', icon: LayoutDashboard, roles: ['inventory_manager'] },
        { title: 'Inventory Items', path: '/inventory/items', icon: Package, roles: ['inventory_manager'] },
        { title: 'Purchase Orders', path: '/inventory/purchase-orders', icon: ClipboardList, roles: ['inventory_manager'] },
        { title: 'Stock Operations', path: '/inventory/stock-issues', icon: Activity, roles: ['inventory_manager'] },
        // CLINICAL CODING
        { title: 'Coding Dashboard', path: '/dashboard/coding', icon: LayoutDashboard, roles: ['coder', 'senior_coder'], isCodingItem: true },
        { title: 'Coding Queue', path: '/dashboard/coding/queue', icon: FileCode, roles: ['coder', 'senior_coder'], isCodingItem: true },
        { title: 'Pending Review', path: '/dashboard/coding/review', icon: CheckSquare, roles: ['senior_coder'], isCodingItem: true },
        { title: 'Procedure Codes', path: '/dashboard/coding/procedure-codes', icon: Database, roles: ['coder', 'senior_coder', 'admin'], isCodingItem: true },
        // ADMIN MODULES
        { title: 'Governance Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin'] },
        { title: 'User Management', path: '/admin/users', icon: Users, roles: ['admin'] },
        { title: 'Staff Onboarding', path: '/admin/staff-onboarding', icon: UserPlus, roles: ['admin'] },
        { title: 'Break-Glass', path: '/admin/break-glass', icon: Siren, roles: ['admin'] },
        { title: 'Audit Logs', path: '/admin/audit-logs', icon: FileText, roles: ['admin'] },
        { title: 'Revenue Anomalies', path: '/admin/revenue-anomalies', icon: Banknote, roles: ['admin'] },
        { title: 'Incidents', path: '/admin/incidents', icon: ShieldCheck, roles: ['admin'] },
        { title: 'Compliance', path: '/admin/compliance', icon: ClipboardList, roles: ['admin'] },
        { title: 'Master Data', path: '/admin/master-data', icon: Database, roles: ['admin'] },
        { title: 'Departments', path: '/admin/departments', icon: Menu, roles: ['admin'] },
        { title: 'System Health', path: '/admin/system', icon: Activity, roles: ['admin'] },
        { title: 'System Settings', path: '/admin/settings', icon: Settings, roles: ['admin'] },
    ];

    // Filter links based on role and clinical coding status
    const filteredNav = allNavItems.filter(item => {
        if (!item.roles.includes(role)) return false;
        if (item.isCodingItem && !clinicalCodingEnabled) return false;
        return true;
    });

    // Get user initials
    const getInitials = () => {
        if (user?.profile?.firstName && user?.profile?.lastName) {
            return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
        }
        return user?.username?.[0]?.toUpperCase() || 'U';
    };

    // Get display name
    const getDisplayName = () => {
        if (user?.profile?.firstName) {
            return `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
        }
        return user?.username || 'User';
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 288 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className={`
                    fixed left-0 top-0 bottom-0 z-50
                    bg-surface border-r border-border
                    shadow-theme-xl md:shadow-none
                    flex flex-col
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                    transition-transform duration-300
                `}
            >
                {/* Logo Section */}
                <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
                    <motion.div
                        className="w-10 h-10 rounded-xl bg-gradient-role flex items-center justify-center text-white shadow-role shrink-0"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Activity size={22} strokeWidth={2} />
                    </motion.div>
                    
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="ml-3 overflow-hidden"
                            >
                                <h1 className="font-bold text-xl text-text-primary tracking-tight">
                                    Lifeline<span className="text-role">X</span>
                                </h1>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile Close Button */}
                    <button 
                        onClick={toggleSidebar} 
                        className="ml-auto md:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-highlight hover:text-text-primary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User Profile Section */}
                <div className={`px-4 py-4 border-b border-border shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
                        {/* Avatar */}
                        <motion.div
                            className="relative shrink-0"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="w-11 h-11 rounded-full bg-gradient-role flex items-center justify-center text-white font-bold text-sm shadow-role">
                                {getInitials()}
                            </div>
                            {/* Online Indicator */}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-surface" />
                        </motion.div>

                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-1 min-w-0"
                                >
                                    <p className="font-semibold text-sm text-text-primary truncate">
                                        {getDisplayName()}
                                    </p>
                                    <p className="text-xs text-role font-medium capitalize truncate">
                                        {role.replace(/_/g, ' ')}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    {filteredNav.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || 
                            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                        const isHovered = hoveredItem === item.path;

                        return (
                            <motion.div
                                key={item.path}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02, duration: 0.3 }}
                                onMouseEnter={() => setHoveredItem(item.path)}
                                onMouseLeave={() => setHoveredItem(null)}
                                className="relative"
                            >
                                <NavLink
                                    to={item.path}
                                    end={item.path === '/dashboard'}
                                    className={`
                                        relative flex items-center gap-3 
                                        ${isCollapsed ? 'justify-center px-3' : 'px-4'} 
                                        py-2.5 rounded-xl
                                        text-sm font-medium
                                        transition-all duration-200 ease-out
                                        group
                                        ${isActive 
                                            ? 'bg-gradient-role text-white shadow-role' 
                                            : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                                        }
                                    `}
                                >
                                    {/* Active Indicator Bar */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}

                                    {/* Icon */}
                                    <span className={`
                                        shrink-0 transition-transform duration-200
                                        ${isHovered && !isActive ? 'scale-110' : ''}
                                        ${item.alert && !isActive ? 'text-error' : ''}
                                    `}>
                                        <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                                    </span>

                                    {/* Title */}
                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="truncate whitespace-nowrap"
                                            >
                                                {item.title}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>

                                    {/* Alert Indicator */}
                                    {item.alert && !isActive && (
                                        <span className="absolute top-2 right-2 w-2 h-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
                                        </span>
                                    )}
                                </NavLink>

                                {/* Tooltip for collapsed mode */}
                                {isCollapsed && isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50"
                                    >
                                        <div className="px-3 py-2 bg-surface-elevated text-text-primary text-sm font-medium rounded-lg shadow-theme-xl border border-border whitespace-nowrap">
                                            {item.title}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </nav>

                {/* Footer Section */}
                <div className="p-3 border-t border-border space-y-2 shrink-0">
                    {/* Theme Toggle */}
                    <motion.button
                        onClick={toggleTheme}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            w-full flex items-center gap-3 
                            ${isCollapsed ? 'justify-center px-3' : 'px-4'} 
                            py-2.5 rounded-xl
                            bg-surface-secondary hover:bg-surface-highlight
                            transition-all duration-200
                            text-sm font-medium text-text-secondary
                        `}
                    >
                        <motion.span
                            key={theme}
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                        </motion.span>
                        
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-1 flex items-center justify-between"
                                >
                                    <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                                    <div className={`
                                        w-9 h-5 rounded-full p-0.5 transition-colors duration-300
                                        ${theme === 'dark' ? 'bg-role' : 'bg-text-muted'}
                                    `}>
                                        <motion.div
                                            className="w-4 h-4 bg-white rounded-full shadow-sm"
                                            animate={{ x: theme === 'dark' ? 16 : 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    {/* Collapse Toggle (Desktop only) */}
                    <motion.button
                        onClick={handleCollapse}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            hidden md:flex w-full items-center gap-3 
                            ${isCollapsed ? 'justify-center px-3' : 'px-4'} 
                            py-2.5 rounded-xl
                            hover:bg-surface-highlight
                            transition-all duration-200
                            text-sm font-medium text-text-muted
                        `}
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    Collapse
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    {/* Version */}
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-[10px] text-center text-text-muted pt-2"
                            >
                                v1.0.0 • LifelineX HIS
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
