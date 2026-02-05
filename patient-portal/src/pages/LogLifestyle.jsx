import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import signalsService from '../services/signals.service';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, AlertCircle, TrendingUp, Moon, Droplets, Utensils } from 'lucide-react';

const SLEEP_QUALITIES = [
    { id: 'poor', label: 'Poor', icon: '😫', color: 'bg-rose-100 text-rose-700' },
    { id: 'fair', label: 'Fair', icon: '😕', color: 'bg-orange-100 text-orange-700' },
    { id: 'good', label: 'Good', icon: '🙂', color: 'bg-lime-100 text-lime-700' },
    { id: 'excellent', label: 'Great', icon: '😴', color: 'bg-emerald-100 text-emerald-700' },
];

const ACTIVITY_TYPES = [
    { id: 'sedentary', label: 'Sedentary', icon: '🪑', desc: 'Mostly sitting' },
    { id: 'light', label: 'Light', icon: '🚶', desc: 'Walking, Chores' },
    { id: 'moderate', label: 'Moderate', icon: '🏃', desc: 'Jogging, Cycling' },
    { id: 'active', label: 'Active', icon: '💪', desc: 'Gym, Sports' },
    { id: 'very_active', label: 'Intense', icon: '🏋️', desc: 'HIIT, Heavy Lifting' },
];

const MEAL_QUALITIES = [
    { id: 'poor', label: 'Unhealthy', icon: '🍟', desc: 'Fast food / Skipped' },
    { id: 'fair', label: 'Okay', icon: '🥪', desc: 'Normal mix' },
    { id: 'good', label: 'Balanced', icon: '🥗', desc: 'Veg & Protein' },
    { id: 'excellent', label: 'Perfect', icon: '🥦', desc: 'Very Nutritious' },
];

