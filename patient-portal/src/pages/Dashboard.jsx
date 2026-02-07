import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import HealthScoreCard from '../components/HealthScoreCard';
import SmartNudgeCard from '../components/SmartNudgeCard';
import nudgeService from '../services/nudgeService';
import deviceService from '../services/deviceService';
import ProactiveAlertsCard from '../components/predictive/ProactiveAlertsCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Plus,
    Stethoscope,
    Smile,
    User,
    Calendar,
    Pill,
    FileText,
    Brain,
    ChevronRight,
    Search,
    Bell,
    Check
} from 'lucide-react';

const Dashboard = () => {
    const { patient, logout } = useAuth();
    const [nudges, setNudges] = useState([]);
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [vitalsData, setVitalsData] = useState(null);
    const [vitalsLoading, setVitalsLoading] = useState(true);

    useEffect(() => {
        const fetchNudges = async () => {
            try {
                const response = await nudgeService.getActiveNudges();
                setNudges(response.data || []);
            } catch (error) {
                console.error("Failed to fetch nudges", error);
            }
        };
        fetchNudges();

        // Fetch device vitals
        const fetchVitals = async () => {
            try {
                setVitalsLoading(true);
                const response = await deviceService.getLatestVitals();
                setVitalsData(response.data);
            } catch (error) {
                console.error("Failed to fetch vitals", error);
            } finally {
                setVitalsLoading(false);
            }
        };
        fetchVitals();
    }, []);

    const handleNudgeResponse = async (nudgeId, status) => {
        try {
            await nudgeService.respondToNudge(nudgeId, status);
            setNudges(prev => prev.filter(n => n._id !== nudgeId));
        } catch (error) {
            console.error("Failed to respond to nudge", error);
        }
    };

    const quickActions = [
        { label: 'Symptom', icon: <Stethoscope size={24} />, to: '/log-symptom', color: 'text-rose-500 bg-rose-50' },
        { label: 'Mood', icon: <Smile size={24} />, to: '/log-mood', color: 'text-amber-500 bg-amber-50' },
        { label: 'Lifestyle', icon: <Activity size={24} />, to: '/log-lifestyle', color: 'text-emerald-500 bg-emerald-50' },
        { label: 'History', icon: <FileText size={24} />, to: '/history', color: 'text-blue-500 bg-blue-50' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-24 relative overflow-x-hidden">

            {/* 1. Modern Glass Header */}
            <div className="sticky top-0 z-30 glass border-b border-b-slate-200/50 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                        {patient?.firstName?.[0] || 'U'}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Good Morning</p>
                        <h1 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">{patient?.firstName}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 rounded-full hover:bg-slate-100 text-[var(--color-text-secondary)] transition-colors relative">
                        <Bell size={20} />
                        {nudges.length > 0 && <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                    </button>
                    <button onClick={logout} className="p-2 rounded-full hover:bg-slate-100 text-[var(--color-text-secondary)] transition-colors">
                        <User size={20} />
                    </button>
                </div>
            </div>

            <motion.div
                className="px-6 pt-6 max-w-lg mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* 2. Health Insights Carousel / Summary */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Daily Vitals</h2>
                        <span className="text-sm font-semibold text-blue-600">See All</span>
                    </div>

                    {/* Horizontal Scroll Snap Area */}
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x">
                        {/* Main Health Score */}
                        <div className="min-w-[85%] snap-center">
                            <HealthScoreCard />
                        </div>

                        {/* Dynamic Vitals Cards from Device Sync */}
                        {vitalsLoading ? (
                            <>
                                <div className="card-premium p-6 min-w-[45%] snap-center flex flex-col justify-between bg-white animate-pulse">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                                    <div className="mt-4 space-y-2">
                                        <div className="w-12 h-6 bg-slate-100 rounded" />
                                        <div className="w-16 h-3 bg-slate-50 rounded" />
                                    </div>
                                </div>
                                <div className="card-premium p-6 min-w-[45%] snap-center flex flex-col justify-between bg-white animate-pulse">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                                    <div className="mt-4 space-y-2">
                                        <div className="w-12 h-6 bg-slate-100 rounded" />
                                        <div className="w-16 h-3 bg-slate-50 rounded" />
                                    </div>
                                </div>
                            </>
                        ) : vitalsData?.hasDevice ? (
                            <>
                                {/* Heart Rate Card */}
                                <Link to="/devices" className="card-premium p-6 min-w-[45%] snap-center flex flex-col justify-between bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 hover:shadow-lg transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-white/80 backdrop-blur-sm rounded-lg text-rose-500 shadow-sm">
                                            <Activity size={20} />
                                        </div>
                                        <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                                            Synced
                                        </span>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-2xl font-bold text-rose-700">{vitalsData.vitals?.heartRate || '--'}</span>
                                        <span className="text-sm text-rose-500 ml-1">bpm</span>
                                        <p className="text-xs text-rose-400 mt-1">Heart Rate</p>
                                    </div>
                                </Link>

                                {/* Sleep Quality Card */}
                                <Link to="/devices" className="card-premium p-6 min-w-[45%] snap-center flex flex-col justify-between bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 hover:shadow-lg transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-white/80 backdrop-blur-sm rounded-lg text-indigo-500 shadow-sm">
                                            <Brain size={20} />
                                        </div>
                                        <span className="text-xs text-indigo-400 font-medium capitalize">{vitalsData.lifestyle?.sleepQuality || 'N/A'}</span>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-2xl font-bold text-indigo-700">{vitalsData.lifestyle?.sleepHours?.toFixed(1) || '--'}</span>
                                        <span className="text-sm text-indigo-500 ml-1">hrs</span>
                                        <p className="text-xs text-indigo-400 mt-1">Sleep</p>
                                    </div>
                                </Link>

                                {/* Steps Card */}
                                <Link to="/devices" className="card-premium p-6 min-w-[45%] snap-center flex flex-col justify-between bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 hover:shadow-lg transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-white/80 backdrop-blur-sm rounded-lg text-emerald-500 shadow-sm">
                                            <Activity size={20} />
                                        </div>
                                        <span className="text-xs text-emerald-400 font-medium">Today</span>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-2xl font-bold text-emerald-700">{vitalsData.lifestyle?.steps?.toLocaleString() || '--'}</span>
                                        <span className="text-sm text-emerald-500 ml-1">steps</span>
                                        <p className="text-xs text-emerald-400 mt-1">Daily Steps</p>
                                    </div>
                                </Link>
                            </>
                        ) : (
                            /* No Device Connected - Connect Prompt */
                            <Link to="/devices" className="card-premium p-6 min-w-[60%] snap-center flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-all group">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Activity size={24} className="text-indigo-600" />
                                </div>
                                <p className="font-bold text-indigo-700 text-sm">Connect a Wearable</p>
                                <p className="text-xs text-indigo-500 text-center mt-1">Sync heart rate, steps & sleep</p>
                            </Link>
                        )}
                    </div>
                </motion.div>

                {/* 3. Quick Actions Grid */}
                <motion.div variants={itemVariants} className="mb-8">
                    <h3 className="section-title mb-4 font-bold text-[var(--color-text-primary)]">Quick Actions</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {quickActions.map((action, i) => (
                            <Link
                                key={i}
                                to={action.to}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${action.color}`}>
                                    {action.icon}
                                </div>
                                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* 3.5 Smart Alerts - AI-powered proactive health insights */}
                <motion.div variants={itemVariants} className="mb-8">
                    <ProactiveAlertsCard compact maxAlerts={3} />
                </motion.div>

                {/* 4. Priorities / Nudges */}
                <motion.div variants={itemVariants} className="mb-8">
                    <h3 className="section-title mb-4 font-bold text-[var(--color-text-primary)]">For You</h3>
                    <div className="space-y-3">
                        <AnimatePresence>
                            {nudges.length > 0 ? (
                                nudges.map(nudge => (
                                    <SmartNudgeCard
                                        key={nudge._id}
                                        nudge={nudge}
                                        onRespond={handleNudgeResponse}
                                        onRemove={(id) => setNudges(prev => prev.filter(n => n._id !== id))}
                                    />
                                ))
                            ) : (
                                <div className="card-premium p-8 text-center bg-white/50 border-dashed border-2 border-slate-200">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Check size={24} />
                                    </div>
                                    <p className="font-semibold text-slate-700">All Caught Up!</p>
                                    <p className="text-xs text-slate-500 mt-1">You're maintaining your routine perfectly.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* 5. Menu List */}
                <motion.div variants={itemVariants} className="space-y-3 pb-8">
                    <h3 className="section-title mb-4 font-bold text-[var(--color-text-primary)]">Menu</h3>
                    {[
                        { icon: <User size={20} />, label: 'My Profile', to: '/profile', color: 'blue' },
                        { icon: <Calendar size={20} />, label: 'Appointments', to: '/appointments', color: 'teal' },
                        { icon: <Pill size={20} />, label: 'Prescriptions', to: '/prescriptions', color: 'rose' },
                        { icon: <FileText size={20} />, label: 'Lab Results', to: '/lab-results', color: 'amber' },
                        { icon: <Brain size={20} />, label: 'LifeLens 360', to: '/lifelens', color: 'purple', highlight: true }
                    ].map((item, idx) => {
                        // Color mapping for dynamic styles
                        const colorStyles = {
                            blue: 'bg-blue-50/50 border-blue-100 hover:border-blue-200 hover:shadow-blue-500/10',
                            teal: 'bg-teal-50/50 border-teal-100 hover:border-teal-200 hover:shadow-teal-500/10',
                            rose: 'bg-rose-50/50 border-rose-100 hover:border-rose-200 hover:shadow-rose-500/10',
                            amber: 'bg-amber-50/50 border-amber-100 hover:border-amber-200 hover:shadow-amber-500/10',
                            purple: 'bg-purple-50/80 border-purple-100 shadow-lg shadow-purple-500/10 backdrop-blur-xl hover:shadow-purple-500/20'
                        };

                        const iconStyles = {
                            blue: 'bg-blue-100 text-blue-600',
                            teal: 'bg-teal-100 text-teal-600',
                            rose: 'bg-rose-100 text-rose-600',
                            amber: 'bg-amber-100 text-amber-600',
                            purple: 'bg-purple-100 text-purple-600'
                        };

                        const textStyles = {
                            blue: 'text-blue-900',
                            teal: 'text-teal-900',
                            rose: 'text-rose-900',
                            amber: 'text-amber-900',
                            purple: 'text-purple-900'
                        };

                        return (
                            <Link
                                key={idx}
                                to={item.to}
                                className={`relative p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 group
                                ${colorStyles[item.color] || 'bg-white border-slate-100'}
                                ${item.highlight ? '' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'}
                                overflow-hidden
                            `}
                            >
                                {/* Detailed Decorative Gradient Bar */}
                                <div className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full shadow-sm opacity-60
                                ${item.color === 'blue' ? 'bg-gradient-to-b from-blue-400 to-blue-600' : ''}
                                ${item.color === 'teal' ? 'bg-gradient-to-b from-teal-400 to-teal-600' : ''}
                                ${item.color === 'rose' ? 'bg-gradient-to-b from-rose-400 to-rose-600' : ''}
                                ${item.color === 'amber' ? 'bg-gradient-to-b from-amber-400 to-amber-600' : ''}
                                ${item.color === 'purple' ? 'bg-gradient-to-b from-purple-400 to-purple-600' : ''}
                            `}></div>

                                <div className="flex items-center gap-4 pl-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ${iconStyles[item.color]}`}>
                                        {item.icon}
                                    </div>
                                    <span className={`font-bold text-sm tracking-wide ${textStyles[item.color]}`}>
                                        {item.label}
                                    </span>
                                </div>

                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 bg-white/50 backdrop-blur-sm
                                ${item.color === 'blue' ? 'text-blue-400 group-hover:text-blue-600' : ''}
                                ${item.color === 'teal' ? 'text-teal-400 group-hover:text-teal-600' : ''}
                                ${item.color === 'rose' ? 'text-rose-400 group-hover:text-rose-600' : ''}
                                ${item.color === 'amber' ? 'text-amber-400 group-hover:text-amber-600' : ''}
                                ${item.color === 'purple' ? 'text-purple-500 group-hover:text-purple-700' : ''}
                            `}>
                                    <ChevronRight size={18} />
                                </div>
                            </Link>
                        );
                    })}
                </motion.div>

            </motion.div>

            {/* Floating Action Button (FAB) */}
            <div className="fixed bottom-6 right-6 z-40">
                <AnimatePresence>
                    {isFabOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2 min-w-[160px]"
                        >
                            <Link to="/book-appointment" className="bg-white text-slate-700 shadow-xl rounded-xl p-3 flex items-center gap-3 border border-slate-100 hover:bg-slate-50">
                                <Calendar size={18} className="text-blue-500" />
                                <span className="font-semibold text-sm">Book Visit</span>
                            </Link>
                            <Link to="/log-symptom" className="bg-white text-slate-700 shadow-xl rounded-xl p-3 flex items-center gap-3 border border-slate-100 hover:bg-slate-50">
                                <Stethoscope size={18} className="text-rose-500" />
                                <span className="font-semibold text-sm">Log Health</span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsFabOpen(!isFabOpen)}
                    className={`w-14 h-14 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 ${isFabOpen ? 'bg-slate-800 rotate-45' : 'bg-blue-600'}`}
                >
                    <Plus size={28} />
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
