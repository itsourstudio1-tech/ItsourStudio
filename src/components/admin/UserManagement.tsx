import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import './UserManagement.css'; // We will create this

interface User {
    id: string;
    fullName: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    status: 'active' | 'inactive';
    authUid?: string;
    createdAt?: any;
    lastLogin?: any;
}

interface UserManagementProps {
    showToast: (type: 'success' | 'error', title: string, message: string) => void;
}

const UserManagement = ({ showToast }: UserManagementProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [userForm, setUserForm] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'viewer',
        status: 'active'
    });

    // Fetch Users Real-time
    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setUsers(usersData);
        }, (error) => {
            console.error("Error fetching users:", error);
            showToast('error', 'Error', 'Failed to fetch users');
        });

        return () => unsubscribe();
    }, [showToast]);

    const resetUserForm = () => {
        setUserForm({
            fullName: '',
            email: '',
            password: '',
            role: 'viewer',
            status: 'active'
        });
        setEditingUser(null);
        setShowUserModal(false);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setUserForm({
            fullName: user.fullName,
            email: user.email,
            password: '',
            role: user.role, // @ts-ignore
            status: user.status
        });
        setShowUserModal(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            if (editingUser) {
                const userRef = doc(db, 'users', editingUser.id);
                // @ts-ignore
                await updateDoc(userRef, {
                    fullName: userForm.fullName,
                    email: userForm.email,
                    role: userForm.role,
                    status: userForm.status,
                    updatedAt: serverTimestamp()
                });
                showToast('success', 'Updated', 'User updated successfully');
            } else {
                // Create new user in Firebase Auth first
                if (!userForm.password || userForm.password.length < 6) {
                    showToast('error', 'Validation', 'Password must be at least 6 characters');
                    setIsCreating(false);
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    userForm.email,
                    userForm.password
                );

                // Then create user profile in Firestore
                await addDoc(collection(db, 'users'), {
                    fullName: userForm.fullName,
                    email: userForm.email,
                    role: userForm.role,
                    status: userForm.status,
                    authUid: userCredential.user.uid,
                    createdAt: serverTimestamp()
                });

                showToast('success', 'Created', 'User created with Firebase Auth');
            }
            resetUserForm();
        } catch (error: any) {
            console.error("Error saving user:", error);
            if (error.code === 'auth/email-already-in-use') {
                showToast('error', 'Error', 'This email is already registered');
            } else if (error.code === 'auth/weak-password') {
                showToast('error', 'Error', 'Password is too weak');
            } else {
                showToast('error', 'Error', error.message || 'Failed to save user');
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteDoc(doc(db, 'users', id));
                showToast('success', 'Deleted', 'User deleted successfully');
            } catch (error) {
                console.error("Error deleting user:", error);
                showToast('error', 'Error', 'Failed to delete user');
            }
        }
    };

    const handleQuickUpdate = async (userId: string, field: 'role' | 'status', value: string) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                [field]: value
            });
            showToast('success', 'Updated', `User ${field} updated to ${value}`);
        } catch (error) {
            console.error(`Error updating user ${field}:`, error);
            showToast('error', 'Error', `Failed to update user ${field}`);
        }
    };

    const handleSendPasswordReset = async (email: string) => {
        if (!window.confirm(`Send password reset email to ${email}?`)) return;

        try {
            await sendPasswordResetEmail(auth, email);
            showToast('success', 'Email Sent', `Password reset email sent to ${email}`);
        } catch (error: any) {
            console.error("Error sending password reset:", error);
            if (error.code === 'auth/user-not-found') {
                showToast('error', 'Error', 'User not found in Firebase Auth');
            } else {
                showToast('error', 'Error', 'Failed to send password reset email');
            }
        }
    };

    return (
        <div className="bookings-section user-management">
            <div className="bookings-header">
                <h3>User Management (RBMS)</h3>
                <button className="btn btn-primary" onClick={() => {
                    resetUserForm();
                    setShowUserModal(true);
                }}>
                    + Add User
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="bookings-table-container desktop-view">
                <table className="bookings-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td style={{ fontWeight: 500 }}>{user.fullName}</td>
                                <td>{user.email}</td>
                                <td>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleQuickUpdate(user.id, 'role', e.target.value)}
                                        className={`status-badge role-${user.role}`}
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td>
                                    <select
                                        value={user.status}
                                        onChange={(e) => handleQuickUpdate(user.id, 'status', e.target.value)}
                                        style={{
                                            color: user.status === 'active' ? '#2e7d32' : '#c62828',
                                            padding: '0.4rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            border: '1px solid #ddd',
                                            background: user.status === 'active' ? '#e8f5e9' : '#ffebee',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </td>
                                <td> {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="action-btn"
                                            title="Edit User"
                                            onClick={() => handleEditUser(user)}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        <button
                                            className="action-btn"
                                            title="Send Password Reset"
                                            onClick={() => handleSendPasswordReset(user.email)}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        </button>
                                        <button
                                            className="action-btn"
                                            title="Delete User"
                                            onClick={() => handleDeleteUser(user.id)}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-view user-card-list">
                {users.map((user) => (
                    <div key={user.id} className="user-card">
                        <div className="user-card-header">
                            <div className="user-info">
                                <span className="user-name">{user.fullName}</span>
                                <span className="user-email">{user.email}</span>
                            </div>
                            <div className="user-actions">
                                <button
                                    className="action-btn"
                                    onClick={() => handleEditUser(user)}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button
                                    className="action-btn"
                                    title="Send Password Reset"
                                    onClick={() => handleSendPasswordReset(user.email)}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </button>
                                <button
                                    className="action-btn"
                                    onClick={() => handleDeleteUser(user.id)}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                        <div className="user-card-body">
                            <div className="card-row">
                                <span className="card-label">Role:</span>
                                <select
                                    value={user.role}
                                    onChange={(e) => handleQuickUpdate(user.id, 'role', e.target.value)}
                                    className={`status-badge role-${user.role}`}
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="card-row">
                                <span className="card-label">Status:</span>
                                <select
                                    value={user.status}
                                    onChange={(e) => handleQuickUpdate(user.id, 'status', e.target.value)}
                                    style={{
                                        color: user.status === 'active' ? '#2e7d32' : '#c62828',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        border: 'none',
                                        background: user.status === 'active' ? '#e8f5e9' : '#ffebee',
                                        cursor: 'pointer',
                                        appearance: 'none' // Remove default arrow if we want custom or none
                                    }}
                                >
                                    <option value="active">ACTIVE</option>
                                    <option value="inactive">INACTIVE</option>
                                </select>
                            </div>
                            <div className="card-row">
                                <span className="card-label">Created:</span>
                                <span>{user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {users.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                        No users found.
                    </div>
                )}
            </div>

            {/* User Modal */}
            <div className={`admin-modal-overlay ${showUserModal ? 'active' : ''}`} onClick={resetUserForm}>
                <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3 className="modal-title">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                        <button className="btn-close" onClick={resetUserForm}>&times;</button>
                    </div>
                    <form onSubmit={handleSaveUser}>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={userForm.fullName}
                                    onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="form-input"
                                    value={userForm.email}
                                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                />
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="form-label">Password (min 6 characters)</label>
                                    <input
                                        type="password"
                                        required
                                        className="form-input"
                                        placeholder="Enter password"
                                        value={userForm.password}
                                        onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                        minLength={6}
                                    />
                                </div>
                            )}
                            {editingUser && (
                                <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.5rem 0' }}>
                                    Use the 🔒 button to send password reset email.
                                </p>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-input"
                                        value={userForm.role}
                                        onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-input"
                                        value={userForm.status}
                                        onChange={e => setUserForm({ ...userForm, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={isCreating}>
                                {isCreating ? 'Creating...' : (editingUser ? 'Update User' : 'Create User')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
