import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, FileText, Stethoscope, CheckCircle, AlertCircle, Clock, Thermometer, Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ipdService from '../../services/ipd.service';

const IPDClinical = ({ admissionId, onBack }) => {
    const [admission, setAdmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Forms
    const [vitalsForm, setVitalsForm] = useState({ temperature: '', bpSystolic: '', bpDiastolic: '', pulse: '', spo2: '' });
    const [noteForm, setNoteForm] = useState({ note: '', type: 'doctor_round' });

    useEffect(() => {
        loadData();
    }, [admissionId]);

    const loadData = async () => {
        try {
            const res = await ipdService.getAdmissionById(admissionId);
            setAdmission(res.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load admission details');
        }
    };

    const handleAddVitals = async (e) => {
        e.preventDefault();
        try {
            await ipdService.addVitals(admissionId, vitalsForm);
            toast.success('Vitals Recorded');
            setVitalsForm({ temperature: '', bpSystolic: '', bpDiastolic: '', pulse: '', spo2: '' });
            loadData();
        } catch (error) {
            toast.error('Failed to add vitals');
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        try {
            await ipdService.addClinicalNote(admissionId, noteForm);
            toast.success('Clinical Note Added');
            setNoteForm({ ...noteForm, note: '' });
            loadData();
        } catch (error) {
            toast.error('Failed to add note');
        }
    };

    const handleApproveDischarge = async () => {
        if (!window.confirm('Confirm discharge approval? This will initiate the discharge workflow.')) return;
        try {
            await ipdService.approveDischarge(admissionId);
            toast.success('Discharge Approved by Doctor');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Approval Failed');
        }
    };

    if (loading) return <div className="p-10 text-center text-text-muted">Loading Clinical Data...</div>;
    if (!admission) return <div className="p-10 text-center text-red-500">Admission not found</div>;

    const patient = admission.patient || {};
    const doctor = admission.doctor || {};
    const bed = admission.bed || {};

    return (
        <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border bg-surface-secondary flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-surface rounded-full transition-colors border border-transparent hover:border-border shadow-sm">
                        <ArrowLeft size={20} className="text-text-secondary" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">{patient.firstName} {patient.lastName}</h2>
                        <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                            <span className="flex items-center gap-1"><span className="font-semibold text-text-primary">ID:</span> {patient.patientId}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><span className="font-semibold text-text-primary">Age:</span> {patient.params?.age || 'N/A'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-border text-text-primary font-medium">{bed.ward?.name} / {bed.bedNumber}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-text-secondary">Admitted By</div>
                    <div className="font-bold text-text-primary">Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{admission.admissionNumber}</div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex border-b border-border px-6">
                {['overview', 'vitals', 'notes', 'discharge'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto bg-surface-secondary/50">

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-text-primary"><Activity className="text-blue-500" /> Latest Vitals</h3>
                            {admission.vitals?.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-blue-500/10 rounded-lg">
                                            <div className="text-xs text-text-secondary mb-1">Temperature</div>
                                            <div className="text-xl font-bold text-text-primary">{admission.vitals[admission.vitals.length - 1].temperature}°F</div>
                                        </div>
                                        <div className="p-3 bg-red-500/10 rounded-lg">
                                            <div className="text-xs text-text-secondary mb-1">Blood Pressure</div>
                                            <div className="text-xl font-bold text-text-primary">{admission.vitals[admission.vitals.length - 1].bpSystolic}/{admission.vitals[admission.vitals.length - 1].bpDiastolic}</div>
                                        </div>
                                        <div className="p-3 bg-emerald-500/10 rounded-lg">
                                            <div className="text-xs text-text-secondary mb-1">Pulse</div>
                                            <div className="text-xl font-bold text-text-primary">{admission.vitals[admission.vitals.length - 1].pulse} bpm</div>
                                        </div>
                                        <div className="p-3 bg-indigo-500/10 rounded-lg">
                                            <div className="text-xs text-text-secondary mb-1">SPO2</div>
                                            <div className="text-xl font-bold text-text-primary">{admission.vitals[admission.vitals.length - 1].spo2}%</div>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-text-muted">
                                        Recorded: {new Date(admission.vitals[admission.vitals.length - 1].recordedAt).toLocaleString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-text-muted">No vitals recorded yet</div>
                            )}
                        </div>

                        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-text-primary"><FileText className="text-orange-500" /> Diagnosis & Recent Notes</h3>
                            <div className="mb-4">
                                <label className="text-xs font-bold text-text-secondary uppercase">Diagnosis</label>
                                <p className="text-text-primary p-3 bg-surface-secondary rounded-lg mt-1 border border-border">{admission.diagnosis || 'No Diagnosis'}</p>
                            </div>
                            {admission.clinicalNotes?.length > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-text-secondary uppercase">Latest Note</label>
                                    <div className="mt-2 p-3 border-l-4 border-primary bg-primary/5">
                                        <p className="text-sm text-text-primary">{admission.clinicalNotes[admission.clinicalNotes.length - 1].note}</p>
                                        <div className="text-xs text-text-muted mt-2 flex justify-between">
                                            <span className="uppercase font-bold">{admission.clinicalNotes[admission.clinicalNotes.length - 1].type.replace('_', ' ')}</span>
                                            <span>{new Date(admission.clinicalNotes[admission.clinicalNotes.length - 1].recordedAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'vitals' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-surface p-6 rounded-xl border border-border shadow-sm h-fit">
                            <h3 className="font-bold text-lg mb-4 text-text-primary">Record Vitals</h3>
                            <form onSubmit={handleAddVitals} className="space-y-4">
                                <input placeholder="Temp (°F)" className="w-full p-3 bg-surface-secondary rounded-lg border border-border text-text-primary placeholder:text-text-muted" value={vitalsForm.temperature} onChange={e => setVitalsForm({ ...vitalsForm, temperature: e.target.value })} required />
                                <div className="grid grid-cols-2 gap-2">
                                    <input placeholder="Systolic" className="w-full p-3 bg-surface-secondary rounded-lg border border-border text-text-primary placeholder:text-text-muted" type="number" value={vitalsForm.bpSystolic} onChange={e => setVitalsForm({ ...vitalsForm, bpSystolic: e.target.value })} />
                                    <input placeholder="Diastolic" className="w-full p-3 bg-surface-secondary rounded-lg border border-border text-text-primary placeholder:text-text-muted" type="number" value={vitalsForm.bpDiastolic} onChange={e => setVitalsForm({ ...vitalsForm, bpDiastolic: e.target.value })} />
                                </div>
                                <input placeholder="Pulse (bpm)" className="w-full p-3 bg-surface-secondary rounded-lg border border-border text-text-primary placeholder:text-text-muted" type="number" value={vitalsForm.pulse} onChange={e => setVitalsForm({ ...vitalsForm, pulse: e.target.value })} />
                                <input placeholder="SPO2 (%)" className="w-full p-3 bg-surface-secondary rounded-lg border border-border text-text-primary placeholder:text-text-muted" type="number" value={vitalsForm.spo2} onChange={e => setVitalsForm({ ...vitalsForm, spo2: e.target.value })} />
                                <button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark">Save Vitals</button>
                            </form>
                        </div>
                        <div className="lg:col-span-2 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-surface-secondary text-text-secondary text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Time</th>
                                        <th className="p-4">Temp</th>
                                        <th className="p-4">BP</th>
                                        <th className="p-4">Pulse</th>
                                        <th className="p-4">SPO2</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {admission.vitals?.slice().reverse().map((v, i) => (
                                        <tr key={i} className="hover:bg-surface-secondary">
                                            <td className="p-4 font-medium text-text-primary">{new Date(v.recordedAt).toLocaleString()}</td>
                                            <td className="p-4 text-text-secondary">{v.temperature}°F</td>
                                            <td className="p-4 text-text-secondary">{v.bpSystolic}/{v.bpDiastolic}</td>
                                            <td className="p-4 text-text-secondary">{v.pulse}</td>
                                            <td className="p-4 text-text-secondary">{v.spo2}%</td>
                                        </tr>
                                    ))}
                                    {(!admission.vitals || admission.vitals.length === 0) && <tr><td colSpan="5" className="p-8 text-center text-text-muted">No records found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-surface p-6 rounded-xl border border-border shadow-sm h-fit">
                            <h3 className="font-bold text-lg mb-4 text-text-primary">Add Clinical Note</h3>
                            <form onSubmit={handleAddNote} className="space-y-4">
                                <select className="w-full p-3 bg-surface-secondary rounded-lg border border-border outline-none text-text-primary" value={noteForm.type} onChange={e => setNoteForm({ ...noteForm, type: e.target.value })}>
                                    <option value="doctor_round">Doctor Round</option>
                                    <option value="nursing_note">Nursing Note</option>
                                    <option value="procedure_note">Procedure Note</option>
                                </select>
                                <textarea rows="6" placeholder="Write clinical observations..." className="w-full p-3 bg-surface-secondary rounded-lg border border-border outline-none text-text-primary placeholder:text-text-muted" value={noteForm.note} onChange={e => setNoteForm({ ...noteForm, note: e.target.value })} required></textarea>
                                <button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark">Save Note</button>
                            </form>
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                            {admission.clinicalNotes?.slice().reverse().map((n, i) => (
                                <div key={i} className="bg-surface p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${n.type === 'doctor_round' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'bg-surface-secondary text-text-secondary'}`}>
                                                {n.type.replace('_', ' ')}
                                            </span>
                                            <span className="text-text-muted text-xs">{new Date(n.recordedAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-text-primary whitespace-pre-wrap">{n.note}</p>
                                </div>
                            ))}
                            {(!admission.clinicalNotes || admission.clinicalNotes.length === 0) && <div className="p-8 text-center text-text-muted">No notes found</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'discharge' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm text-center">
                            <h2 className="text-2xl font-bold text-text-primary mb-2">Discharge Control Center</h2>
                            <p className="text-text-secondary mb-8">Manage the discharge process for this patient.</p>

                            <div className="grid grid-cols-2 gap-8 text-left max-w-lg mx-auto mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${admission.discharge?.isApprovedByDoctor ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'}`}>
                                        {admission.discharge?.isApprovedByDoctor ? <CheckCircle size={24} /> : <Clock size={24} />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase text-text-muted">Doctor Approval</div>
                                        <div className={`font-semibold ${admission.discharge?.isApprovedByDoctor ? 'text-text-primary' : 'text-text-secondary'}`}>{admission.discharge?.isApprovedByDoctor ? 'Approved' : 'Pending'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* This billing status is from the admission record (summary) or checked live. For now, using admission.discharge.billingCleared from backend, which defaults false. */}
                                    <div className={`p-3 rounded-full ${admission.discharge?.billingCleared ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                        {admission.discharge?.billingCleared ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase text-text-muted">Billing Clearance</div>
                                        <div className={`font-semibold ${admission.discharge?.billingCleared ? 'text-text-primary' : 'text-text-secondary'}`}>{admission.discharge?.billingCleared ? 'Cleared' : 'Pending Bill'}</div>
                                    </div>
                                </div>
                            </div>

                            {!admission.discharge?.isApprovedByDoctor && (
                                <button onClick={handleApproveDischarge} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                    <Stethoscope size={20} /> Approve Discharge
                                </button>
                            )}

                            {admission.discharge?.isApprovedByDoctor && !admission.discharge?.billingCleared && (
                                <div className="p-4 bg-amber-500/10 text-amber-800 dark:text-amber-400 rounded-lg border border-amber-500/20 text-sm">
                                    Discharge approved. Generating final bill... (Billing Module Integration Required)
                                </div>
                            )}

                            {admission.discharge?.isApprovedByDoctor && admission.discharge?.billingCleared && (
                                <div className="p-4 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 rounded-lg border border-emerald-500/20 font-bold">
                                    Patient Ready for Gate Pass
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IPDClinical;
