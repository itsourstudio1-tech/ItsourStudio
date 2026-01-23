import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, doc, updateDoc, writeBatch, where, deleteDoc } from 'firebase/firestore';
import { Bell, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import './NotificationHub.css'; // Reusing hub styles where applicable + custom styles

interface Notification {
    id: string;
    type: 'booking' | 'report' | 'system';
    title: string;
    message: string;
    timestamp: any;
    isRead: boolean;
    link?: string;
}

interface NotificationHistoryProps {
    onNavigate: (tab: string) => void;
}

const NotificationHistory = ({ onNavigate }: NotificationHistoryProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);

    // Initial Load - Realtime? Or just one-off?
    // History pages are usually fine to be one-off, but realtime is nicer.
    // However, pagination with realtime is tricky.
    // Let's stick to simple realtime for the first 50, then load more if needed? 
    // Or just fetch all (if not too many) or paginate.
    // Let's implement simple pagination.

    const PAGE_SIZE = 20;

    const fetchFirstPage = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(PAGE_SIZE));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
            setNotifications(data);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFirstPage();

        // Mark current page as read automatically when viewing history?
        // Maybe "Mark all displayed as read"?
        // The user asked for "mark all as read" button specifically on the hub.
        // Let's keep it manual or specific.
    }, []);

    const fetchMore = async () => {
        if (!lastDoc) return;
        try {
            const q = query(
                collection(db, 'notifications'),
                orderBy('timestamp', 'desc'),
                startAfter(lastDoc),
                limit(PAGE_SIZE)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];

            setNotifications(prev => [...prev, ...data]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching more:", error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { isRead: true });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const batch = writeBatch(db);
            // Query only unread to avoid writing unnecessary docs
            // Limit to 400 (batch limit is 500) just in case
            const unreadQ = query(collection(db, 'notifications'), where('isRead', '==', false), limit(400));
            const snapshot = await getDocs(unreadQ);

            if (snapshot.empty) return;

            snapshot.forEach(doc => {
                batch.update(doc.ref, { isRead: true });
            });

            await batch.commit();

            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        } catch (error) {
            console.error("Error marking all read:", error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Delete this notification?")) return;
        try {
            await deleteDoc(doc(db, 'notifications', id));
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking': return <Calendar size={24} className="text-blue-500" />;
            case 'report': return <AlertTriangle size={24} className="text-amber-500" />;
            default: return <Bell size={24} className="text-slate-500" />;
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Notification History</h2>
                    <p style={{ color: '#64748b', margin: '0.5rem 0 0' }}>View past alerts and updates</p>
                </div>
                <button
                    onClick={handleMarkAllRead}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#3b82f6',
                        fontWeight: 500
                    }}
                >
                    Mark All Read
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : (
                <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            No notifications found.
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div
                                key={n.id}
                                style={{
                                    background: n.isRead ? 'white' : '#f0f9ff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    display: 'flex',
                                    gap: '1rem',
                                    transition: 'transform 0.2s',
                                    position: 'relative',
                                    alignItems: 'center'
                                }}
                                onClick={() => {
                                    if (!n.isRead) handleMarkAsRead(n.id);
                                    if (n.link) onNavigate(n.link);
                                }}
                            >
                                <div style={{
                                    fontSize: '1.5rem',
                                    background: 'white',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #e2e8f0',
                                    flexShrink: 0
                                }}>
                                    {getIcon(n.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 0.25rem', color: '#1e293b' }}>{n.title}</h4>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        {n.message}
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                                        {n.timestamp?.toDate().toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(n.id, e)}
                                    title="Delete notification"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        marginLeft: '1rem',
                                        opacity: 0.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '4px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                        e.currentTarget.style.background = '#fef2f2';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '0.5';
                                        e.currentTarget.style.background = 'none';
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )
            }

            {
                hasMore && !loading && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button
                            onClick={fetchMore}
                            style={{
                                padding: '0.75rem 2rem',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                color: '#475569',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Load More
                        </button>
                    </div>
                )
            }
        </div >
    );
};

export default NotificationHistory;
