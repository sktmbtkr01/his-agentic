/**
 * DeviceSyncPanel Component
 * Panel for managing connected wearable devices
 * Supports connecting, disconnecting, and syncing devices
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone,
    Watch,
    Activity,
    CheckCircle,
    XCircle,
    RefreshCw,
    Plus,
    Trash2,
    Clock,
    Zap,
    Heart,
    AlertTriangle,
    ChevronRight,
    Wifi,
    WifiOff,
} from 'lucide-react';
import deviceService from '../../services/deviceService';

const DeviceSyncPanel = ({ onClose, onDeviceChange }) => {
    const [devices, setDevices] = useState([]);
    const [providers, setProviders] = useState({});
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [syncingDeviceId, setSyncingDeviceId] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Fetch devices and providers
    const fetchData = async () => {
        try {
            setLoading(true);
            const [devicesRes, providersRes] = await Promise.all([
                deviceService.getDevices(),
                deviceService.getProviders(),
            ]);
            setDevices(devicesRes.data?.devices || []);
            setProviders(providersRes.data || {});
            setError(null);
        } catch (err) {
            console.error('Failed to fetch device data:', err);
            setError('Failed to load device data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Connect a new device
    const handleConnect = async (providerKey = 'demo') => {
        try {
            setConnecting(true);
            setError(null);
            const response = await deviceService.connectDevice(providerKey);

            if (response.data?.requiresOAuth) {
                // Redirect to OAuth URL
                window.location.href = response.data.authUrl;
            } else {
                // Device connected successfully
                setSuccessMessage('Device connected successfully!');
                await fetchData();
                onDeviceChange?.();
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err) {
            console.error('Failed to connect device:', err);
            setError(err.response?.data?.error || 'Failed to connect device');
        } finally {
            setConnecting(false);
        }
    };

    // Disconnect a device
    const handleDisconnect = async (deviceId) => {
        if (!confirm('Are you sure you want to disconnect this device?')) return;

        try {
            await deviceService.disconnectDevice(deviceId);
            setSuccessMessage('Device disconnected');
            await fetchData();
            onDeviceChange?.();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Failed to disconnect device:', err);
            setError('Failed to disconnect device');
        }
    };

    // Sync a device
    const handleSync = async (deviceId) => {
        try {
            setSyncingDeviceId(deviceId);
            await deviceService.syncDevice(deviceId);
            setSuccessMessage('Sync completed successfully!');
            await fetchData();
            onDeviceChange?.();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Failed to sync device:', err);
            setError('Sync failed. Please try again.');
        } finally {
            setSyncingDeviceId(null);
        }
    };

    // Get device icon
    const getDeviceIcon = (provider) => {
        switch (provider) {
            case 'fitbit':
                return Watch;
            case 'apple_health':
                return Heart;
            default:
                return Smartphone;
        }
    };

    // Format sync status
    const formatSyncStatus = (status) => {
        switch (status) {
            case 'success':
                return { text: 'Synced', colorClass: 'text-[#1FA89A]', bgClass: 'bg-[#1FA89A]/10', icon: CheckCircle };
            case 'syncing':
                return { text: 'Syncing...', colorClass: 'text-[#5E7C66]', bgClass: 'bg-[#5E7C66]/10', icon: RefreshCw };
            case 'failed':
                return { text: 'Failed', colorClass: 'text-[#E05A4F]', bgClass: 'bg-[#E05A4F]/10', icon: XCircle };
            case 'pending':
                return { text: 'Pending', colorClass: 'text-[#E6A23C]', bgClass: 'bg-[#E6A23C]/10', icon: Clock };
            default:
                return { text: 'Unknown', colorClass: 'text-slate-400', bgClass: 'bg-slate-100', icon: AlertTriangle };
        }
    };

    // Format last sync time
    const formatLastSync = (timestamp) => {
        if (!timestamp) return 'Never synced';
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hours ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="bg-[#FDFBF7] rounded-[24px] shadow-2xl max-w-md w-full mx-auto overflow-hidden border border-[#5E7C66]/10">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#5E7C66] to-[#3E5F4F] p-6 text-white relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-5 -mb-5 blur-xl"></div>
                
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Connected Devices</h2>
                        <p className="text-[#E8F5E9]/90 text-sm mt-1">Manage your health data sources</p>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1">
                            <XCircle size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Success/Error Messages */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 p-3 bg-[#1FA89A]/10 text-[#1FA89A] rounded-2xl border border-[#1FA89A]/20"
                        >
                            <CheckCircle size={18} />
                            <span className="text-sm font-bold">{successMessage}</span>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 p-3 bg-[#E05A4F]/10 text-[#E05A4F] rounded-2xl border border-[#E05A4F]/20"
                        >
                            <AlertTriangle size={18} />
                            <span className="text-sm font-bold">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-8 text-[#5E7C66]/60">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        <span className="font-medium">Loading devices...</span>
                    </div>
                ) : (
                    <>
                        {/* Connected Devices */}
                        {devices.length > 0 ? (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-[#5E7C66] uppercase tracking-wider ml-1">Your Devices</h3>
                                {devices.map((device) => {
                                    const Icon = getDeviceIcon(device.provider);
                                    const syncStatus = formatSyncStatus(device.lastSync?.status);
                                    const StatusIcon = syncStatus.icon;
                                    const isSyncing = syncingDeviceId === device._id;

                                    return (
                                        <motion.div
                                            key={device._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white border border-[#E2E8F0] rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Device Icon */}
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${device.isDemoMode
                                                    ? 'bg-gradient-to-br from-[#E6A23C]/20 to-[#E6A23C]/10'
                                                    : 'bg-gradient-to-br from-[#5E7C66]/20 to-[#3E5F4F]/20'
                                                    }`}>
                                                    <Icon className={`w-7 h-7 ${device.isDemoMode ? 'text-[#E6A23C]' : 'text-[#3E5F4F]'
                                                        }`} />
                                                </div>

                                                {/* Device Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-[#2D3748] text-lg truncate">
                                                            {device.displayName}
                                                        </h4>
                                                        {device.isDemoMode && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E6A23C]/10 text-[#E6A23C] rounded-full border border-[#E6A23C]/20 uppercase tracking-wide">
                                                                Demo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${syncStatus.bgClass}`}>
                                                            <StatusIcon className={`w-3 h-3 ${syncStatus.colorClass}`} />
                                                            <span className={`text-xs font-bold ${syncStatus.colorClass}`}>
                                                                {syncStatus.text}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-[#5E7C66]/70 font-medium">
                                                            {formatLastSync(device.lastSync?.timestamp)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() => handleSync(device._id)}
                                                        disabled={isSyncing}
                                                        className="p-2 hover:bg-[#5E7C66]/10 rounded-xl text-[#5E7C66] transition-colors disabled:opacity-50"
                                                        title="Sync now"
                                                    >
                                                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDisconnect(device._id)}
                                                        className="p-2 hover:bg-[#E05A4F]/10 rounded-xl text-[#E05A4F] transition-colors"
                                                        title="Disconnect"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Next Sync Info */}
                                            <div className="mt-4 pt-3 border-t border-[#F0F4F8] flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-medium text-[#5E7C66]/80">
                                                    <Clock size={14} />
                                                    <span>Next sync: {device.nextSyncIn || 'Scheduled'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-bold bg-[#FDFBF7] px-2 py-1 rounded-lg">
                                                    <Wifi size={12} className="text-[#1FA89A]" />
                                                    <span className="text-[#1FA89A]">Hourly sync enabled</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-[#FDFBF7] rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-[#5E7C66]/10 shadow-sm">
                                    <WifiOff className="w-10 h-10 text-[#5E7C66]/40" />
                                </div>
                                <h3 className="font-bold text-[#2D3748] mb-1">No Devices Connected</h3>
                                <p className="text-sm text-[#5E7C66]/70 mb-4 px-8">
                                    Connect a wearable device to start tracking your vital health metrics automatically.
                                </p>
                            </div>
                        )}

                        {/* Connect New Device */}
                        <div className="border-t border-[#5E7C66]/10 pt-6">
                            <h3 className="text-sm font-bold text-[#5E7C66] uppercase tracking-wider mb-4 ml-1">Add a Device</h3>
                            <div className="space-y-3">
                                {/* Demo Device Option */}
                                <button
                                    onClick={() => handleConnect('demo')}
                                    disabled={connecting || devices.some(d => d.provider === 'demo')}
                                    className="w-full flex items-center gap-4 p-4 border border-[#E2E8F0] rounded-[20px] hover:border-[#5E7C66]/30 hover:bg-[#5E7C66]/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#5E7C66] to-[#3E5F4F] rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                        <Smartphone className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-[#2D3748] group-hover:text-[#3E5F4F] transition-colors">
                                            Demo Wearable
                                        </h4>
                                        <p className="text-xs text-[#5E7C66]/70">
                                            Try with simulated health data
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {connecting && (
                                            <RefreshCw className="w-4 h-4 animate-spin text-[#5E7C66]" />
                                        )}
                                        <ChevronRight size={20} className="text-[#5E7C66]/40 group-hover:text-[#5E7C66] transition-colors" />
                                    </div>
                                </button>

                                {/* Fitbit Option */}
                                <button
                                    onClick={() => handleConnect('fitbit')}
                                    disabled={!providers?.fitbit?.configured || connecting}
                                    className="w-full flex items-center gap-4 p-4 border border-[#E2E8F0] rounded-[20px] hover:border-[#1FA89A]/30 hover:bg-[#1FA89A]/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#1FA89A] to-[#147D73] rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                        <Watch className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-[#2D3748] group-hover:text-[#1FA89A]">
                                            Fitbit
                                        </h4>
                                        <p className="text-xs text-[#5E7C66]/70">
                                            {providers?.fitbit?.configured
                                                ? 'Sync heart rate, steps & sleep'
                                                : 'API not configured'}
                                        </p>
                                    </div>
                                    <ChevronRight size={20} className="text-[#5E7C66]/40 group-hover:text-[#1FA89A] transition-colors" />
                                </button>

                                {/* Google Fit Option */}
                                <button
                                    onClick={() => handleConnect('google_fit')}
                                    disabled={!providers?.google_fit?.configured || connecting}
                                    className="w-full flex items-center gap-4 p-4 border border-[#E2E8F0] rounded-[20px] hover:border-[#E05A4F]/30 hover:bg-[#E05A4F]/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#E05A4F] to-[#C03E39] rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                        <Activity className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-[#2D3748] group-hover:text-[#E05A4F]">
                                            Google Fit
                                        </h4>
                                        <p className="text-xs text-[#5E7C66]/70">
                                            {providers?.google_fit?.configured
                                                ? 'Sync activity & heart rate from Android'
                                                : 'API not configured'}
                                        </p>
                                    </div>
                                    <ChevronRight size={20} className="text-[#5E7C66]/40 group-hover:text-[#E05A4F] transition-colors" />
                                </button>
                            </div>
                        </div>

                        {/* Info Notice */}
                        <div className="bg-[#1FA89A]/5 border border-[#1FA89A]/20 rounded-[20px] p-4 flex items-start gap-4">
                            <div className="p-2 bg-[#1FA89A]/10 rounded-full">
                                <Zap className="w-5 h-5 text-[#1FA89A] flex-shrink-0" />
                            </div>
                            <div className="text-sm text-[#3E5F4F]">
                                <p className="font-bold text-[#1FA89A]">Auto-sync enabled</p>
                                <p className="text-[#5E7C66]/80 text-xs mt-1 leading-relaxed">
                                    Your devices sync automatically every hour to ensure your health dashboard is always up to date.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DeviceSyncPanel;
