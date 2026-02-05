import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getQueue, resetOPD } from '../../features/opd/opdSlice';
import { motion } from 'framer-motion';
import { User, Clock, CheckCircle, Activity, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OPDQueue = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { queue, isLoading, isError, message } = useSelector((state) => state.opd);

    // Auto-refresh mechanism
    useEffect(() => {
        dispatch(getQueue());
        const interval = setInterval(() => {
            dispatch(getQueue());
        }, 30000); // Poll every 30s

        return () => {
            clearInterval(interval);
            dispatch(resetOPD());
        }
    }, [dispatch]);

    const handleConsultationStart = (appointmentId) => {
        navigate(`/dashboard/consultation/${appointmentId}`);
    };

    if (isLoading && (!queue || queue.length === 0)) {
        return <div className="p-12 text-center text-text-muted">Loading queue...</div>
    }

    if (isError) {
        return <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-lg m-4">Error loading queue: {message}</div>
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Activity className="text-primary" /> OPD Live Queue
                    </h1>
                    <p className="text-text-secondary text-sm">Real-time patient waiting list</p>
                </div>
                <div className="bg-surface px-4 py-2 rounded-full shadow-sm text-sm font-medium text-text-secondary border border-border">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Queue List */}
            <div className="space-y-4">
                {queue && queue.length > 0 ? queue.map((appointment, index) => (
                    <motion.div
                        key={appointment._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative p-6 rounded-2xl border transition-all ${index === 0
                            ? 'bg-surface border-primary shadow-lg shadow-primary/10 scale-[1.02]' // Active Patient
                            : 'bg-surface border-border shadow-sm opacity-80 hover:opacity-100 hover:shadow-md'
                            }`}
                    >
                        {index === 0 && (
                            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                Current Patient
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                {/* Token Number */}
                                <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl font-bold border-2 ${index === 0 ? 'bg-primary text-white border-primary' : 'bg-surface-secondary text-text-muted border-border'
                                    }`}>
                                    <span className="text-xs uppercase opacity-70">Token</span>
                                    <span className="text-3xl">{appointment.tokenNumber || index + 1}</span>
                                </div>

                                {/* Patient Info */}
                                <div>
                                    <h3 className="text-xl font-bold text-text-primary">{appointment.patient.firstName} {appointment.patient.lastName}</h3>
                                    <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                                        <span className="flex items-center gap-1"><User size={14} /> {appointment.patient.patientId}</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(appointment.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="mt-2 inline-block px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded-md font-medium capitalize">
                                        {appointment.status.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate(`/dashboard/emr/${appointment.patient._id}`)}
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all bg-surface-secondary text-text-primary hover:bg-surface-highlight"
                                    title="View Patient EMR"
                                >
                                    <FileText size={18} />
                                    EMR
                                </button>
                                <button
                                    onClick={() => handleConsultationStart(appointment._id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${index === 0
                                        ? 'bg-primary text-white hover:bg-primary-hover shadow-md'
                                        : 'bg-surface-secondary text-text-secondary hover:bg-surface-highlight'
                                        }`}
                                >
                                    {index === 0 ? 'Start Consultation' : 'View Details'}
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border">
                        <CheckCircle size={64} className="mx-auto text-green-500/20 mb-4" />
                        <h3 className="text-xl font-bold text-text-primary">All Cleared!</h3>
                        <p className="text-text-muted">No patients waiting in queue.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OPDQueue;
