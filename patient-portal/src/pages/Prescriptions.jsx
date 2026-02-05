import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Clock, User, Calendar, ChevronRight, X, RefreshCw, History, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import prescriptionService from '../services/prescriptionService';

const Prescriptions = () => {
    const navigate = useNavigate();
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
            'Antibiotic': 'bg-rose-50 text-rose-600 border-rose-200',
            'Antacid': 'bg-purple-50 text-purple-600 border-purple-200',
            'Antidiabetic': 'bg-blue-50 text-blue-600 border-blue-200',
            'Antihypertensive': 'bg-emerald-50 text-emerald-600 border-emerald-200',
            'Vitamin': 'bg-yellow-50 text-yellow-600 border-yellow-200',
            'default': 'bg-slate-50 text-slate-600 border-slate-200'
        };
        return colors[category] || colors.default;
    };

    const currentData = activeTab === 'active' ? prescriptions : history;

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-24 relative overflow-x-hidden">
            {/* Glass Header */}
            <div className="sticky top-0 z-30 glass border-b border-slate-200/50 px-4 pt-4 pb-2">
                 <div className="flex items-center justify-between mb-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100/50 text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800">Prescriptions</h1>
                    <div className="w-8"></div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100/80 rounded-xl backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'active'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-600'
                            }`}
                    >
                        <Pill size={14} /> Active
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'history'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-600'
                            }`}
                    >
                        <History size={14} /> History
                    </button>
                </div>
            </div>

            {/* Notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="px-4 pt-4"
                    >
                        <div className={`p-4 rounded-xl flex items-center gap-3 shadow-lg ${notification.type === 'success'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                : 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                            }`}>
                            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="text-sm font-bold">{notification.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div className="p-4 space-y-4 max-w-lg mx-auto">
                <AnimatePresence mode='wait'>
                    {loading ? (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center py-20 gap-4">
                             <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                             <p className="text-sm font-medium text-slate-400">Loading prescriptions...</p>
                         </motion.div>
                    ) : currentData.length === 0 ? (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-20 px-8">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                💊
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">No prescriptions</h2>
                            <p className="text-slate-500 text-sm">
                                {activeTab === 'active'
                                    ? 'You have no active prescriptions at the moment.'
                                    : 'No past prescription history found.'}
                            </p>
                        </motion.div>
                    ) : (
                        currentData.map((rx, index) => (
                            <motion.div
                                key={rx._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => openDetails(rx)}
                                className="card-premium p-0 bg-white overflow-hidden group cursor-pointer"
                            >
                                <div className="p-5">
                                    {/* Prescription Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-3">
                                             <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                <Pill size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
                                                    Dr. {rx.doctor?.lastName}
                                                </h3>
                                                <p className="text-xs text-slate-400 font-mono tracking-wider mt-0.5">#{rx.prescriptionNumber || 'RX-000'}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${rx.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {rx.status}
                                        </div>
                                    </div>

                                    {/* Medicines Preview */}
                                    <div className="space-y-2 mb-4">
                                        {rx.medicines.slice(0, 3).map((med, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                <div className="text-xl">{getMedicineIcon(med.form)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-700 text-sm truncate">
                                                        {med.name}
                                                        {med.strength && <span className="text-slate-400 ml-1 font-normal">{med.strength}</span>}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                        {med.frequency} • {med.duration}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {rx.medicines.length > 3 && (
                                            <p className="text-xs font-bold text-blue-500 pl-2">
                                                +{rx.medicines.length - 3} more medications
                                            </p>
                                        )}
                                    </div>
                                    
                                     <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-xs text-slate-400 font-medium">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(rx.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1 text-blue-600 group-hover:translate-x-1 transition-transform">
                                            Details <ChevronRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Prescription Details Modal */}
            <AnimatePresence>
                {selectedPrescription && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={() => setSelectedPrescription(null)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shrink-0">
                                <div className="flex justify-between items-start mb-4">
                                     <div>
                                        <h2 className="text-xl font-bold">Prescription</h2>
                                        <p className="text-blue-100 text-xs font-mono opacity-80 mt-1">Ref: {selectedPrescription.prescriptionNumber}</p>
                                    </div>
                                    <button onClick={() => setSelectedPrescription(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-md">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                                        Dr
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">Dr. {selectedPrescription.doctor?.firstName} {selectedPrescription.doctor?.lastName}</p>
                                        <p className="text-blue-100 text-xs">{selectedPrescription.doctor?.specialization || 'Attending Physician'}</p>
                                    </div>
                                </div>
                            </div>

                             {/* Scrollable Content */}
                             <div className="p-5 overflow-y-auto custom-scrollbar">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Medications</h3>
                                <div className="space-y-3">
                                    {selectedPrescription.medicines.map((med, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-white p-2 rounded-xl shadow-sm text-2xl h-12 w-12 flex items-center justify-center">
                                                    {getMedicineIcon(med.form)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-slate-800 text-lg">{med.name}</h4>
                                                         <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${getCategoryColor(med.category)}`}>
                                                            {med.form}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-500 font-medium text-sm mb-2">{med.strength}</p>
                                                    
                                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                                        <div className="bg-white px-3 py-2 rounded-lg border border-slate-100">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Frequency</p>
                                                            <p className="font-bold text-slate-700 text-xs">{med.frequency}</p>
                                                        </div>
                                                        <div className="bg-white px-3 py-2 rounded-lg border border-slate-100">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                                                            <p className="font-bold text-slate-700 text-xs">{med.duration}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {med.instructions && (
                                                        <div className="mt-3 text-xs bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-100 italic">
                                                            "{med.instructions}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedPrescription.notes && (
                                    <div className="mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Doctor's Notes</h3>
                                         <p className="text-sm text-slate-600 italic">"{selectedPrescription.notes}"</p>
                                    </div>
                                )}
                             </div>

                             {/* Footer Actions */}
                             {selectedPrescription.status === 'active' && (
                                 <div className="p-4 border-t border-slate-100 bg-white">
                                     <button
                                        onClick={() => handleRefill(selectedPrescription._id)}
                                        disabled={refillLoading}
                                        className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
                                     >
                                         {refillLoading ? 'Processing...' : <><RefreshCw size={18} /> Request Refill</>}
                                     </button>
                                 </div>
                             )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Prescriptions;
