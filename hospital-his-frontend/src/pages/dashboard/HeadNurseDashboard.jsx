
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Users, Clock, CheckCircle, AlertTriangle,
    ChevronRight, Activity, BedDouble, Heart,
    RefreshCw, ArrowRight, Bell, Clipboard, Calendar,
    UserCheck, Stethoscope, ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import nursingService from '../../services/nursing.service';
import bedService from '../../services/bed.service';
import ipdService from '../../services/ipd.service';
import { WelcomeBanner } from '../../components/dashboard';

// --- Reusable Components (Local) ---

// Animated CountUp for numbers
const CountUp = ({ value, duration = 800 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime = null;
        let startValue = count;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            const easeOut = 1 - Math.pow(1 - percentage, 3);
            setCount(Math.floor(startValue + (value - startValue) * easeOut));
            if (progress < duration) requestAnimationFrame(animate);
            else setCount(value);
        };
        requestAnimationFrame(animate);
    }, [value]);
    return <span>{count}</span>;
};

// StatCard Component
const StatCard = ({ title, value, subtext, icon: Icon, color, onClick, isLoading, delay = 0, highlight }) => {
    const baseColorName = color.split('-')[1];
    const borderColor = `border-${baseColorName}-100`;
    const hoverBorder = `hover:border-${baseColorName}-200`;
    const bgGradient = `bg-gradient-to-br from-${baseColorName}-50 to-white`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)" }}
            onClick={onClick}
            className={`relative p-6 rounded-2xl border ${borderColor} ${bgGradient} ${hoverBorder} shadow-sm transition-all group ${onClick ? 'cursor-pointer' : ''} ${highlight ? `ring-2 ring-${baseColorName}-200` : ''}`}
        >
            <div className="relative z-10">
                <div className={`p-3 rounded-xl mb-4 inline-block ${color} bg-opacity-10 shadow-sm`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                <p className="text-text-secondary text-xs font-bold tracking-wider uppercase mb-1">{title}</p>
                <h3 className="text-4xl font-extrabold text-text-primary tracking-tight mb-2">
                    {isLoading ? <div className="h-9 w-20 bg-surface-secondary animate-pulse rounded"></div> : <CountUp value={value} />}
                </h3>
                <div className="flex items-center text-xs font-medium text-text-secondary">
                    {subtext}
                    {onClick && <ChevronRight size={14} className="ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />}
                </div>
            </div>
            <Icon
                className={`absolute -bottom-4 -right-4 w-32 h-32 opacity-[0.03] text-${baseColorName}-600 transform group-hover:scale-110 group-hover:rotate-[-10deg] transition-all duration-700 pointer-events-none`}
            />
        </motion.div>
    );
};

