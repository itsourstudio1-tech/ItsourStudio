import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './Admin.css';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 1. Check Hardcoded Super Admin (Backdoor/Legacy)
            if ((password === 'admin123' || password === 'studio2024') && (!email || email === 'admin')) {
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('userRole', 'admin');
                navigate('/admin');
                return;
            }

            // 2. Check Firestore Users
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('User not found');
                setIsLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            // Simple password check (In production, use hashing or Firebase Auth)
            if (userData.password === password) {
                if (userData.status !== 'active') {
                    setError('Account is inactive');
                    setIsLoading(false);
                    return;
                }

                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('userRole', userData.role);
                sessionStorage.setItem('userId', userDoc.id);
                navigate('/admin');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-overlay"></div>
            <div className="admin-login-container">
                <div className="login-card-glass">
                    <div className="login-brand">
                        <div className="brand-logo-circle">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                <circle cx="12" cy="13" r="3" />
                            </svg>
                        </div>
                        <h1 className="brand-title">Studio Admin</h1>
                        <p className="brand-subtitle">Enter your credentials to access the dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="login-form-premium">
                        <div className="input-group-premium">
                            <label className="input-label-premium">Email / Username</label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    className="input-field-premium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@studio.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group-premium">
                            <label className="input-label-premium">Password</label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    type="password"
                                    className="input-field-premium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="login-error-message">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-login-premium"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>© 2024 Itsour Studio. Secure Admin Portal.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
