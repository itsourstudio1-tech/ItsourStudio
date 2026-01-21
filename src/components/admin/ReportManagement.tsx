import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './ReportManagement.css';

interface Report {
    id: string;
    type: 'bug' | 'visual' | 'feature' | 'other' | 'admin_report';
    subject?: string; // Added subject
    description: string;
    email: string;
    status: 'new' | 'in-progress' | 'resolved';
    userAgent?: string;
    url?: string;
    timestamp?: any;
    screenshot?: string;
}

interface ReportManagementProps {
    showToast: (type: 'success' | 'error', title: string, message: string) => void;
}

const ReportManagement = ({ showToast }: ReportManagementProps) => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'new' | 'in-progress' | 'resolved'>('all');

    useEffect(() => {
        const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reportsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Report[];
            setReports(reportsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reports:", error);
            showToast('error', 'Error', 'Failed to fetch reports');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [showToast]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'reports', id), {
                status: newStatus
            });
            showToast('success', 'Status Updated', `Report marked as ${newStatus}`);
        } catch (error) {
            console.error("Error updating report status:", error);
            showToast('error', 'Error', 'Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                await deleteDoc(doc(db, 'reports', id));
                showToast('success', 'Report Deleted', 'Report removed successfully');
            } catch (error) {
                console.error("Error deleting report:", error);
                showToast('error', 'Error', 'Failed to delete report');
            }
        }
    };

    const filteredReports = reports.filter(r => filter === 'all' || r.status === filter);

    const stats = {
        total: reports.length,
        new: reports.filter(r => r.status === 'new').length,
        resolved: reports.filter(r => r.status === 'resolved').length
    };

    if (loading) return <div className="p-4">Loading reports...</div>;

    return (
        <div className="report-management">
            <div className="report-stats">
                <div className="report-stat-card">
                    <span className="report-stat-label">Total Reports</span>
                    <span className="report-stat-value">{stats.total}</span>
                </div>
                <div className="report-stat-card">
                    <span className="report-stat-label">New Issues</span>
                    <span className="report-stat-value" style={{ color: '#ef4444' }}>{stats.new}</span>
                </div>
                <div className="report-stat-card">
                    <span className="report-stat-label">Resolved</span>
                    <span className="report-stat-value" style={{ color: '#10b981' }}>{stats.resolved}</span>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Issue Tracker</h3>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>

            {filteredReports.length === 0 ? (
                <div className="empty-state">
                    <p>No reports found.</p>
                </div>
            ) : (
                <div className="reports-grid">
                    {filteredReports.map(report => (
                        <div key={report.id} className="report-card">
                            <div className="report-header">
                                <span className={`report-type-badge badge-${report.type}`}>
                                    {report.type}
                                </span>
                                <select
                                    className={`report-status-select status-${report.status}`}
                                    value={report.status}
                                    onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                                >
                                    <option value="new">New</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div className="report-body">
                                {report.subject && <h4 style={{ margin: '0 0 0.5rem', color: '#334155' }}>{report.subject}</h4>}
                                <p className="report-desc">{report.description}</p>
                                <div className="report-meta">
                                    <div className="report-meta-item">
                                        <span>📧</span>
                                        <span>{report.email !== 'anonymous' ? report.email : 'Anonymous'}</span>
                                    </div>
                                    <div className="report-meta-item">
                                        <span>🕒</span>
                                        <span>{report.timestamp?.toDate().toLocaleString() || 'Unknown date'}</span>
                                    </div>
                                    {report.url && (
                                        <div className="report-meta-item">
                                            <span>🔗</span>
                                            <a href={report.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                                                View Page
                                            </a>
                                        </div>
                                    )}
                                </div>
                                {report.screenshot && (
                                    <div style={{ marginTop: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                        <a href={report.screenshot} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={report.screenshot}
                                                alt="Bug Screenshot"
                                                style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
                                            />
                                        </a>
                                        <div style={{ padding: '0.5rem', background: '#f8fafc', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                                            Click to view full image
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="report-actions">
                                <button className="btn-delete-report" onClick={() => handleDelete(report.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReportManagement;