// Alert Badge
const AlertBadge = ({ severity }) => {
    const styles = {
        'critical': 'bg-red-500/10 text-red-500 border-red-500/20',
        'high': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        'medium': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        'low': 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[severity] || styles['medium']}`}>
            {severity}
        </span>
    );
};

const HeadNurseDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    // State
    const [stats, setStats] = useState({
        totalPatients: 0,
        pendingTasks: 0,
        criticalAlerts: 0,
        occupiedBeds: 0,
        totalBeds: 0
    });
    const [alerts, setAlerts] = useState([]);
    const [admittedPatients, setAdmittedPatients] = useState([]);
    const [pendingHandovers, setPendingHandovers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Greeting logic
    const greeting = useMemo(() => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    }, [currentTime]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dashboardRes, alertsRes, occupancyRes, patientsRes, handoversRes] = await Promise.all([
                nursingService.getDashboard().catch(() => ({ data: {} })),
                nursingService.getActiveAlerts().catch(() => ({ data: [] })),
                bedService.getOccupancy().catch(() => ({ data: { occupied: 0, total: 0 } })),
                ipdService.getAdmittedPatients().catch(() => ({ data: [] })),
                nursingService.getPendingHandovers().catch(() => ({ data: [] }))
            ]);

            const dashboard = dashboardRes.data || {};
            const alertsList = alertsRes.data || [];
            const occupancy = occupancyRes.data || { occupied: 0, total: 0 };
            const patients = patientsRes.data || [];
            const handovers = handoversRes.data || [];

            setAlerts(alertsList.slice(0, 5));
            setAdmittedPatients(patients.slice(0, 5));
            setPendingHandovers(handovers.slice(0, 3));

            setStats({
                totalPatients: patients.length || dashboard.totalPatients || 0,
                pendingTasks: dashboard.pendingTasks || 0,
                criticalAlerts: alertsList.filter(a => a.severity === 'critical').length,
                occupiedBeds: occupancy.occupied || 0,
                totalBeds: occupancy.total || 0
            });
        } catch (error) {
            console.error("Error fetching head nurse dashboard data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
    };

    const occupancyPercent = stats.totalBeds > 0
        ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100)
        : 0;

    return (
        <div className="min-h-screen pb-12 max-w-7xl mx-auto">
            {/* Premium Welcome Banner */}
            <WelcomeBanner
                userName={user?.name?.split(' ')[0] || 'Head Nurse'}
                role="head_nurse"
                onRefresh={handleRefresh}
                isRefreshing={loading}
                lastUpdated={new Date()}
                subtitle="Manage wards, nursing staff, and patient care."
            />

            {/* Quick Action Button */}
            <div className="flex justify-end mt-4 mb-6">
                <button
                    onClick={() => navigate('/nursing')}
                    className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 inline-flex items-center gap-2"
                >
                    Go to Nursing Station <ArrowRight size={18} />
                </button>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Admitted Patients"
                    value={stats.totalPatients}
                    subtext="Currently in care"
                    icon={Users}
                    color="bg-blue-500"
                    isLoading={loading}
                    delay={0}
                    onClick={() => navigate('/ipd')}
                />
                <StatCard
                    title="Bed Occupancy"
                    value={occupancyPercent}
                    subtext={`${stats.occupiedBeds}/${stats.totalBeds} beds occupied`}
                    icon={BedDouble}
                    color="bg-purple-500"
                    isLoading={loading}
                    delay={0.1}
                    highlight={occupancyPercent > 85}
                    onClick={() => navigate('/bed-management')}
                />
                <StatCard
                    title="Pending Tasks"
                    value={stats.pendingTasks}
                    subtext="Tasks to complete"
                    icon={Clipboard}
                    color="bg-amber-500"
                    isLoading={loading}
                    delay={0.2}
                    highlight={stats.pendingTasks > 10}
                    onClick={() => navigate('/nursing')}
                />
                <StatCard
                    title="Critical Alerts"
                    value={stats.criticalAlerts}
                    subtext="Require attention"
                    icon={AlertTriangle}
                    color="bg-red-500"
                    isLoading={loading}
                    delay={0.3}
                    highlight={stats.criticalAlerts > 0}
                    onClick={() => navigate('/nursing')}
                />
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Patient List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-surface rounded-3xl border border-border p-6 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-xl text-text-primary flex items-center gap-2">
                                <Heart className="text-pink-500" size={20} /> Ward Patients
                            </h3>
                            <p className="text-sm text-text-muted">Patients under nursing care</p>
                        </div>
                        <button onClick={() => navigate('/ipd')} className="text-sm font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1">
                            View All <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {admittedPatients.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4 text-text-muted">
                                    <Users size={32} />
                                </div>
                                <h4 className="text-text-secondary font-bold">No patients</h4>
                                <p className="text-text-muted text-sm">No patients currently admitted.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {admittedPatients.map((admission, idx) => (
                                    <div
                                        key={admission._id || idx}
                                        onClick={() => navigate(`/ipd/${admission._id}`)}
                                        className="group p-4 rounded-xl border border-border hover:border-pink-500/30 bg-surface hover:bg-pink-500/5 transition-all cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-xs font-bold text-pink-500">
                                                {admission.patient?.firstName?.[0] || '?'}{admission.patient?.lastName?.[0] || '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-primary group-hover:text-pink-500 transition-colors">
                                                    {admission.patient?.firstName} {admission.patient?.lastName}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                    <span>Bed: {admission.bed?.bedNumber || 'N/A'}</span>
                                                    <span>•</span>
                                                    <span>{admission.ward?.name || admission.diagnosis || 'General'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Admitted</p>
                                                <p className="text-xs font-medium text-text-secondary">
                                                    {admission.admissionDate ? format(new Date(admission.admissionDate), 'dd MMM') : 'N/A'}
                                                </p>
                                            </div>
                                            <ChevronRight size={18} className="text-text-muted group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Right Column: Alerts & Quick Actions */}
                <div className="space-y-6">
                    {/* Shift Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-pink-600 to-rose-700 rounded-3xl p-6 text-white shadow-xl shadow-pink-200"
                    >
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                            <Calendar size={20} className="text-pink-200" /> Ward Overview
                        </h3>
                        <p className="text-pink-100 text-sm opacity-80 mb-6">Today's nursing status</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-pink-200 mb-1">Patients</p>
                                <p className="text-2xl font-bold">{stats.totalPatients}</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-pink-200 mb-1">Occupancy</p>
                                <p className="text-2xl font-bold">{occupancyPercent}%</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Active Alerts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-surface rounded-3xl border border-border p-6 shadow-sm"
                    >
                        <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                            <Bell size={18} className="text-red-500" />
                            Active Alerts
                        </h4>
                        {alerts.length === 0 ? (
                            <div className="text-center py-4 text-text-muted text-sm flex flex-col items-center">
                                <CheckCircle size={24} className="text-emerald-500 mb-2" />
                                No active alerts
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {alerts.map((alert, idx) => (
                                    <div
                                        key={alert._id || idx}
                                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-medium text-red-500 flex-1">{alert.message || 'Alert'}</p>
                                            <AlertBadge severity={alert.severity} />
                                        </div>
                                        <p className="text-xs text-red-400">
                                            {alert.patient?.firstName} {alert.patient?.lastName} • {alert.type || 'General'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-surface rounded-3xl border border-border p-6 shadow-sm"
                    >
                        <h4 className="font-bold text-text-primary mb-4">Quick Actions</h4>
                        <div className="space-y-2">
                            <button onClick={() => navigate('/nursing')} className="w-full p-3 text-left rounded-xl hover:bg-surface-highlight transition-colors flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-text-primary border border-transparent hover:border-border">
                                <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg">
                                    <ClipboardList size={18} />
                                </div>
                                Nursing Station
                            </button>
                            <button onClick={() => navigate('/bed-management')} className="w-full p-3 text-left rounded-xl hover:bg-surface-highlight transition-colors flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-text-primary border border-transparent hover:border-border">
                                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                                    <BedDouble size={18} />
                                </div>
                                Bed Management
                            </button>
                            <button onClick={() => navigate('/duty-roster')} className="w-full p-3 text-left rounded-xl hover:bg-surface-highlight transition-colors flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-text-primary border border-transparent hover:border-border">
                                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                    <UserCheck size={18} />
                                </div>
                                Duty Roster
                            </button>
                            <button onClick={() => navigate('/dashboard/emergency')} className="w-full p-3 text-left rounded-xl hover:bg-surface-highlight transition-colors flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-text-primary border border-transparent hover:border-border">
                                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                                    <Activity size={18} />
                                </div>
                                Emergency
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default HeadNurseDashboard;
