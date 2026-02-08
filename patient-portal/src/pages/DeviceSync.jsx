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
        <div className="min-h-screen bg-[#FDFBF7] relative">
            <div className="max-w-md mx-auto min-h-screen pb-8 relative">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-3 -ml-3 hover:bg-[#5E7C66]/10 rounded-full transition-colors text-[#5E7C66]"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-[#3E5F4F] leading-none mb-0.5 tracking-tight">
                            Device Sync
                        </h1>
                        <p className="text-xs font-semibold text-[#5E7C66]/80 tracking-wide uppercase">
                            Wearable Connections
                        </p>
                    </div>
                </div>

                <motion.div
                    className="px-6 pt-2 space-y-6 pb-24"
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
                                className="flex items-center gap-3 p-4 bg-[#1FA89A]/10 text-[#0D6D63] rounded-[24px] border border-[#1FA89A]/20 shadow-sm"
                            >
                                <CheckCircle size={20} className="text-[#1FA89A]" />
                                <span className="font-bold text-sm">
                                    {provider.charAt(0).toUpperCase() + provider.slice(1)} connected!
                                </span>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-3 p-4 bg-[#E05A4F]/10 text-[#C03A2F] rounded-[24px] border border-[#E05A4F]/20 shadow-sm"
                            >
                                <XCircle size={20} className="text-[#E05A4F]" />
                                <span className="font-bold text-sm">{decodeURIComponent(error)}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick Overview Hero Card */}
                    <div className="relative overflow-hidden rounded-[32px] p-6 bg-gradient-to-br from-[#5E7C66] to-[#3E5F4F] shadow-[0_10px_30px_rgba(94,124,102,0.35)] text-white">
                        {/* Abstract shapes for energy */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#1FA89A]/30 rounded-full blur-2xl -ml-10 -mb-5" />
                        
                        <div className="relative z-10">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                                    <Watch size={28} className="text-white drop-shadow-md" />
                                </div>
                                <div className="min-w-0 flex-1 pt-1">
                                    <h2 className="text-xl font-bold text-white mb-1">Wearable Sync</h2>
                                    <p className="text-sm text-white/90 leading-relaxed font-medium">
                                        Connect your tracker to sync health metrics automatically.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                                {[
                                    { icon: Heart, label: 'Heart Rate' },
                                    { icon: Footprints, label: 'Activity' },
                                    { icon: Moon, label: 'Sleep' },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white shadow-sm"
                                    >
                                        <item.icon size={12} />
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Current Vitals */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-lg font-bold text-[#3E5F4F]">
                                Current Vitals
                            </h3>
                            <button
                                onClick={() => setShowPanel(true)}
                                className="flex items-center gap-1 text-sm font-bold text-[#E6A23C] hover:text-[#CA8A2C] transition-colors"
                            >
                                <Settings size={16} />
                                Manage
                            </button>
                        </div>

                        <div className="rounded-[24px] shadow-soft bg-white border border-stone-100/80 overflow-hidden relative z-0">
                             <VitalsDisplay
                                key={refreshKey}
                                onConnectDevice={() => setShowPanel(true)}
                            />
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[#3E5F4F] px-1">
                            Features
                        </h3>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                {
                                    icon: RefreshCw,
                                    title: 'Auto Sync',
                                    description: 'Background hourly sync',
                                    color: 'bg-[#1FA89A]/10 text-[#1FA89A] border-[#1FA89A]/20',
                                    iconBg: 'bg-[#1FA89A]/20'
                                },
                                {
                                    icon: TrendingUp,
                                    title: 'Trend Analysis',
                                    description: 'Track progress over time',
                                    color: 'bg-[#5E7C66]/10 text-[#5E7C66] border-[#5E7C66]/20',
                                    iconBg: 'bg-[#5E7C66]/20'
                                },
                                {
                                    icon: Zap,
                                    title: 'AI Insights',
                                    description: 'Personalized recommendations',
                                    color: 'bg-[#E6A23C]/10 text-[#E6A23C] border-[#E6A23C]/20',
                                    iconBg: 'bg-[#E6A23C]/20'
                                },
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-4 p-4 rounded-[24px] bg-white border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${feature.iconBg} ${feature.color.split(' ')[1]}`}>
                                        <feature.icon size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-stone-800 text-sm truncate">{feature.title}</h4>
                                        <p className="text-xs font-medium text-stone-500 truncate">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Supported Devices */}
                    <div className="bg-white p-5 rounded-[24px] border border-stone-100 shadow-soft">
                        <h3 className="font-bold text-[#3E5F4F] mb-4">Supported Devices</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { name: 'Fitbit', status: 'Available', icon: Watch },
                                { name: 'Google Fit', status: 'Available', icon: Smartphone },
                            ].map((device, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-2xl border flex flex-col gap-2 ${device.status === 'Available'
                                        ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'
                                        : 'bg-stone-50 border-stone-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-xl ${device.status === 'Available' ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-200 text-stone-400'}`}>
                                            <device.icon size={18} />
                                        </div>
                                        <span className={`text-sm font-bold ${device.status === 'Available' ? 'text-emerald-800' : 'text-stone-500'
                                            }`}>
                                            {device.name}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide ml-1 ${device.status === 'Available' ? 'text-emerald-600' : 'text-stone-400'
                                        }`}>
                                        {device.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Device Panel Modal */}
            <AnimatePresence>
                {showPanel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-[#5E7C66]/20 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowPanel(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm"
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
