import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import HealthScoreCard from '../components/HealthScoreCard';
import SmartMetricsGrid from '../components/SmartMetricsGrid';
import VitalsCard from '../components/VitalsCard';
import WellnessHero from '../components/WellnessHero';
import FloatingNavBar from '../components/FloatingNavBar';
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
    Check,
    X,
    LogOut
} from 'lucide-react';

const Dashboard = () => {
    const { patient, logout } = useAuth();
    const [nudges, setNudges] = useState([]);
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [vitalsData, setVitalsData] = useState(null);
    const [vitalsLoading, setVitalsLoading] = useState(true);

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
             document.body.style.overflow = 'unset';
        };
    }, [isDrawerOpen]);

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
        { label: 'Symptom', icon: <Stethoscope size={20} />, to: '/log-symptom', cardBg: 'bg-gradient-to-br from-rose-50 to-white', iconColor: 'text-rose-500', borderColor: 'border-rose-100', iconBg: 'bg-white shadow-rose-100' },
        { label: 'Mood', icon: <Smile size={20} />, to: '/log-mood', cardBg: 'bg-gradient-to-br from-amber-50 to-white', iconColor: 'text-amber-500', borderColor: 'border-amber-100', iconBg: 'bg-white shadow-amber-100' },
        { label: 'Lifestyle', icon: <Activity size={20} />, to: '/log-lifestyle', cardBg: 'bg-gradient-to-br from-emerald-50 to-white', iconColor: 'text-emerald-600', borderColor: 'border-emerald-100', iconBg: 'bg-white shadow-emerald-100' },
        { label: 'History', icon: <FileText size={20} />, to: '/history', cardBg: 'bg-gradient-to-br from-blue-50 to-white', iconColor: 'text-blue-600', borderColor: 'border-blue-100', iconBg: 'bg-white shadow-blue-100' },
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
        <div className="min-h-screen bg-bone-100 relative">
            <div className="max-w-md mx-auto bg-bone-100 min-h-screen pb-32 px-5 pt-6 shadow-2xl shadow-bone-300/20">
                
                <WellnessHero onMenuClick={() => setIsDrawerOpen(true)} />

                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">
                    
                    {/* 1. Health Score Section */}
                    <motion.div variants={itemVariants}>
                        <HealthScoreCard />
                    </motion.div>

                    {/* 2. Daily Vitals (Grid Layout) */}
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-lg font-serif font-bold text-sage-900 flex items-center gap-2">
                                Daily Vitals
                                <span className="w-1.5 h-1.5 rounded-full bg-peach-500"></span>
                            </h2>
                            <Link to="/devices" className="text-sm font-semibold text-peach-600 hover:text-peach-700">See All</Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {vitalsLoading ? (
                                <>
                                    <div className="bg-white p-4 rounded-3xl border border-bone-200 shadow-sm h-32 animate-pulse" />
                                    <div className="bg-white p-4 rounded-3xl border border-bone-200 shadow-sm h-32 animate-pulse" />
                                </>
                            ) : vitalsData?.hasDevice ? (
                                <>
                                    <Link to="/devices" className="block"><VitalsCard type="heart" value={vitalsData.vitals?.heartRate} unit="bpm" label="Heart Rate" status="Synced" /></Link>
                                    <Link to="/devices" className="block"><VitalsCard type="sleep" value={vitalsData.lifestyle?.sleepHours?.toFixed(1)} unit="hrs" label="Sleep" status={vitalsData.lifestyle?.sleepQuality || 'N/A'} /></Link>
                                    <Link to="/devices" className="block"><VitalsCard type="steps" value={vitalsData.lifestyle?.steps?.toLocaleString()} unit="steps" label="Daily Steps" status="Today" /></Link>
                                    <Link to="/devices" className="flex flex-col items-center justify-center bg-sage-50 rounded-[24px] border border-sage-100 shadow-soft hover:shadow-lg transition-all min-h-[180px] group relative overflow-hidden">
                                         <div className="absolute inset-0 bg-sage-100/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="p-4 rounded-full bg-white text-sage-400 shadow-sm mb-3 group-hover:scale-110 transition-transform z-10">
                                            <Activity size={24} />
                                        </div>
                                        <span className="text-xs font-bold text-sage-500 uppercase tracking-widest z-10">More Metrics</span>
                                     </Link>
                                </>
                            ) : (
                                <Link to="/devices" className="col-span-2 p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center text-center gap-2">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600"><Activity size={20} /></div>
                                    <div><h3 className="font-bold text-indigo-900 text-sm">Connect a Wearable</h3><p className="text-xs text-indigo-600">Track heart rate, sleep & more</p></div>
                                </Link>
                            )}
                        </div>
                    </motion.div>

                    {/* 3. Quick Actions */}
                    <motion.div variants={itemVariants}>
                         <div className="grid grid-cols-4 gap-3">
                            {quickActions.map((action, i) => (
                                <Link key={i} to={action.to} className={`flex flex-col items-center justify-between p-3 rounded-[24px] border ${action.cardBg} ${action.borderColor} shadow-soft active:scale-95 transition-all min-h-[110px]`}>
                                    <div className={`p-2.5 rounded-2xl shadow-sm ${action.iconBg} ${action.iconColor}`}>
                                        {action.icon}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${action.iconColor} opacity-90 mt-2`}>{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    {/* 4. Proactive Alerts */}
                    <motion.div variants={itemVariants}>
                        <ProactiveAlertsCard compact maxAlerts={3} />
                    </motion.div>

                    {/* 5. Health Actions / Nudges */}
                    <motion.div variants={itemVariants}>
                         <h3 className="text-lg font-serif font-bold text-sage-900 mb-4 px-1">Health Actions</h3>
                         <div className="space-y-3">
                            <AnimatePresence>
                                {nudges.length > 0 ? (
                                    nudges.map((nudge) => (
                                        <SmartNudgeCard
                                            key={nudge._id}
                                            nudge={nudge}
                                            onRespond={handleNudgeResponse}
                                        />
                                    ))
                                ) : (
                                    <div className="p-6 text-center bg-white/50 border-dashed border-2 border-bone-200 rounded-3xl">
                                        <div className="w-10 h-10 bg-sage-100 text-sage-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Check size={20} />
                                        </div>
                                        <p className="font-semibold text-sage-700 text-sm">All Caught Up!</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                </motion.div>
            </div>
            
            <FloatingNavBar />

            {/* Floating Action Button (FAB) */}
            <div className="fixed bottom-24 right-4 z-40">
                <AnimatePresence>
                    {isFabOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2 min-w-[170px]"
                        >
                            <Link to="/book-appointment" className="bg-white text-sage-900 shadow-xl rounded-2xl p-3 flex items-center gap-3 border border-sage-100">
                                <Calendar size={18} className="text-peach-500" />
                                <span className="font-semibold text-sm">Book Visit</span>
                            </Link>
                            <Link to="/log-symptom" className="bg-white text-sage-900 shadow-xl rounded-2xl p-3 flex items-center gap-3 border border-sage-100">
                                <Stethoscope size={18} className="text-rose-500" />
                                <span className="font-semibold text-sm">Log Health</span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsFabOpen(!isFabOpen)}
                    className={`w-14 h-14 rounded-full shadow-2xl shadow-peach-500/30 flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 ${isFabOpen ? 'bg-sage-800 rotate-45' : 'bg-peach-500'}`}
                >
                    <Plus size={28} />
                </button>
            </div>

            {/* Side Drawer Menu */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Backdrop overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDrawerOpen(false)}
                            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        />
                        
                        {/* Drawer content */}
                        <motion.div 
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl rounded-l-[32px] overflow-hidden flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="p-6 bg-sage-50 flex justify-between items-center border-b border-sage-100">
                                <div>
                                    <h2 className="text-xl font-serif font-bold text-sage-900">Menu</h2>
                                    <p className="text-xs text-sage-500 font-medium">Quick Access</p>
                                </div>
                                <button 
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sage-500 hover:text-sage-800 shadow-sm transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Drawer Items */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Profile Summary */}
                                <div className="flex items-center gap-4 mb-6 p-4 bg-sage-50 rounded-[24px] border border-sage-100">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                         <img 
                                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${patient?.firstName || 'User'}&backgroundColor=e3e4db`} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sage-900">{patient?.firstName || 'User'} {patient?.lastName}</h3>
                                        <Link to="/profile" className="text-xs font-semibold text-peach-600 hover:text-peach-700">View Profile</Link>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { icon: <User size={20} />, label: 'My Profile', to: '/profile', color: 'bg-blue-50 text-blue-600' },
                                        { icon: <Calendar size={20} />, label: 'Appointments', to: '/appointments', color: 'bg-teal-50 text-teal-600' },
                                        { icon: <Pill size={20} />, label: 'Prescriptions', to: '/prescriptions', color: 'bg-rose-50 text-rose-600' },
                                        { icon: <FileText size={20} />, label: 'Lab Results', to: '/lab-results', color: 'bg-amber-50 text-amber-600' },
                                        { icon: <Brain size={20} />, label: 'LifeLens 360', to: '/lifelens', color: 'bg-purple-50 text-purple-600', highlight: true }
                                    ].map((item, idx) => (
                                         <Link 
                                            key={idx} 
                                            to={item.to} 
                                            onClick={() => setIsDrawerOpen(false)}
                                            className={`flex items-center justify-between p-4 rounded-[24px] bg-white border border-stone-100 shadow-soft hover:shadow-lg transition-all active:scale-95 ${item.highlight ? 'ring-2 ring-purple-100 bg-purple-50/30' : ''}`}
                                         >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                                                    {item.icon}
                                                </div>
                                                <span className="font-bold text-sage-900 text-sm">{item.label}</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-300">
                                                <ChevronRight size={18} />
                                            </div>
                                         </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-6 border-t border-stone-100 bg-stone-50">
                                <button 
                                    onClick={logout}
                                    className="w-full py-3 rounded-full bg-white border border-stone-200 text-stone-600 font-bold shadow-sm hover:bg-stone-100 flex items-center justify-center gap-2"
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                                <p className="text-center text-[10px] text-stone-400 mt-4">
                                    LifelineX v5.0 • &copy; 2026
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Dashboard;
