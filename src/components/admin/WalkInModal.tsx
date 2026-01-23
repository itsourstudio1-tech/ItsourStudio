
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { X, AlertTriangle, Play, CheckCircle } from 'lucide-react';
import { generateBookingReference } from '../../utils/generateReference';
import './WalkInModal.css';

// Reusing package definitions (Ideally this should be in a shared config file)
const PACKAGES = [
    { id: 'solo', name: 'Solo Package', price: 299, duration: 15 },
    { id: 'basic', name: 'Basic Package', price: 399, duration: 25 },
    { id: 'transfer', name: 'Just Transfer', price: 549, duration: 30 },
    { id: 'standard', name: 'Standard Package', price: 699, duration: 45 },
    { id: 'family', name: 'Family Package', price: 1249, duration: 50 },
    { id: 'barkada', name: 'Barkada Package', price: 1949, duration: 50 },
    { id: 'birthday', name: 'Birthday Package', price: 599, duration: 45 }
];

interface WalkInModalProps {
    isOpen: boolean;
    onClose: () => void;
    showToast: (type: 'success' | 'error', title: string, message: string) => void;
    activeTimer: { endTime: number; clientName: string; isRunning: boolean } | null;
    setActiveTimer: (timer: { endTime: number; clientName: string; isRunning: boolean } | null) => void;
}

