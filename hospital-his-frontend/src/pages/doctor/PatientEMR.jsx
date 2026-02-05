import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    User,
    Calendar,
    Activity,
    FileText,
    Pill,
    TestTube,
    Scan,
    Heart,
    ClipboardList,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    TrendingUp
} from 'lucide-react';
import RiskScoreChart from '../../components/charts/RiskScoreChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const PatientEMR = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [emrData, setEmrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        opdVisits: true,
        ipdAdmissions: false,
        vitalSigns: false,
        labTests: false,
        radiologyTests: false,
        prescriptions: false,
        clinicalNotes: false
    });

    useEffect(() => {
        fetchEMR();
    }, [patientId]);

    const fetchEMR = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user?.token;
            const response = await fetch(`${API_URL}/emr/comprehensive/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch EMR data');
            }

            const result = await response.json();
            setEmrData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-600">{error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-surface-secondary rounded-lg hover:bg-surface-highlight"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!emrData?.hasHistory) {
        return (
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-text-secondary hover:text-primary mb-6"
                >
                    <ArrowLeft size={20} /> Back to Queue
                </button>
                <div className="bg-surface rounded-2xl p-12 text-center border border-border">
                    <FileText className="mx-auto h-16 w-16 text-text-muted mb-4" />
                    <h2 className="text-xl font-bold text-text-primary mb-2">No Medical History</h2>
                    <p className="text-text-secondary">EMR not available since no history exists for this patient.</p>
                </div>
            </div>
        );
    }

    const { patient, summary } = emrData.data;

    const SectionHeader = ({ icon: Icon, title, count, section, color = "primary" }) => (
        <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between p-4 bg-surface-secondary rounded-xl hover:bg-surface-highlight transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${color}/10`}>
                    <Icon className={`text-${color}`} size={20} />
                </div>
                <span className="font-semibold text-text-primary">{title}</span>
                {count > 0 && (
                    <span className="px-2 py-0.5 bg-surface text-text-secondary text-xs rounded-full">
                        {count}
                    </span>
                )}
            </div>
            {expandedSections[section] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-text-secondary hover:text-primary"
                >
                    <ArrowLeft size={20} /> Back to Queue
                </button>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/dashboard/sentinel/${patientId}`)}
                        className="px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 flex items-center gap-2 transition-colors font-medium text-sm"
                    >
                        <Activity size={16} /> Sentinel View
                    </button>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <ClipboardList className="text-primary" /> Patient EMR
                    </h1>
                </div>
            </div>

            {/* Patient Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-2xl p-6 mb-6"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <User size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h2>
                            <p className="text-white/80">ID: {patient.patientId}</p>
                            <div className="flex gap-4 mt-2 text-sm text-white/70">
                                <span>DOB: {formatDate(patient.dateOfBirth)}</span>
                                <span>Gender: {patient.gender}</span>
                                {patient.bloodGroup && <span>Blood: {patient.bloodGroup}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="text-right text-sm">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-white/80">
                            <span>OPD Visits:</span><span className="font-bold text-white">{summary.totalOPDVisits}</span>
                            <span>IPD Admissions:</span><span className="font-bold text-white">{summary.totalIPDAdmissions}</span>
                            <span>Lab Tests:</span><span className="font-bold text-white">{summary.totalLabTests}</span>
                            <span>Imaging:</span><span className="font-bold text-white">{summary.totalRadiologyTests}</span>
                        </div>
                    </div>
                </div>
                {(patient.allergies?.length > 0 || patient.chronicConditions?.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-white/20 flex gap-6">
                        {patient.allergies?.length > 0 && (
                            <div>
                                <span className="text-white/70 text-sm">Allergies:</span>
                                <span className="ml-2 text-yellow-300">{patient.allergies.join(', ')}</span>
                            </div>
                        )}
                        {patient.chronicConditions?.length > 0 && (
                            <div>
                                <span className="text-white/70 text-sm">Chronic Conditions:</span>
                                <span className="ml-2">{patient.chronicConditions.join(', ')}</span>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Risk Score Chart - Show for latest OPD visit */}
            {emrData.data.opdVisits.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <RiskScoreChart
                        appointmentId={emrData.data.opdVisits[0]._id}
                        patientId={patientId}
                    />
                </motion.div>
            )}

            {/* Sections */}
            <div className="space-y-4">
                {/* OPD Visits */}
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                    <SectionHeader icon={Calendar} title="OPD Visits" count={emrData.data.opdVisits.length} section="opdVisits" />
                    {expandedSections.opdVisits && emrData.data.opdVisits.length > 0 && (
                        <div className="p-4 space-y-3">
                            {emrData.data.opdVisits.map((visit, idx) => (
                                <div key={visit._id || idx} className="p-4 bg-surface-secondary rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs text-text-secondary">{visit.appointmentNumber}</span>
                                            <p className="font-semibold text-text-primary">{formatDate(visit.date)}</p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="text-text-secondary">{visit.doctor}</p>
                                            <p className="text-text-secondary">{visit.department}</p>
                                        </div>
                                    </div>
                                    {visit.chiefComplaint && <p className="text-sm"><strong>Complaint:</strong> {visit.chiefComplaint}</p>}
                                    {visit.diagnosis && <p className="text-sm"><strong>Diagnosis:</strong> {visit.diagnosis}</p>}
                                    {visit.notes && <p className="text-sm text-text-secondary mt-1">{visit.notes}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                    {expandedSections.opdVisits && emrData.data.opdVisits.length === 0 && (
                        <p className="p-4 text-center text-text-secondary">No OPD visits recorded.</p>
                    )}
                </div>

                {/* IPD Admissions */}
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                    <SectionHeader icon={Activity} title="IPD Admissions" count={emrData.data.ipdAdmissions.length} section="ipdAdmissions" />
                    {expandedSections.ipdAdmissions && emrData.data.ipdAdmissions.length > 0 && (
                        <div className="p-4 space-y-3">
                            {emrData.data.ipdAdmissions.map((adm, idx) => (
                                <div key={adm._id || idx} className="p-4 bg-surface-secondary rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs text-text-secondary">{adm.admissionNumber}</span>
                                            <p className="font-semibold text-text-primary">
                                                {formatDate(adm.admissionDate)} - {adm.dischargeDate ? formatDate(adm.dischargeDate) : 'Ongoing'}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${adm.status === 'discharged' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                            }`}>{adm.status}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <p><strong>Doctor:</strong> {adm.doctor}</p>
                                        <p><strong>Ward:</strong> {adm.ward} / Bed: {adm.bed}</p>
                                        <p><strong>Type:</strong> {adm.admissionType}</p>
                                        <p><strong>Department:</strong> {adm.department}</p>
                                    </div>
                                    {adm.diagnosis && <p className="text-sm mt-2"><strong>Diagnosis:</strong> {adm.diagnosis}</p>}
                                    {adm.dischargeSummary && <p className="text-sm mt-1"><strong>Discharge Summary:</strong> {adm.dischargeSummary}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                    {expandedSections.ipdAdmissions && emrData.data.ipdAdmissions.length === 0 && (
                        <p className="p-4 text-center text-text-secondary">No IPD admissions recorded.</p>
                    )}
                </div>

                {/* Vital Signs */}
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                    <SectionHeader icon={Heart} title="Vital Signs" count={emrData.data.vitalSigns.length} section="vitalSigns" />
                    {expandedSections.vitalSigns && emrData.data.vitalSigns.length > 0 && (
                        <div className="p-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-text-secondary border-b border-border">
                                        <th className="pb-2">Date</th>
                                        <th className="pb-2">BP</th>
                                        <th className="pb-2">Pulse</th>
                                        <th className="pb-2">Temp</th>
                                        <th className="pb-2">SpO2</th>
                                        <th className="pb-2">RR</th>
                                        <th className="pb-2">By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {emrData.data.vitalSigns.slice(0, 10).map((vs, idx) => (
                                        <tr key={vs._id || idx} className={`border-b border-border last:border-0 ${vs.isCritical ? 'bg-red-500/10' : vs.isAbnormal ? 'bg-yellow-500/10' : ''}`}>
                                            <td className="py-2">{formatDateTime(vs.recordedAt)}</td>
                                            <td>{vs.bloodPressure?.systolic}/{vs.bloodPressure?.diastolic || '-'}</td>
                                            <td>{vs.pulse?.rate || '-'}</td>
                                            <td>{vs.temperature?.value || '-'}</td>
                                            <td>{vs.oxygenSaturation?.value || '-'}%</td>
                                            <td>{vs.respiratoryRate?.rate || '-'}</td>
                                            <td className="text-text-secondary">{vs.recordedBy}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {emrData.data.vitalSigns.length > 10 && (
                                <p className="text-center text-text-secondary text-sm mt-2">Showing 10 of {emrData.data.vitalSigns.length} records</p>
                            )}
                        </div>
                    )}
                    {expandedSections.vitalSigns && emrData.data.vitalSigns.length === 0 && (
                        <p className="p-4 text-center text-text-secondary">No vital signs recorded.</p>
                    )}
                </div>

                {/* Lab Tests */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <SectionHeader icon={TestTube} title="Lab Tests" count={emrData.data.labTests.length} section="labTests" />
                    {expandedSections.labTests && emrData.data.labTests.length > 0 && (
                        <div className="p-4 space-y-3">
                            {emrData.data.labTests.map((lt, idx) => (
                                <div key={lt._id || idx} className="p-4 bg-slate-50 rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold text-slate-800">{lt.testName}</p>
                                            <span className="text-xs text-slate-500">{lt.testNumber} • {lt.category}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${lt.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>{lt.status}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">Ordered by {lt.orderedBy} on {formatDate(lt.orderedAt)}</p>
                                    {lt.results && lt.results.length > 0 && (
                                        <div className="mt-2 text-sm">
                                            <p className="font-medium text-slate-700">Results:</p>
                                            <ul className="ml-4 list-disc">
                                                {lt.results.slice(0, 5).map((r, i) => (
                                                    <li key={i} className={r.isAbnormal ? 'text-red-600' : ''}>
                                                        {r.parameter}: {r.value} {r.unit} {r.normalRange && `(Normal: ${r.normalRange})`}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {lt.aiSummary && (() => {
                                        // Parse AI summary if it's JSON
                                        let summaryData = null;
                                        try {
                                            summaryData = typeof lt.aiSummary === 'string' ? JSON.parse(lt.aiSummary) : lt.aiSummary;
                                        } catch (e) {
                                            // If parsing fails, display as plain text
                                            summaryData = null;
                                        }

                                        if (summaryData && typeof summaryData === 'object') {
                                            return (
                                                <div className="mt-3 p-3 bg-blue-500/10 rounded-lg text-sm border border-blue-500/20">
                                                    <p className="font-semibold text-blue-500 mb-2 flex items-center gap-1">
                                                        🤖 AI Summary
                                                    </p>
                                                    <p className="text-text-primary mb-2">{summaryData.summary}</p>

                                                    {summaryData.overallStatus && (
                                                        <p className="mb-2">
                                                            <span className="font-medium text-text-secondary">Status: </span>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${summaryData.overallStatus === 'normal' ? 'bg-green-500/10 text-green-500' :
                                                                summaryData.overallStatus === 'attention_needed' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                    'bg-red-500/10 text-red-500'
                                                                }`}>
                                                                {summaryData.overallStatus?.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </p>
                                                    )}

                                                    {summaryData.clinicalRecommendation && (
                                                        <p className="text-text-secondary mb-2">
                                                            <span className="font-medium">Recommendation: </span>
                                                            {summaryData.clinicalRecommendation}
                                                        </p>
                                                    )}

                                                    {summaryData.abnormalValues && summaryData.abnormalValues.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="font-medium text-red-700 mb-1">Abnormal Values:</p>
                                                            <ul className="list-disc ml-4 text-red-600">
                                                                {summaryData.abnormalValues.map((av, i) => (
                                                                    <li key={i}>
                                                                        <span className="font-medium">{av.parameter}:</span> {av.value} - {av.significance}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {summaryData.disclaimer && (
                                                        <p className="text-xs text-text-muted mt-2 italic">{summaryData.disclaimer}</p>
                                                    )}
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div className="mt-2 p-2 bg-blue-500/10 rounded-lg text-sm">
                                                    <p className="font-medium text-blue-500">AI Summary:</p>
                                                    <p className="text-blue-400">{lt.aiSummary}</p>
                                                </div>
                                            );
                                        }
                                    })()}
                                    {lt.reportPdf && (
                                        <a
                                            href={`http://localhost:5001/${lt.reportPdf}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 mt-2 text-primary text-sm hover:underline"
                                        >
                                            <ExternalLink size={14} /> View PDF Report
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {expandedSections.labTests && emrData.data.labTests.length === 0 && (
                        <p className="p-4 text-center text-text-secondary">No lab tests recorded.</p>
                    )}
                </div>

                {/* Radiology Tests */}
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                    <SectionHeader icon={Scan} title="Radiology / Imaging" count={emrData.data.radiologyTests.length} section="radiologyTests" />
                    {expandedSections.radiologyTests && emrData.data.radiologyTests.length > 0 && (
                        <div className="p-4 space-y-3">
                            {emrData.data.radiologyTests.map((rt, idx) => (
                                <div key={rt._id || idx} className="p-4 bg-surface-secondary rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold text-text-primary">{rt.testName}</p>
                                            <span className="text-xs text-text-secondary">{rt.testNumber} • {rt.category}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${rt.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                            }`}>{rt.status}</span>
                                    </div>
                                    <p className="text-sm text-text-secondary">Ordered by {rt.orderedBy} on {formatDate(rt.orderedAt)}</p>
                                    {rt.findings && <p className="text-sm mt-2"><strong>Findings:</strong> {rt.findings}</p>}
                                    {rt.impression && <p className="text-sm"><strong>Impression:</strong> {rt.impression}</p>}
                                    {rt.recommendations && <p className="text-sm"><strong>Recommendations:</strong> {rt.recommendations}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                    {expandedSections.radiologyTests && emrData.data.radiologyTests.length === 0 && (
                        <p className="p-4 text-center text-text-secondary">No radiology tests recorded.</p>
                    )}
                </div>

                {/* Prescriptions */}
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                    <SectionHeader icon={Pill} title="Prescriptions" count={emrData.data.prescriptions.length} section="prescriptions" />
                    {expandedSections.prescriptions && emrData.data.prescriptions.length > 0 && (
                        <div className="p-4 space-y-3">
                            {emrData.data.prescriptions.map((rx, idx) => (
                                <div key={rx._id || idx} className="p-4 bg-surface-secondary rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs text-text-secondary">{rx.prescriptionNumber}</span>
                                            <p className="font-semibold text-text-primary">{formatDate(rx.date)}</p>
                                        </div>
                                        <p className="text-sm text-text-secondary">{rx.doctor}</p>
                                    </div>
                                    <div className="mt-2">
                                        <p className="font-medium text-sm text-text-primary mb-1">Medicines:</p>
                                        <ul className="space-y-1">
                                            {rx.medicines?.map((m, i) => (
                                                <li key={i} className="text-sm bg-surface p-2 rounded border border-border">
                                                    <span className="font-medium">{m.name}</span>
                                                    {m.genericName && <span className="text-text-secondary"> ({m.genericName})</span>}
                                                    <span className="text-text-secondary"> — {m.dosage}, {m.frequency}, {m.duration}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {rx.specialInstructions && (
                                        <p className="text-sm mt-2 text-text-secondary"><strong>Instructions:</strong> {rx.specialInstructions}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {expandedSections.prescriptions && emrData.data.prescriptions.length === 0 && (
                        <p className="p-4 text-center text-text-secondary">No prescriptions recorded.</p>
                    )}
                </div>

                {/* Clinical Notes */}
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                    <SectionHeader icon={FileText} title="Clinical Notes" count={emrData.data.clinicalNotes.length} section="clinicalNotes" />
                    {expandedSections.clinicalNotes && emrData.data.clinicalNotes.length > 0 && (
                        <div className="p-4 space-y-3">
                            {emrData.data.clinicalNotes.map((note, idx) => (
                                <div key={note._id || idx} className="p-4 bg-surface-secondary rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold text-text-primary">{formatDate(note.date)}</p>
                                            <span className="text-xs text-text-secondary capitalize">{note.visitType}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary">{note.doctor}</p>
                                    </div>
                                    {note.chiefComplaint && <p className="text-sm"><strong>Chief Complaint:</strong> {note.chiefComplaint}</p>}
                                    {note.presentingIllness && <p className="text-sm"><strong>Presenting Illness:</strong> {note.presentingIllness}</p>}
                                    {note.examination && <p className="text-sm"><strong>Examination:</strong> {note.examination}</p>}
                                    {note.diagnosis && <p className="text-sm"><strong>Diagnosis:</strong> {note.diagnosis}</p>}
                                    {note.treatment && <p className="text-sm"><strong>Treatment:</strong> {note.treatment}</p>}
                                    {note.notes && <p className="text-sm text-text-secondary mt-1">{note.notes}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                    {expandedSections.clinicalNotes && emrData.data.clinicalNotes.length === 0 && (
                        <p className="p-4 text-center text-text-secondary">No clinical notes recorded.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientEMR;
