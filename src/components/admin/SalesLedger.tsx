import { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Pencil, Save, X, Trash2, PlusCircle, Monitor } from 'lucide-react';
import './SalesLedger.css';

interface Booking {
    id: string;
    referenceNumber?: string;
    fullName: string;
    phone: string;
    date: string;
    time: string; // "9:00 AM", "9:30 AM", etc.
    package: string;
    totalPrice: number;
    status: string;
    createdAt?: any;
    // Extended fields for Ledger
    pax?: string;
    addOns?: string;
    addOnsAmount?: string;
    discount?: string;
    downpaymentDate?: string;
    downpaymentAmount?: string;
    downpaymentRef?: string;
    fullPaymentGcash?: string;
    fullPaymentCash?: string;
    fullPaymentRef?: string;
    remarks?: string;
    [key: string]: any;
}

interface SalesLedgerProps {
    showToast: (type: 'success' | 'error', title: string, message: string) => void;
}

// Generate 30-min slots from 9:00 AM to 8:00 PM
const GENERATE_TIMESLOTS = () => {
    const slots = [];
    let startHour = 9;
    let startMin = 0;
    const endHour = 20; // 8 PM

    while (startHour < endHour || (startHour === endHour && startMin === 0)) {
        const formatTime = (h: number, m: number) => {
            const period = h >= 12 ? 'pm' : 'am';
            const displayH = h > 12 ? h - 12 : h;
            const displayM = m === 0 ? '00' : m;
            return `${displayH}:${displayM} ${period}`;
        };

        const startTime = formatTime(startHour, startMin);

        // Calculate end time (30 mins later)
        let endH = startHour;
        let endM = startMin + 30;
        if (endM >= 60) {
            endH++;
            endM = 0;
        }
        const endTime = formatTime(endH, endM);

        slots.push(`${startTime}-${endTime}`);

        // Increment loop
        startHour = endH;
        startMin = endM;
    }
    return slots;
};

const TIMESLOTS = GENERATE_TIMESLOTS();

