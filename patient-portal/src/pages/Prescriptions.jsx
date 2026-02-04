import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Clock, User, Calendar, ChevronRight, X, RefreshCw, History, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import prescriptionService from '../services/prescriptionService';

const Prescriptions = () => {
    const [activeTab, setActiveTab] = useState('active');
    const [prescriptions, setPrescriptions] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [refillLoading, setRefillLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    useEffect(() => {
        if (activeTab === 'history' && history.length === 0) {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchPrescriptions = async () => {
        try {
            const response = await prescriptionService.getPrescriptions();
            setPrescriptions(response.data || []);
        } catch (error) {
            console.error("Failed to fetch prescriptions", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await prescriptionService.getPrescriptionHistory();
            setHistory(response.data || []);
        } catch (error) {
            console.error("Failed to fetch prescription history", error);
        }
    };

    const handleRefill = async (prescriptionId) => {
        setRefillLoading(true);
        try {
            const response = await prescriptionService.requestRefill(prescriptionId);
            setNotification({
                type: 'success',
                message: response.message || 'Refill request submitted successfully!'
            });
            setSelectedPrescription(null);
            setTimeout(() => setNotification(null), 5000);
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.response?.data?.error || 'Failed to request refill'
            });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setRefillLoading(false);
        }
    };

    const openDetails = async (prescription) => {
        try {
            const response = await prescriptionService.getPrescriptionById(prescription._id);
            setSelectedPrescription(response.data);
        } catch (error) {
            console.error("Failed to fetch prescription details", error);
            setSelectedPrescription(prescription);
        }
    };

    const getMedicineIcon = (form) => {
        switch (form?.toLowerCase()) {
            case 'tablet':
            case 'capsule':
                return '💊';
            case 'syrup':
            case 'suspension':
                return '🧴';
            case 'injection':
                return '💉';
            case 'cream':
            case 'ointment':
            case 'gel':
                return '🧴';
            case 'drops':
                return '💧';
            case 'inhaler':
                return '🌬️';
            default:
                return '💊';
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Analgesic': 'bg-orange-50 text-orange-600 border-orange-200',
            'Antibiotic': 'bg-red-50 text-red-600 border-red-200',
            'Antacid': 'bg-purple-50 text-purple-600 border-purple-200',
            'Antidiabetic': 'bg-blue-50 text-blue-600 border-blue-200',
            'Antihypertensive': 'bg-pink-50 text-pink-600 border-pink-200',
            'Vitamin': 'bg-yellow-50 text-yellow-600 border-yellow-200',
            'default': 'bg-slate-50 text-slate-600 border-slate-200'
        };
        return colors[category] || colors.default;
    };

    const currentData = activeTab === 'active' ? prescriptions : history;

    return (
        <div className="page-container pb-20">
            {/* Header */}
            <header className="bg-white p-4 sticky top-0 z-10 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-slate-800">My Prescriptions</h1>
                    <Link to="/dashboard" className="text-primary font-medium text-sm">
                        Dashboard
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'active'
                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <Pill size={16} />
                        Active
                        {prescriptions.length > 0 && (
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'active' ? 'bg-white/20' : 'bg-teal-100 text-teal-600'
                                }`}>
                                {prescriptions.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'history'
                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <History size={16} />
                        History
                    </button>
                </div>
            </header>

            {/* Notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mx-4 mt-4 p-4 rounded-xl flex items-center gap-3 ${notification.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                    >
                        {notification.type === 'success' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <AlertCircle size={20} />
                        )}
                        <span className="text-sm font-medium">{notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-500">
                        <div className="spinner mx-auto mb-2" style={{ width: '2rem', height: '2rem' }}></div>
                        Loading prescriptions...
                    </div>
                ) : currentData.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                        <Pill size={48} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 font-medium">
                            {activeTab === 'active' ? 'No active prescriptions' : 'No prescription history'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {activeTab === 'active'
                                ? 'Prescriptions from your doctor will appear here'
                                : 'Your past prescriptions will be listed here'}
                        </p>
                    </div>
                ) : (
                    currentData.map((rx, index) => (
                        <motion.div
                            key={rx._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => openDetails(rx)}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            {/* Prescription Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold mb-2 ${rx.status === 'active'
                                            ? 'bg-teal-50 text-teal-600'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {rx.status === 'active' ? 'Active' : 'Dispensed'}
                                    </span>
                                    <p className="text-xs text-slate-400 font-mono">{rx.prescriptionNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">
                                        {new Date(rx.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Doctor Info */}
                            {rx.doctor && (
                                <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                                    <User size={16} className="text-slate-400" />
                                    <span>Dr. {rx.doctor.firstName} {rx.doctor.lastName}</span>
                                    {rx.doctor.specialization && (
                                        <span className="text-slate-400">• {rx.doctor.specialization}</span>
                                    )}
                                </div>
                            )}

                            {/* Medicines Preview */}
                            <div className="space-y-2">
                                {rx.medicines.slice(0, 3).map((med, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                                        <span className="text-xl">{getMedicineIcon(med.form)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">
                                                {med.name}
                                                {med.strength && <span className="text-slate-400 ml-1">{med.strength}</span>}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {med.dosage} • {med.frequency} • {med.duration}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-md border ${getCategoryColor(med.category)}`}>
                                            {med.form || 'Tablet'}
                                        </span>
                                    </div>
                                ))}
                                {rx.medicines.length > 3 && (
                                    <p className="text-xs text-slate-400 text-center py-1">
                                        +{rx.medicines.length - 3} more medications
                                    </p>
                                )}
                            </div>

                            {/* View Details Hint */}
                            <div className="flex items-center justify-end mt-3 text-primary text-sm font-medium">
                                View Details <ChevronRight size={16} />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Prescription Details Modal */}
            <AnimatePresence>
                {selectedPrescription && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={() => setSelectedPrescription(null)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                                <div>
                                    <h2 className="text-lg font-bold">Prescription Details</h2>
                                    <p className="text-teal-100 text-sm font-mono">{selectedPrescription.prescriptionNumber}</p>
                                </div>
                                <button onClick={() => setSelectedPrescription(null)} className="text-white/80 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
                                {/* Doctor Info */}
                                {selectedPrescription.doctor && (
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Prescribed By</p>
                                        <p className="font-bold text-slate-800">
                                            Dr. {selectedPrescription.doctor.firstName} {selectedPrescription.doctor.lastName}
                                        </p>
                                        {selectedPrescription.doctor.specialization && (
                                            <p className="text-sm text-slate-500">{selectedPrescription.doctor.specialization}</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(selectedPrescription.createdAt).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                )}

                                {/* Medications List */}
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <Pill size={18} className="text-teal-500" />
                                        Medications ({selectedPrescription.medicines.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedPrescription.medicines.map((med, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">{getMedicineIcon(med.form)}</span>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-800">
                                                            {med.name}
                                                            {med.strength && (
                                                                <span className="font-normal text-slate-500 ml-2">{med.strength}</span>
                                                            )}
                                                        </p>
                                                        {med.genericName && (
                                                            <p className="text-xs text-slate-400 italic">{med.genericName}</p>
                                                        )}
                                                        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                                                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                                                                <p className="text-slate-400 uppercase">Dosage</p>
                                                                <p className="font-bold text-slate-700">{med.dosage}</p>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                                                                <p className="text-slate-400 uppercase">Frequency</p>
                                                                <p className="font-bold text-slate-700">{med.frequency}</p>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                                                                <p className="text-slate-400 uppercase">Duration</p>
                                                                <p className="font-bold text-slate-700">{med.duration}</p>
                                                            </div>
                                                        </div>
                                                        {med.instructions && (
                                                            <p className="text-sm text-slate-600 mt-3 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                                                <span className="font-medium">Instructions:</span> {med.instructions}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Special Instructions */}
                                {selectedPrescription.specialInstructions && (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs text-blue-600 uppercase font-bold mb-1">Special Instructions</p>
                                        <p className="text-sm text-blue-800">{selectedPrescription.specialInstructions}</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-3 p-4 border-t bg-slate-50">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPrescription(null)}
                                    className="flex-1 btn btn-secondary"
                                >
                                    Close
                                </button>
                                {selectedPrescription.status === 'dispensed' && (
                                    <button
                                        type="button"
                                        onClick={() => handleRefill(selectedPrescription._id)}
                                        disabled={refillLoading}
                                        className="flex-1 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {refillLoading ? (
                                            <>
                                                <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div>
                                                Requesting...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw size={16} />
                                                Request Refill
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Prescriptions;
