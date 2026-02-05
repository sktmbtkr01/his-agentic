import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, FlaskConical, Stethoscope, Activity, AlertCircle, CheckCircle, Upload, Building2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const TimelineItem = ({ event, isLast, index = 0 }) => {
    const navigate = useNavigate();

    const getIcon = (type) => {
        switch (type) {
            case 'appointment': return <Stethoscope size={20} />;
            case 'lab_result': return <FlaskConical size={20} />;
            case 'document': return <FileText size={20} />;
            case 'health_log': return <Activity size={20} />;
            default: return <Calendar size={20} />;
        }
    };

    const getColors = (type) => {
        switch (type) {
            case 'appointment': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'lab_result': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'document': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'health_log': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const handleClick = () => {
        if (event.type === 'document' && event.status === 'pending') {
            navigate(`/verify-ocr/${event._id}`);
        } else if (event.type === 'lab_result' && event.details?._id) {
           // navigate(`/lab-results/${event.details._id}`); // Simplified for now
        }
    };

    const formattedDate = new Date(event.date).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric'
    });

    const formattedYear = new Date(event.date).getFullYear();

    const formattedTime = new Date(event.date).toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-4 group relative"
        >
            {/* Time Column */}
            <div className="flex flex-col items-end min-w-[70px] pt-1 text-right">
                <span className="text-sm font-bold text-slate-800 leading-tight">{formattedDate}</span>
                <span className="text-[10px] text-slate-400 font-medium">{formattedYear}</span>
                <span className="text-xs text-slate-500 mt-1">{formattedTime}</span>
            </div>

            {/* Timeline Line & Dot */}
            <div className="relative flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 z-10 bg-white shadow-sm ring-4 ring-white ${
                    event.type === 'appointment' ? 'border-blue-500' :
                    event.type === 'lab_result' ? 'border-purple-500' :
                    event.type === 'document' ? 'border-orange-500' :
                    'border-emerald-500'
                }`}></div>
                {!isLast && <div className="w-0.5 bg-slate-100 flex-1 absolute top-3 h-[calc(100%+16px)]"></div>}
            </div>

            {/* Content Card */}
            <div
                onClick={handleClick}
                className={`flex-1 mb-6 p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group-hover:bg-slate-50/50
                ${event.type === 'document' && event.status === 'pending' ? 'ring-2 ring-orange-100 border-orange-200' : 'border-slate-100'}`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${getColors(event.type)}`}>
                            {getIcon(event.type)}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-base leading-tight mb-1">{event.title}</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{event.subtitle}</p>

                            {event.type === 'document' && event.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full border border-orange-100">
                                    <AlertCircle size={12} /> Make Verification
                                </span>
                            )}
                            {event.type === 'document' && event.status === 'verified' && (
                                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
                                    <CheckCircle size={12} /> Verified
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {event.source === 'upload' && (
                             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400" title="Uploaded by you">
                                 <Upload size={12} />
                             </div>
                        )}
                        {event.source === 'hospital' && (
                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500" title="Hospital Record">
                                <Building2 size={12} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TimelineItem;
