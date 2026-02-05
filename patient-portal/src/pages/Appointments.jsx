import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Plus, X, RefreshCw, AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import appointmentService from '../services/appointmentService';

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
                    <h1 className="text-lg font-bold text-slate-800">Appointments</h1>
                    <Link to="/book-appointment" className="p-2 rounded-full bg-blue-600 text-white shadow-lg text-sm flex items-center gap-1 active:scale-90 transition-transform">
                        <Plus size={20} />
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100/80 rounded-xl backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            activeTab === 'upcoming' 
                            ? 'bg-white text-blue-600 shadow-sm scale-1' 
                            : 'text-slate-500 scale-95 opacity-80'
                        }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            activeTab === 'history' 
                            ? 'bg-white text-slate-800 shadow-sm scale-1' 
                            : 'text-slate-500 scale-95 opacity-80'
                        }`}
                    >
                        History
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4 max-w-lg mx-auto">
                <AnimatePresence mode='wait'>
                    {loading ? (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center py-20 gap-4">
                             <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                             <p className="text-sm font-medium text-slate-400">Syncing calendar...</p>
                         </motion.div>
                    ) : filteredAppointments.length === 0 ? (
                        <motion.div initial={{opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <Calendar size={40} />
                            </div>
                            <h3 className="font-bold text-slate-700 text-lg mb-1">No appointments</h3>
                            <p className="text-sm text-slate-400 mb-6 max-w-[200px]">
                                {activeTab === 'upcoming' ? 'You have no upcoming appointments scheduled.' : 'No past appointment history found.'}
                            </p>
                            {activeTab === 'upcoming' && (
                                <Link to="/book-appointment" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-transform">
                                    Book Now
                                </Link>
                            )}
                        </motion.div>
                    ) : (
                        filteredAppointments.map((app, idx) => (
                            <motion.div
                                key={app._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="card-premium p-0 bg-white overflow-hidden group"
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                <User size={24} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg leading-tight">
                                                    Dr. {app.doctor?.firstName} {app.doctor?.lastName}
                                                </h3>
                                                <p className="text-sm text-blue-500 font-medium">{app.doctor?.specialization}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            app.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                                            app.status === 'completed' ? 'bg-green-50 text-green-600' :
                                            'bg-rose-50 text-rose-600'
                                        }`}>
                                            {app.status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                                            <Calendar size={18} className="text-slate-400" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                                                <p className="font-bold text-slate-700 text-sm">
                                                    {new Date(app.scheduledDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                                            <Clock size={18} className="text-slate-400" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Time</p>
                                                <p className="font-bold text-slate-700 text-sm">{app.scheduledTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                     <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                                        <MapPin size={14} className="text-slate-400" />
                                        {app.department?.name || 'Main Wing Hospital'}
                                    </div>
                                </div>

                                {app.status === 'scheduled' && (
                                    <div className="border-t border-slate-100 flex divide-x divide-slate-100 bg-slate-50/50">
                                        <button
                                            onClick={() => openRescheduleModal(app)}
                                            className="flex-1 py-3 text-center text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={14} />
                                            Reschedule
                                        </button>
                                        <button
                                            onClick={() => handleCancel(app._id)}
                                            disabled={actionLoading}
                                            className="flex-1 py-3 text-center text-rose-500 text-xs font-bold hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <X size={14} />
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={closeRescheduleModal}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Reschedule</h2>
                                    <p className="text-xs text-slate-500 font-medium">Please select a new time slot</p>
                                </div>
                                <button onClick={closeRescheduleModal} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
                                {/* Current Appointment Info */}
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                    <AlertCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Currently Scheduled</p>
                                        <p className="font-bold text-slate-800 text-sm">
                                            {new Date(rescheduleModal.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            at {rescheduleModal.scheduledTime} with Dr. {rescheduleModal.doctor?.lastName}
                                        </p>
                                    </div>
                                </div>

                                {/* Date Picker */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Select New Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={rescheduleDate}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                    />
                                </div>

                                {/* Time Slots */}
                                {rescheduleDate && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Available Slots</label>
                                        {loadingSlots ? (
                                            <div className="py-8 flex justify-center">
                                                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                                            </div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                {availableSlots.map(slot => (
                                                    <button
                                                        key={slot.time}
                                                        type="button"
                                                        disabled={!slot.available}
                                                        onClick={() => setRescheduleSlot(slot.time)}
                                                        className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                                                            !slot.available 
                                                                ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed hidden' 
                                                                : rescheduleSlot === slot.time 
                                                                    ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800 ring-offset-2' 
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        {slot.time}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 text-sm font-medium">No slots available for this date.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 border-t border-slate-100 bg-white sticky bottom-0">
                                <button
                                    type="button"
                                    disabled={!rescheduleDate || !rescheduleSlot || actionLoading}
                                    onClick={handleReschedule}
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-blue-500/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
