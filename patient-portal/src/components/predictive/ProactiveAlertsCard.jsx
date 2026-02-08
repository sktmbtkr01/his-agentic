/**
 * ProactiveAlertsCard Component
 * Phase 4: Displays AI-generated proactive health alerts
 * Shows trend analysis and anomaly detection results
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Heart,
    Activity,
    Moon,
    Smile,
    Frown,
    Bell,
    BellOff,
    X,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Info,
    Sparkles,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
} from 'lucide-react';
import predictiveService from '../../services/predictiveService';

// Severity colors and icons
const SEVERITY_CONFIG = {
    critical: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: AlertTriangle,
        iconColor: 'text-red-600',
        badge: 'bg-red-500',
    },
    high: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: AlertCircle,
        iconColor: 'text-orange-600',
        badge: 'bg-orange-500',
    },
    medium: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: Info,
        iconColor: 'text-amber-600',
        badge: 'bg-amber-500',
    },
    low: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: Sparkles,
        iconColor: 'text-emerald-600',
        badge: 'bg-emerald-500',
    },
};

// Alert type icons
const TYPE_ICONS = {
    vital_anomaly: Heart,
    symptom_pattern: Activity,
    mood_decline: Frown,
    sleep_disruption: Moon,
    activity_change: Activity,
    declining_score: TrendingDown,
    vital_trend: TrendingUp,
    chronic_symptom: AlertCircle,
    risk_prediction: AlertTriangle,
    health_milestone: Sparkles,
};

const AlertCard = ({ alert, onAcknowledge, onDismiss, onAction }) => {
    const [expanded, setExpanded] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const severityConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
    const TypeIcon = TYPE_ICONS[alert.type] || Bell;
    const SeverityIcon = severityConfig.icon;

    const handleDismiss = (helpful) => {
        onDismiss(alert._id, { helpful });
        setShowFeedback(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={`relative overflow-hidden rounded-2xl border ${severityConfig.bg} ${severityConfig.border} transition-all`}
        >
            {/* Severity indicator bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${severityConfig.badge}`} />

            <div className="p-4 pl-5">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${severityConfig.bg} border ${severityConfig.border}`}>
                        <TypeIcon size={20} className={severityConfig.iconColor} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.badge} text-white`}>
                                <SeverityIcon size={12} />
                                {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                            </span>
                            <span className="text-xs text-slate-400">{alert.age || 'Just now'}</span>
                        </div>

                        <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">
                            {alert.title}
                        </h4>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            {alert.message}
                        </p>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => setShowFeedback(true)}
                        className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <X size={16} className="text-slate-400" />
                    </button>
                </div>

                {/* Context data */}
                {alert.context?.trend && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                        {alert.context.trend.direction === 'increasing' && (
                            <span className="flex items-center gap-1 text-orange-600">
                                <TrendingUp size={14} />
                                {Math.abs(alert.context.trend.percentChange)}% increase
                            </span>
                        )}
                        {alert.context.trend.direction === 'decreasing' && (
                            <span className="flex items-center gap-1 text-blue-600">
                                <TrendingDown size={14} />
                                {Math.abs(alert.context.trend.percentChange)}% decrease
                            </span>
                        )}
                        {alert.context.duration && (
                            <span className="text-slate-400">
                                over {alert.context.duration}
                            </span>
                        )}
                    </div>
                )}

                {/* Recommendations */}
                {alert.recommendations && alert.recommendations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {alert.recommendations.map((rec, i) => (
                            <button
                                key={i}
                                onClick={() => onAction(rec.route)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all hover:shadow-sm"
                            >
                                {rec.action}
                                <ChevronRight size={12} />
                            </button>
                        ))}
                    </div>
                )}

                {/* Feedback overlay */}
                <AnimatePresence>
                    {showFeedback && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center"
                        >
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700 mb-3">
                                    Was this alert helpful?
                                </p>
                                <div className="flex items-center gap-2 justify-center">
                                    <button
                                        onClick={() => handleDismiss(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                                    >
                                        <ThumbsUp size={14} />
                                        Helpful
                                    </button>
                                    <button
                                        onClick={() => handleDismiss(false)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                                    >
                                        <ThumbsDown size={14} />
                                        Not helpful
                                    </button>
                                    <button
                                        onClick={() => setShowFeedback(false)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X size={16} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const ProactiveAlertsCard = ({ compact = false, maxAlerts = 5 }) => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAlerts = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            const response = await predictiveService.getActiveAlerts({ limit: maxAlerts });
            if (response.success) {
                setAlerts(response.data.alerts);
            }
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
            setError('Failed to load alerts');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // Re-run analysis to generate new alerts
            await predictiveService.runAnalysis();
            await fetchAlerts();
        } catch (err) {
            console.error('Failed to refresh alerts:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleAcknowledge = async (alertId) => {
        try {
            await predictiveService.acknowledgeAlert(alertId);
            setAlerts(prev => prev.filter(a => a._id !== alertId));
        } catch (err) {
            console.error('Failed to acknowledge alert:', err);
        }
    };

    const handleDismiss = async (alertId, feedback) => {
        try {
            await predictiveService.dismissAlert(alertId, feedback);
            setAlerts(prev => prev.filter(a => a._id !== alertId));
        } catch (err) {
            console.error('Failed to dismiss alert:', err);
        }
    };

    const handleAction = (route) => {
        if (route) {
            navigate(route);
        }
    };

    if (loading) {
        return (
            <div className="card-premium p-5 bg-white animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                    <div className="h-24 bg-slate-100 rounded-2xl" />
                    <div className="h-24 bg-slate-100 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error && !alerts.length) {
        return (
            <div className="card-premium p-5 bg-white">
                <div className="text-center py-8 text-slate-500">
                    <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={() => fetchAlerts()}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    const highPriorityCount = alerts.filter(
        a => a.severity === 'critical' || a.severity === 'high'
    ).length;

    return (
        <div className="card-premium p-5 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                        <Bell size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">
                            Smart Alerts
                        </h3>
                        <p className="text-xs text-slate-500">
                            AI-powered health insights
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {highPriorityCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                            <AlertTriangle size={12} />
                            {highPriorityCount} urgent
                        </span>
                    )}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${refreshing ? 'opacity-50' : ''}`}
                    >
                        <RefreshCw size={18} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Alert list */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {alerts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8"
                        >
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle size={32} className="text-emerald-500" />
                            </div>
                            <h4 className="font-bold text-slate-700 mb-1">All clear!</h4>
                            <p className="text-sm text-slate-500">
                                No health alerts right now. Keep up the great work!
                            </p>
                        </motion.div>
                    ) : (
                        alerts.map((alert) => (
                            <AlertCard
                                key={alert._id}
                                alert={alert}
                                onAcknowledge={handleAcknowledge}
                                onDismiss={handleDismiss}
                                onAction={handleAction}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* View all link */}
            {alerts.length > 0 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate('/health-insights')}
                        className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
                    >
                        View all health insights
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProactiveAlertsCard;
