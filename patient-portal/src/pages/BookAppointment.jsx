import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
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

    return (
        <div className="page-container pb-20 bg-slate-50 min-h-screen">
            <header className="bg-white p-4 sticky top-0 z-10 border-b flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="text-slate-500">
                    <ChevronLeft />
                </button>
                <h1 className="text-xl font-bold text-slate-800">Book Appointment</h1>
            </header>

            <div className="p-4">
                {/* Progress */}
                <div className="flex justify-between mb-6 px-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-2 rounded-full flex-1 mx-1 ${step >= i ? 'bg-primary' : 'bg-slate-200'}`} />
                    ))}
                </div>

                {/* Step 1: Department & Doctor */}
                {step === 1 && (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <h2 className="text-lg font-semibold mb-4 text-slate-800">Choose Specialist</h2>

                        <label className="block text-sm font-medium text-slate-600 mb-2">Department</label>
                        <select
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            onChange={(e) => {
                                const dept = departments.find(d => d._id === e.target.value);
                                setSelectedDept(dept || null);
                                setSelectedDoctor(null);
                            }}
                            value={selectedDept?._id || ''}
                        >
                            <option value="">Select Department</option>
                            {departments.map(d => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                        </select>

                        {selectedDept && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-600 mb-2">Select Doctor</label>
                                <div className="space-y-3">
                                    {doctors.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic py-4 text-center">No doctors available in this department.</p>
                                    ) : (
                                        doctors.map(doc => {
                                            const isSelected = selectedDoctor && selectedDoctor._id === doc._id;
                                            return (
                                                <div
                                                    key={doc._id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => {
                                                        console.log("Doctor selected:", doc);
                                                        setSelectedDoctor(doc);
                                                    }}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setSelectedDoctor(doc);
                                                        }
                                                    }}
                                                    style={{
                                                        border: isSelected ? '2px solid rgb(20, 184, 166)' : '1px solid #e2e8f0',
                                                        backgroundColor: isSelected ? 'rgb(240, 253, 250)' : 'white',
                                                        boxShadow: isSelected ? '0 0 0 3px rgba(20, 184, 166, 0.2)' : 'none'
                                                    }}
                                                    className="p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:shadow-md"
                                                >
                                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                                                        <User size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-800 text-lg">{doc.firstName} {doc.lastName}</p>
                                                        <p className="text-sm text-slate-500">{doc.specialization || 'General'}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white shrink-0">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-8">
                            <button
                                type="button"
                                disabled={!selectedDoctor}
                                onClick={() => {
                                    console.log("Next button clicked, selectedDoctor:", selectedDoctor);
                                    if (selectedDoctor) {
                                        setStep(2);
                                    }
                                }}
                                style={{
                                    backgroundColor: selectedDoctor ? 'rgb(20, 184, 166)' : 'rgb(148, 163, 184)',
                                    color: 'white',
                                    cursor: selectedDoctor ? 'pointer' : 'not-allowed',
                                    opacity: selectedDoctor ? 1 : 0.6
                                }}
                                className="w-full py-4 text-lg font-semibold rounded-xl shadow-lg transition-all"
                            >
                                Next: Schedule
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Date & Time */}
                {step === 2 && (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <h2 className="text-lg font-semibold mb-4 text-slate-800">Select Time</h2>

                        <label className="block text-sm font-medium text-slate-600 mb-2">Date</label>
                        <input
                            type="date"
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl mb-6"
                            min={new Date().toISOString().split('T')[0]}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />

                        {selectedDate && (
                            <>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Available Slots</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {slots.length > 0 ? slots.map(slot => (
                                        <button
                                            key={slot.time}
                                            disabled={!slot.available}
                                            onClick={() => setSelectedSlot(slot.time)}
                                            className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${!slot.available ? 'bg-slate-100 text-slate-300 cursor-not-allowed' :
                                                selectedSlot === slot.time ? 'bg-primary text-white' :
                                                    'bg-white border text-slate-600 hover:border-primary'
                                                }`}
                                        >
                                            {slot.time}
                                        </button>
                                    )) : (
                                        <p className="col-span-3 text-center text-slate-400 py-4">No slots available</p>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="flex gap-3 mt-8">
                            <button type="button" onClick={() => setStep(1)} className="flex-1 btn btn-secondary">Back</button>
                            <button
                                type="button"
                                disabled={!selectedSlot}
                                onClick={() => setStep(3)}
                                className="flex-1 btn btn-primary disabled:opacity-50"
                            >
                                Next: Review
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <h2 className="text-lg font-semibold mb-4 text-slate-800">Confirm Booking</h2>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex justify-between border-b pb-4">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Doctor</p>
                                    <p className="font-bold text-slate-800">Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</p>
                                    <p className="text-sm text-slate-500">{selectedDept?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase font-bold">Schedule</p>
                                    <p className="font-bold text-slate-800">{new Date(selectedDate).toLocaleDateString()}</p>
                                    <p className="text-sm text-primary font-bold">{selectedSlot}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Notes (Optional)</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 rounded-lg text-sm"
                                    placeholder="Describe your symptoms or reason for visit..."
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                disabled={isBooking}
                                className="flex-1 btn btn-secondary disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleBook}
                                disabled={isBooking}
                                className="flex-1 btn btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isBooking ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
                                        Booking...
                                    </span>
                                ) : (
                                    'Confirm Booking'
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default BookAppointment;
