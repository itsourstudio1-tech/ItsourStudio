import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './Admin.css';

interface Booking {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    package: string;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'rejected' | 'completed';
    totalPrice: number;
    paymentProofUrl?: string;
    createdAt?: any;
    notes?: string;
}

const AdminDashboard = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        revenue: 0
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Fetch Bookings Real-time
    useEffect(() => {
        const q = query(collection(db, 'bookings'), orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Booking[];

            setBookings(bookingsData);

            // Calculate Stats
            const newStats = bookingsData.reduce((acc, curr) => {
                acc.total++;
                if (curr.status === 'pending') acc.pending++;
                if (curr.status === 'confirmed') {
                    acc.confirmed++;
                    acc.revenue += curr.totalPrice || 0;
                }
                return acc;
            }, { total: 0, pending: 0, confirmed: 0, revenue: 0 });

            setStats(newStats);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const sendEmailNotification = async (booking: Booking, status: string, reason?: string) => {
        const emailType = status === 'confirmed' ? 'confirmed' : status === 'rejected' ? 'rejected' : null;

        if (!emailType) return;

        try {
            await fetch('http://localhost:3001/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: emailType,
                    booking: {
                        name: booking.fullName,
                        email: booking.email,
                        package: booking.package,
                        date: booking.date,
                        time_start: booking.time,
                        reason: reason || 'Scheduling conflict'
                    }
                })
            });
            // Show success toast or log
            console.log(`Email sent for status: ${status}`);
        } catch (error) {
            console.error("Failed to send email notification", error);
            alert("Status updated but failed to send email notification.");
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        let reason = '';
        if (newStatus === 'rejected') {
            const result = prompt("Please enter a reason for rejection:", "Bookings are full");
            if (result === null) return; // Cancelled
            reason = result;
        }

        try {
            const bookingRef = doc(db, 'bookings', id);
            await updateDoc(bookingRef, {
                status: newStatus,
                rejectionReason: reason || null
            });

            // Find the booking object to send email
            const booking = bookings.find(b => b.id === id);
            if (booking && (newStatus === 'confirmed' || newStatus === 'rejected')) {
                await sendEmailNotification(booking, newStatus, reason);
            }

        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'bookings', id));
            } catch (error) {
                console.error("Error deleting booking:", error);
                alert("Failed to delete booking");
            }
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                {/* Ensure you have a spinner style or replace with text */}
                <p>Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-container">
                <header className="admin-header">
                    <div>
                        <h1 className="admin-title">Admin Dashboard</h1>
                        <p className="section-subtitle">Manage bookings and studio schedule</p>
                    </div>
                    {/* Add Logout button here if auth is implemented */}
                </header>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <h4>Total Bookings</h4>
                            <div className="stat-value">{stats.total}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <h4>Pending Requests</h4>
                            <div className="stat-value">{stats.pending}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <h4>Confirmed Sessions</h4>
                            <div className="stat-value">{stats.confirmed}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <h4>Total Est. Revenue</h4>
                            <div className="stat-value">₱{stats.revenue.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bookings-section">
                    <div className="bookings-header">
                        <h3>Recent Bookings</h3>
                        {/* Add Filter/Search if needed */}
                    </div>
                    <div className="bookings-table-container">
                        <table className="bookings-table">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Date & Time</th>
                                    <th>Package</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{booking.fullName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{booking.phone}</div>
                                        </td>
                                        <td>
                                            <div>{booking.date}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{booking.time}</div>
                                        </td>
                                        <td>{booking.package}</td>
                                        <td>
                                            <select
                                                value={booking.status}
                                                onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                                className={`status-badge status-${booking.status}`}
                                                style={{ border: 'none', cursor: 'pointer', padding: '5px' }}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="completed">Completed</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </td>
                                        <td>₱{booking.totalPrice}</td>
                                        <td>
                                            {booking.paymentProofUrl ? (
                                                <button
                                                    className="proof-link"
                                                    onClick={() => setSelectedImage(booking.paymentProofUrl || null)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                    View Proof
                                                </button>
                                            ) : (
                                                <span style={{ color: '#aaa', fontSize: '0.8rem' }}>No proof uploaded</span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className="action-btn"
                                                title="Delete Booking"
                                                onClick={() => handleDelete(booking.id)}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {bookings.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                            No bookings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            <div className={`image-modal-overlay ${selectedImage ? 'active' : ''}`} onClick={() => setSelectedImage(null)}>
                <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                    <button className="close-modal-btn" onClick={() => setSelectedImage(null)}>&times;</button>
                    {selectedImage && <img src={selectedImage} alt="Payment Proof" />}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
