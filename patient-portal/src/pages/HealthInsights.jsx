/**
 * Health Insights Page
 * Phase 4: Comprehensive trend analysis and predictive insights
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Heart,
    Activity,
    Moon,
    Smile,
    Frown,
    Brain,
    Zap,
    AlertTriangle,
    CheckCircle,
    ChevronRight,
    RefreshCw,
    Calendar,
    BarChart3,
    LineChart,
    PieChart,
} from 'lucide-react';
import ProactiveAlertsCard from '../components/predictive/ProactiveAlertsCard';
import TrendChart from '../components/predictive/TrendChart';
import predictiveService from '../services/predictiveService';

const MetricCard = ({ title, icon: Icon, color, value, trend, subtitle, dataPoints, onClick }) => {
    const trendColor = trend?.direction === 'increasing'
        ? 'text-emerald-500'
        : trend?.direction === 'decreasing'
            ? 'text-red-500'
            : 'text-slate-400';

    const TrendIcon = trend?.direction === 'increasing'
        ? TrendingUp
        : trend?.direction === 'decreasing'
            ? TrendingDown
            : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`card-premium p-4 bg-white cursor-pointer`}
            onClick={onClick}
        >
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                    <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
            </div>

            {/* Value */}
            <div className="flex items-end justify-between mb-2">
                <div>
                    <span className="text-2xl font-bold text-slate-800">{value}</span>
                    {TrendIcon && (
                        <span className={`inline-flex items-center gap-1 ml-2 text-xs font-medium ${trendColor}`}>
                            <TrendIcon size={14} />
                            {Math.abs(trend.percentChange || 0)}%
                        </span>
                    )}
                </div>
            </div>

            {/* Mini chart */}
            {dataPoints && dataPoints.length > 0 && (
                <TrendChart
                    dataPoints={dataPoints}
                    color={color.includes('indigo') ? '#6366f1' :
                        color.includes('rose') ? '#f43f5e' :
                            color.includes('amber') ? '#f59e0b' :
                                color.includes('emerald') ? '#10b981' : '#6366f1'}
                    height={30}
                    showTrend={false}
                    label={title}
                />
            )}
        </motion.div>
    );
};

