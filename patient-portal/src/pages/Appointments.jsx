import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Plus, X, RefreshCw, AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import appointmentService from '../services/appointmentService';

// Energetic Theme Colors - Refactored for Energy & Contrast
const theme = {
    bg: "bg-[#FDFBF7]", // Cream base
    textPrimary: "text-[#2C3E50]", // Dark Slate/Charcoal for better readability
    textSecondary: "text-[#5E7C66]", // Olive for secondary text
    accent: "text-[#0F766E]", // Rich Teal
    accentBg: "bg-[#0F766E]",
    success: "text-[#059669]", // Emerald Green
    successBg: "bg-[#059669]",
    danger: "text-[#DC2626]", // Strong Red
    dangerBg: "bg-[#DC2626]",
    cardBg: "bg-white",
    cardBorder: "border-slate-100"
};

const Appointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [rescheduleModal, setRescheduleModal] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleSlot, setRescheduleSlot] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await appointmentService.getAppointments();
            setAppointments(response.data || []);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
        setActionLoading(true);
        try {
            await appointmentService.cancelAppointment(id);
            await fetchAppointments();
        } catch (error) {
            alert("Failed to cancel appointment");
        } finally {
            setActionLoading(false);
        }
    };

    const openRescheduleModal = (appointment) => {
        setRescheduleModal(appointment);
        setRescheduleDate('');
        setRescheduleSlot(null);
        setAvailableSlots([]);
    };

    const closeRescheduleModal = () => {
        setRescheduleModal(null);
        setRescheduleDate('');
        setRescheduleSlot(null);
        setAvailableSlots([]);
    };

    const handleDateChange = async (date) => {
        setRescheduleDate(date);
        setRescheduleSlot(null);
        if (!date || !rescheduleModal?.doctor?._id) return;

        setLoadingSlots(true);
        try {
            const response = await appointmentService.getSlots(rescheduleModal.doctor._id, date);
            setAvailableSlots(response.data || []);
        } catch (error) {
            console.error("Failed to fetch slots", error);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleReschedule = async () => {
        if (!rescheduleDate || !rescheduleSlot || !rescheduleModal) return;

        setActionLoading(true);
        try {
            await appointmentService.rescheduleAppointment(rescheduleModal._id, {
                date: rescheduleDate,
                time: rescheduleSlot
            });
            closeRescheduleModal();
            await fetchAppointments();
            alert("Appointment rescheduled successfully!");
        } catch (error) {
            alert(error.response?.data?.error || "Failed to reschedule appointment");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredAppointments = appointments.filter(app => {
        if (activeTab === 'upcoming') {
            return ['scheduled', 'confirmed'].includes(app.status);
        }
        return ['completed', 'cancelled'].includes(app.status);
    });

    const getStatusStyle = (status) => {
        switch(status) {
            case 'scheduled':
            case 'confirmed':
                return { 
                    badge: "bg-[#0F766E]/10 text-[#0F766E]", 
                    border: "border-l-4 border-[#0F766E]", // Rich Teal
                    icon: "text-[#0F766E]"
                };
            case 'completed':
                return { 
                    badge: "bg-[#059669]/10 text-[#059669]", // Emerald
                    border: "border-l-4 border-[#059669]", 
                    icon: "text-[#059669]"
                };
            case 'cancelled':
                return { 
                    badge: "bg-[#DC2626]/10 text-[#DC2626]", // Strong Red
                    border: "border-l-4 border-[#DC2626]", 
                    icon: "text-[#DC2626]"
                };
            default:
                return { 
                    badge: "bg-slate-100 text-slate-500", 
                    border: "border-l-4 border-slate-300",
                    icon: "text-slate-400"
                };
        }
    };

    return (
        <div className={`min-h-screen ${theme.bg} pb-24 relative overflow-x-hidden`}>
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-slate-200/60 px-6 pt-6 pb-4 shadow-sm">
                 <div className="flex items-center justify-between mb-6">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-[#2C3E50] tracking-tight">Appointments</h1>
                        <div className="h-1 w-12 bg-[#0F766E] mx-auto mt-1 rounded-full opacity-100 shadow-sm"></div>
                    </div>
                    <Link to="/book-appointment" className="p-3 rounded-2xl bg-[#0F766E] text-white shadow-lg shadow-[#0F766E]/30 flex items-center gap-1 active:scale-90 transition-transform hover:bg-[#115E59] hover:shadow-xl">
                        <Plus size={24} strokeWidth={2.5} />
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-slate-100 rounded-2xl shadow-inner">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                            activeTab === 'upcoming' 
                            ? 'bg-[#0F766E] text-white shadow-md shadow-[#0F766E]/20 scale-100' 
                            : 'text-slate-500 scale-95 hover:text-slate-700'
                        }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                            activeTab === 'history' 
                            ? 'bg-[#2C3E50] text-white shadow-md shadow-slate-900/20 scale-100' 
                            : 'text-slate-500 scale-95 hover:text-slate-700'
                        }`}
                    >
                        History
                    </button>
                </div>
            </div>

            <div className="px-6 py-6 space-y-6 max-w-lg mx-auto">
                <AnimatePresence mode='wait'>
                    {loading ? (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center py-20 gap-4">
                             <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0F766E] rounded-full animate-spin"></div>
                             <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Syncing calendar...</p>
                         </motion.div>
                    ) : filteredAppointments.length === 0 ? (
                        <motion.div initial={{opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-6 text-slate-300 shadow-sm border border-slate-100">
                                <Calendar size={48} />
                            </div>
                            <h3 className="font-bold text-[#2C3E50] text-xl mb-2">No appointments</h3>
                            <p className="text-base text-slate-500 mb-8 max-w-[240px] leading-relaxed">
                                {activeTab === 'upcoming' ? 'You have no upcoming appointments scheduled.' : 'No past appointment history found.'}
                            </p>
                            {activeTab === 'upcoming' && (
                                <Link to="/book-appointment" className="px-8 py-4 bg-[#2C3E50] text-white rounded-[20px] font-bold text-base shadow-xl shadow-slate-900/20 active:scale-95 transition-transform hover:bg-[#1E293B]">
                                    Book Now
                                </Link>
                            )}
                        </motion.div>
                    ) : (
                        filteredAppointments.map((app, idx) => {
                            const styles = getStatusStyle(app.status);
                            return (
                                <motion.div
                                    key={app._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all group border border-slate-100 ${styles.border}`}
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-5">
                                            <div className="flex gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                                                    <User size={28} className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[#2C3E50] text-xl leading-tight mb-1">
                                                        Dr. {app.doctor?.firstName} {app.doctor?.lastName}
                                                    </h3>
                                                    <div className={`bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold px-2.5 py-1 rounded-lg inline-block`}>
                                                        {app.doctor?.specialization}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-sm ${styles.badge}`}>
                                                {app.status}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-5">
                                            <div className="bg-slate-50/50 rounded-2xl p-4 flex flex-col gap-1 border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <Calendar size={16} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Date</span>
                                                </div>
                                                <p className="font-bold text-[#2C3E50] text-lg">
                                                    {new Date(app.scheduledDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                            <div className="bg-slate-50/50 rounded-2xl p-4 flex flex-col gap-1 border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <Clock size={16} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Time</span>
                                                </div>
                                                <p className="font-bold text-[#2C3E50] text-lg">{app.scheduledTime}</p>
                                            </div>
                                        </div>
                                        
                                         <div className="flex items-center gap-2 text-sm text-slate-600 px-1 font-medium bg-slate-50 py-3 rounded-xl justify-center border border-slate-100/50">
                                            <MapPin size={16} className="text-[#0F766E]" />
                                            {app.department?.name || 'Main Wing Hospital'}
                                        </div>
                                    </div>

                                    {app.status === 'scheduled' && (
                                        <div className="border-t border-slate-100 flex divide-x divide-slate-100 bg-slate-50/30">
                                            <button
                                                onClick={() => openRescheduleModal(app)}
                                                className="flex-1 py-4 text-center text-[#0F766E] text-sm font-bold hover:bg-[#0F766E]/5 transition-colors flex items-center justify-center gap-2 group/btn"
                                            >
                                                <RefreshCw size={18} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                                                Reschedule
                                            </button>
                                            <button
                                                onClick={() => handleCancel(app._id)}
                                                disabled={actionLoading}
                                                className="flex-1 py-4 text-center text-[#DC2626] text-sm font-bold hover:bg-[#DC2626]/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <X size={18} />
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Reschedule Modal */}
            <AnimatePresence>
                {rescheduleModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#2C3E50]/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                        onClick={closeRescheduleModal}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-[#FDFBF7] rounded-t-[32px] sm:rounded-[32px] w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl border border-white/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                                <div>
                                    <h2 className="text-xl font-bold text-[#2C3E50]">Reschedule</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">Please select a new time slot</p>
                                </div>
                                <button onClick={closeRescheduleModal} className="p-2 -mr-2 text-slate-400 hover:text-[#2C3E50] hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-[#FDFBF7]">
                                {/* Current Appointment Info */}
                                <div className="bg-[#0F766E]/10 p-5 rounded-[24px] border border-[#0F766E]/20 flex items-start gap-4">
                                    <div className="p-2 bg-white rounded-full text-[#0F766E]">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#0F766E] font-bold uppercase mb-1 tracking-wider">Currently Scheduled</p>
                                        <p className="font-bold text-[#2C3E50] text-base">
                                            {new Date(rescheduleModal.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            at <span className="font-bold">{rescheduleModal.scheduledTime}</span> with Dr. {rescheduleModal.doctor?.lastName}
                                        </p>
                                    </div>
                                </div>

                                {/* Date Picker */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block ml-1">Select New Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-4 bg-white border border-slate-200 rounded-[20px] text-[#2C3E50] font-bold focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none shadow-sm transition-all"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={rescheduleDate}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                    />
                                </div>

                                {/* Time Slots */}
                                {rescheduleDate && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block ml-1">Available Slots</label>
                                        {loadingSlots ? (
                                            <div className="py-8 flex justify-center">
                                                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0F766E] rounded-full animate-spin"></div>
                                            </div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-3">
                                                {availableSlots.map(slot => (
                                                    <button
                                                        key={slot.time}
                                                        type="button"
                                                        disabled={!slot.available}
                                                        onClick={() => setRescheduleSlot(slot.time)}
                                                        className={`py-3 rounded-[14px] text-xs font-bold transition-all border ${
                                                            !slot.available 
                                                                ? 'bg-[#FDFBF7] text-slate-300 border-transparent cursor-not-allowed hidden' 
                                                                : rescheduleSlot === slot.time 
                                                                    ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-lg shadow-[#0F766E]/20 ring-2 ring-[#0F766E]/20 ring-offset-1 ring-offset-[#FDFBF7]' 
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F766E]/30 hover:bg-[#FDFBF7]'
                                                            }`}
                                                    >
                                                        {slot.time}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-[#FAFAFA] rounded-[24px] border border-dashed border-slate-200">
                                                <p className="text-slate-400 text-sm font-bold">No slots available for this date.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0">
                                <button
                                    type="button"
                                    disabled={!rescheduleDate || !rescheduleSlot || actionLoading}
                                    onClick={handleReschedule}
                                    className="w-full py-4 bg-[#0F766E] text-white rounded-[20px] font-bold text-base tracking-wide shadow-xl shadow-[#0F766E]/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#115E59]"
                                >
                                    {actionLoading ? 'Updating Check-up...' : 'Confirm Reschedule'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Appointments;
