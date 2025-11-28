import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const BookingSection = () => {
    const location = useLocation();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        package: '',
        date: '',
        time: '',
        notes: ''
    });
    const [paymentFile, setPaymentFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Handle pre-selection of package from URL hash or state
    useEffect(() => {
        if (location.hash === '#booking' && location.state?.packageId) {
            setFormData(prev => ({ ...prev, package: location.state.packageId }));
        }
    }, [location]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('File size exceeds 10MB limit');
                return;
            }
            setPaymentFile(file);
        }
    };

    const generateTimeSlots = (dateString: string) => {
        if (!dateString) return [];

        const date = new Date(dateString);
        const day = date.getDay();
        const isWeekend = day === 0 || day === 6; // 0 is Sunday, 6 is Saturday

        const startHour = isWeekend ? 9 : 10;
        const endHour = isWeekend ? 20 : 19; // 8 PM or 7 PM

        const slots = [];
        for (let hour = startHour; hour < endHour; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    const formatTime = (time: string) => {
        const [hour, minute] = time.split(':');
        const h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHour = h % 12 || 12;
        return `${formattedHour}:${minute} ${ampm}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            let paymentProofUrl = '';

            // Upload payment proof if exists
            if (paymentFile) {
                const storageRef = ref(storage, `payment-proofs/${Date.now()}_${paymentFile.name}`);
                const snapshot = await uploadBytes(storageRef, paymentFile);
                paymentProofUrl = await getDownloadURL(snapshot.ref);
            }

            // Save booking to Firestore
            await addDoc(collection(db, 'bookings'), {
                ...formData,
                paymentProofUrl,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            setIsSubmitting(false);
            setSubmitStatus('success');

            // Reset form after success
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                package: '',
                date: '',
                time: '',
                notes: ''
            });
            setPaymentFile(null);

            // Reset status after 5 seconds
            setTimeout(() => setSubmitStatus('idle'), 5000);

        } catch (error) {
            console.error("Error adding booking: ", error);
            setIsSubmitting(false);
            setSubmitStatus('error');
        }
    };

    // Get today's date for min attribute
    const today = new Date().toISOString().split('T')[0];

    return (
        <section id="booking" className="booking-section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Book Your Session</h2>
                    <p className="section-subtitle">Reserve your studio time in just a few clicks</p>
                </div>

                <div className="booking-container">
                    <form className="booking-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="fullName">Full Name *</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address *</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number *</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="0912 345 6789"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="date">Preferred Date *</label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                    min={today}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="time">Preferred Time *</label>
                                <select
                                    id="time"
                                    name="time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.date}
                                >
                                    <option value="">Select time</option>
                                    {generateTimeSlots(formData.date).map(time => (
                                        <option key={time} value={time}>{formatTime(time)}</option>
                                    ))}
                                </select>
                                {!formData.date && <small className="text-muted">Please select a date first</small>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="package">Select Package *</label>
                                <select
                                    id="package"
                                    name="package"
                                    value={formData.package}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Choose a package</option>
                                    <option value="solo">Solo - 15 mins (₱299)</option>
                                    <option value="basic">Basic - 25 mins (₱399)</option>
                                    <option value="transfer">Just Transfer - 30 mins (₱549)</option>
                                    <option value="standard">Standard - 45 mins (₱699)</option>
                                    <option value="family">Family - 50 mins (₱1,249)</option>
                                    <option value="barkada">Barkada - 50 mins (₱1,949)</option>
                                    <option value="birthday">Birthday - 45 mins (₱599)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="paymentProof">Payment Proof (GCash) (Optional)</label>
                            <div className="file-upload-wrapper">
                                <input
                                    type="file"
                                    id="paymentProof"
                                    name="paymentProof"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="file-input"
                                />
                                <div className="file-upload-placeholder">
                                    <span>{paymentFile ? paymentFile.name : 'Click to upload screenshot (Max 10MB)'}</span>
                                </div>
                            </div>
                            <small className="form-help">Upload a screenshot of your GCash payment for faster confirmation.</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">Special Requests or Notes</label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={4}
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Tell us about your vision, any specific requirements, or questions you have..."
                            ></textarea>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className={`btn btn-primary btn-large ${isSubmitting ? 'loading' : ''}`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span>Processing...</span>
                                ) : (
                                    <>
                                        <span>Confirm Booking</span>
                                        <span className="btn-icon">→</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {submitStatus === 'success' && (
                            <div className="form-success-message">
                                <div className="success-icon">✓</div>
                                <h3>Booking Request Received!</h3>
                                <p>We've sent a confirmation email to {formData.email}. See you soon!</p>
                            </div>
                        )}
                    </form>

                    <div className="booking-info">
                        <div className="info-card">
                            <h3>What to Expect</h3>
                            <ul>
                                <li>You'll receive a confirmation email within 24 hours</li>
                                <li>Arrive 10 minutes early for a studio orientation</li>
                                <li>Bring outfit changes if desired</li>
                                <li>Photos delivered within 3-5 business days</li>
                            </ul>
                        </div>
                        <div className="info-card">
                            <h3>Studio Location</h3>
                            <p>123 Creative Avenue<br />Downtown District<br />City, State 12345</p>
                            <p><strong>Hours:</strong><br />Mon-Fri: 10AM - 7PM<br />Sat-Sun: 9AM - 8PM</p>
                        </div>
                        <div className="info-card">
                            <h3>Contact Us</h3>
                            <p>📧 hello@studiolens.com<br />📱 (555) 123-4567</p>
                            <div className="social-links">
                                <a href="#" className="social-link">Instagram</a>
                                <a href="#" className="social-link">Facebook</a>
                                <a href="#" className="social-link">Pinterest</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BookingSection;
