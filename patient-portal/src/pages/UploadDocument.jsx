import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import recordsService from '../services/recordsService';

const UploadDocument = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('other');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.size > 5 * 1024 * 1024) {
            setError('File size too large (Max 5MB)');
            setFile(null);
        } else {
            setError('');
            setFile(selected);
            if (!title) setTitle(selected.name.split('.')[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('type', type);

        try {
            const response = await recordsService.uploadDocument(formData);
            const docId = response.data.data._id;
            // Redirect to OCR confirm if it's an image, else timeline
            if (file.type.startsWith('image/')) {
                navigate(`/verify-ocr/${docId}`);
            } else {
                navigate('/timeline');
            }
        } catch (err) {
            console.error(err);
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="page-container min-h-screen">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-8 mb-4">
                <div className="max-w-xl mx-auto">
                    <button onClick={() => navigate(-1)} className="text-blue-100 mb-2 hover:text-white">← Back</button>
                    <h1 className="text-2xl font-bold">Upload Document</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4">
                <div className="card">
                    {error && <div className="alert alert-error mb-4">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Document Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="input"
                                placeholder="e.g., Blood Test Report"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Category</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="input"
                            >
                                <option value="prescription">Prescription</option>
                                <option value="lab_report">Lab Report</option>
                                <option value="discharge_summary">Discharge Summary</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Select File</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer relative">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {file ? (
                                    <div>
                                        <p className="font-semibold text-blue-600 truncate">{file.name}</p>
                                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="text-4xl block mb-2">📁</span>
                                        <p className="text-slate-600 font-medium">Click to upload or drag & drop</p>
                                        <p className="text-xs text-slate-400 mt-1">Images or PDF (Max 5MB)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!file || uploading}
                            className="btn btn-primary w-full py-3 text-lg"
                        >
                            {uploading ? 'Uploading & Scanning...' : 'Upload Document'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UploadDocument;
