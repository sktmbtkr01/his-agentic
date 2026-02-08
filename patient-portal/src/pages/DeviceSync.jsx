/**
 * DeviceSync Page
 * Full page for managing connected wearable devices
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Smartphone,
    Watch,
    Activity,
    Heart,
    Moon,
    Footprints,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    TrendingUp,
    ChevronRight,
    Settings,
    AlertCircle,
} from 'lucide-react';
import DeviceSyncPanel from '../components/device/DeviceSyncPanel';
import VitalsDisplay from '../components/device/VitalsDisplay';
import deviceService from '../services/deviceService';

const DeviceSync = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showPanel, setShowPanel] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Check for OAuth callback success/error
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');

    useEffect(() => {
        if (success) {
            // Refresh data after successful OAuth
            setRefreshKey(prev => prev + 1);
        }
    }, [success]);

    const handleDeviceChange = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-8">
            {/* Header */}
            <div className="sticky top-0 z-30 glass border-b border-b-slate-200/50 px-6 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={22} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
                            Device Sync
                        </h1>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Manage your wearable devices
                        </p>
                    </div>
                </div>
            </div>

            <motion.div
                className="px-6 pt-6 max-w-lg mx-auto space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* OAuth Callback Messages */}
                <AnimatePresence>
                    {success && provider && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100"
                        >
                            <CheckCircle size={20} />
                            <span className="font-medium">
                                {provider.charAt(0).toUpperCase() + provider.slice(1)} connected successfully!
                            </span>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100"
                        >
                            <XCircle size={20} />
                            <span className="font-medium">{decodeURIComponent(error)}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hero Section */}
                <div className="card-premium p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl" />
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Watch size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Wearable Sync</h2>
                                <p className="text-white/80 text-sm">24/7 health monitoring</p>
                            </div>
                        </div>

                        <p className="text-white/90 text-sm mb-4">
                            Connect your fitness tracker to automatically sync heart rate, steps, sleep data, and more.
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {[
                                { icon: Heart, label: 'Heart Rate' },
                                { icon: Footprints, label: 'Steps' },
                                { icon: Moon, label: 'Sleep' },
                                { icon: Activity, label: 'Activity' },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm"
                                >
                                    <item.icon size={14} />
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Current Vitals */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                            Current Vitals
                        </h3>
                        <button
                            onClick={() => setShowPanel(true)}
                            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            <Settings size={16} />
                            Manage
                        </button>
                    </div>

                    <VitalsDisplay
                        key={refreshKey}
                        onConnectDevice={() => setShowPanel(true)}
                    />
                </div>

                {/* Features */}
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                        Features
                    </h3>

                    <div className="space-y-3">
                        {[
                            {
                                icon: RefreshCw,
                                title: 'Automatic Sync',
                                description: 'Data syncs every hour in the background',
                                color: 'blue',
                            },
                            {
                                icon: TrendingUp,
                                title: 'Trend Analysis',
                                description: 'Track your progress over time',
                                color: 'emerald',
                            },
                            {
                                icon: Zap,
                                title: 'AI Insights',
                                description: 'Get personalized health recommendations',
                                color: 'amber',
                            },
                            {
                                icon: AlertCircle,
                                title: 'Smart Alerts',
                                description: 'Get notified of unusual patterns',
                                color: 'rose',
                            },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all
                                    ${feature.color === 'blue' ? 'bg-blue-50/50 border-blue-100' : ''}
                                    ${feature.color === 'emerald' ? 'bg-emerald-50/50 border-emerald-100' : ''}
                                    ${feature.color === 'amber' ? 'bg-amber-50/50 border-amber-100' : ''}
                                    ${feature.color === 'rose' ? 'bg-rose-50/50 border-rose-100' : ''}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                    ${feature.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                                    ${feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : ''}
                                    ${feature.color === 'amber' ? 'bg-amber-100 text-amber-600' : ''}
                                    ${feature.color === 'rose' ? 'bg-rose-100 text-rose-600' : ''}
                                `}>
                                    <feature.icon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{feature.title}</h4>
                                    <p className="text-xs text-slate-500">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Supported Devices */}
                <div className="card-premium p-5 bg-white">
                    <h3 className="font-bold text-slate-800 mb-4">Supported Devices</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { name: 'Fitbit', status: 'Available', icon: Watch },
                            { name: 'Google Fit', status: 'Available', icon: Smartphone },
                        ].map((device, i) => (
                            <div
                                key={i}
                                className={`p-3 rounded-xl border ${device.status === 'Available'
                                    ? 'bg-emerald-50 border-emerald-100'
                                    : 'bg-slate-50 border-slate-100'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <device.icon size={16} className={
                                        device.status === 'Available' ? 'text-emerald-600' : 'text-slate-400'
                                    } />
                                    <span className={`text-sm font-semibold ${device.status === 'Available' ? 'text-emerald-700' : 'text-slate-600'
                                        }`}>
                                        {device.name}
                                    </span>
                                </div>
                                <span className={`text-xs ${device.status === 'Available' ? 'text-emerald-600' : 'text-slate-400'
                                    }`}>
                                    {device.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Device Panel Modal */}
            <AnimatePresence>
                {showPanel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowPanel(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DeviceSyncPanel
                                onClose={() => setShowPanel(false)}
                                onDeviceChange={handleDeviceChange}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeviceSync;
