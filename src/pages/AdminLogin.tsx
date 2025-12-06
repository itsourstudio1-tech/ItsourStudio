import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const AdminLogin = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: FormEvent) => {
        e.preventDefault();
        // TODO: Replace with secure auth
        if (password === 'admin123' || password === 'studio2024') {
            sessionStorage.setItem('isAdmin', 'true');
            navigate('/admin');
        } else {
            setError('Invalid password');
        }
    };

    return (
        <div className="admin-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', paddingTop: 0 }}>
            <div className="section-header" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <h2 className="section-title">Admin Access</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px' }}
                            placeholder="Enter admin password"
                        />
                    </div>
                    {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
