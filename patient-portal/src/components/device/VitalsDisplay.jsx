/**
 * VitalsDisplay Component
 * Displays real-time synced vitals from connected wearable devices
 * Shows heart rate, steps, sleep quality in an elegant card layout
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Heart,
    Moon,
    Footprints,
    Flame,
    RefreshCw,
    Smartphone,
    AlertCircle,
    Clock,
    Zap,
    TrendingUp,
} from 'lucide-react';
import deviceService from '../../services/deviceService';

const VitalsDisplay = ({ onConnectDevice }) => {
    const [vitalsData, setVitalsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState(null);

    // Fetch vitals data
    const fetchVitals = async () => {
        try {
            setLoading(true);
            const response = await deviceService.getLatestVitals();
            setVitalsData(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch vitals:', err);
            setError('Failed to load vitals data');
        } finally {
            setLoading(false);
        }
    };

    // Trigger manual sync
    const handleSync = async () => {
        if (!vitalsData?.device?.id) return;

        try {
            setSyncing(true);
            await deviceService.syncDevice(vitalsData.device.id);
            await fetchVitals(); // Refresh data after sync
        } catch (err) {
            console.error('Sync failed:', err);
            setError('Sync failed. Please try again.');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchVitals();

        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchVitals, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Format time since last sync
    const formatTimeSince = (timestamp) => {
        if (!timestamp) return 'Never';
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    // Loading state
    if (loading) {
        return (
            <div className="card-premium p-6 bg-white">
                <div className="flex items-center justify-center gap-3 text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm">Loading vitals...</span>
                </div>
            </div>
        );
    }

    // No device connected state
    if (!vitalsData?.hasDevice) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100"
            >
                <div className="text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <Smartphone className="w-7 h-7 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Connect a Wearable</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Sync data from your fitness tracker for personalized health insights
                    </p>
                    <button
                        onClick={onConnectDevice}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:-translate-y-0.5"
                    >
                        <Zap size={18} />
                        Connect Device
                    </button>
                </div>
            </motion.div>
        );
    }

    const { device, vitals, lifestyle } = vitalsData;

    // Vitals cards data
    const vitalCards = [
        {
            id: 'heart-rate',
            icon: Heart,
            label: 'Heart Rate',
            value: vitals?.heartRate || '--',
            unit: 'bpm',
            color: 'rose',
            gradient: 'from-rose-500 to-pink-500',
            bgGradient: 'from-rose-50 to-pink-50',
            available: !!vitals?.heartRate,
        },
        {
            id: 'steps',
            icon: Footprints,
            label: 'Steps',
            value: lifestyle?.steps ? lifestyle.steps.toLocaleString() : '--',
            unit: 'today',
            color: 'emerald',
            gradient: 'from-emerald-500 to-teal-500',
            bgGradient: 'from-emerald-50 to-teal-50',
            available: !!lifestyle?.steps,
        },
        {
            id: 'sleep',
            icon: Moon,
            label: 'Sleep',
            value: lifestyle?.sleepHours ? lifestyle.sleepHours.toFixed(1) : '--',
            unit: 'hours',
            quality: lifestyle?.sleepQuality,
            color: 'indigo',
            gradient: 'from-indigo-500 to-purple-500',
            bgGradient: 'from-indigo-50 to-purple-50',
            available: !!lifestyle?.sleepHours,
        },
        {
            id: 'active',
            icon: Flame,
            label: 'Active',
            value: lifestyle?.activeMinutes || '--',
            unit: 'mins',
            color: 'amber',
            gradient: 'from-amber-500 to-orange-500',
            bgGradient: 'from-amber-50 to-orange-50',
            available: !!lifestyle?.activeMinutes,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
        >
            {/* Header with sync button */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${device?.isDemoMode ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                    <span className="text-xs font-medium text-slate-500">
                        {device?.displayName || 'Wearable'} {device?.isDemoMode && '(Demo)'}
                    </span>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Syncing...' : formatTimeSince(device?.lastSync?.timestamp)}
                </button>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                    {vitalCards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`card-premium p-4 bg-gradient-to-br ${card.bgGradient} border border-${card.color}-100 relative overflow-hidden`}
                        >
                            {/* Background decoration */}
                            <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full blur-xl`} />

                            <div className="relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm`}>
                                        <card.icon className={`w-5 h-5 text-${card.color}-500`} />
                                    </div>
                                    {card.quality && (
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize
                                            ${card.quality === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                                                card.quality === 'good' ? 'bg-blue-100 text-blue-700' :
                                                    card.quality === 'fair' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-rose-100 text-rose-700'}
                                        `}>
                                            {card.quality}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-0.5">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-bold text-${card.color}-700`}>
                                            {card.value}
                                        </span>
                                        <span className="text-xs text-slate-500">{card.unit}</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-600">{card.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Error message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl"
                >
                    <AlertCircle size={14} />
                    {error}
                </motion.div>
            )}

            {/* Demo mode notice */}
            {device?.isDemoMode && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <Activity size={14} />
                    <span>Demo mode - Connect a real device for accurate data</span>
                </div>
            )}
        </motion.div>
    );
};

export default VitalsDisplay;
