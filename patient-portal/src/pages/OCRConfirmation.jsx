import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import recordsService from '../services/recordsService';

const OCRConfirmation = () => {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                // We reuse the confirm endpoint or create a get-one endpoint
                // Wait, I didn't make a get-single-doc endpoint. 
                // I can just fetch the timeline and filter for now, or use the confirm GET if I had one.
                // Actually my backend only has upload and confirm (PUT). 
                // Let's assume I can get the doc context. 
                // For MVP, I'll pass state or just fetch it. 
                // Let's add a quick GET route or simpler, just reuse confirm endpoint to GET data? No that's PUT.
                // I'll make a quick direct API call if I missed the route, 
                // or purely for now, I'll assume the user just coming from upload has the data in state?
                // No, reliable way is key. 
                // I'll use the timeline endpoint to find it, it's hacky but works without new backend code.
                const response = await recordsService.getTimeline({ sources: 'upload' });
                const doc = response.data.data.find(d => d.details._id === documentId);
                if (doc) {
                    setDocument(doc.details);
                    setRawText(doc.details.ocrData?.rawText || '');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDocument();
    }, [documentId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await recordsService.confirmOCR(documentId, { rawText });
            navigate('/timeline');
        } catch (err) {
            alert('Failed to save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!document) return <div className="p-8 text-center">Document not found</div>;

    return (
        <div className="page-container min-h-screen pb-20">
            <div className="bg-slate-900 text-white px-4 py-6 mb-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">Verify Scanned Text</h1>
                    <button onClick={handleSave} disabled={saving} className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50">
                        {saving ? 'Saving...' : 'Confirm & Save'}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
                {/* Image Preview */}
                <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex flex-col">
                    <div className="bg-slate-200 px-4 py-2 text-xs font-semibold uppercase text-slate-500 tracking-wider">Original Document</div>
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                        <img
                            src={`http://localhost:5001/${document.filePath}`}
                            alt="Original"
                            className="max-w-full shadow-lg"
                        />
                    </div>
                </div>

                {/* Text Editor */}
                <div className="flex flex-col">
                    <div className="bg-blue-50 px-4 py-2 text-xs font-semibold uppercase text-blue-500 tracking-wider flex justify-between items-center">
                        Scanned Text
                        <span className="text-xs normal-case bg-blue-100 px-2 py-0.5 rounded text-blue-600">
                            Confidence: {Math.round(document.ocrData?.confidence || 0)}%
                        </span>
                    </div>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        className="flex-1 w-full p-4 border border-slate-200 rounded-b-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                        placeholder="No text extracted..."
                    />
                    <p className="text-xs text-slate-400 mt-2">
                        * Please correct any errors in the scanned text before saving.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OCRConfirmation;
