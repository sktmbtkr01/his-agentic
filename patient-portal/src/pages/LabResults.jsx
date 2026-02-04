import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Clock, Calendar, ChevronRight, X, FileText, Download, AlertTriangle, CheckCircle, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import labService from '../services/labService';

const LabResults = () => {
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
            case 'completed': return 'bg-green-50 text-green-600 border-green-200';
            case 'sample_collected': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'in_progress': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'ordered': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const formatStatus = (status) => {
        return status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <div className="page-container pb-20">
            {/* Header */}
            <header className="bg-white p-4 sticky top-0 z-10 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-slate-800">Lab Results</h1>
                    <Link to="/dashboard" className="text-primary font-medium text-sm">
                        Dashboard
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'completed'
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <CheckCircle size={16} />
                        Completed
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'pending'
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <Clock size={16} />
                        Pending
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-500">
                        <div className="spinner mx-auto mb-2" style={{ width: '2rem', height: '2rem' }}></div>
                        Loading labs...
                    </div>
                ) : labTests.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                        <FlaskConical size={48} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 font-medium">
                            {activeTab === 'completed' ? 'No completed lab results' : 'No pending lab orders'}
                        </p>
                    </div>
                ) : (
                    labTests.map((test, index) => (
                        <motion.div
                            key={test._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => openDetails(test._id)}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                            {/* Category Indicator Strip */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${test.isCritical ? 'bg-red-500' : test.isAbnormal ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}></div>

                            <div className="flex justify-between items-start mb-2 pl-2">
                                <div>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${getStatusColor(test.status)}`}>
                                        {formatStatus(test.status)}
                                    </span>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{test.testName}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{test.testNumber}</p>
                                </div>
                                {(test.isAbnormal || test.isCritical) && (
                                    <div className={`p-2 rounded-full ${test.isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                        <AlertTriangle size={16} />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 mt-3 pl-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {formatDate(test.orderedDate)}
                                </span>
                                {test.orderedBy && (
                                    <span className="flex items-center gap-1">
                                        Dr. {test.orderedBy.lastName}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {(selectedTest || detailLoading) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={() => !detailLoading && setSelectedTest(null)}
                    >
                        {detailLoading ? (
                            <div className="bg-white p-4 rounded-xl flex items-center gap-3">
                                <div className="spinner w-5 h-5"></div>
                                <span className="text-slate-600 font-medium">Loading details...</span>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="p-4 border-b bg-slate-50 flex justify-between items-start sticky top-0 z-10">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800 leading-tight">{selectedTest.testName}</h2>
                                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                            <Calendar size={14} /> {formatDate(selectedTest.timelines.completed || selectedTest.timelines.ordered)}
                                        </p>
                                    </div>
                                    <button onClick={() => setSelectedTest(null)} className="p-1 bg-slate-200 rounded-full hover:bg-slate-300">
                                        <X size={20} className="text-slate-600" />
                                    </button>
                                </div>

                                {/* Scrollable Content */}
                                <div className="p-4 overflow-y-auto space-y-6">

                                    {/* AI Summary Section */}
                                    {selectedTest.aiSummary && (
                                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                            <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold">
                                                <Brain size={18} />
                                                <h3>AI Summary</h3>
                                            </div>
                                            <div className="text-sm text-slate-700 space-y-2">
                                                {selectedTest.aiSummary.summary?.split('\n').map((line, i) => (
                                                    <p key={i}>{line}</p>
                                                ))}
                                                {/* Handle structured AI response if present */}
                                                {selectedTest.aiSummary.keyFindings && (
                                                    <ul className="list-disc pl-4 mt-2 bg-white/50 p-2 rounded-lg">
                                                        {selectedTest.aiSummary.keyFindings.map((item, i) => (
                                                            <li key={i}>{item}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-indigo-400 mt-3 text-right">
                                                Generated by AI • Verify with doctor
                                            </p>
                                        </div>
                                    )}

                                    {/* Results Table */}
                                    {selectedTest.results && selectedTest.results.length > 0 ? (
                                        <div>
                                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                <FileText size={18} className="text-slate-400" />
                                                Test Results
                                            </h3>
                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                                        <tr>
                                                            <th className="px-4 py-3 font-medium">Parameter</th>
                                                            <th className="px-4 py-3 font-medium text-right">Value</th>
                                                            <th className="px-4 py-3 font-medium text-right bg-slate-50/50 hidden sm:table-cell">Range</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {selectedTest.results.map((result, idx) => (
                                                            <tr key={idx} className={result.isAbnormal ? 'bg-amber-50/30' : ''}>
                                                                <td className="px-4 py-3 font-medium text-slate-700">
                                                                    {result.parameter}
                                                                    <div className="text-xs text-slate-400 sm:hidden">
                                                                        Range: {result.normalRange || 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className={`font-bold ${result.isCritical ? 'text-red-600' :
                                                                            result.isAbnormal ? 'text-amber-600' : 'text-slate-700'
                                                                        }`}>
                                                                        {result.value}
                                                                    </span>
                                                                    <span className="text-slate-400 text-xs ml-1">{result.unit}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-slate-500 text-xs hidden sm:table-cell">
                                                                    {result.normalRange || 'N/A'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <FlaskConical size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>No result data available yet</p>
                                        </div>
                                    )}

                                    {/* Additional Info */}
                                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                                        <div className="bg-slate-50 p-3 rounded-lg">
                                            <p className="font-bold text-slate-700 mb-1">Ordered By</p>
                                            <p>Dr. {selectedTest.orderedBy?.lastName || 'Unknown'}</p>
                                            <p>{selectedTest.orderedBy?.specialization}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg">
                                            <p className="font-bold text-slate-700 mb-1">Status</p>
                                            <p className="uppercase">{formatStatus(selectedTest.status)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer (Actions) */}
                                <div className="p-4 border-t bg-slate-50 flex gap-3">
                                    <button
                                        className="flex-1 btn btn-secondary"
                                        onClick={() => setSelectedTest(null)}
                                    >
                                        Close
                                    </button>
                                    {selectedTest.reportUrl && (
                                        <a
                                            href={labService.getPdfUrl(selectedTest.reportUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                                        >
                                            <Download size={16} />
                                            Download PDF
                                        </a>
                                    )}
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
