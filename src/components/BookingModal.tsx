import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, setDoc, serverTimestamp, query, where, getDocs, doc, getDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { sanitizeName, sanitizeEmail, sanitizePhoneNumber, sanitizeText } from '../utils/sanitize';
import { generateBookingReference } from '../utils/generateReference';
import paymentQr from '../assets/payment_qr.png';
import './ModalStyles.css';
import { useBooking } from '../context/BookingContext';

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
    start: number;
    end: number;
}

const BookingModal = () => {
    const { isBookingOpen, closeBooking, selectedPackageId } = useBooking();
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
    const [unavailableDates, setUnavailableDates] = useState<Record<string, string>>({});
    const [seasonalPromo, setSeasonalPromo] = useState<any>(null); // State for seasonal promo data
    const [privacyConsent, setPrivacyConsent] = useState(false); // DPA Compliance

    const [services, setServices] = useState<any[]>([]);

    // Fetch Seasonal Promo & Services Data
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const q = query(collection(db, 'services'), orderBy('order', 'asc'));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const fetched = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setServices(fetched);
                }
            } catch (err) {
                console.error("Error fetching services for booking:", err);
            }
        };

        const fetchPromo = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'siteContent', 'seasonalPromo'));
                if (docSnap.exists()) {
                    setSeasonalPromo(docSnap.data());
                }
            } catch (err) {
                console.error("Error fetching seasonal promo for booking:", err);
            }
        };

        // Fetch Administrative Blocks
        const unsubscribe = onSnapshot(collection(db, 'unavailableDates'), (snapshot) => {
            const blocks: Record<string, string> = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.date) {
                    blocks[data.date] = data.reason || 'Unavailable';
                }
            });
            setUnavailableDates(blocks);
        }, (error) => {
            console.error("Error fetching unavailable dates:", error);
            // Verify if error is permissions-related and handle gracefully (e.g. stop listening or ignore)
        });

        fetchPromo();
        fetchServices();
        return () => unsubscribe();
    }, []);

    // QOL States
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
        message: '',
        type: 'info',
        visible: false
    });

    // Auto-Scroll to top on step change & Check for scrollability
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);

    const checkScroll = (element: Element) => {
        if (element.scrollHeight > element.clientHeight + 20) { // +20 buffer
            // Only show if not already near bottom
            if (element.scrollTop + element.clientHeight < element.scrollHeight - 20) {
                setShowScrollIndicator(true);
            } else {
                setShowScrollIndicator(false);
            }
        } else {
            setShowScrollIndicator(false);
        }
    };

    // Scroll to top only on step change
    useEffect(() => {
        const content = document.querySelector('.booking-content');
        if (content) {
            content.scrollTop = 0;
        }
    }, [step]);

    // Check scroll indicators on updates
    useEffect(() => {
        const content = document.querySelector('.booking-content');
        if (content) {
            setTimeout(() => checkScroll(content), 100);
        }
    }, [step, formData]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        checkScroll(e.currentTarget);
    };

    // Auto-Save Progress
    useEffect(() => {
        if (isBookingOpen) {
            const savedData = sessionStorage.getItem('bookingProgress');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    setFormData(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error("Failed to load saved progress", e);
                }
            }
        }
    }, [isBookingOpen]);

    useEffect(() => {
        if (isBookingOpen) {
            sessionStorage.setItem('bookingProgress', JSON.stringify(formData));
        }
    }, [formData, isBookingOpen]);

    // Initialize with selected package
    useEffect(() => {
        if (isBookingOpen) {
            if (selectedPackageId) {
                setFormData(prev => ({ ...prev, package: selectedPackageId }));
            }
            setStep(1);
        }
    }, [isBookingOpen, selectedPackageId]);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isBookingOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isBookingOpen]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard!`, 'success');
    };

    const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    useEffect(() => {
        const fetchBookings = async () => {
            if (!formData.date) return;

            const q = query(
                collection(db, 'booked_slots'),
                where('date', '==', formData.date)
            );

            try {
                const querySnapshot = await getDocs(q);
                const ranges: BookedSlot[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.status === 'rejected' || data.status === 'cancelled') return; // Ignore rejected
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

    // Phone formatter
    const formatPhoneNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 0) return '';
        if (cleaned.length <= 4) return cleaned;
        if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            const formatted = formatPhoneNumber(value);
            if (formatted.length <= 13) { // 09XX XXX XXXX is 13 chars
                setFormData(prev => ({ ...prev, [name]: formatted }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'extensionDuration' ? parseInt(value) : value
            }));
        }
    };

    const handleTimeSelect = (time: string) => {
        setFormData(prev => ({ ...prev, time }));
    };

    // Drag and Drop Logic
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileProcess(files[0]);
        }
    };

    const handleFileProcess = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            showToast('File size exceeds 10MB limit', 'error');
            return;
        }
        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file', 'error');
            return;
        }

        setPaymentFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setPaymentFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Custom Calendar Logic
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const isDateDisabled = (day: number) => {
        const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const year = dateToCheck.getFullYear();
        const month = String(dateToCheck.getMonth() + 1).padStart(2, '0');
        const dateDay = String(dateToCheck.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${dateDay}`;

        // Check if blocked by admin
        if (unavailableDates[dateString]) return true;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dateToCheck < today;
    };

    const handleDateClick = (day: number) => {
        if (isDateDisabled(day)) return;
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Format as YYYY-MM-DD
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dateDay = String(selectedDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${dateDay}`;

        setFormData(prev => ({ ...prev, date: dateString }));
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const year = dateToCheck.getFullYear();
            const month = String(dateToCheck.getMonth() + 1).padStart(2, '0');
            const dateDay = String(dateToCheck.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${dateDay}`;

            const isSelected = formData.date === dateString;
            const isDisabled = isDateDisabled(day);
            const blockReason = unavailableDates[dateString];

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => handleDateClick(day)}
                    title={blockReason ? `Unavailable: ${blockReason}` : ''}
                >
                    {day}
                    {blockReason && <span className="calendar-block-dot"></span>}
                </div>
            );
        }

        return (
            <div className="custom-calendar">
                <div className="calendar-header">
                    <button type="button" onClick={handlePrevMonth}>&lt;</button>
                    <span>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                    <button type="button" onClick={handleNextMonth}>&gt;</button>
                </div>
                <div className="calendar-grid">
                    <div className="calendar-weekday">Sun</div>
                    <div className="calendar-weekday">Mon</div>
                    <div className="calendar-weekday">Tue</div>
                    <div className="calendar-weekday">Wed</div>
                    <div className="calendar-weekday">Thu</div>
                    <div className="calendar-weekday">Fri</div>
                    <div className="calendar-weekday">Sat</div>
                    {days}
                </div>
            </div>
        );
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

    // Helper to parse numeric values from strings (e.g., "₱299" -> 299, "15 Minutes" -> 15)
    const parseNumeric = (value: any) => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return parseInt(value.toString().replace(/\D/g, '')) || 0;
    };

    // Dynamic Package List including Seasonal Promo and Database Services
    const allPackages = [
        ...(seasonalPromo && seasonalPromo.isActive ? [{
            id: 'seasonal-promo',
            name: seasonalPromo.title,
            price: parseNumeric(seasonalPromo.price),
            duration: 45 // Default duration for promo
        }] : []),
        ...services.map(s => ({
            id: s.id,
            name: s.title,
            price: parseNumeric(s.price),
            duration: parseNumeric(s.duration)
        }))
    ];

    // Fallback to hardcoded if DB is empty to prevent crash
    const finalPackages = allPackages.length > 0 ? allPackages : PACKAGES;

    const selectedPackage = finalPackages.find(p => p.id === formData.package);
    const basePrice = selectedPackage ? selectedPackage.price : 0;
    const extensionPrice = EXTENSION_RATES[formData.extensionDuration as keyof typeof EXTENSION_RATES] || 0;
    const totalPrice = basePrice + extensionPrice;
    const downpayment = Math.ceil(totalPrice * 0.5);
    const durationTotal = (selectedPackage ? selectedPackage.duration : 0) + formData.extensionDuration;

    const isSlotAvailable = (timeStr: string) => {
        // Check if past time (UTC+8)
        if (formData.date) {
            const now = new Date();
            const phFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Manila',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const phDateString = phFormatter.format(now);

            if (formData.date < phDateString) return false;

            if (formData.date === phDateString) {
                const phTimeFormatter = new Intl.DateTimeFormat('en-GB', {
                    timeZone: 'Asia/Manila',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                const phTimeStr = phTimeFormatter.format(now);
                if (timeStr < phTimeStr) return false;
            }
        }

        if (!selectedPackage) return true;

        const proposedStart = timeToMinutes(timeStr);
        const proposedEnd = proposedStart + durationTotal;

        for (const range of bookedRanges) {
            if (proposedStart < range.end && proposedEnd > range.start) {
                return false;
            }
        }
        return true;
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            // Validate Step 1: Service
            if (!formData.package) {
                showToast("Please select a package.", 'error');
                return;
            }
            if (!formData.date) {
                showToast("Please select a date.", 'error');
                return;
            }
            if (!formData.time) {
                showToast("Please select a time slot.", 'error');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            // Validate Step 2: Contact
            if (!formData.fullName || !formData.email || !formData.phone) {
                showToast("Please fill in all required contact details.", 'error');
                return;
            }
            if (!formData.phone.startsWith('09') || formData.phone.length !== 13) {
                showToast("Please enter a valid PH phone number (starts with 09, 11 digits).", 'error');
                return;
            }
            setStep(3);
        }
    };

    const handleBackStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const checkAvailability = async () => {
        // Fresh fetch to ensure no race conditions
        const q = query(
            collection(db, 'booked_slots'),
            where('date', '==', formData.date) // Fetch all for the day
        );
        const snapshot = await getDocs(q);

        const proposedStart = timeToMinutes(formData.time);
        const proposedEnd = proposedStart + durationTotal;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            // Ignore rejected bookings
            if (data.status === 'rejected' || data.status === 'cancelled') continue;

            if (data.time && data.durationTotal) {
                const existingStart = timeToMinutes(data.time);
                const existingEnd = existingStart + data.durationTotal;

                // Overlap Check
                if (proposedStart < existingEnd && proposedEnd > existingStart) {
                    return false; // Conflict found
                }
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!privacyConsent) {
            showToast("Please accept the Privacy Policy to proceed with your booking.", 'error');
            return;
        }

        if (!paymentFile) {
            showToast("Please upload your payment proof.", 'error');
            return;
        }

        setIsSubmitting(true);

        // 1. Concurrency Check (The "Double Booking" Prevention)
        const isAvailable = await checkAvailability();
        if (!isAvailable) {
            setIsSubmitting(false);
            showToast("⚠️ This slot was just booked by someone else! Please choose another time.", 'error');
            // Refresh the grid
            setFormData(prev => ({ ...prev, time: '' })); // Clear invalid time
            return;
        }

        try {
            let paymentProofUrl = '';
            if (paymentFile) {
                // Upload directly to Firebase Storage
                const { storage } = await import('../firebase');
                const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

                const storageRef = ref(storage, `payment-proofs/${Date.now()}_${paymentFile.name}`);
                await uploadBytes(storageRef, paymentFile);
                paymentProofUrl = await getDownloadURL(storageRef);
                console.log(`File uploaded to Firebase Storage: ${paymentProofUrl}`);
            }

            // Sanitize all user inputs before storing
            const sanitizedFullName = sanitizeName(formData.fullName, 100);
            const sanitizedEmail = sanitizeEmail(formData.email);
            const sanitizedPhone = sanitizePhoneNumber(formData.phone.replace(/\s/g, ''));
            const sanitizedNotes = sanitizeText(formData.notes, 500);

            if (!sanitizedFullName || !sanitizedEmail || !sanitizedPhone) {
                showToast("Invalid form data. Please check your inputs.", 'error');
                setIsSubmitting(false);
                return;
            }

            // Generate unique booking reference
            const bookingReference = generateBookingReference();

            const docRef = await addDoc(collection(db, 'bookings'), {
                referenceNumber: bookingReference,
                fullName: sanitizedFullName,
                email: sanitizedEmail,
                phone: sanitizedPhone,
                package: formData.package,
                date: formData.date,
                time: formData.time,
                notes: sanitizedNotes,
                extensionDuration: formData.extensionDuration,
                totalPrice,
                downpayment,
                durationTotal,
                paymentProofUrl,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            // Sync to public booked_slots for availability checking
            await setDoc(doc(db, 'booked_slots', docRef.id), {
                date: formData.date,
                time: formData.time,
                durationTotal: durationTotal,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            // Send Email Notification
            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'received',
                        booking: {
                            referenceNumber: bookingReference,
                            name: formData.fullName,
                            email: formData.email,
                            package: selectedPackage?.name || formData.package,
                            total_amount: totalPrice,
                            downpayment: downpayment,
                            date: formData.date,
                            time_start: formData.time ? formatTime(formData.time) : ''
                        }
                    })
                });
            } catch (emailError) {
                console.error("Failed to send email notification", emailError);
            }

            setIsSubmitting(false);
            setStep(4); // Move to Step 4 (Done)

            // Clear saved progress
            sessionStorage.removeItem('bookingProgress');

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
            setPreviewUrl(null);

        } catch (error) {
            console.error("Error adding booking: ", error);
            setIsSubmitting(false);
            showToast("Something went wrong. Please try again.", 'error');
        }
    };

    if (!isBookingOpen) return null;

    return (
        <div className="modal-overlay active" onClick={closeBooking}>
            {/* Toast Notification */}
            {toast.visible && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        <div className="toast-icon">
                            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
                        </div>
                        <div className="toast-message">{toast.message}</div>
                    </div>
                </div>
            )}

            <div className="modal-content booking-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={closeBooking}>&times;</button>

                <div className="booking-modal-header">
                    <div className="header-text">
                        <h2 className="section-title">Book Session</h2>
                    </div>

                    <div className="booking-stepper">
                        <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <div className="step-circle">1</div>
                            <span className="step-label">Service</span>
                        </div>
                        <div className="step-line"></div>
                        <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                            <div className="step-circle">2</div>
                            <span className="step-label">Details</span>
                        </div>
                        <div className="step-line"></div>
                        <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                            <div className="step-circle">3</div>
                            <span className="step-label">Payment</span>
                        </div>
                        <div className="step-line"></div>
                        <div className={`step-item ${step >= 4 ? 'active' : ''}`}>
                            <div className="step-circle">4</div>
                            <span className="step-label">Done</span>
                        </div>
                    </div>
                </div>

                {step === 4 ? (
                    <div className="booking-success-container">
                        <div className="success-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h3>Booking Request Received!</h3>
                        <p>We've received your booking request and payment proof.</p>
                        <p>A confirmation email has been sent to your inbox.</p>
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={() => { setStep(1); closeBooking(); }}>Close</button>
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>Book Another Session</button>
                        </div>
                    </div>
                ) : (
                    <div className="booking-content wizard-layout" onScroll={handleScroll}>
                        {showScrollIndicator && (
                            <div className="scroll-indicator-overlay">
                                <div className="bounce-arrow">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </div>
                        )}
                        <form onSubmit={step === 3 ? handleSubmit : handleNextStep} className="wizard-form">

                            {/* STEP 1: SERVICE SELECTION */}
                            {step === 1 && (
                                <div className="wizard-step fade-in">
                                    <div className="step-header">
                                        <h3 className="step-title">Select Your Experience</h3>
                                        <p className="step-subtitle">Choose a package that suits your needs</p>
                                    </div>

                                    <div className="packages-grid">
                                        {finalPackages.map(pkg => (
                                            <div
                                                key={pkg.id}
                                                className={`package-card ${formData.package === pkg.id ? 'selected' : ''}`}
                                                onClick={() => setFormData(prev => ({ ...prev, package: pkg.id }))}
                                            >
                                                <div className="package-info">
                                                    <span className="package-name">{pkg.name}</span>
                                                    <span className="package-duration">{pkg.duration} mins</span>
                                                </div>
                                                <div className="package-price">₱{pkg.price}</div>
                                                {formData.package === pkg.id && (
                                                    <div className="check-icon">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="form-section-divider"></div>

                                    <div className="date-time-container">
                                        <div className="form-group date-group">
                                            <label>Select Date</label>
                                            {renderCalendar()}
                                        </div>

                                        <div className="form-group extension-group">
                                            <label>Add Extra Time?</label>
                                            <div className="extension-options-grid">
                                                {Object.entries(EXTENSION_RATES).map(([duration, price]) => {
                                                    const dur = parseInt(duration);
                                                    const isSelected = formData.extensionDuration === dur;
                                                    return (
                                                        <div
                                                            key={duration}
                                                            className={`extension-card ${isSelected ? 'selected' : ''}`}
                                                            onClick={() => setFormData(prev => ({ ...prev, extensionDuration: dur }))}
                                                        >
                                                            <div className="extension-main">
                                                                <span className="ext-icon">{dur === 0 ? '🚫' : '⚡'}</span>
                                                                <span className="ext-label">{dur === 0 ? 'No Extension' : `+${dur} mins`}</span>
                                                            </div>
                                                            {dur > 0 && <span className="ext-price">₱{price}</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group time-selection-container">
                                        <label>Select Time Slot</label>
                                        {!formData.date ? (
                                            <div className="empty-state-box">
                                                <span className="icon">📅</span>
                                                <p>Please select a date above to see available slots</p>
                                            </div>
                                        ) : (
                                            <>
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
                                                <div className="time-legend">
                                                    <div className="legend-item"><span className="dot available"></span> Available</div>
                                                    <div className="legend-item"><span className="dot selected"></span> Selected</div>
                                                    <div className="legend-item"><span className="dot booked"></span> Booked</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: CONTACT DETAILS */}
                            {/* STEP 2: CONTACT DETAILS */}
                            {step === 2 && (
                                <div className="wizard-step fade-in">
                                    <div className="step-header">
                                        <h3 className="step-title">Your Details</h3>
                                        <p className="step-subtitle">Please provide your contact information</p>
                                    </div>

                                    <div className="details-form">
                                        <div className="input-group full">
                                            <label htmlFor="fullName">Full Name</label>
                                            <div className="input-wrapper">
                                                <div className="input-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                </div>
                                                <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Juan Dela Cruz" />
                                            </div>
                                        </div>

                                        <div className="form-row-grid">
                                            <div className="input-group">
                                                <label htmlFor="email">Email</label>
                                                <div className="input-wrapper">
                                                    <div className="input-icon">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                                    </div>
                                                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="juan@example.com" />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label htmlFor="phone">Phone</label>
                                                <div className="input-wrapper">
                                                    <div className="input-icon">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                                    </div>
                                                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required placeholder="0917 123 4567" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="input-group full">
                                            <label htmlFor="notes">Notes (Optional)</label>
                                            <div className="input-wrapper">
                                                <div className="input-icon top-aligned">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                                </div>
                                                <textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleChange} placeholder="Any special requests?"></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="booking-summary-mini updated">
                                        <div className="mini-header">Session Summary</div>
                                        <div className="mini-content">
                                            <div className="mini-item">
                                                <span className="label">Package</span>
                                                <span className="value">{selectedPackage?.name}</span>
                                            </div>
                                            <div className="mini-item">
                                                <span className="label">Date</span>
                                                <span className="value">{formData.date}</span>
                                            </div>
                                            <div className="mini-item">
                                                <span className="label">Time</span>
                                                <span className="value">{formData.time ? formatTime(formData.time) : '-'}</span>
                                            </div>
                                            <div className="mini-item highlight">
                                                <span className="label">Total</span>
                                                <span className="value">₱{totalPrice}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: PAYMENT */}
                            {step === 3 && (
                                <div className="wizard-step fade-in payment-step">
                                    <div className="step-header">
                                        <h3 className="step-title">Secure Payment</h3>
                                        <p className="step-subtitle">Complete your booking with a downpayment</p>
                                    </div>
                                    <div className="checkout-grid">
                                        {/* Left Column: Payment Method */}
                                        <div className="checkout-section payment-method">
                                            <div className="section-label">Payment Method</div>
                                            <div className="payment-card-hero">
                                                <div className="gcash-brand">
                                                    <span className="brand-name">GCash</span>
                                                    <span className="brand-tag">Official Merchant</span>
                                                </div>

                                                <div className="qr-hero">
                                                    <img src={paymentQr} alt="Scan to Pay" />
                                                </div>

                                                <div className="payment-details-hero">
                                                    <div className="detail-group">
                                                        <span className="label">Send to</span>
                                                        <div className="value-row">
                                                            <span className="value number">0905 336 7103</span>
                                                            <button type="button" className="copy-btn" onClick={() => copyToClipboard('09053367103', 'Number')}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="detail-group">
                                                        <span className="label">Amount Due</span>
                                                        <div className="value-row">
                                                            <span className="value amount">₱{downpayment}</span>
                                                            <button type="button" className="copy-btn" onClick={() => copyToClipboard(downpayment.toString(), 'Amount')}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Summary & Upload */}
                                        <div className="checkout-section summary-upload">
                                            <div className="booking-summary-box">
                                                <div className="section-label">Booking Summary</div>
                                                <div className="summary-list">
                                                    <div className="summary-row">
                                                        <span>Package</span>
                                                        <strong>{selectedPackage?.name}</strong>
                                                    </div>
                                                    <div className="summary-row">
                                                        <span>Date & Time</span>
                                                        <strong>{formData.date} @ {formData.time ? formatTime(formData.time) : '-'}</strong>
                                                    </div>
                                                    <div className="summary-row">
                                                        <span>Duration</span>
                                                        <strong>{durationTotal} mins</strong>
                                                    </div>
                                                    <div className="summary-divider"></div>
                                                    <div className="summary-row total">
                                                        <span>Total Price</span>
                                                        <strong>₱{totalPrice}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="upload-proof-box">
                                                <div className="section-label">Confirm Payment</div>

                                                {previewUrl ? (
                                                    <div className="preview-container">
                                                        <img src={previewUrl} alt="Payment Proof" className="preview-image" />
                                                        <button type="button" className="remove-preview-btn" onClick={removeFile}>
                                                            &times;
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`upload-dropzone ${isDragging ? 'drag-over' : ''}`}
                                                        onDragOver={handleDragOver}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={handleDrop}
                                                    >
                                                        <input type="file" id="paymentProof" name="paymentProof" accept="image/*" onChange={handleFileChange} required />
                                                        <div className="dropzone-content">
                                                            <div className="upload-prompt">
                                                                <div className="icon-upload">
                                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                                </div>
                                                                <span>{isDragging ? 'Drop Image Here' : 'Upload Screenshot'}</span>
                                                                <span className="drop-subtext">or drag and drop</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="privacy-consent-box" style={{
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: '#f8f9fa',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        color: '#444'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={privacyConsent}
                                            onChange={(e) => setPrivacyConsent(e.target.checked)}
                                            required
                                            style={{
                                                marginTop: '3px',
                                                width: '18px',
                                                height: '18px',
                                                accentColor: '#c9a86c'
                                            }}
                                        />
                                        <span>
                                            I agree to the collection and processing of my personal data as described in the{' '}
                                            <a href="/privacy-policy" target="_blank" style={{ color: '#c9a86c', fontWeight: 500 }}>
                                                Privacy Policy
                                            </a>{' '}
                                            in accordance with the Data Privacy Act of 2012 (RA 10173).
                                        </span>
                                    </label>
                                </div>
                            )}

                            <div className="wizard-actions">
                                {step > 1 && (
                                    <button type="button" className="btn btn-secondary btn-lg" onClick={handleBackStep}>
                                        Back
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Processing...' : step === 3 ? 'Complete Booking' : 'Next Step'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;
