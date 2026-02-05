import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import signalsService from '../services/signals.service';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Stethoscope, Smile, TrendingUp, Activity, Filter, Trash2, Calendar, Clock, Droplets, Utensils, Moon } from 'lucide-react';

const CATEGORY_CONFIG = {
    symptom: { icon: <Stethoscope size={20} />, label: 'Symptom', color: 'bg-rose-50 text-rose-600 border-rose-100', accent: 'border-rose-500' },
    mood: { icon: <Smile size={20} />, label: 'Mood', color: 'bg-amber-50 text-amber-600 border-amber-100', accent: 'border-amber-500' },
    lifestyle: { icon: <TrendingUp size={20} />, label: 'Lifestyle', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', accent: 'border-emerald-500' },
    vitals: { icon: <Activity size={20} />, label: 'Vitals', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', accent: 'border-indigo-500' },
};

const SEVERITY_COLORS = {
    mild: 'bg-emerald-100 text-emerald-700',
    moderate: 'bg-amber-100 text-amber-700',
    severe: 'bg-rose-100 text-rose-700',
};

const MOOD_ICONS = {
    great: '😄',
    good: '🙂',
    okay: '😐',
    low: '😔',
    bad: '😞',
};

const SignalHistory = () => {
    const navigate = useNavigate();
    const [signals, setSignals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        fetchSignals();
    }, [activeFilter]);

    const fetchSignals = async (page = 1) => {
        setIsLoading(true);
        setError('');

        try {
            const params = { page, limit: 20 };
            if (activeFilter !== 'all') {
                params.category = activeFilter;
            }

            const result = await signalsService.getSignals(params);
            setSignals(result.data || []);
            setPagination(result.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load history');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;

        try {
            await signalsService.deleteSignal(id);
            setSignals(signals.filter((s) => s._id !== id));
        } catch (err) {
            setError('Failed to delete entry');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const renderSignalContent = (signal) => {
        switch (signal.category) {
            case 'symptom':
                return (
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <h3 className="font-bold text-slate-800 capitalize text-lg">
                                {signal.symptom?.type?.replace(/_/g, ' ')}
                            </h3>
                            <span className={`text-[10px] font-bold uppercase trackin-wider px-2 py-1 rounded-full ${SEVERITY_COLORS[signal.symptom?.severity] || 'bg-slate-100 text-slate-500'}`}>
                                {signal.symptom?.severity}
                            </span>
                        </div>
                       
                        <div className="flex items-center gap-2 mt-1 text-xs font-medium text-slate-400">
                            {signal.symptom?.duration && (
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {signal.symptom.duration.value} {signal.symptom.duration.unit}
                                </span>
                            )}
                        </div>
                        {signal.symptom?.notes && (
                            <p className="text-sm mt-3 pt-3 border-t border-slate-50 text-slate-600 italic">
                                "{signal.symptom.notes}"
                            </p>
                        )}
                    </div>
                );

            case 'mood':
                return (
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                            <span className="text-2xl filter drop-shadow-sm">{MOOD_ICONS[signal.mood?.type] || '😐'}</span>
                            <span className="capitalize">{signal.mood?.type}</span>
                        </h3>
                        {signal.mood?.stressLevel && (
                             <div className="mt-2 text-xs font-medium flex items-center gap-2">
                                <span className="text-slate-400">Stress Level:</span>
                                <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${signal.mood.stressLevel > 7 ? 'bg-red-500' : signal.mood.stressLevel > 4 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                        style={{width: `${signal.mood.stressLevel * 10}%`}}
                                    ></div>
                                </div>
                                <span className="text-slate-600">{signal.mood.stressLevel}/10</span>
                            </div>
                        )}
                        {signal.mood?.notes && (
                             <p className="text-sm mt-3 pt-3 border-t border-slate-50 text-slate-600 italic">
                                "{signal.mood.notes}"
                            </p>
                        )}
                    </div>
                );

            case 'lifestyle':
                return (
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 mb-3">Daily Log</h3>
                        <div className="grid grid-cols-2 gap-2">
                             {signal.lifestyle?.sleep && (
                                <div className="bg-indigo-50 rounded-lg p-2 text-xs text-indigo-700 flex items-center gap-2">
                                    <Moon size={14} />
                                    <span>{signal.lifestyle.sleep.duration}h <span className="opacity-70">({signal.lifestyle.sleep.quality})</span></span>
                                </div>
                            )}
                            {signal.lifestyle?.activity && (
                                <div className="bg-rose-50 rounded-lg p-2 text-xs text-rose-700 flex items-center gap-2">
                                    <Activity size={14} />
                                    <span className="truncate max-w-[100px]">{signal.lifestyle.activity.duration}m {signal.lifestyle.activity.type}</span>
                                </div>
                            )}
                             {signal.lifestyle?.hydration && (
                                <div className="bg-sky-50 rounded-lg p-2 text-xs text-sky-700 flex items-center gap-2">
                                    <Droplets size={14} />
                                    <span>{signal.lifestyle.hydration.glasses} glasses</span>
                                </div>
                            )}
                             {signal.lifestyle?.meals && (
                                <div className="bg-orange-50 rounded-lg p-2 text-xs text-orange-700 flex items-center gap-2">
                                    <Utensils size={14} />
                                    <span>{signal.lifestyle.meals.count} meals</span>
                                </div>
                            )}
                        </div>
                       
                        {signal.lifestyle?.notes && (
                             <p className="text-sm mt-3 pt-3 border-t border-slate-50 text-slate-600 italic">
                                "{signal.lifestyle.notes}"
                            </p>
                        )}
                    </div>
                );

            case 'vitals':
                const vitalItems = [];
                if (signal.vitals?.bloodPressure) {
                    vitalItems.push({ label: 'BP', value: `${signal.vitals.bloodPressure.systolic}/${signal.vitals.bloodPressure.diastolic}`, unit: '' });
                }
                if (signal.vitals?.heartRate) {
                    vitalItems.push({ label: 'HR', value: signal.vitals.heartRate, unit: 'bpm' });
                }
                if (signal.vitals?.temperature) {
                    vitalItems.push({ label: 'Temp', value: signal.vitals.temperature, unit: '°C' });
                }
                return (
                    <div className="flex-1">
                         <h3 className="font-bold text-slate-800 mb-3">Vitals Check</h3>
                         <div className="flex gap-3 flex-wrap">
                            {vitalItems.map((item, i) => (
                                <div key={i} className="flex flex-col items-center bg-slate-50 border border-slate-100 p-2 rounded-xl min-w-[60px]">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
                                    <span className="font-bold text-slate-800">{item.value} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span></span>
                                </div>
                            ))}
                         </div>
                    </div>
                );

            default:
                return <p>Unknown signal type</p>;
        }
    };

    const filters = [
        { id: 'all', label: 'All', icon: <Filter size={16} /> },
        { id: 'symptom', label: 'Symptoms', icon: <Stethoscope size={16} /> },
        { id: 'mood', label: 'Mood', icon: <Smile size={16} /> },
        { id: 'lifestyle', label: 'Lifestyle', icon: <TrendingUp size={16} /> },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-24 relative overflow-x-hidden">
            {/* Glass Header */}
             <div className="sticky top-0 z-30 glass border-b border-slate-200/50 px-4 pt-4 pb-2">
                 <div className="flex items-center justify-between mb-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100/50 text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-bold text-slate-800">History</h1>
                        <p className="text-xs font-medium text-slate-500">{pagination.total} Entr{pagination.total === 1 ? 'y' : 'ies'}</p>
                    </div>
                    <div className="w-8"></div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border
                                ${activeFilter === filter.id
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {filter.icon} {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 py-6 max-w-lg mx-auto">
                <AnimatePresence mode='wait'>
                    {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="alert alert-error mb-4">{error}</motion.div>}

                    {isLoading ? (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center py-20 gap-4">
                             <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                             <p className="text-sm font-medium text-slate-400">Loading your history...</p>
                         </motion.div>
                    ) : signals.length === 0 ? (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-20 px-8">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                📝
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">No entries found</h2>
                            <p className="text-slate-500 mb-8 text-sm">
                                Entries you create will appear here. Start by logging your first symptom or mood.
                            </p>
                            <Link to="/dashboard" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform inline-block">
                                Go to Dashboard
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {signals.map((signal, idx) => {
                                const config = CATEGORY_CONFIG[signal.category] || { icon: <Activity />, label: 'Signal', color: 'bg-slate-100', accent: 'border-slate-200' };
                                return (
                                    <motion.div 
                                        key={signal._id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="card-premium p-0 bg-white overflow-hidden group hover:shadow-md transition-shadow"
                                    >
                                        <div className={`h-1 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-20 ${config.color.split(' ')[1]}`}></div>
                                        <div className="p-5 flex items-start gap-4">
                                            {/* Icon Box */}
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 border ${config.color}`}>
                                                {config.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Calendar size={10} /> {formatDate(signal.recordedAt)}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDelete(signal._id)}
                                                        className="text-slate-300 hover:text-rose-500 transition-colors p-1 -mt-1 -mr-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                
                                                {renderSignalContent(signal)}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center gap-4 mt-8">
                        <button
                            onClick={() => fetchSignals(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs disabled:opacity-50 hover:bg-slate-50 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-xs font-medium text-slate-400">
                             {pagination.page} / {pagination.pages}
                        </span>
                        <button
                            onClick={() => fetchSignals(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs disabled:opacity-50 hover:bg-slate-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignalHistory;