const WalkInModal = ({ isOpen, onClose, showToast, activeTimer, setActiveTimer }: WalkInModalProps) => {
    const [step, setStep] = useState<'form' | 'timer'>('form');
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        packageId: '',
        addOnsAmount: 0,
        notes: '',
        durationOverride: 0,
        paymentMethod: 'cash' as 'cash' | 'gcash'
    });

    const [timeLeft, setTimeLeft] = useState<string>('00:00');

    const [conflictWarning, setConflictWarning] = useState<string | null>(null);
    const [calculating, setCalculating] = useState(false);
    const [currentRef, setCurrentRef] = useState('');

    useEffect(() => {
        if (isOpen) {
            // IF timer is running, go to timer view, else form
            if (activeTimer && activeTimer.isRunning) {
                setStep('timer');
            } else {
                setStep('form');
                setCurrentRef(generateBookingReference()); // Generate new ref on open
                setFormData({
                    fullName: '',
                    phone: '',
                    email: '',
                    packageId: '',
                    addOnsAmount: 0,
                    notes: '',
                    durationOverride: 0,
                    paymentMethod: 'cash'
                });
                setConflictWarning(null);
            }
        }
    }, [isOpen, activeTimer]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (activeTimer && activeTimer.isRunning) {
            interval = setInterval(() => {
                const now = Date.now();
                const diff = activeTimer.endTime - now;

                if (diff <= 0) {
                    setTimeLeft("00:00");
                    setActiveTimer(activeTimer ? { ...activeTimer, isRunning: false } : null);
                    // Play sound or alert?
                } else {
                    const minutes = Math.floor(diff / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

    const selectedPackage = PACKAGES.find(p => p.id === formData.packageId);
    const totalDuration = (selectedPackage?.duration || 0) + (formData.durationOverride || 0);
    const totalPrice = (selectedPackage?.price || 0) + (Number(formData.addOnsAmount) || 0);

    // Conflict Check
    useEffect(() => {
        const checkConflict = async () => {
            if (!selectedPackage) return;
            setCalculating(true);
            setConflictWarning(null);

            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];

            // Calculate end time
            const startMinutes = now.getHours() * 60 + now.getMinutes();
            const endMinutes = startMinutes + totalDuration;

            // Query existing bookings for today
            const q = query(collection(db, 'booked_slots'), where('date', '==', dateStr));
            try {
                const snapshot = await getDocs(q);
                let conflict = false;

                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'confirmed' || data.status === 'pending') {
                        if (data.time && data.durationTotal) {
                            const [h, m] = data.time.split(':').map(Number);
                            const existStart = h * 60 + m;
                            const existEnd = existStart + data.durationTotal;

                            // Overlap Logic
                            if (startMinutes < existEnd && endMinutes > existStart) {
                                conflict = true;
                            }
                        }
                    }
                });

                if (conflict) {
                    setConflictWarning("Warning: This walk-in session conflicts with an existing reservation!");
                }
            } catch (err) {
                console.error("Error checking conflicts:", err);
            }
            setCalculating(false);
        };

        if (isOpen && selectedPackage) {
            checkConflict();
        }
    }, [formData.packageId, formData.durationOverride, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !selectedPackage) {
            showToast('error', 'Missing Fields', 'Please fill in Name and Package.');
            return;
        }

        try {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            // Create Booking Data with Ledger Fields
            const bookingData = {
                referenceNumber: currentRef, // Use pre-generated ref
                fullName: formData.fullName,
                phone: formData.phone || '',
                email: formData.email || '',
                package: selectedPackage.name,
                totalPrice: totalPrice,
                addOnsAmount: formData.addOnsAmount,
                date: dateStr,
                time: timeStr,
                durationTotal: totalDuration,
                type: 'walk-in',
                status: 'confirmed',
                createdAt: serverTimestamp(),
                notes: formData.notes,
                // Ledger Payment Fields
                fullPaymentCash: formData.paymentMethod === 'cash' ? totalPrice : 0,
                fullPaymentGcash: formData.paymentMethod === 'gcash' ? totalPrice : 0,
            };

            const docRef = await addDoc(collection(db, 'bookings'), bookingData);

            // Create Booked Slot
            await setDoc(doc(db, 'booked_slots', docRef.id), {
                date: dateStr,
                time: timeStr,
                durationTotal: totalDuration,
                status: 'confirmed',
                createdAt: serverTimestamp()
            });

            showToast('success', 'Walk-in Recorded', 'Booking created successfully.');

            // Start Timer UI
            const endTime = Date.now() + (totalDuration * 60 * 1000);
            setActiveTimer({
                endTime,
                clientName: formData.fullName,
                isRunning: true
            });
            setStep('timer');

        } catch (err) {
            console.error("Error creating walk-in:", err);
            showToast('error', 'Error', 'Failed to save walk-in.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="walkin-overlay">
            <div className="walkin-modal">
                <button className="walkin-close" onClick={onClose}><X size={20} /></button>

                {step === 'form' ? (
                    <>
                        <div className="walkin-header">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2>New Walk-In Session</h2>
                                    <p>Enter details below to start immediate session.</p>
                                </div>
                                <div style={{
                                    background: '#fff7ed',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #fed7aa',
                                    textAlign: 'right',
                                    marginRight: '2.5rem' // Make space for close button
                                }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#ea580c', fontWeight: 600, textTransform: 'uppercase' }}>Reference No.</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#9a3412', fontFamily: 'monospace' }}>{currentRef}</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="walkin-content-row">
                            {/* Left Column: Form Inputs */}
                            <div className="walkin-form-column">
                                <div className="form-group">
                                    <label>Client Name</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="Enter client name"
                                        autoFocus
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Mobile Number (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="09XX XXX XXXX"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email (Optional)</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="client@mail.com"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Package</label>
                                        <select
                                            value={formData.packageId}
                                            onChange={e => setFormData({ ...formData, packageId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Package</option>
                                            {PACKAGES.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} - ₱{p.price} ({p.duration} min)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Add-ons (₱)</label>
                                        <input
                                            type="number"
                                            value={formData.addOnsAmount}
                                            onChange={e => setFormData({ ...formData, addOnsAmount: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Extra Time (Minutes)</label>
                                    <input
                                        type="number"
                                        step="5"
                                        value={formData.durationOverride}
                                        onChange={e => setFormData({ ...formData, durationOverride: parseInt(e.target.value) || 0 })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Notes (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Special requests..."
                                    />
                                </div>

                            </div>

                            {/* Right Column: Summary & Actions */}
                            <div className="walkin-summary-column">
                                <div className="summary-title">Session Summary</div>

                                <div className="summary-rows">
                                    <div className="summary-item">
                                        <span>Base Price</span>
                                        <span>₱{(selectedPackage?.price || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Add-ons</span>
                                        <span>₱{formData.addOnsAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span>Duration</span>
                                        <span>{totalDuration} mins</span>
                                    </div>
                                </div>

                                <div className="summary-total">
                                    <span>Total Due</span>
                                    <strong>₱{totalPrice.toLocaleString()}</strong>
                                </div>

                                <div className="payment-method-selector" style={{ marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Payment Method</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: `1px solid ${formData.paymentMethod === 'cash' ? 'var(--walkin-primary)' : '#e2e8f0'}`,
                                                background: formData.paymentMethod === 'cash' ? '#fff7ed' : 'white',
                                                color: formData.paymentMethod === 'cash' ? 'var(--walkin-primary)' : '#64748b',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            💵 Cash
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'gcash' })}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: `1px solid ${formData.paymentMethod === 'gcash' ? '#3b82f6' : '#e2e8f0'}`,
                                                background: formData.paymentMethod === 'gcash' ? '#eff6ff' : 'white',
                                                color: formData.paymentMethod === 'gcash' ? '#3b82f6' : '#64748b',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            📱 GCash
                                        </button>
                                    </div>
                                </div>

                                {conflictWarning && (
                                    <div className="conflict-warning">
                                        <AlertTriangle size={24} />
                                        <span>{conflictWarning}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn-start-session"
                                    disabled={calculating}
                                >
                                    <Play size={20} />
                                    Start Session
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="timer-view">
                        <div className="timer-header">
                            <h3>Session In Progress</h3>
                            <span>Client: {activeTimer?.clientName}</span>
                        </div>

                        <div className={`timer-display ${activeTimer?.isRunning ? 'pulse' : ''}`}>
                            {timeLeft}
                        </div>

                        <div className="timer-controls">
                            <button className="btn-finish btn-minimize" onClick={() => {
                                onClose();
                            }}>
                                Minimize
                            </button>
                            <button className="btn-finish btn-finish-action" onClick={() => {
                                setActiveTimer(null);
                                onClose();
                            }}>
                                <CheckCircle size={18} />
                                Finish Session
                            </button>
                        </div>
                        <p className="timer-note">You can minimize this window. The timer will continue running.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalkInModal;
