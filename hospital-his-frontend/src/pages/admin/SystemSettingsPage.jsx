import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle, Clock, User, History, X } from 'lucide-react';
import systemSettingsService from '../../services/systemSettings.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const SystemSettingsPage = () => {
    const [settings, setSettings] = useState(null);
    const [auditLog, setAuditLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingToggle, setPendingToggle] = useState(null);
    const [warningData, setWarningData] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const [settingsData, auditData] = await Promise.all([
                systemSettingsService.getSettings(),
                systemSettingsService.getAuditLog()
            ]);
            setSettings(settingsData);
            setAuditLog(auditData);
        } catch (error) {
            toast.error('Failed to load settings');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleClinicalCoding = async () => {
        const newValue = !settings.clinicalCoding.enabled;
        setToggling(true);

        try {
            const response = await systemSettingsService.toggleClinicalCoding(newValue);

            if (response.warning) {
                // Show confirmation modal
                setWarningData(response);
                setPendingToggle(newValue);
                setShowConfirmModal(true);
            } else {
                setSettings(prev => ({
                    ...prev,
                    clinicalCoding: response.data.clinicalCoding
                }));
                toast.success(response.message);
                loadSettings(); // Refresh audit log
            }
        } catch (error) {
            toast.error('Failed to update setting');
        } finally {
            setToggling(false);
        }
    };

    const handleForceToggle = async () => {
        if (pendingToggle === null) return;

        setToggling(true);
        try {
            const response = await systemSettingsService.forceToggleClinicalCoding(pendingToggle);
            setSettings(prev => ({
                ...prev,
                clinicalCoding: response.data.clinicalCoding
            }));
            toast.success(response.message);
            setShowConfirmModal(false);
            setPendingToggle(null);
            setWarningData(null);
            loadSettings();
        } catch (error) {
            toast.error('Failed to update setting');
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
                    <div className="bg-gray-100 h-48 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Settings className="text-primary" /> System Settings
                </h1>
                <p className="text-gray-500 mt-2">Configure hospital-wide system behavior.</p>
            </div>

            {/* Clinical Coding Setting */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8"
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold text-slate-800">Clinical Coding</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${settings?.clinicalCoding?.enabled
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                {settings?.clinicalCoding?.enabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mb-4">
                            When enabled, clinical coding becomes a mandatory step before billing.
                            Coders must review and approve procedure codes for each encounter.
                        </p>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                            <h4 className="font-semibold text-sm text-slate-700 mb-2">When Enabled:</h4>
                            <ul className="text-xs text-slate-600 space-y-1">
                                <li>• Coders see pending encounters in their queue</li>
                                <li>• Procedure codes must be added and approved</li>
                                <li>• Billing is blocked until coding is approved</li>
                            </ul>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                            <h4 className="font-semibold text-sm text-amber-700 mb-2">When Disabled:</h4>
                            <ul className="text-xs text-amber-600 space-y-1">
                                <li>• Clinical coding module is bypassed</li>
                                <li>• Coders do not see pending work</li>
                                <li>• Billing proceeds without coding requirement</li>
                            </ul>
                        </div>
                    </div>

                    <button
                        onClick={handleToggleClinicalCoding}
                        disabled={toggling}
                        className={`ml-6 p-2 rounded-xl transition-all ${settings?.clinicalCoding?.enabled
                                ? 'text-emerald-500 hover:bg-emerald-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                    >
                        {settings?.clinicalCoding?.enabled ? (
                            <ToggleRight size={48} strokeWidth={1.5} />
                        ) : (
                            <ToggleLeft size={48} strokeWidth={1.5} />
                        )}
                    </button>
                </div>

                {settings?.clinicalCoding?.lastModifiedAt && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Last changed: {format(new Date(settings.clinicalCoding.lastModifiedAt), 'PPp')}
                        </span>
                    </div>
                )}
            </motion.div>

            {/* Audit Log */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <History size={20} className="text-gray-400" /> Settings Audit Log
                </h2>

                {auditLog.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No changes recorded yet.</p>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {auditLog.map((entry, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className={`p-1.5 rounded-full ${entry.newValue ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {entry.newValue ? <CheckCircle size={14} /> : <ToggleLeft size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-slate-700">
                                            {entry.setting.replace('.', ' → ')}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {entry.previousValue ? 'ON' : 'OFF'} → {entry.newValue ? 'ON' : 'OFF'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <User size={10} />
                                            {entry.changedBy?.name || 'System'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {format(new Date(entry.changedAt), 'PP p')}
                                        </span>
                                    </div>
                                    {entry.reason && (
                                        <p className="text-xs text-gray-500 mt-1 italic">"{entry.reason}"</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowConfirmModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                        >
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Confirm Change</h3>
                                    <p className="text-sm text-gray-500">This action requires confirmation</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">
                                {warningData?.message}
                            </p>

                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-6">
                                <p className="text-xs text-amber-700">
                                    <strong>Note:</strong> Existing in-progress coding records will remain accessible.
                                    Only future encounters will bypass the coding step.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-2.5 px-4 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleForceToggle}
                                    disabled={toggling}
                                    className="flex-1 py-2.5 px-4 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {toggling ? 'Processing...' : 'Disable Anyway'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SystemSettingsPage;
