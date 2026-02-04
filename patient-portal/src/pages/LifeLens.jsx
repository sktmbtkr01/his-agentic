import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, Moon, Calendar, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import HealthChart from '../components/analytics/HealthChart';
import InsightCard from '../components/analytics/InsightCard';

const LifeLens = () => {
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
        { id: '7d', label: '7 Days' },
        { id: '30d', label: '30 Days' },
        { id: '3m', label: '3 Months' }
    ];

    return (
        <div className="page-container pb-20 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-6 pb-24">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="text-white/80" /> LifeLens 360
                    </h1>
                    <Link to="/dashboard" className="text-white/80 hover:text-white text-sm font-medium">Dashboard</Link>
                </div>
                <p className="text-white/90 text-lg font-light max-w-xs">
                    Synthesizing your health signals into actionable intelligence.
                </p>
            </div>

            <div className="-mt-16 px-4 space-y-6">

                {/* Time Range Selector */}
                <div className="bg-white/20 backdrop-blur-md p-1 rounded-xl flex gap-1 w-fit border border-white/30">
                    {ranges.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setRange(r.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${range === r.id
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-white/80 hover:bg-white/10'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="spinner mx-auto mb-4 w-8 h-8 border-indigo-500 border-t-transparent"></div>
                        <p className="text-slate-500">Analyzing your health patterns...</p>
                    </div>
                ) : (
                    <>
                        {/* Insights Section */}
                        {data?.insights && data.insights.length > 0 && (
                            <section className="space-y-3">
                                {data.insights.map((insight, idx) => (
                                    <InsightCard
                                        key={idx}
                                        type={insight.type}
                                        message={insight.message}
                                    />
                                ))}
                            </section>
                        )}

                        {/* Charts Grid */}
                        <div className="grid gap-6 md:grid-cols-2">

                            {/* Vitals Chart */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Heart Health</h3>
                                        <p className="text-xs text-slate-400">Blood Pressure & Heart Rate</p>
                                    </div>
                                </div>
                                <HealthChart
                                    data={data?.trends}
                                    keys={[
                                        { dataKey: 'systolic', name: 'Systolic BP' },
                                        { dataKey: 'diastolic', name: 'Diastolic BP' },
                                        { dataKey: 'heartRate', name: 'Heart Rate' }
                                    ]}
                                    colors={['#ef4444', '#f97316', '#8b5cf6']}
                                />
                            </motion.div>

                            {/* Sleep & Mood Correlation */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                                        <Moon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Sleep & Mood</h3>
                                        <p className="text-xs text-slate-400">Correlation Analysis</p>
                                    </div>
                                </div>
                                <HealthChart
                                    type="area"
                                    data={data?.trends}
                                    keys={[
                                        { dataKey: 'moodScore', name: 'Mood Score (1-5)' },
                                        { dataKey: 'sleepHours', name: 'Sleep Hours' }
                                    ]}
                                    colors={['#fbbf24', '#6366f1']}
                                />
                            </motion.div>

                            {/* Weight Trend */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                            >
                                <h3 className="font-bold text-slate-800 mb-4">Weight Trend</h3>
                                <HealthChart
                                    data={data?.trends}
                                    keys={[
                                        { dataKey: 'weight', name: 'Weight (kg)' }
                                    ]}
                                    colors={['#10b981']}
                                    height={200}
                                />
                            </motion.div>

                        </div>

                        {/* CTA */}
                        <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">More data = Better insights</h3>
                                    <p className="text-sm">Keep logging your vitals to unlock deeper implementation.</p>
                                </div>
                                <Link to="/log-symptom" className="p-3 bg-white text-slate-900 rounded-full hover:bg-slate-100 transition-colors">
                                    <ArrowRight size={20} />
                                </Link>
                            </div>
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LifeLens;
