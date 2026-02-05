import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, Moon, Calendar, ChevronLeft, Info, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import HealthChart from '../components/analytics/HealthChart';
import InsightCard from '../components/analytics/InsightCard';

const LifeLens = () => {
    const navigate = useNavigate();
    const [range, setRange] = useState('30d');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [range]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await analyticsService.getHealthTrends(range);
            setData(result.data);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const ranges = [
        { id: '7d', label: '7D' },
        { id: '30d', label: '30D' },
        { id: '3m', label: '3M' }
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
                    <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Brain className="text-indigo-600" size={20} /> LifeLens 360
                    </h1>
                     <button className="p-2 -mr-2 rounded-full hover:bg-slate-100/50 text-slate-400 transition-colors">
                        <Info size={20} />
                    </button>
                </div>

                {/* Range Selector */}
                <div className="flex p-1 bg-slate-100/80 rounded-xl backdrop-blur-sm max-w-xs mx-auto">
                    {ranges.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setRange(r.id)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${range === r.id
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-600'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto">
                <AnimatePresence mode="wait">
                    {loading ? (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center justify-center py-20 gap-4">
                             <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                             <p className="text-sm font-medium text-slate-400">Analyzing signals...</p>
                         </motion.div>
                    ) : (
                        <>
                            {/* Insights Section */}
                            {data?.insights && data.insights.length > 0 && (
                                <motion.section 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3"
                                >
                                    {data.insights.map((insight, idx) => (
                                        <InsightCard
                                            key={idx}
                                            type={insight.type}
                                            message={insight.message}
                                        />
                                    ))}
                                </motion.section>
                            )}

                            {/* Vitals Chart */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="card-premium p-5 bg-white"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">Heart Health</h3>
                                        <p className="text-xs text-slate-400 font-medium">Blood Pressure & Heart Rate</p>
                                    </div>
                                </div>
                                <HealthChart
                                    data={data?.trends}
                                    keys={[
                                        { dataKey: 'systolic', name: 'Systolic' },
                                        { dataKey: 'diastolic', name: 'Diastolic' },
                                        { dataKey: 'heartRate', name: 'HR' }
                                    ]}
                                    colors={['#f43f5e', '#fb923c', '#8b5cf6']}
                                />
                            </motion.div>

                            {/* Sleep & Mood Correlation */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="card-premium p-5 bg-white"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl">
                                        <Moon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">Sleep & Mood</h3>
                                        <p className="text-xs text-slate-400 font-medium">Correlation Analysis</p>
                                    </div>
                                </div>
                                <HealthChart
                                    type="area"
                                    data={data?.trends}
                                    keys={[
                                        { dataKey: 'moodScore', name: 'Mood' },
                                        { dataKey: 'sleepHours', name: 'Sleep' }
                                    ]}
                                    colors={['#fbbf24', '#6366f1']}
                                />
                            </motion.div>

                            {/* Weight Trend */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="card-premium p-5 bg-white"
                            >
                                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Weight Trend</h3>
                                <HealthChart
                                    data={data?.trends}
                                    keys={[
                                        { dataKey: 'weight', name: 'Weight (kg)' }
                                    ]}
                                    colors={['#10b981']}
                                    height={200}
                                />
                            </motion.div>

                            {/* CTA */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="bg-slate-900 text-slate-300 p-6 rounded-3xl relative overflow-hidden shadow-xl shadow-slate-900/10"
                            >
                                <div className="relative z-10 flex justify-between items-center">
                                    <div className="pr-4">
                                        <h3 className="text-white font-bold text-lg mb-1">More data = Better insights</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">Keep logging your vitals to unlock deeper health patterns and AI predictions.</p>
                                    </div>
                                    <Link to="/log-symptom" className="p-3 bg-white text-slate-900 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10">
                                        <ArrowRight size={20} />
                                    </Link>
                                </div>
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LifeLens;