const InsightCard = ({ insight }) => {
    const navigate = useNavigate();

    const severityStyles = {
        positive: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        neutral: 'bg-slate-50 border-slate-100 text-slate-700',
        warning: 'bg-amber-50 border-amber-100 text-amber-700',
        alert: 'bg-red-50 border-red-100 text-red-700',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-xl border ${severityStyles[insight.type] || severityStyles.neutral}`}
        >
            <div className="flex gap-3">
                <div className="flex-shrink-0">
                    {insight.type === 'positive' && <CheckCircle size={20} className="text-emerald-500" />}
                    {insight.type === 'warning' && <AlertTriangle size={20} className="text-amber-500" />}
                    {insight.type === 'alert' && <AlertTriangle size={20} className="text-red-500" />}
                    {insight.type === 'neutral' && <Brain size={20} className="text-slate-500" />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium">{insight.message}</p>
                    {insight.action && (
                        <button
                            onClick={() => navigate(insight.action.route)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
                        >
                            {insight.action.label}
                            <ChevronRight size={12} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const HealthInsights = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [vitalTrends, setVitalTrends] = useState(null);
    const [moodTrends, setMoodTrends] = useState(null);
    const [scoreTrends, setScoreTrends] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState(7); // days

    const fetchData = async () => {
        try {
            const [summaryRes, vitalsRes, moodRes, scoreRes] = await Promise.all([
                predictiveService.getSummary(),
                predictiveService.getVitalTrends(timeRange),
                predictiveService.getMoodTrends(timeRange),
                predictiveService.getHealthScoreTrends(timeRange),
            ]);

            if (summaryRes.success) setSummary(summaryRes.data);
            if (vitalsRes.success) setVitalTrends(vitalsRes.data);
            if (moodRes.success) setMoodTrends(moodRes.data);
            if (scoreRes.success) setScoreTrends(scoreRes.data);
        } catch (err) {
            console.error('Failed to fetch health insights:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await predictiveService.runAnalysis();
            await fetchData();
        } catch (err) {
            console.error('Failed to refresh:', err);
        } finally {
            setRefreshing(false);
        }
    };

    // Generate insights from data
    const insights = [];

    if (scoreTrends?.significantDecline) {
        insights.push({
            type: 'warning',
            message: `Your health score has dropped ${Math.abs(scoreTrends.declinePercent)}% this week. Let's work on improving it!`,
            action: { label: 'Log signals', route: '/dashboard' },
        });
    } else if (scoreTrends?.trend?.direction === 'increasing') {
        insights.push({
            type: 'positive',
            message: 'Great progress! Your health score is trending upward.',
        });
    }

    if (moodTrends?.consecutiveBadMoods >= 2) {
        insights.push({
            type: 'warning',
            message: `You've been feeling low for ${moodTrends.consecutiveBadMoods} consecutive days. Consider talking to someone or trying relaxation techniques.`,
            action: { label: 'Log mood', route: '/log/mood' },
        });
    }

    if (summary?.vitals?.anomalyCount > 0) {
        insights.push({
            type: 'alert',
            message: `${summary.vitals.anomalyCount} unusual vital readings detected this week. Keep monitoring.`,
            action: { label: 'View details', route: '/device-sync' },
        });
    }

    if (moodTrends?.averageStress && moodTrends.averageStress > 7) {
        insights.push({
            type: 'warning',
            message: `Your average stress level (${moodTrends.averageStress}/10) is quite high. Try to find time for relaxation.`,
        });
    }

    if (insights.length === 0) {
        insights.push({
            type: 'positive',
            message: 'Your health metrics look stable! Keep maintaining your healthy habits.',
        });
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] p-6">
                <div className="max-w-lg mx-auto space-y-4">
                    <div className="h-12 bg-white rounded-xl animate-pulse" />
                    <div className="h-48 bg-white rounded-2xl animate-pulse" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-32 bg-white rounded-2xl animate-pulse" />
                        <div className="h-32 bg-white rounded-2xl animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-8">
            {/* Header */}
            <div className="sticky top-0 z-30 glass border-b border-b-slate-200/50 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={22} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
                                Health Insights
                            </h1>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                AI-powered health analysis
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`p-2 hover:bg-slate-100 rounded-xl transition-colors ${refreshing ? 'opacity-50' : ''}`}
                    >
                        <RefreshCw size={20} className={`text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <motion.div
                className="px-6 pt-6 max-w-lg mx-auto space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Time Range Selector */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {[
                        { value: 7, label: '7 Days' },
                        { value: 14, label: '14 Days' },
                        { value: 30, label: '30 Days' },
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setTimeRange(option.value)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${timeRange === option.value
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                        >
                            <Calendar size={14} />
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Proactive Alerts */}
                <ProactiveAlertsCard maxAlerts={3} />

                {/* AI Insights */}
                <div className="card-premium p-5 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                            <Brain size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">AI Insights</h3>
                            <p className="text-xs text-slate-500">Personalized observations</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {insights.map((insight, i) => (
                            <InsightCard key={i} insight={insight} />
                        ))}
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Health Score */}
                    <MetricCard
                        title="Health Score"
                        icon={Activity}
                        color="bg-gradient-to-br from-indigo-500 to-purple-600"
                        value={scoreTrends?.latestScore || '--'}
                        trend={scoreTrends?.trend}
                        subtitle="Overall health"
                        dataPoints={scoreTrends?.dataPoints}
                        onClick={() => navigate('/dashboard')}
                    />

                    {/* Mood Score */}
                    <MetricCard
                        title="Mood"
                        icon={moodTrends?.stats?.mean >= 3 ? Smile : Frown}
                        color="bg-gradient-to-br from-amber-500 to-orange-500"
                        value={moodTrends?.stats?.mean ? `${(moodTrends.stats.mean).toFixed(1)}/5` : '--'}
                        trend={moodTrends?.trend}
                        subtitle="Average mood"
                        dataPoints={moodTrends?.dataPoints?.map(d => ({ ...d, value: d.value }))}
                        onClick={() => navigate('/log/mood')}
                    />

                    {/* Heart Rate */}
                    {vitalTrends?.heartRate && (
                        <MetricCard
                            title="Heart Rate"
                            icon={Heart}
                            color="bg-gradient-to-br from-rose-500 to-pink-500"
                            value={`${Math.round(vitalTrends.heartRate.stats.mean)} bpm`}
                            trend={vitalTrends.heartRate.trend}
                            subtitle="Average"
                            dataPoints={vitalTrends.heartRate.dataPoints}
                            onClick={() => navigate('/device-sync')}
                        />
                    )}

                    {/* Stress Level */}
                    {moodTrends?.averageStress && (
                        <MetricCard
                            title="Stress Level"
                            icon={Zap}
                            color="bg-gradient-to-br from-emerald-500 to-teal-500"
                            value={`${moodTrends.averageStress}/10`}
                            trend={null}
                            subtitle="Average stress"
                            onClick={() => navigate('/log/mood')}
                        />
                    )}
                </div>

                {/* Mood Distribution */}
                {moodTrends?.moodDistribution && Object.keys(moodTrends.moodDistribution).length > 0 && (
                    <div className="card-premium p-5 bg-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                                <PieChart size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Mood Distribution</h3>
                                <p className="text-xs text-slate-500">Last {timeRange} days</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {Object.entries(moodTrends.moodDistribution).map(([mood, count]) => {
                                const moodColors = {
                                    great: 'bg-emerald-100 text-emerald-700',
                                    good: 'bg-green-100 text-green-700',
                                    okay: 'bg-amber-100 text-amber-700',
                                    low: 'bg-orange-100 text-orange-700',
                                    bad: 'bg-red-100 text-red-700',
                                };

                                const moodEmoji = {
                                    great: '😊',
                                    good: '🙂',
                                    okay: '😐',
                                    low: '😔',
                                    bad: '😢',
                                };

                                return (
                                    <div
                                        key={mood}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl ${moodColors[mood] || 'bg-slate-100 text-slate-700'}`}
                                    >
                                        <span>{moodEmoji[mood] || '•'}</span>
                                        <span className="text-sm font-medium capitalize">{mood}</span>
                                        <span className="text-xs opacity-70">({count})</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="card-premium p-5 bg-white">
                    <h3 className="font-bold text-slate-800 mb-4">Track Your Health</h3>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: Heart, label: 'Symptoms', route: '/log/symptom', color: 'bg-rose-100 text-rose-600' },
                            { icon: Smile, label: 'Mood', route: '/log/mood', color: 'bg-amber-100 text-amber-600' },
                            { icon: Moon, label: 'Lifestyle', route: '/log/lifestyle', color: 'bg-blue-100 text-blue-600' },
                        ].map((action) => (
                            <button
                                key={action.label}
                                onClick={() => navigate(action.route)}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                                    <action.icon size={20} />
                                </div>
                                <span className="text-xs font-medium text-slate-700">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default HealthInsights;
