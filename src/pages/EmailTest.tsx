import { useState } from 'react';
import '../components/ModalStyles.css'; // Reuse existing styles for basic layout

const EmailTest = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('Test User');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const sendEmail = async (type: 'confirmed' | 'received' | 'rejected') => {
        if (!email) {
            setMessage('Please enter an email address');
            return;
        }

        setLoading(true);
        setMessage(`Sending ${type} email...`);

        const mockBooking = {
            name: name,
            email: email,
            package: 'Standard Package',
            date: '2025-12-25',
            time_start: '10:00 AM',
            total_amount: 699,
            downpayment: 350,
            extensionText: '+15 mins',
            reason: type === 'rejected' ? 'Slot already taken' : undefined
        };

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type,
                    booking: mockBooking
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`Success: ${data.message}`);
            } else {
                setMessage(`Error: ${data.error || 'Failed to send'}`);
            }
        } catch (error) {
            console.error(error);
            setMessage('Network error or server offline');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '4rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1>Email Notification Tester</h1>
            <p>Use this page to test the Nodemailer integration.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                <div className="form-group">
                    <label>Recipient Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email to receive tests"
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                <div className="form-group">
                    <label>Test Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter a test name"
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => sendEmail('received')}
                        disabled={loading}
                        style={{ padding: '0.5rem 1rem', background: '#eab308', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Test "Received" (Pending)
                    </button>
                    <button
                        onClick={() => sendEmail('confirmed')}
                        disabled={loading}
                        style={{ padding: '0.5rem 1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Test "Confirmed"
                    </button>
                    <button
                        onClick={() => sendEmail('rejected')}
                        disabled={loading}
                        style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Test "Rejected"
                    </button>
                </div>

                {message && (
                    <div style={{ marginTop: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '4px' }}>
                        <strong>Status:</strong> {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailTest;
