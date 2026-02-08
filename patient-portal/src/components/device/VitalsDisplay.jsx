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
            <div className="rounded-[24px] p-6 bg-white border border-stone-100 shadow-soft">
                <div className="flex items-center justify-center gap-3 text-stone-400">
                    <div className="w-5 h-5 border-2 border-stone-300 border-t-[#3E5F4F] rounded-full animate-spin" />
                    <span className="text-sm font-bold text-stone-500">Syncing data...</span>
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
                className="rounded-[24px] p-8 -mt-2 bg-white border border-stone-100 shadow-soft text-center group transition-all hover:shadow-lg relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#1FA89A]/10 to-transparent rounded-bl-full opacity-50" />
                
                <div className="w-16 h-16 bg-[#3E5F4F]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-8 h-8 text-[#3E5F4F]" />
                </div>
                <h3 className="text-lg font-bold text-stone-800 mb-2">Connect a Wearable</h3>
                <p className="text-sm text-stone-500 mb-6 max-w-xs mx-auto font-medium">
                    Sync data from your fitness tracker to unlock tailored health insights.
                </p>
                <button
                    onClick={onConnectDevice}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#3E5F4F] text-white font-bold rounded-2xl shadow-lg shadow-[#3E5F4F]/20 hover:bg-[#2F4A3D] transition-all active:scale-95"
                >
                    <Zap size={18} />
                    Connect Device
                </button>
            </motion.div>
        );
    }

    const { device, vitals, lifestyle } = vitalsData;

    // Vitals cards data matching new bold palette
    const vitalCards = [
        {
            id: 'heart-rate',
            icon: Heart,
            label: 'Heart Rate',
            value: vitals?.heartRate || '--',
            unit: 'bpm',
            // Heart Coral: #E05A4F
            color: 'text-[#E05A4F]',
            iconBg: 'bg-[#E05A4F]/20',
            badgeBg: 'bg-[#E05A4F]/15',
            badgeText: 'text-[#C03A2F]',
            quality: null,
        },
        {
            id: 'steps',
            icon: Footprints,
            label: 'Steps',
            value: lifestyle?.steps ? lifestyle.steps.toLocaleString() : '--',
            unit: 'today',
            // Activity Teal: #1FA89A
            color: 'text-[#1FA89A]',
            iconBg: 'bg-[#1FA89A]/20',
            badgeBg: 'bg-[#1FA89A]/15',
            badgeText: 'text-[#0D6D63]',
            quality: null,

        },
        {
            id: 'sleep',
            icon: Moon,
            label: 'Sleep',
            value: lifestyle?.sleepHours ? lifestyle.sleepHours.toFixed(1) : '--',
            unit: 'hours',
            quality: lifestyle?.sleepQuality,
            // Sleep Lavender: #7C6FD6
            color: 'text-[#7C6FD6]',
            iconBg: 'bg-[#7C6FD6]/20',
            badgeBg: 'bg-[#7C6FD6]/15',
            badgeText: 'text-[#5B4E9E]',
        },
        {
            id: 'active',
            icon: Flame,
            label: 'Active',
            value: lifestyle?.activeMinutes || '--',
            unit: 'mins',
            // Mood Amber: #E6A23C
            color: 'text-[#E6A23C]',
            iconBg: 'bg-[#E6A23C]/20',
            badgeBg: 'bg-[#E6A23C]/15',
            badgeText: 'text-[#B87A1B]',
            quality: null,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
        >
            {/* Header with sync button */}
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${device?.isDemoMode ? 'bg-[#E6A23C]' : 'bg-[#1FA89A]'} shadow-sm`} />
                    <span className="text-xs font-bold uppercase tracking-wide text-stone-500">
                        {device?.displayName || 'Wearable'} {device?.isDemoMode && '(Demo)'}
                    </span>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#3E5F4F] transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={12} className={`stroke-[2.5px] ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : formatTimeSince(device?.lastSync?.timestamp)}
                </button>
            </div>

            {/* Vitals Grid - Vivid Cards */}
            <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                    {vitalCards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-[24px] bg-white border border-stone-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                        >
                             {/* Subtle corner glow */}
                             <div className={`absolute top-0 right-0 w-16 h-16 ${card.iconBg} blur-2xl opacity-40 -mr-6 -mt-6 transition-opacity group-hover:opacity-60`} />

                            <div className="relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2.5 rounded-xl ${card.iconBg} ${card.color}`}>
                                        <card.icon size={20} strokeWidth={2.5} />
                                    </div>
                                    {card.quality && (
                                        <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full capitalize ${card.badgeBg} ${card.badgeText}`}>
                                            {card.quality}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-0.5">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-stone-800 tracking-tight">
                                            {card.value}
                                        </span>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">{card.unit}</span>
                                    </div>
                                    <p className="text-xs font-bold text-stone-500">{card.label}</p>
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
                    className="flex items-center gap-2 text-xs font-bold text-[#C03A2F] bg-[#E05A4F]/10 p-4 rounded-2xl"
                >
                    <AlertCircle size={14} />
                    {error}
                </motion.div>
            )}

            {/* Demo mode notice */}
            {device?.isDemoMode && (
                <div className="flex items-center gap-2 text-xs font-bold text-[#B87A1B] bg-[#E6A23C]/10 p-4 rounded-2xl border border-[#E6A23C]/20">
                    <Activity size={14} />
                    <span>Demo Data Active</span>
                </div>
            )}
        </motion.div>
    );
};

export default VitalsDisplay;
