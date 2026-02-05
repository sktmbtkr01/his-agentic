import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar as CalendarIcon, Clock, User, Stethoscope, CheckCircle, ArrowRight } from 'lucide-react';
import appointmentService from '../services/appointmentService';

const BookAppointment = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isBooking, setIsBooking] = useState(false);

    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);

    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Fetch Departments on mount
        const loadDepts = async () => {
            const res = await appointmentService.getDepartments();
            setDepartments(res.data || []);
        };
        loadDepts();
    }, []);

    useEffect(() => {
        if (selectedDept) {
            const loadDoctors = async () => {
                const res = await appointmentService.getDoctors(selectedDept._id);
                setDoctors(res.data || []);
            };
            loadDoctors();
        }
    }, [selectedDept]);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            const loadSlots = async () => {
                const res = await appointmentService.getSlots(selectedDoctor._id, selectedDate);
                setSlots(res.data || []);
            };
            loadSlots();
        }
    }, [selectedDoctor, selectedDate]);

    const handleBook = async () => {
        setIsBooking(true);
        try {
            await appointmentService.bookAppointment({
                departmentId: selectedDept._id,
                doctorId: selectedDoctor._id,
                date: selectedDate,
                time: selectedSlot,
                notes
            });
            // Navigate with success state
            navigate('/appointments', { state: { success: 'Appointment booked successfully!' } });
        } catch (error) {
            alert(error.response?.data?.error || "Failed to book appointment");
            setIsBooking(false);
        }
    };

    const steps = [
        { id: 1, label: 'Doctor' },
        { id: 2, label: 'Time' },
        { id: 3, label: 'Confirm' }
    ];

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-24 relative overflow-x-hidden">
             {/* Glass Header */}
             <div className="sticky top-0 z-30 glass border-b border-slate-200/50 px-4 pt-4 pb-2">
                 <div className="flex items-center gap-4 mb-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100/50 text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">New Appointment</h1>
                        <p className="text-xs text-slate-500">Step {step} of 3</p>
                    </div>
                </div>

                 {/* Progress Bar */}
                 <div className="flex items-center justify-between mb-2 relative">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10"></div>
                     <div className="absolute left-0 top-1/2 h-0.5 bg-blue-500 -z-10 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                    {steps.map((s) => (
                        <div key={s.id} className="flex flex-col items-center bg-[var(--color-background)] px-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                                step >= s.id 
                                ? 'bg-blue-500 border-blue-500 text-white' 
                                : 'bg-white border-slate-300 text-slate-400'
                            }`}>
                                {step > s.id ? <CheckCircle size={16} /> : s.id}
                            </div>
                            <span className={`text-[10px] font-bold mt-1 tracking-wider uppercase transition-colors ${step >= s.id ? 'text-blue-600' : 'text-slate-400'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto">
                <AnimatePresence mode='wait'>
                    {/* Step 1: Department & Doctor */}
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ x: 20, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Select Department</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none appearance-none transition-all"
                                        onChange={(e) => {
                                            const dept = departments.find(d => d._id === e.target.value);
                                            setSelectedDept(dept || null);
                                            setSelectedDoctor(null);
                                        }}
                                        value={selectedDept?._id || ''}
                                    >
                                        <option value="">Choose Specialty...</option>
                                        {departments.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                </div>
                            </div>

                            {selectedDept && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Available Doctors</label>
                                    <div className="space-y-3">
                                        {doctors.length === 0 ? (
                                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 text-sm font-medium">No doctors available for this department.</p>
                                            </div>
                                        ) : (
                                            doctors.map(doc => {
                                                const isSelected = selectedDoctor && selectedDoctor._id === doc._id;
                                                return (
                                                    <div
                                                        key={doc._id}
                                                        onClick={() => setSelectedDoctor(doc)}
                                                        className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border-2 ${
                                                            isSelected 
                                                            ? 'bg-blue-50 border-blue-500 shadow-blue-500/10' 
                                                            : 'bg-white border-transparent shadow-sm hover:scale-[1.02]'
                                                        }`}
                                                    >
                                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 border-2 ${isSelected ? 'bg-white border-blue-200 text-blue-600' : 'bg-slate-100 border-white text-slate-400'}`}>
                                                            {doc.firstName[0]}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className={`font-bold text-lg ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                                                Dr. {doc.firstName} {doc.lastName}
                                                            </h3>
                                                            <p className={`text-sm ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                                                                {doc.specialization || 'Specialist'}
                                                            </p>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                                                            isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-200'
                                                        }`}>
                                                            {isSelected && <CheckCircle size={14} fill="currentColor" className="text-white" />}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="button"
                                    disabled={!selectedDoctor}
                                    onClick={() => selectedDoctor && setStep(2)}
                                    className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                >
                                    Next Step <ArrowRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Date & Time */}
                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ x: 20, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Select Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                </div>
                            </div>

                            {selectedDate && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Available Slots</label>
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                        {slots.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-3">
                                                {slots.map(slot => (
                                                    <button
                                                        key={slot.time}
                                                        disabled={!slot.available}
                                                        onClick={() => setSelectedSlot(slot.time)}
                                                        className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                                                            !slot.available 
                                                            ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed hidden' 
                                                            : selectedSlot === slot.time 
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        {slot.time}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-slate-400 text-sm font-medium">No slots available for this date.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setStep(1)} 
                                    className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold active:scale-95 transition-transform"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    disabled={!selectedSlot}
                                    onClick={() => setStep(3)}
                                    className="flex-[2] py-4 bg-slate-800 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                >
                                    Review <ArrowRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ x: 20, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="card-premium p-6 bg-white space-y-6">
                                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
                                        Dr.
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-800">
                                            Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                                        </h3>
                                        <p className="text-blue-500 font-medium">{selectedDept?.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <CalendarIcon size={16} />
                                            <span className="text-xs font-bold uppercase">Date</span>
                                        </div>
                                        <p className="font-bold text-slate-800">
                                            {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <Clock size={16} />
                                            <span className="text-xs font-bold uppercase">Time</span>
                                        </div>
                                        <p className="font-bold text-slate-800">{selectedSlot}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Notes (Optional)</label>
                                    <textarea
                                        className="w-full p-4 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                        placeholder="Briefly describe your symptoms or reason for visit..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={isBooking}
                                    className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold active:scale-95 transition-transform"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBook}
                                    disabled={isBooking}
                                    className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isBooking ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Confirming...
                                        </>
                                    ) : (
                                        <>Confirm Booking <CheckCircle size={20} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BookAppointment;
