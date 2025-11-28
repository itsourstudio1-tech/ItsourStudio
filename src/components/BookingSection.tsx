import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const PACKAGES = [
    { id: 'solo', name: 'Solo Package', price: 299, duration: 15 },
    { id: 'basic', name: 'Basic Package', price: 399, duration: 25 },
    { id: 'transfer', name: 'Just Transfer', price: 549, duration: 30 },
    { id: 'standard', name: 'Standard Package', price: 699, duration: 45 },
    { id: 'family', name: 'Family Package', price: 1249, duration: 50 },
    { id: 'barkada', name: 'Barkada Package', price: 1949, duration: 50 },
    { id: 'birthday', name: 'Birthday Package', price: 599, duration: 45 }
];

const EXTENSION_RATES = {
    0: 0,
    15: 150,
    30: 300,
    45: 450,
    60: 600
};

interface BookedSlot {
    start: number; // minutes from midnight
    end: number;   // minutes from midnight
}

const BookingSection = () => {
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        package: '',
        date: '',
        time: '',
        notes: '',
        extensionDuration: 0
    });
    const [paymentFile, setPaymentFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookedRanges, setBookedRanges] = useState<BookedSlot[]>([]);

    useEffect(() => {
        if (location.hash === '#booking' && location.state?.packageId) {
            setFormData(prev => ({ ...prev, package: location.state.packageId }));
        }
    }, [location]);

    // Helper to convert "HH:MM" to minutes from midnight
    const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Fetch bookings and store as ranges
    useEffect(() => {
        const fetchBookings = async () => {
            if (!formData.date) return;

            const q = query(
                collection(db, 'bookings'),
                where('date', '==', formData.date)
            );

            try {
                const querySnapshot = await getDocs(q);
                const ranges: BookedSlot[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.time && data.durationTotal) {
                        const start = timeToMinutes(data.time);
                        const end = start + data.durationTotal;
                        ranges.push({ start, end });
                    }
                });
                setBookedRanges(ranges);
            } catch (error) {
                console.error("Error fetching bookings:", error);
            }
        };

        fetchBookings();
    }, [formData.date]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'extensionDuration' ? parseInt(value) : value
        }));
    };

    const handleTimeSelect = (time: string) => {
        setFormData(prev => ({ ...prev, time }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
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
        const isWeekend = day === 0 || day === 6;

        const startHour = isWeekend ? 9 : 10;
        const endHour = isWeekend ? 20 : 19;

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

    // Calculations
    const selectedPackage = PACKAGES.find(p => p.id === formData.package);
    const basePrice = selectedPackage ? selectedPackage.price : 0;
    const extensionPrice = EXTENSION_RATES[formData.extensionDuration as keyof typeof EXTENSION_RATES] || 0;
    const totalPrice = basePrice + extensionPrice;
    const downpayment = totalPrice * 0.5;
    const durationTotal = (selectedPackage ? selectedPackage.duration : 0) + formData.extensionDuration;

    // Check if a specific slot is available given the total duration
    const isSlotAvailable = (timeStr: string) => {
        if (!selectedPackage) return true; // Can't check without package duration

        const proposedStart = timeToMinutes(timeStr);
        const proposedEnd = proposedStart + durationTotal;

        // Check collision with any booked range
        for (const range of bookedRanges) {
            // Overlap formula: (StartA < EndB) and (EndA > StartB)
            if (proposedStart < range.end && proposedEnd > range.start) {
                return false;
            }
        }
        return true;
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.time) {
            alert("Please select a time slot.");
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentFile) {
            alert("Please upload your payment proof.");
            return;
        }

        setIsSubmitting(true);

        try {
            let paymentProofUrl = '';
            if (paymentFile) {
                // Upload to local backend server
                const formData = new FormData();
                formData.append('paymentProof', paymentFile);

                const response = await fetch('http://localhost:3001/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const data = await response.json();
                paymentProofUrl = data.path;
                console.log(`File uploaded to: ${paymentProofUrl}`);
            }

            await addDoc(collection(db, 'bookings'), {
                ...formData,
                totalPrice,
                downpayment,
                durationTotal,
                paymentProofUrl,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            setIsSubmitting(false);
            setStep(3);

            setFormData({
                fullName: '',
                email: '',
                phone: '',
                package: '',
                date: '',
                time: '',
                notes: '',
                extensionDuration: 0
            });
            setPaymentFile(null);

        } catch (error) {
            console.error("Error adding booking: ", error);
            setIsSubmitting(false);
            alert("Something went wrong. Please try again.");
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <section id="booking" className="booking-section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Book Your Session</h2>
                    <p className="section-subtitle">Reserve your studio time in just a few clicks</p>
                </div>

                {step === 3 ? (
                    <div className="booking-success-container">
                        <div className="success-icon">✓</div>
                        <h3>Booking Request Received!</h3>
                        <p>We've received your booking request and payment proof.</p>
                        <p>A confirmation email has been sent to your inbox.</p>
                        <button className="btn btn-primary" onClick={() => setStep(1)}>Book Another Session</button>
                    </div>
                ) : (
                    <div className="booking-grid">
                        <div className="booking-form-container">
                            <form className="booking-form" onSubmit={step === 1 ? handleNextStep : handleSubmit}>
                                {step === 1 && (
                                    <>
                                        <h3 className="form-step-title">1. Session Details</h3>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="fullName">Full Name *</label>
                                                <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="John Doe" />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="email">Email Address *</label>
                                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="phone">Phone Number *</label>
                                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required placeholder="0912 345 6789" />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="date">Preferred Date *</label>
                                                <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required min={today} />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="package">Select Package *</label>
                                                <select id="package" name="package" value={formData.package} onChange={handleChange} required>
                                                    <option value="">Choose a package</option>
                                                    {PACKAGES.map(pkg => (
                                                        <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.duration} mins) - ₱{pkg.price}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="extensionDuration">Add Extension (Optional)</label>
                                                <select id="extensionDuration" name="extensionDuration" value={formData.extensionDuration} onChange={handleChange}>
                                                    <option value="0">No Extension</option>
                                                    <option value="15">+15 Minutes (₱150)</option>
                                                    <option value="30">+30 Minutes (₱300)</option>
                                                    <option value="45">+45 Minutes (₱450)</option>
                                                    <option value="60">+60 Minutes (₱600)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>Select Time Slot *</label>
                                            {!formData.date ? (
                                                <p className="text-muted">Please select a date to view available times.</p>
                                            ) : !formData.package ? (
                                                <p className="text-muted">Please select a package to check availability.</p>
                                            ) : (
                                                <div className="time-slot-grid">
                                                    {generateTimeSlots(formData.date).map(time => {
                                                        const available = isSlotAvailable(time);
                                                        const selected = formData.time === time;
                                                        return (
                                                            <button
                                                                key={time}
                                                                type="button"
                                                                className={`time-slot-btn ${selected ? 'selected' : ''} ${!available ? 'disabled' : ''}`}
                                                                onClick={() => available && handleTimeSelect(time)}
                                                                disabled={!available}
                                                            >
                                                                {formatTime(time)}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <div className="time-legend">
                                                <div className="legend-item"><span className="dot available"></span> Available</div>
                                                <div className="legend-item"><span className="dot selected"></span> Selected</div>
                                                <div className="legend-item"><span className="dot booked"></span> Booked</div>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="notes">Special Requests or Notes</label>
                                            <textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleChange} placeholder="Tell us about your vision..."></textarea>
                                        </div>

                                        <div className="form-actions">
                                            <button type="submit" className="btn btn-primary btn-large">Proceed to Payment →</button>
                                        </div>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <h3 className="form-step-title">2. Payment & Confirmation</h3>

                                        <div className="payment-instructions">
                                            <h4>How to Pay</h4>
                                            <p>Please send the downpayment of <strong>₱{downpayment}</strong> to the GCash number below:</p>
                                            <div className="gcash-details">
                                                <p className="gcash-number">0917 123 4567</p>
                                                <p className="gcash-name">IT'S OUR STUDIO</p>
                                            </div>
                                            <p className="instruction-note">Take a screenshot of your payment receipt and upload it below.</p>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="paymentProof">Upload Payment Proof *</label>
                                            <div className="file-upload-wrapper">
                                                <input type="file" id="paymentProof" name="paymentProof" accept="image/*" onChange={handleFileChange} className="file-input" required />
                                                <div className="file-upload-placeholder">
                                                    <span>{paymentFile ? paymentFile.name : 'Click to upload GCash screenshot'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-actions">
                                            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                                            <button type="submit" className={`btn btn-primary btn-large ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
                                                {isSubmitting ? 'Processing...' : 'Submit Payment & Book'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>

                        <div className="booking-summary-panel">
                            <h3>Booking Summary</h3>
                            <div className="summary-row">
                                <span>Package:</span>
                                <span>{selectedPackage?.name || '-'}</span>
                            </div>
                            <div className="summary-row">
                                <span>Date:</span>
                                <span>{formData.date || '-'}</span>
                            </div>
                            <div className="summary-row">
                                <span>Time:</span>
                                <span>{formData.time ? formatTime(formData.time) : '-'}</span>
                            </div>
                            <div className="summary-row">
                                <span>Duration:</span>
                                <span>{durationTotal} mins</span>
                            </div>

                            <hr />

                            <div className="summary-row">
                                <span>Base Price:</span>
                                <span>₱{basePrice}</span>
                            </div>
                            <div className="summary-row">
                                <span>Extension Fee:</span>
                                <span>₱{extensionPrice}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total:</span>
                                <span>₱{totalPrice}</span>
                            </div>

                            <div className="downpayment-highlight">
                                <span>Required Downpayment (50%):</span>
                                <strong>₱{downpayment}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default BookingSection;
