import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Plus, X, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import appointmentService from '../services/appointmentService';

const Appointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="page-container pb-20">
            <header className="bg-white p-4 sticky top-0 z-10 border-b flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-800">My Appointments</h1>
                <Link to="/book-appointment" className="btn btn-primary text-sm flex items-center gap-1">
                    <Plus size={16} /> Book New
                </Link>
            </header>

            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-500">
                        <div className="spinner mx-auto mb-2" style={{ width: '2rem', height: '2rem' }}></div>
                        Loading appointments...
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                        <Calendar size={48} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 font-medium">No appointments found</p>
                        <p className="text-xs text-slate-400 mb-4">Schedule a check-up with our doctors</p>
                        <Link to="/book-appointment" className="text-primary font-bold text-sm">Book Appointment</Link>
                    </div>
                ) : (
                    appointments.map(app => (
                        <motion.div
                            key={app._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold mb-2 ${app.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                                        app.status === 'completed' ? 'bg-green-50 text-green-600' :
                                            'bg-red-50 text-red-600'
                                        }`}>
                                        {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                                    </span>
                                    <h3 className="font-bold text-slate-800 text-lg">
                                        Dr. {app.doctor?.firstName} {app.doctor?.lastName}
                                    </h3>
                                    <p className="text-sm text-slate-500">{app.doctor?.specialization}</p>
                                </div>
                                <div className="text-center bg-slate-50 px-3 py-2 rounded-xl">
                                    <p className="text-xs text-slate-400 uppercase font-bold">
                                        {new Date(app.scheduledDate).toLocaleDateString(undefined, { month: 'short' })}
                                    </p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {new Date(app.scheduledDate).getDate()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Clock size={16} className="text-slate-400" />
                                    {app.scheduledTime}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin size={16} className="text-slate-400" />
                                    {app.department?.name || 'Main Wing'}
                                </div>
                            </div>

                            {app.status === 'scheduled' && (
                                <div className="flex gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        onClick={() => openRescheduleModal(app)}
                                        className="flex-1 py-2 text-center text-primary text-sm font-medium hover:bg-primary/5 rounded-lg transition flex items-center justify-center gap-1"
                                    >
                                        <RefreshCw size={14} />
                                        Reschedule
                                    </button>
                                    <button
                                        onClick={() => handleCancel(app._id)}
                                        disabled={actionLoading}
                                        className="flex-1 py-2 text-center text-red-500 text-sm font-medium hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Reschedule Modal */}
            <AnimatePresence>
                {rescheduleModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={closeRescheduleModal}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <h2 className="text-lg font-bold text-slate-800">Reschedule Appointment</h2>
                                <button onClick={closeRescheduleModal} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                                {/* Current Appointment Info */}
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Current Appointment</p>
                                    <p className="font-bold text-slate-800">
                                        Dr. {rescheduleModal.doctor?.firstName} {rescheduleModal.doctor?.lastName}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {new Date(rescheduleModal.scheduledDate).toLocaleDateString()} at {rescheduleModal.scheduledTime}
                                    </p>
                                </div>

                                {/* Date Picker */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">New Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={rescheduleDate}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                    />
                                </div>

                                {/* Time Slots */}
                                {rescheduleDate && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-2">New Time</label>
                                        {loadingSlots ? (
                                            <div className="text-center py-4 text-slate-400">Loading slots...</div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-2">
                                                {availableSlots.map(slot => (
                                                    <button
                                                        key={slot.time}
                                                        type="button"
                                                        disabled={!slot.available}
                                                        onClick={() => setRescheduleSlot(slot.time)}
                                                        className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${!slot.available ? 'bg-slate-100 text-slate-300 cursor-not-allowed' :
                                                            rescheduleSlot === slot.time ? 'bg-primary text-white' :
                                                                'bg-white border text-slate-600 hover:border-primary'
                                                            }`}
                                                    >
                                                        {slot.time}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-4 text-slate-400">No slots available</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-3 p-4 border-t">
                                <button
                                    type="button"
                                    onClick={closeRescheduleModal}
                                    className="flex-1 btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={!rescheduleDate || !rescheduleSlot || actionLoading}
                                    onClick={handleReschedule}
                                    className="flex-1 btn btn-primary disabled:opacity-50"
                                >
                                    {actionLoading ? 'Saving...' : 'Confirm'}
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
