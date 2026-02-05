import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getClinicalStats } from '../../features/analytics/analyticsSlice';
import {
    Users, Calendar, Clock, Activity, TrendingUp, RefreshCw,
    AlertTriangle, FileText, Stethoscope, ChevronRight, Bell,
    BedDouble, ExternalLink, CheckCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { SOCKET_URL } from '../../config/api.config';
import { WelcomeBanner, OPDScheduleChart } from '../../components/dashboard';
import { StatCardSkeleton, WelcomeBannerSkeleton, NeedsAttentionSkeleton, ChartSkeleton } from '../../components/ui/Skeletons';

const POLLING_INTERVAL = 60000; // 1 minute

// Animated CountUp
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

// Enhanced StatCard with click-through behavior and theme-aware styling
const StatCard = ({ title, value, subtext, icon: Icon, color, onClick, isLoading, delay = 0, highlight }) => {
    // Color configurations for different card types
    const colorConfigs = {
        'bg-blue-500': {
            gradient: 'from-cyan-500/20 to-blue-500/10 dark:from-cyan-500/10 dark:to-blue-500/5',
            iconBg: 'bg-cyan-500/15 dark:bg-cyan-400/20',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            accentLine: 'from-cyan-500 to-blue-500',
            pulse: 'bg-cyan-500',
            ring: 'ring-cyan-500/30 dark:ring-cyan-400/30',
        },
        'bg-purple-500': {
            gradient: 'from-purple-500/20 to-violet-500/10 dark:from-purple-500/10 dark:to-violet-500/5',
            iconBg: 'bg-purple-500/15 dark:bg-purple-400/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
            accentLine: 'from-purple-500 to-violet-500',
            pulse: 'bg-purple-500',
            ring: 'ring-purple-500/30 dark:ring-purple-400/30',
        },
        'bg-orange-500': {
            gradient: 'from-orange-500/20 to-amber-500/10 dark:from-orange-500/10 dark:to-amber-500/5',
            iconBg: 'bg-orange-500/15 dark:bg-orange-400/20',
            iconColor: 'text-orange-600 dark:text-orange-400',
            accentLine: 'from-orange-500 to-amber-500',
            pulse: 'bg-orange-500',
            ring: 'ring-orange-500/30 dark:ring-orange-400/30',
        },
        'bg-red-500': {
            gradient: 'from-red-500/20 to-rose-500/10 dark:from-red-500/10 dark:to-rose-500/5',
            iconBg: 'bg-red-500/15 dark:bg-red-400/20',
            iconColor: 'text-red-600 dark:text-red-400',
            accentLine: 'from-red-500 to-rose-500',
            pulse: 'bg-red-500',
            ring: 'ring-red-500/30 dark:ring-red-400/30',
        },
    };

    const config = colorConfigs[color] || colorConfigs['bg-blue-500'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                relative overflow-hidden p-6 rounded-2xl
                bg-surface border border-border
                shadow-theme-md hover:shadow-theme-xl
                transition-all duration-300 ease-out group
                ${onClick ? 'cursor-pointer' : ''}
                ${highlight ? `ring-2 ${config.ring}` : ''}
            `}
        >
            {/* Gradient Accent Line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.accentLine}`} />

            {/* Subtle gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`} />

            {highlight && (
                <div className="absolute top-4 right-4 z-10">
                    <span className="flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulse} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.pulse}`}></span>
                    </span>
                </div>
            )}

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <div className={`p-3 rounded-xl mb-4 inline-block ${config.iconBg} shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                        <Icon size={24} className={config.iconColor} />
                    </div>
                    <p className="text-text-secondary text-xs font-bold tracking-wider uppercase mb-1">{title}</p>
                    <h3 className="text-4xl font-extrabold text-text-primary tracking-tight mb-2">
                        {isLoading ? <div className="h-9 w-20 bg-surface-highlight animate-pulse rounded"></div> : <CountUp value={value} />}
                    </h3>
                    <div className="flex items-center text-xs font-medium text-text-muted">
                        {subtext}
                        {onClick && <ChevronRight size={14} className="ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />}
                    </div>
                </div>
            </div>

            {/* Decorative Background Icon */}
            <Icon
                className={`absolute -bottom-4 -right-4 w-32 h-32 opacity-[0.03] dark:opacity-[0.06] ${config.iconColor} transform group-hover:scale-110 group-hover:rotate-[-10deg] transition-all duration-700 pointer-events-none`}
            />
        </motion.div>
    );
};

