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
                return { text: 'Synced', color: 'emerald', icon: CheckCircle };
            case 'syncing':
                return { text: 'Syncing...', color: 'blue', icon: RefreshCw };
            case 'failed':
                return { text: 'Failed', color: 'rose', icon: XCircle };
            case 'pending':
                return { text: 'Pending', color: 'amber', icon: Clock };
            default:
                return { text: 'Unknown', color: 'slate', icon: AlertTriangle };
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
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold">Connected Devices</h2>
                        <p className="text-indigo-200 text-sm mt-1">Manage your wearable devices</p>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-white/70 hover:text-white">
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
                            className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100"
                        >
                            <CheckCircle size={18} />
                            <span className="text-sm font-medium">{successMessage}</span>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100"
                        >
                            <AlertTriangle size={18} />
                            <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        <span>Loading devices...</span>
                    </div>
                ) : (
                    <>
                        {/* Connected Devices */}
                        {devices.length > 0 ? (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700">Your Devices</h3>
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
                                            className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Device Icon */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${device.isDemoMode
                                                    ? 'bg-gradient-to-br from-amber-100 to-orange-100'
                                                    : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                                                    }`}>
                                                    <Icon className={`w-6 h-6 ${device.isDemoMode ? 'text-amber-600' : 'text-indigo-600'
                                                        }`} />
                                                </div>

                                                {/* Device Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-800 truncate">
                                                            {device.displayName}
                                                        </h4>
                                                        {device.isDemoMode && (
                                                            <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                                                Demo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <StatusIcon className={`w-3.5 h-3.5 text-${syncStatus.color}-500`} />
                                                        <span className={`text-xs text-${syncStatus.color}-600 font-medium`}>
                                                            {syncStatus.text}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            • {formatLastSync(device.lastSync?.timestamp)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleSync(device._id)}
                                                        disabled={isSyncing}
                                                        className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-colors disabled:opacity-50"
                                                        title="Sync now"
                                                    >
                                                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDisconnect(device._id)}
                                                        className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-colors"
                                                        title="Disconnect"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Next Sync Info */}
                                            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Clock size={14} />
                                                    <span>Next sync: {device.nextSyncIn || 'Scheduled'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Wifi size={12} className="text-emerald-500" />
                                                    <span className="text-emerald-600 font-medium">Hourly sync enabled</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <WifiOff className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="font-bold text-slate-700 mb-1">No Devices Connected</h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    Connect a wearable to track your health metrics
                                </p>
                            </div>
                        )}

                        {/* Connect New Device */}
                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Add a Device</h3>
                            <div className="space-y-2">
                                {/* Demo Device Option */}
                                <button
                                    onClick={() => handleConnect('demo')}
                                    disabled={connecting || devices.some(d => d.provider === 'demo')}
                                    className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                                        <Smartphone className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-700">
                                            Demo Wearable
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Try with simulated health data
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {connecting && (
                                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                                        )}
                                        <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-500" />
                                    </div>
                                </button>

                                {/* Fitbit Option */}
                                <button
                                    onClick={() => handleConnect('fitbit')}
                                    disabled={!providers?.fitbit?.configured || connecting}
                                    className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-teal-300 hover:bg-teal-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                                        <Watch className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-slate-800 group-hover:text-teal-700">
                                            Fitbit
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {providers?.fitbit?.configured
                                                ? 'Sync heart rate, steps & sleep'
                                                : 'API not configured'}
                                        </p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-400 group-hover:text-teal-500" />
                                </button>

                                {/* Google Fit Option */}
                                <button
                                    onClick={() => handleConnect('google_fit')}
                                    disabled={!providers?.google_fit?.configured || connecting}
                                    className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                                        <Activity className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-slate-800 group-hover:text-emerald-700">
                                            Google Fit
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {providers?.google_fit?.configured
                                                ? 'Sync activity & heart rate from Android'
                                                : 'API not configured'}
                                        </p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-500" />
                                </button>
                            </div>
                        </div>

                        {/* Info Notice */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                            <Zap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-700">
                                <p className="font-medium">Auto-sync enabled</p>
                                <p className="text-blue-600 text-xs mt-0.5">
                                    Your devices sync automatically every hour for the latest data
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
