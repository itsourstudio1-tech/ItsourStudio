import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sanitizeName, sanitizeText, sanitizeNumber } from '../utils/sanitize';
import './FeedbackModal.css';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
    const [name, setName] = useState('');
    const [rating, setRating] = useState(5);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setName('');
        setMessage('');
        setRating(5);
        setIsSuccess(false);
        setError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Sanitize all inputs before storing
        const sanitizedName = sanitizeName(name, 50);
        const sanitizedMessage = sanitizeText(message, 500);
        const sanitizedRating = sanitizeNumber(rating, 1, 5, 5);

        if (!sanitizedName || !sanitizedMessage) {
            setError('Please provide a valid name and message.');
            setIsSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(db, 'feedbacks'), {
                name: sanitizedName,
                rating: sanitizedRating,
                message: sanitizedMessage,
                showInTestimonials: false, // Default to hidden until approved
                createdAt: serverTimestamp()
            });

            setIsSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (error) {
            console.error("Error submitting feedback: ", error);
            setError('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="feedback-modal-overlay" onClick={handleClose}>
            <div className="feedback-modal-content" onClick={e => e.stopPropagation()}>
                <button className="feedback-modal-close" onClick={handleClose}>
                    ×
                </button>

                {isSuccess ? (
                    <div className="feedback-success-message">
                        <span className="feedback-success-icon">✓</span>
                        <h3>Thank You!</h3>
                        <p>Your feedback has been submitted successfully.</p>
                    </div>
                ) : (
                    <>
                        <div className="feedback-modal-header">
                            <h2>Leave a Review</h2>
                            <p>We'd love to hear about your experience!</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="feedback-form-group">
                                <label className="feedback-form-label">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name"
                                    className="feedback-form-input"
                                />
                            </div>

                            <div className="feedback-form-group">
                                <label className="feedback-form-label">Rating</label>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className={star <= rating ? 'filled' : ''}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="feedback-form-group">
                                <label className="feedback-form-label">Message</label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Share your experience..."
                                    rows={4}
                                    className="feedback-form-textarea"
                                />
                            </div>

                            {error && (
                                <div style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    {error}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="feedback-submit-btn" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;
