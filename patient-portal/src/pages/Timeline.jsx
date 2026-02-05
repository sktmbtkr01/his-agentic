import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Filter, Building2, User, Search, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import recordsService from '../services/recordsService';
import TimelineItem from '../components/TimelineItem';

const Timeline = () => {
    const navigate = useNavigate();
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        sources: ['hospital', 'self']
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
            setTimeline(response.data.data || []);
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
                    <h1 className="text-lg font-bold text-slate-800">History</h1>
                    <div className="w-8"></div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
                    {['hospital', 'self'].map(source => (
                        <button
                            key={source}
                            onClick={() => toggleSource(source)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                                ${filters.sources.includes(source)
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-500/20'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                        >
                            {source === 'hospital' ? <Building2 size={12} /> : <User size={12} />}
                            {source === 'hospital' ? 'Hospital' : 'Self-Logged'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 mt-6">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 opacity-50">
                                    <div className="w-16 pt-1 flex flex-col items-end gap-1">
                                        <div className="h-3 w-10 bg-slate-200 rounded animate-pulse"></div>
                                        <div className="h-2 w-6 bg-slate-200 rounded animate-pulse"></div>
                                    </div>
                                    <div className="w-3 h-3 rounded-full bg-slate-200 mt-1 shrink-0"></div>
                                    <div className="flex-1 h-24 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse"></div>
                                </div>
                            ))}
                        </motion.div>
                    ) : timeline.length > 0 ? (
                        <div className="relative pb-10">
                             {/* Vertical Guide Line */}
                            <div className="absolute left-[85px] top-2 bottom-6 w-0.5 bg-slate-100 -z-10"></div>

                            {timeline.map((event, index) => (
                                <TimelineItem
                                    key={event._id}
                                    event={event}
                                    index={index}
                                    isLast={index === timeline.length - 1}
                                />
                            ))}
                        </div>
                    ) : (
                        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="text-center py-20 px-8">
                             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                📜
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">No records found</h2>
                            <p className="text-slate-500 text-sm">
                                Try adjusting the filters to see more of your medical history.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Timeline;
