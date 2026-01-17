import { useState } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ReportModal.css';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ReportType = 'bug' | 'visual' | 'feature' | 'other';

const ReportModal = ({ isOpen, onClose }: ReportModalProps) => {
    const [type, setType] = useState<ReportType>('bug');
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState(''); // Optional, for follow-up
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Create the report document first
            const docRef = await addDoc(collection(db, 'reports'), {
                type,
                description,
                email: email || 'anonymous',
                status: 'new', // new, in-progress, resolved
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: serverTimestamp()
            });

            // 2. If there is a file, upload it
            if (file) {
                const storageRef = ref(storage, `reports/${docRef.id}_${file.name}`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                // Update doc with screenshot URL
                await updateDoc(docRef, { screenshot: downloadURL });
            }

            setIsSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err) {
            console.error("Error submitting report:", err);
            setError("Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsSuccess(false);
        setDescription('');
        setEmail('');
        setType('bug');
        setFile(null);
        setError(null);
        onClose();
    };

    return (
        <div className="report-modal-overlay" onClick={handleClose}>
            <div className="report-modal-content" onClick={e => e.stopPropagation()}>
                <button className="report-modal-close" onClick={handleClose}>
                    &times;
                </button>

                {isSuccess ? (
                    <div className="report-success-message">
                        <span className="report-success-icon">✅</span>
                        <h3>Thank you!</h3>
                        <p>Your report has been submitted successfully.</p>
                    </div>
                ) : (
                    <>
                        <div className="report-modal-header">
                            <h2>Report an Issue</h2>
                            <p>Help us improve your experience. Found a bug or have a suggestion?</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="report-form-group">
                                <label className="report-form-label">Issue Type</label>
                                <select
                                    className="report-form-select"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as ReportType)}
                                >
                                    <option value="bug">🐛 Bug / Error</option>
                                    <option value="visual">🎨 Visual / Styling Issue</option>
                                    <option value="feature">💡 Feature Request</option>
                                    <option value="other">📝 Other</option>
                                </select>
                            </div>

                            <div className="report-form-group">
                                <label className="report-form-label">Description</label>
                                <textarea
                                    className="report-form-textarea"
                                    placeholder="Please describe what happened..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="report-form-group">
                                <label className="report-form-label">Contact Email (Optional)</label>
                                <input
                                    type="email"
                                    className="report-form-input"
                                    placeholder="In case we need more details"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="report-form-group">
                                <label className="report-form-label">Screenshot (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="report-form-input"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                    style={{ padding: '0.5rem' }}
                                />
                            </div>

                            {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                            <button
                                type="submit"
                                className="report-submit-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