const LogLifestyle = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('sleep');

    // Sleep data
    const [sleepHours, setSleepHours] = useState(7);
    const [sleepQuality, setSleepQuality] = useState(null);

    // Activity data
    const [activityType, setActivityType] = useState(null);
    const [activityDuration, setActivityDuration] = useState(30);

    // Hydration data
    const [waterGlasses, setWaterGlasses] = useState(4);

    // Meals data
    const [mealCount, setMealCount] = useState(3);
    const [mealQuality, setMealQuality] = useState(null);

    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        // Build lifestyle data based on what's filled
        const lifestyleData = { notes: notes || undefined };

        if (sleepQuality) {
            lifestyleData.sleep = {
                duration: sleepHours,
                quality: sleepQuality,
            };
        }

        if (activityType) {
            lifestyleData.activity = {
                type: activityType,
                duration: activityDuration,
            };
        }

        lifestyleData.hydration = { glasses: waterGlasses };

        if (mealQuality) {
            lifestyleData.meals = {
                count: mealCount,
                quality: mealQuality,
            };
        }

        try {
            await signalsService.logSignal({
                category: 'lifestyle',
                lifestyle: lifestyleData,
            });

            setSuccess('Lifestyle logged successfully!');
            setTimeout(() => {
                navigate('/dashboard', {
                    state: { message: 'Lifestyle logged successfully' }
                });
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to log lifestyle. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabs = [
        { id: 'sleep', label: 'Sleep', icon: <Moon size={18} /> },
        { id: 'activity', label: 'Activity', icon: <TrendingUp size={18} /> },
        { id: 'hydration', label: 'Hydration', icon: <Droplets size={18} /> },
        { id: 'meals', label: 'Meals', icon: <Utensils size={18} /> },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-24 relative overflow-x-hidden">
            {/* Glass Header */}
            <div className="sticky top-0 z-30 glass border-b border-slate-200/50 px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100/50 text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800">New Entry</h1>
                    <div className="w-8"></div> {/* Spacer */}
                </div>

                 {/* Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-6 py-6 max-w-lg mx-auto space-y-6">
                <AnimatePresence mode='wait'>
                    {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-4 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 text-sm font-semibold">{error}</motion.div>}
                    {success && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-4 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-sm font-semibold">{success}</motion.div>}

                    {/* Sleep Tab */}
                    {activeTab === 'sleep' && (
                        <motion.div key="sleep" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                            <div className="card-premium p-6 bg-white mb-6">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Moon className="text-indigo-500" /> Sleep Duration</h3>
                                <div className="text-center mb-8">
                                    <span className="text-6xl font-extrabold text-slate-800 tracking-tighter">
                                        {sleepHours}
                                    </span>
                                    <span className="text-lg text-slate-400 font-medium ml-1">hrs</span>
                                </div>
                                <input
                                    type="range" min="0" max="12" step="0.5"
                                    value={sleepHours}
                                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                                    className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-xs font-bold text-slate-300 mt-2 px-1">
                                    <span>0H</span><span>6H</span><span>12H</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {SLEEP_QUALITIES.map((quality) => (
                                    <button
                                        key={quality.id}
                                        onClick={() => setSleepQuality(quality.id)}
                                        className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200 border
                                            ${sleepQuality === quality.id ? `${quality.color} border-transparent ring-2 ring-indigo-500 ring-offset-2` : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'}
                                        `}
                                    >
                                        <span className="text-2xl">{quality.icon}</span>
                                        <span className="font-semibold text-xs uppercase tracking-wider">{quality.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                            <div className="space-y-3 mb-6">
                                {ACTIVITY_TYPES.map((activity) => (
                                    <button
                                        key={activity.id}
                                        onClick={() => setActivityType(activity.id)}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 border text-left
                                            ${activityType === activity.id
                                                ? 'bg-rose-50 border-rose-200 shadow-md transform scale-[1.02]'
                                                : 'bg-white border-slate-100'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${activityType === activity.id ? 'bg-rose-100' : 'bg-slate-50' }`}>
                                            {activity.icon}
                                        </div>
                                        <div>
                                            <span className={`font-bold block text-sm ${activityType === activity.id ? 'text-rose-900' : 'text-slate-800'}`}>
                                                {activity.label}
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium">
                                                {activity.desc}
                                            </span>
                                        </div>
                                        {activityType === activity.id && <Check size={20} className="ml-auto text-rose-500" />}
                                    </button>
                                ))}
                            </div>

                            {activityType && activityType !== 'sedentary' && (
                                <div className="card-premium p-6 bg-white animate-in slide-in-from-bottom-4 fade-in duration-300">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="text-rose-500" /> Duration (mins)</h3>
                                    <div className="flex items-end justify-center gap-2 mb-6">
                                        <span className="text-5xl font-extrabold text-slate-800">{activityDuration}</span>
                                        <span className="text-lg text-slate-400 font-medium mb-1">min</span>
                                    </div>
                                    <input
                                        type="range" min="5" max="180" step="5"
                                        value={activityDuration}
                                        onChange={(e) => setActivityDuration(parseInt(e.target.value, 10))}
                                        className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-rose-500"
                                    />
                                    <div className="flex justify-between text-xs font-bold text-slate-300 mt-2 px-1">
                                        <span>5m</span><span>90m</span><span>3h</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Hydration Tab */}
                    {activeTab === 'hydration' && (
                        <motion.div key="hydration" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                            <div className="card-premium p-8 bg-sky-50 border-sky-100 mb-6 text-center relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20"></div>
                                
                                <span className="text-7xl font-extrabold text-sky-600 block mb-1">{waterGlasses}</span>
                                <span className="text-sm font-bold text-sky-400 uppercase tracking-widest">Glasses</span>
                                
                                <div className="flex justify-center gap-6 mt-8">
                                    <button
                                        onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                                        className="w-16 h-16 rounded-2xl bg-white text-sky-600 text-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-center font-bold"
                                    >
                                        −
                                    </button>
                                    <button
                                        onClick={() => setWaterGlasses(Math.min(20, waterGlasses + 1))}
                                        className="w-16 h-16 rounded-2xl bg-sky-500 text-white text-3xl shadow-lg shadow-sky-500/30 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                {[4, 6, 8, 10].map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => setWaterGlasses(preset)}
                                        className={`py-3 rounded-xl text-sm font-bold transition-all border
                                            ${waterGlasses === preset
                                                ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20'
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                                            }`}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Meals Tab */}
                    {activeTab === 'meals' && (
                        <motion.div key="meals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                            <div className="card-premium p-6 bg-white mb-6">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 block">Total Meals</label>
                                <div className="flex justify-between gap-2">
                                    {[1, 2, 3, 4, 5].map((count) => (
                                        <button
                                            key={count}
                                            onClick={() => setMealCount(count)}
                                            className={`w-12 h-14 rounded-2xl text-lg font-bold transition-all flex items-center justify-center border
                                                ${mealCount === count
                                                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20 scale-110'
                                                    : 'bg-slate-50 border-slate-100 text-slate-400'
                                                }`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {MEAL_QUALITIES.map((quality) => (
                                    <button
                                        key={quality.id}
                                        onClick={() => setMealQuality(quality.id)}
                                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border text-left
                                            ${mealQuality === quality.id
                                                ? 'bg-orange-50 border-orange-200 shadow-sm'
                                                : 'bg-white border-slate-100 opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <div className="text-2xl">{quality.icon}</div>
                                        <div>
                                            <span className={`font-bold block text-sm ${mealQuality === quality.id ? 'text-orange-900' : 'text-slate-700'}`}>
                                                {quality.label}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {quality.desc}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Notes & Submit */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                         <div className="mt-8 pt-8 border-t border-slate-100">
                             <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add a note about today..."
                                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none text-slate-700 text-sm min-h-[100px] mb-4"
                            />

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <span className="text-white/80">Saving...</span> : <><Check size={20} /> Save Entry</>}
                            </button>
                         </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LogLifestyle;
