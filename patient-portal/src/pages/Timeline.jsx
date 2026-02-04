import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import recordsService from '../services/recordsService';
import TimelineItem from '../components/TimelineItem';

const Timeline = () => {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        sources: ['hospital', 'self', 'upload']
    });

    useEffect(() => {
        fetchTimeline();
    }, [filters]);

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const response = await recordsService.getTimeline({
                ...filters,
                sources: filters.sources.join(',')
            });
            setTimeline(response.data.data);
        } catch (error) {
            console.error('Failed to fetch timeline', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSource = (source) => {
        setFilters(prev => {
            const newSources = prev.sources.includes(source)
                ? prev.sources.filter(s => s !== source)
                : [...prev.sources, source];
            return { ...prev, sources: newSources };
        });
    };

    return (
        <div className="page-container min-h-screen pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-8 mb-4">
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Medical Timeline</h1>
                        <p className="opacity-90">Your complete health journey</p>
                    </div>
                    <Link to="/upload-document" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition backdrop-blur-sm">
                        + Upload
                    </Link>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4">
                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {['hospital', 'self', 'upload'].map(source => (
                        <button
                            key={source}
                            onClick={() => toggleSource(source)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition capitalize
                                ${filters.sources.includes(source)
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                        >
                            {source === 'hospital' ? '🏥 Hospital' : source === 'self' ? '👤 Self' : '📄 Uploads'}
                        </button>
                    ))}
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse flex gap-4">
                                <div className="w-20 pt-1 flex flex-col items-end gap-1">
                                    <div className="h-4 w-12 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-8 bg-slate-200 rounded"></div>
                                </div>
                                <div className="w-3 h-3 rounded-full bg-slate-200 mt-1 shrink-0"></div>
                                <div className="flex-1 h-24 bg-slate-200 rounded-xl mb-6"></div>
                            </div>
                        ))}
                    </div>
                ) : timeline.length > 0 ? (
                    <div className="relative">
                        {/* Vertical line background for the whole list */}
                        <div className="absolute left-[94px] top-2 bottom-6 w-0.5 bg-slate-200 -z-10"></div>

                        {timeline.map((event, index) => (
                            <TimelineItem
                                key={event._id}
                                event={event}
                                isLast={index === timeline.length - 1}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        <span className="text-4xl block mb-2">📭</span>
                        <p>No records found for the selected filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timeline;
