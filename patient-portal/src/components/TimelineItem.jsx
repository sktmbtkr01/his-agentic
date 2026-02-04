import { useNavigate } from 'react-router-dom';

const TimelineItem = ({ event, isLast }) => {
    const navigate = useNavigate();

    const getIcon = (type) => {
        switch (type) {
            case 'appointment': return '🏥';
            case 'lab_result': return '🔬';
            case 'document': return '📄';
            case 'health_log': return '❤️';
            default: return '📌';
        }
    };

    const getColors = (type) => {
        switch (type) {
            case 'appointment': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'lab_result': return 'bg-purple-100 text-purple-600 border-purple-200';
            case 'document': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'health_log': return 'bg-green-100 text-green-600 border-green-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const handleClick = () => {
        if (event.type === 'document' && event.status === 'pending') {
            navigate(`/verify-ocr/${event._id}`);
        } else if (event.type === 'lab_result' && event.details?._id) {
            // Could navigate to detailed lab view if it exists
        }
    };

    const formattedDate = new Date(event.date).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const formattedTime = new Date(event.date).toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="flex gap-4 group">
            {/* Time Column */}
            <div className="flex flex-col items-end min-w-[80px] pt-1">
                <span className="text-sm font-semibold text-slate-700">{formattedDate}</span>
                <span className="text-xs text-slate-400">{formattedTime}</span>
            </div>

            {/* Timeline Line & Dot */}
            <div className="relative flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 z-10 bg-white ${getColors(event.type).split(' ')[2]}`}></div>
                {!isLast && <div className="w-0.5 bg-slate-200 flex-1 absolute top-3 h-full"></div>}
            </div>

            {/* Content Card */}
            <div
                onClick={handleClick}
                className={`flex-1 mb-6 p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition cursor-pointer 
                ${event.type === 'document' && event.status === 'pending' ? 'ring-2 ring-orange-200' : ''}`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${getColors(event.type)}`}>
                            {getIcon(event.type)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">{event.title}</h3>
                            <p className="text-sm text-slate-500">{event.subtitle}</p>

                            {event.type === 'document' && event.status === 'pending' && (
                                <span className="inline-block mt-2 text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                    ⚠️ Action Required: Verify
                                </span>
                            )}
                            {event.type === 'document' && event.status === 'verified' && (
                                <span className="inline-block mt-2 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Verified
                                </span>
                            )}
                        </div>
                    </div>
                    {event.source === 'upload' && <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-500">Uploaded</span>}
                    {event.source === 'hospital' && <span className="text-xs px-2 py-1 bg-blue-50 rounded text-blue-500">Hospital</span>}
                </div>
            </div>
        </div>
    );
};

export default TimelineItem;