// Priority Badge with theme-aware contrast
const PriorityBadge = ({ priority }) => {
    const styles = {
        critical: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-400/30',
        important: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-400/30',
        normal: 'bg-surface-highlight text-text-secondary border-border'
    };
    const labels = {
        critical: 'Critical',
        important: 'Important',
        normal: 'Normal'
    };
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${styles[priority]}`}>
            {labels[priority]}
        </span>
    );
};

// Needs Attention Item with Left Accent Border - Theme Aware
const AttentionItem = ({ item, onClick }) => {
    const accents = {
        critical: 'border-l-red-500 bg-red-500/5 dark:bg-red-500/10',
        important: 'border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10',
        normal: 'border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10'
    };

    // Fallback if priority is missing or unknown
    const priority = item.priority || 'normal';
    const accentClass = accents[priority] || accents.normal;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.01, x: 4 }}
            onClick={onClick}
            className={`flex items-start gap-4 p-4 mb-3 bg-surface-secondary rounded-r-xl border-l-4 border-y border-r border-border hover:bg-surface-highlight hover:shadow-theme-md cursor-pointer transition-all duration-200 group ${accentClass}`}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-text-primary truncate pr-2">{item.title}</span>
                    <div className="flex-shrink-0">
                        <PriorityBadge priority={priority} />
                    </div>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 mb-2 leading-relaxed">{item.description}</p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-border">
                    {item.time && (
                        <div className="flex items-center text-[10px] text-text-muted font-medium">
                            <Clock size={10} className="mr-1" />
                            {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                        </div>
                    )}
                    <span className="text-[10px] text-role font-semibold group-hover:underline flex items-center">
                        Take Action
                        <ChevronRight size={10} className="ml-0.5" />
                    </span>
                </div>
            </div>
        </motion.div>
    );
};


const ClinicalDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { data: stats, isLoading, isError, message } = useSelector((state) => state.analytics);
    const { user } = useSelector((state) => state.auth);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);

    // Update clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Greeting
    const greeting = useMemo(() => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    }, [currentTime]);

    // Fetch data
    const fetchStats = useCallback(() => {
        setIsRefreshing(true);
        dispatch(getClinicalStats())
            .finally(() => {
                setIsRefreshing(false);
                setLastRefresh(new Date());
            });
    }, [dispatch]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Polling
    useEffect(() => {
        const interval = setInterval(fetchStats, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchStats]);

    // Socket for real-time updates
    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('lab-completed', () => fetchStats());
        socket.on('appointment-updated', () => fetchStats());

        return () => socket.disconnect();
    }, [fetchStats]);

    // Custom Chart Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-surface-elevated dark:bg-neutral-800 text-text-primary p-3 rounded-xl shadow-theme-xl border border-border text-xs">
                    <p className="font-bold mb-1">{data.name}</p>
                    <p className="text-text-secondary">{data.patients} patient{data.patients !== 1 ? 's' : ''} scheduled</p>
                    {data.isCurrentHour && <p className="text-role mt-1">← Current hour</p>}
                </div>
            );
        }
        return null;
    };

    if (isError) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-red-500/10 dark:bg-red-500/20 rounded-2xl border border-red-500/20 m-8">
                <AlertTriangle size={40} className="text-red-500 dark:text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Failed to load dashboard</h3>
                <p className="text-red-600 dark:text-red-400 mb-6">{message}</p>
                <button onClick={fetchStats} className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                    Retry
                </button>
            </div>
        );
    }

    if (isLoading && !stats) {
        return (
            <div className="min-h-screen pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <WelcomeBannerSkeleton />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
                    {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 order-2 lg:order-1 h-[500px]">
                        <NeedsAttentionSkeleton />
                    </div>
                    <div className="lg:col-span-2 order-1 lg:order-2 h-[500px]">
                        <ChartSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    const trafficData = stats?.trafficData || [];
    const needsAttention = stats?.needsAttention || [];
    const currentHourIndex = trafficData.findIndex(d => d.isCurrentHour);

    return (
        <div className="min-h-screen pb-12 max-w-7xl mx-auto">
            {/* Premium Welcome Banner */}
            <WelcomeBanner
                userName={user?.name?.split(' ')[0] || 'Doctor'}
                role="doctor"
                onRefresh={fetchStats}
                isRefreshing={isRefreshing}
                lastUpdated={lastRefresh}
                subtitle="Here's what needs your attention today."
            />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
                <StatCard
                    delay={0}
                    title="My Appointments"
                    value={stats?.appointments?.total || 0}
                    subtext={`${stats?.appointments?.checkedIn || 0} waiting`}
                    icon={Calendar}
                    color="bg-blue-500"
                    isLoading={isRefreshing}
                    onClick={() => navigate('/opd')}
                />
                <StatCard
                    delay={0.1}
                    title="Admitted Patients"
                    value={stats?.admittedPatients || 0}
                    subtext="In your care"
                    icon={BedDouble}
                    color="bg-purple-500"
                    isLoading={isRefreshing}
                    onClick={() => navigate('/ipd')}
                />
                <StatCard
                    delay={0.2}
                    title="Lab Reports"
                    value={stats?.pendingLabReports || 0}
                    subtext={stats?.recentLabUploads > 0 ? `${stats.recentLabUploads} new in last 2 hrs` : "Pending review"}
                    icon={FileText}
                    color="bg-orange-500"
                    isLoading={isRefreshing}
                    onClick={() => navigate('/dashboard/lab')}
                    highlight={stats?.recentLabUploads > 0}
                />
                <StatCard
                    delay={0.3}
                    title="Critical Alerts"
                    value={stats?.criticalAlerts || 0}
                    subtext="Require immediate attention"
                    icon={AlertTriangle}
                    color="bg-red-500"
                    isLoading={isRefreshing}
                    highlight={stats?.criticalAlerts > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Needs Attention Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-1 order-2 lg:order-1 flex flex-col h-full"
                >
                    <div className="bg-surface rounded-3xl border border-border p-6 shadow-theme-md h-full max-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                            <div>
                                <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-amber-500 dark:text-amber-400" />
                                    Needs Attention
                                </h3>
                            </div>
                            <span className="bg-surface-highlight text-text-secondary text-xs font-bold px-2 py-1 rounded-md">
                                {needsAttention.length} Pending
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar -mr-2">
                            <AnimatePresence>
                                {needsAttention.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                                        <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                                            <CheckCircle className="text-emerald-500 dark:text-emerald-400 w-8 h-8" />
                                        </div>
                                        <p className="text-text-primary font-medium text-sm">All Caught Up!</p>
                                        <p className="text-text-muted text-xs mt-1">No pending alerts</p>
                                    </div>
                                ) : (
                                    needsAttention.map((item) => (
                                        <AttentionItem
                                            key={item.id}
                                            item={item}
                                            onClick={() => navigate(item.actionUrl)}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* OPD Schedule Chart - Premium Component */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 order-1 lg:order-2"
                >
                    <OPDScheduleChart
                        data={trafficData.map(d => ({
                            time: d.name,
                            scheduled: d.patients || 0,
                            current: d.current || 0,
                            isCurrentHour: d.isCurrentHour
                        }))}
                        role="doctor"
                        title="My OPD Schedule"
                        subtitle="Patient load distribution (Today)"
                        showStats={true}
                        height={320}
                    />
                </motion.div>
            </div>

            {/* Quick Lists Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Upcoming Appointments */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-surface rounded-2xl border border-border p-6 shadow-theme-md"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-text-primary">Upcoming Appointments</h4>
                        <button onClick={() => navigate('/opd')} className="text-xs text-role hover:opacity-80 font-medium flex items-center gap-1 transition-opacity">
                            View all <ExternalLink size={12} />
                        </button>
                    </div>

                    {stats?.upcomingAppointments?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.upcomingAppointments.map(appt => (
                                <div
                                    key={appt.id}
                                    onClick={() => navigate(`/opd/${appt.id}`)}
                                    className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl hover:bg-surface-highlight cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-sm text-text-primary">{appt.patientName}</p>
                                        <p className="text-xs text-text-muted">{appt.patientId} • {appt.complaint || 'General'}</p>
                                    </div>
                                    <span className="text-xs font-medium text-role bg-role/10 px-2 py-1 rounded-full">
                                        {appt.time || 'Scheduled'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted text-center py-6">No upcoming appointments</p>
                    )}
                </motion.div>

                {/* My Admissions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-surface rounded-2xl border border-border p-6 shadow-theme-md"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-text-primary">My Admitted Patients</h4>
                        <button onClick={() => navigate('/ipd')} className="text-xs text-role hover:opacity-80 font-medium flex items-center gap-1 transition-opacity">
                            View all <ExternalLink size={12} />
                        </button>
                    </div>

                    {stats?.admissions?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.admissions.map(adm => (
                                <div
                                    key={adm.id}
                                    onClick={() => navigate(`/ipd/${adm.id}`)}
                                    className="flex items-center justify-between p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl hover:bg-purple-500/20 dark:hover:bg-purple-500/30 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-sm text-text-primary">{adm.patientName}</p>
                                        <p className="text-xs text-text-muted">{adm.patientId}</p>
                                    </div>
                                    <BedDouble size={16} className="text-purple-500 dark:text-purple-400" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted text-center py-6">No admitted patients</p>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ClinicalDashboard;
