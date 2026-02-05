import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Clock, Calendar, ChevronRight, X, FileText, Download, AlertTriangle, CheckCircle, Brain, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import labService from '../services/labService';

const LabResults = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('completed');
    const [labTests, setLabTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTest, setSelectedTest] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchLabTests();
    }, [activeTab]);

    const fetchLabTests = async () => {
        setLoading(true);
        try {
            // Fetch based on tab
            const status = activeTab === 'completed' ? 'completed' : 'pending';
            const response = await labService.getLabTests({ status });
            setLabTests(response.data || []);
        } catch (error) {
            console.error("Failed to fetch lab tests", error);
        } finally {
            setLoading(false);
        }
    };

    const openDetails = async (testId) => {
        setDetailLoading(true);
        try {
            const response = await labService.getLabTestById(testId);
            setSelectedTest(response.data);
        } catch (error) {
            console.error("Failed to fetch lab details", error);
        } finally {
            setDetailLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'sample_collected': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'in_progress': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'ordered': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const formatStatus = (status) => {
        return status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
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
                    <h1 className="text-lg font-bold text-slate-800">Lab Results</h1>
                    <div className="w-8"></div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100/80 rounded-xl backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'completed'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-600'
                            }`}
                    >
                        <CheckCircle size={14} /> Result
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'pending'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-600'
                            }`}
                    >
                        <Clock size={14} /> Pending
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-w-lg mx-auto">
                <AnimatePresence mode='wait'>
                    {loading ? (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center py-20 gap-4">
                             <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                             <p className="text-sm font-medium text-slate-400">Loading labs...</p>
                         </motion.div>
                    ) : labTests.length === 0 ? (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-20 px-8">
                             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                🧪
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">No results found</h2>
                            <p className="text-slate-500 text-sm">
                                {activeTab === 'completed' ? 'You have no completed lab results.' : 'No pending lab orders.'}
                            </p>
                        </motion.div>
                    ) : (
                        labTests.map((test, index) => (
                            <motion.div
                                key={test._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => openDetails(test._id)}
                                className="card-premium p-0 bg-white overflow-hidden group cursor-pointer"
                            >
                                <div className="p-5 flex items-start gap-4">
                                     {/* Left Icon with status indicator */}
                                     <div className="relative">
                                         <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
                                            <FlaskConical size={20} />
                                         </div>
                                         {(test.isAbnormal || test.isCritical) && (
                                            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                                                test.isCritical ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'
                                            }`}>
                                                <AlertTriangle size={10} />
                                            </div>
                                         )}
                                     </div>
                                     
                                     <div className="flex-1 min-w-0">
                                         <div className="flex justify-between items-start mb-1">
                                             <h3 className="font-bold text-slate-800 text-base leading-tight truncate pr-2">{test.testName}</h3>
                                             <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(test.status)}`}>
                                                {formatStatus(test.status)}
                                            </span>
                                         </div>
                                         <p className="text-xs text-slate-400 font-mono mb-2">{test.testNumber}</p>
                                         
                                         <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDate(test.orderedDate)}
                                            </span>
                                             {test.orderedBy && (
                                                <span className="flex items-center gap-1 truncate max-w-[100px]">
                                                    Dr. {test.orderedBy.lastName}
                                                </span>
                                            )}
                                         </div>
                                     </div>
                                      <div className="self-center pl-2 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">
                                         <ChevronRight size={20} />
                                     </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {(selectedTest || detailLoading) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={() => !detailLoading && setSelectedTest(null)}
                    >
                        {detailLoading ? (
                             <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl"
                            >
                                <div className="spinner w-8 h-8 border-indigo-500 border-t-transparent"></div>
                                <span className="text-slate-600 font-bold text-sm">Retrieving results...</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shrink-0">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold leading-tight pr-4">{selectedTest.testName}</h2>
                                            <p className="text-indigo-200 text-xs font-mono mt-1 opacity-80">Ref: {selectedTest.testNumber}</p>
                                        </div>
                                        <button onClick={() => setSelectedTest(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-md">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-medium text-indigo-100">
                                        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                                             <Calendar size={14} /> {formatDate(selectedTest.timelines.completed || selectedTest.timelines.ordered)}
                                        </div>
                                        <div className="uppercase text-[10px] font-bold tracking-wider bg-white text-indigo-600 px-2 py-1 rounded">
                                            {formatStatus(selectedTest.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div className="p-5 overflow-y-auto custom-scrollbar space-y-6">

                                    {/* AI Summary Section */}
                                    {selectedTest.aiSummary && (
                                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 relative overflow-hidden">
                                           <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100/50 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                            <div className="flex items-center gap-2 mb-3 text-indigo-700 font-bold relative z-10">
                                                <Brain size={18} />
                                                <h3 className="text-sm uppercase tracking-wider">AI Analysis</h3>
                                            </div>
                                            <div className="text-sm text-slate-700 space-y-2 relative z-10 leading-relaxed">
                                                {selectedTest.aiSummary.summary?.split('\n').map((line, i) => (
                                                    <p key={i}>{line}</p>
                                                ))}
                                                {selectedTest.aiSummary.keyFindings && (
                                                    <div className="mt-3 bg-white/60 p-3 rounded-xl border border-indigo-100/50">
                                                        <p className="text-xs font-bold text-indigo-800 mb-2">Key Findings:</p>
                                                        <ul className="space-y-1">
                                                            {selectedTest.aiSummary.keyFindings.map((item, i) => (
                                                                <li key={i} className="text-xs flex items-start gap-2">
                                                                    <div className="w-1 h-1 bg-indigo-400 rounded-full mt-1.5 shrink-0"></div>
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Results Table */}
                                    {selectedTest.results && selectedTest.results.length > 0 ? (
                                        <div>
                                            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-3 ml-1">
                                                Raw Data
                                            </h3>
                                            <div className="space-y-3">
                                                {selectedTest.results.map((result, idx) => (
                                                    <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${
                                                        result.isCritical ? 'bg-rose-50 border-rose-100' :
                                                        result.isAbnormal ? 'bg-amber-50 border-amber-100' : 
                                                        'bg-slate-50 border-slate-100'
                                                    }`}>
                                                        <div>
                                                            <p className="font-bold text-slate-700 text-sm">{result.parameter}</p>
                                                            <p className="text-xs text-slate-400 mt-0.5">Ref: {result.normalRange || 'N/A'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                             <p className={`font-bold text-lg ${
                                                                 result.isCritical ? 'text-rose-600' :
                                                                 result.isAbnormal ? 'text-amber-600' :
                                                                 'text-slate-800'
                                                             }`}>
                                                                 {result.value}
                                                                 <span className="text-xs font-medium text-slate-400 ml-1">{result.unit}</span>
                                                             </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                       <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <FlaskConical size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm font-medium">No numerical results available yet</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-white">
                                    <button
                                        onClick={() => setSelectedTest(null)}
                                        className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LabResults;