const SalesLedger = ({ showToast }: SalesLedgerProps) => {
    const [bookings, setBookings] = useState<Booking[]>([]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Booking>>({});

    // Default to today
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {

        // Fetch bookings ONLY for the selected date
        // Note: This relies on your 'date' field in Firestore being "YYYY-MM-DD"
        const q = query(collection(db, 'bookings'), where('date', '==', selectedDate));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Booking[];
            setBookings(data);

        }, (err) => {
            console.error("Error fetching ledger data:", err);
            showToast('error', 'Error', 'Failed to load sales data');

        });
        return () => unsubscribe();
    }, [selectedDate, showToast]);

    // Map time slots to bookings
    const dailyRows = useMemo(() => {
        return TIMESLOTS.map(slot => {
            // Logic to match booking time to slot
            // Our slot format: "9:00 am-9:30 am"
            // Firestore time format might be "09:00" or "9:00 AM". Need to be robust.

            // Extract start time from slot for matching (e.g., "9:00 am")
            const slotStart = slot.split('-')[0].toLowerCase().replace(/\s/g, '');

            const booking = bookings.find(b => {
                if (!b.time) return false;
                // Normalize booking time
                const bTime = b.time.toLowerCase().replace(/\s/g, '');
                // Simple match: does booking time start with same chars? 
                // e.g. b.time="09:00" vs slot="9:00". 
                // Let's rely on exact match if possible, or partial.

                // Assuming data is standard, let's try strict first, then loose
                return bTime === slotStart || slotStart.includes(bTime) || bTime.includes(slotStart);
            });

            return {
                timeLabel: slot,
                booking: booking || null
            };
        });
    }, [bookings]);

    // Calculations for the footer (only for displayed bookings)
    const totals = useMemo(() => {
        return bookings.reduce((acc, curr) => ({
            amount: acc.amount + (Number(curr.totalPrice) || 0),
            addOns: acc.addOns + (Number(curr.addOnsAmount) || 0),
            discount: acc.discount + (Number(curr.discount) || 0),
            totalParams: acc.totalParams + ((Number(curr.totalPrice) || 0) + (Number(curr.addOnsAmount) || 0) - (Number(curr.discount) || 0))
        }), { amount: 0, addOns: 0, discount: 0, totalParams: 0 });
    }, [bookings]);


    const startEdit = (booking: Booking) => {
        setEditingId(booking.id);
        setEditForm({ ...booking });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleChange = (field: string, value: string) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            const ref = doc(db, 'bookings', editingId);
            await updateDoc(ref, editForm);
            showToast('success', 'Saved', 'Entry updated successfully');
            setEditingId(null);
        } catch (err) {
            console.error("Error saving ledger entry:", err);
            showToast('error', 'Error', 'Failed to update entry');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this record? This will open up the time slot.')) {
            try {
                await deleteDoc(doc(db, 'bookings', id));
                // Try to delete from booked_slots too if it exists
                try {
                    await deleteDoc(doc(db, 'booked_slots', id));
                } catch (e) {
                    // Ignore if not found
                }
                showToast('success', 'Deleted', 'Record removed successfully');
            } catch (err) {
                console.error("Error deleting record:", err);
                showToast('error', 'Error', 'Failed to delete record');
            }
        }
    };

    // Create a new booking for an empty slot
    const createEmptyBooking = async (timeSlot: string) => {
        try {
            // Clean time: "9:00 am-9:30 am" -> "9:00 AM"
            let timeStart = timeSlot.split('-')[0].trim().toUpperCase();

            const newDoc = await addDoc(collection(db, 'bookings'), {
                date: selectedDate,
                time: timeStart,
                fullName: 'New Client', // Placeholder
                status: 'pending',
                createdAt: serverTimestamp(),
                totalPrice: 0
            });

            // Immediately start editing
            setEditingId(newDoc.id);
            setEditForm({
                id: newDoc.id,
                date: selectedDate,
                time: timeStart,
                fullName: '',
                status: 'pending',
                totalPrice: 0
            });

            showToast('success', 'Created', 'New slot created. Please fill in details.');
        } catch (error) {
            console.error("Error creating slot:", error);
            showToast('error', 'Error', 'Failed to create slot');
        }
    };

    // Helper to render editable cell
    const renderCell = (booking: Booking | null, field: keyof Booking, type: 'text' | 'number' | 'date' = 'text') => {
        // If no booking, we can't render a cell unless we are in "Create Mode" which is handled by createEmptyBooking
        if (!booking) return <div className="empty-cell"></div>;

        const isEditing = editingId === booking.id;
        const value = isEditing ? editForm[field] : booking[field];

        if (isEditing) {
            return (
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => handleChange(field as string, e.target.value)}
                    className="ledger-input"
                />
            );
        }
        return <div className="cell-content" title={String(value || '')}>{value || '-'}</div>;
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0]; // Assume first sheet
                const ws = wb.Sheets[wsname];

                // Read as array of arrays to handle duplicate headers
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

                // Check headers in row 1-2 usually, but let's assume row 2 (index 1) has data or row 3 (index 2)
                // We'll skip the first 2 rows (Headers) and map by index
                // Row 0: "No.", "Date of Res", etc.
                // Row 1: Sub-headers like "Date", "50% Gcash"
                // Data starts at Row 2 (index 2) usually, but let's scan for the first number in Col 0

                let startIndex = 0;
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    // Look for a row where the first column is a number 1 or string "1"
                    if (row[0] == 1 || row[0] == "1") {
                        startIndex = i;
                        break;
                    }
                }

                if (startIndex === 0 && data.length > 2) startIndex = 2; // Default fallback

                const bookingsToAdd: any[] = [];

                for (let i = startIndex; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length < 5) continue; // Skip empty rows

                    // Parse Date - Excel dates can be tricky
                    // Try to parse row[1] (Date of Reservation)
                    // If it's the daily log shown in screenshot, the file itself might be just for ONE day, 
                    // OR it lists date in Col 1. Let's assume Col 1 is "Date of Reservation" (Created At)
                    // BUT WHERE IS THE BOOKING DATE?
                    // In the screenshot, the TOP LEFT says "February 01, 2026". 
                    // The rows are Timeslots.
                    // This creates a problem: The Excel rows represent Timeslots, not standalone bookings with flexible dates.

                    // IF import is for "Existing Records", they probably have a Master Sheet.
                    // If they are importing the DAILY SHEET (as shown), we need to know the date.
                    // Let's assume for now we are importing a list where:
                    // Col 1 = Created Date? Or is it the Booking Date?
                    // In the screenshot, Col 1 is "Date of Reservation" (Created At).
                    // The "Date" of the event is likely the sheet title "February 01...".

                    // Let's prompt user for the "Event Date" creates simplicity,
                    // OR we can try to guess it.
                    // Actually, if they import a "Masterlist", it usually has "Date of Event" column.
                    // But if they import the "Daily Log" image provided, the rows correspond to Time Slots.

                    // STRATEGY: Create a booking for each row that has a NAME.
                    // If Name is empty, skip (it's an empty slot).

                    const clientName = row[2]; // Name
                    if (!clientName) continue;

                    // Parse Time (Col 5)
                    const timeRaw = row[5];

                    // Clean Time: "9:00-9:30 am" -> "9:00 AM" (start time)
                    let timeStart = timeRaw;
                    if (typeof timeRaw === 'string' && timeRaw.includes('-')) {
                        timeStart = timeRaw.split('-')[0].trim();
                        // Add AM/PM if missing and inferred? 
                        // The format in screenshot is "9:00-9:30 am". split('-')[0] gives "9:00"
                        // We need to append am/pm from the end if missing.
                        if (!timeStart.toLowerCase().includes('m')) {
                            const endPart = timeRaw.split('-')[1].toLowerCase();
                            if (endPart.includes('pm')) timeStart += ' PM'; // imperfect heuristic but ok
                            else timeStart += ' AM';
                        }
                    }

                    // Package (Col 6)
                    const pkg = row[6] || 'Unknown';

                    // Mapping
                    const bookingData = {
                        date: selectedDate, // Import into the CURRENTLY VIEWED DATE for safety? Or prompt? 
                        // Using selectedDate is safest for "Daily Log" import.
                        createdAt: row[1] ? new Date() : serverTimestamp(), // todo: parse row[1] if needed
                        fullName: clientName,
                        phone: row[4] || '',
                        time: timeStart || '',
                        package: pkg,
                        totalPrice: Number(row[11]) || 0, // Total Amount
                        status: 'confirmed', // Assume imported records are confirmed

                        // Ledger Fields
                        pax: String(row[3] || ''),
                        addOns: row[8] || '',
                        addOnsAmount: String(row[9] || 0),
                        discount: String(row[10] || 0),

                        downpaymentDate: formatDateForInput(row[12]),
                        downpaymentAmount: String(row[13] || 0),
                        downpaymentRef: row[14] || '',

                        fullPaymentGcash: String(row[15] || 0),
                        fullPaymentRef: row[16] || '',
                        fullPaymentCash: String(row[17] || 0),
                    };

                    bookingsToAdd.push(bookingData);
                }

                if (bookingsToAdd.length > 0) {
                    if (confirm(`Found ${bookingsToAdd.length} bookings for ${selectedDate}. Import them?`)) {

                        // Batch write
                        const batch = writeBatch(db);
                        // Firestore batch limit is 500. Secure loop.
                        for (const bk of bookingsToAdd) {
                            // We are generating new IDs. usage of addDoc inside is not for batch.
                            // Batch requires ref.
                            const newRef = doc(collection(db, 'bookings'));
                            batch.set(newRef, bk);

                            // Also update booked_slots for consistency?
                            const slotRef = doc(collection(db, 'booked_slots'), newRef.id);
                            batch.set(slotRef, {
                                date: bk.date,
                                time: bk.time,
                                status: 'confirmed'
                            });
                        }

                        await batch.commit();
                        showToast('success', 'Import Successful', `${bookingsToAdd.length} records imported.`);

                    }
                } else {
                    showToast('error', 'No Data Found', 'No valid booking rows found in file.');
                }

            } catch (err) {
                console.error("Error parsing excel:", err);
                showToast('error', 'Import Failed', 'Could not read file. Format might be wrong.');
            }
        };

        reader.readAsBinaryString(file);
        // Reset input
        e.target.value = '';
    };

    // Helper to format Excel date (which might be generic string or number) to YYYY-MM-DD
    const formatDateForInput = (val: any) => {
        if (!val) return '';
        // If it's a date object
        if (val instanceof Date) return val.toISOString().split('T')[0];
        // If it's a string like "Feb 1"
        return String(val);
        // We can leave it as string for the text inputs
    };

    // Format CreatedAt date
    const getResDate = (booking: Booking | null) => {
        if (!booking) return '';
        if (booking.createdAt?.seconds) {
            return new Date(booking.createdAt.seconds * 1000).toLocaleDateString();
        }
        return booking.createdAt || '-'; // Fallback
    };

    return (
        <div className="sales-ledger-container">
            {/* Mobile Detection - Show desktop-only message */}
            {isMobile ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #fff4e6 0%, #f9efe0 100%)',
                    borderRadius: '16px',
                    margin: '20px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #bf6a39 0%, #8b5e3b 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px',
                        boxShadow: '0 8px 24px rgba(191, 106, 57, 0.3)'
                    }}>
                        <Monitor size={40} color="white" />
                    </div>
                    <h2 style={{
                        color: '#3b2c28',
                        fontSize: '24px',
                        fontWeight: '700',
                        marginBottom: '12px',
                        fontFamily: 'var(--font-display)'
                    }}>
                        Desktop Only
                    </h2>
                    <p style={{
                        color: '#8b5e3b',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        maxWidth: '400px',
                        marginBottom: '8px'
                    }}>
                        The Sales Ledger requires a larger screen to display all columns and data properly.
                    </p>
                    <p style={{
                        color: '#ada3a4',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        Please open this page on a desktop or laptop computer.
                    </p>
                </div>
            ) : (
                <>
                    <div className="ledger-header">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).toUpperCase()}
                            </h3>
                            <span style={{ color: '#000', fontWeight: 'bold' }}>
                                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                            </span>
                        </div>
                        <div className="ledger-controls">
                            <button onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() - 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }} className="btn-nav">◀</button>

                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="ledger-filter"
                                style={{ fontWeight: 'bold' }}
                            />

                            <button onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() + 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }} className="btn-nav">▶</button>

                            <label className="btn-import-excel">
                                Import Excel
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    style={{ display: 'none' }}
                                    onChange={handleImportExcel}
                                />
                            </label>

                            <button className="btn-export-excel" onClick={() => alert("Excel Export coming soon!")}>
                                Export Daily Log
                            </button>
                        </div>
                    </div>

                    <div className="ledger-table-wrapper">
                        <table className="ledger-table" style={{ fontSize: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th rowSpan={2} style={{ width: '30px' }}>NO.</th>
                                    <th rowSpan={2} style={{ width: '80px' }}>DATE OF RESERVATION</th>
                                    <th rowSpan={2} style={{ width: '120px' }}>NAME</th>
                                    <th rowSpan={2} style={{ width: '40px' }}>PAX</th>
                                    <th rowSpan={2} style={{ width: '90px' }}>CONTACT NO.</th>
                                    <th rowSpan={2} style={{ width: '100px' }}>TIME</th>
                                    <th rowSpan={2} style={{ width: '100px' }}>PACKAGE</th>
                                    <th rowSpan={2} style={{ width: '70px' }}>AMOUNT</th>
                                    <th rowSpan={2} style={{ width: '100px' }}>ADD-ONS</th>
                                    <th rowSpan={2} style={{ width: '70px' }}>AMOUNT</th>
                                    <th rowSpan={2} style={{ width: '70px', background: 'red', color: 'white' }}>DISCOUNT</th>
                                    <th rowSpan={2} style={{ width: '80px' }}>TOTAL AMOUNT</th>

                                    <th colSpan={3} style={{ textAlign: 'center', background: '#fef3c7' }}>DOWNPAYMENT</th>
                                    <th colSpan={3} style={{ textAlign: 'center', background: '#dcfce7' }}>FULL PAYMENT</th>
                                    <th rowSpan={2} style={{ width: '60px' }}>ACTION</th>
                                </tr>
                                <tr>
                                    {/* DP Headers */}
                                    <th style={{ background: '#fef3c7' }}>DATE</th>
                                    <th style={{ background: '#fef3c7' }}>50% GCASH</th>
                                    <th style={{ background: '#fef3c7' }}>REF. NO</th>

                                    {/* Full Payment Headers */}
                                    <th style={{ background: '#dcfce7' }}>GCASH</th>
                                    <th style={{ background: '#dcfce7' }}>REF. NO</th>
                                    <th style={{ background: '#dcfce7' }}>CASH</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyRows.map((row, index) => {
                                    const { booking } = row;
                                    const isEditing = booking && editingId === booking.id;

                                    return (
                                        <tr key={index} className={booking ? (isEditing ? 'editing-row' : 'booked-row') : 'empty-row'}>
                                            <td style={{ textAlign: 'center' }}>{index + 1}</td>

                                            {/* Date of Reservation (When they booked) */}
                                            <td style={{ textAlign: 'center' }}>{booking ? getResDate(booking) : ''}</td>

                                            <td style={{ fontWeight: 'bold' }}>{booking?.fullName}</td>
                                            <td style={{ textAlign: 'center' }}>{renderCell(booking, 'pax', 'number')}</td>
                                            <td>{booking?.phone}</td>

                                            {/* TIME SLOT LABEL - Always matched to fixed array */}
                                            <td style={{ fontWeight: '600', background: '#f0f9ff' }}>{row.timeLabel}</td>

                                            <td>{booking?.package}</td>
                                            <td>{booking ? `₱${Number(booking.totalPrice).toLocaleString()}` : ''}</td>

                                            <td>{renderCell(booking, 'addOns', 'text')}</td>
                                            <td>{renderCell(booking, 'addOnsAmount', 'number')}</td>
                                            <td style={{ color: 'red' }}>{renderCell(booking, 'discount', 'number')}</td>

                                            <td style={{ fontWeight: 'bold' }}>
                                                {booking && `₱${((Number(booking.totalPrice) || 0) + (Number(booking.addOnsAmount) || 0) - (Number(booking.discount) || 0)).toLocaleString()}`}
                                            </td>

                                            {/* Downpayment */}
                                            <td style={{ background: '#fffbeb' }}>{renderCell(booking, 'downpaymentDate', 'date')}</td>
                                            <td style={{ background: '#fffbeb' }}>{renderCell(booking, 'downpaymentAmount', 'number')}</td>
                                            <td style={{ background: '#fffbeb' }}>{renderCell(booking, 'downpaymentRef', 'text')}</td>

                                            {/* Full Payment */}
                                            <td style={{ background: '#f0fdf4' }}>{renderCell(booking, 'fullPaymentGcash', 'number')}</td>
                                            <td style={{ background: '#f0fdf4' }}>{renderCell(booking, 'fullPaymentRef', 'text')}</td>
                                            <td style={{ background: '#f0fdf4' }}>{renderCell(booking, 'fullPaymentCash', 'number')}</td>

                                            <td>
                                                {booking && (
                                                    isEditing ? (
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            <button className="btn-save-mini" onClick={saveEdit} title="Save">
                                                                <Save size={16} />
                                                            </button>
                                                            <button className="btn-cancel-mini" onClick={cancelEdit} title="Cancel">
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            <button className="btn-edit-mini" onClick={() => startEdit(booking)} title="Edit">
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button className="btn-delete-mini" onClick={() => handleDelete(booking.id)} title="Delete" style={{ color: '#ef4444' }}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                                {!booking && (
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        <button className="btn-add-mini" onClick={() => createEmptyBooking(row.timeLabel)} title="Add Booking" style={{ color: '#10b981' }}>
                                                            <PlusCircle size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Summary Footer for the Day */}
                                <tr className="totals-row">
                                    <td colSpan={7} style={{ textAlign: 'right', fontWeight: 'bold' }}>DAILY TOTAL:</td>
                                    <td>₱{totals.amount.toLocaleString()}</td>
                                    <td></td>
                                    <td>₱{totals.addOns.toLocaleString()}</td>
                                    <td style={{ color: 'red' }}>₱{totals.discount.toLocaleString()}</td>
                                    <td style={{ fontWeight: 'bold' }}>₱{totals.totalParams.toLocaleString()}</td>
                                    <td colSpan={7}></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div >
    );
};

export default SalesLedger;
