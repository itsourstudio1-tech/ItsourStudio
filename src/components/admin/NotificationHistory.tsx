import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, doc, updateDoc, writeBatch, where, deleteDoc } from 'firebase/firestore';
import { Bell, Calendar, AlertTriangle, Trash2, ArrowLeft } from 'lucide-react';
import NotificationDetailsModal from './NotificationDetailsModal';
import './NotificationHistory.css';

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
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'booking' | 'report' | 'system' | 'unread'>('all');

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
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = [...notifications];

        if (filterType === 'unread') {
            filtered = filtered.filter(n => !n.isRead);
        } else if (filterType !== 'all') {
            filtered = filtered.filter(n => n.type === filterType);
        }

        setFilteredNotifications(filtered);
    }, [notifications, filterType]);

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
            const unreadQ = query(collection(db, 'notifications'), where('isRead', '==', false), limit(400));
            const snapshot = await getDocs(unreadQ);

            if (snapshot.empty) return;

            snapshot.forEach(doc => {
                batch.update(doc.ref, { isRead: true });
            });

            await batch.commit();
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

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const bookingCount = notifications.filter(n => n.type === 'booking').length;
    const reportCount = notifications.filter(n => n.type === 'report').length;
    const systemCount = notifications.filter(n => n.type === 'system').length;

    return (
        <div className="notification-history-container">
            {/* Header */}
            <div className="notification-history-header">
                <div className="notification-history-title-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => onNavigate('analytics')}
                            className="btn-back"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="notification-history-title">Notification History</h1>
                            <p className="notification-history-subtitle">
                                {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
                                {unreadCount > 0 && ` • ${unreadCount} unread`}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="notification-history-actions">
                    <button className="btn-mark-all" onClick={handleMarkAllRead}>
                        Mark All As Read
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="notification-filter-section">
                <div className="notification-filter-tabs">
                    <button
                        className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilterType('unread')}
                    >
                        Unread ({unreadCount})
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'booking' ? 'active' : ''}`}
                        onClick={() => setFilterType('booking')}
                    >
                        Bookings ({bookingCount})
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'report' ? 'active' : ''}`}
                        onClick={() => setFilterType('report')}
                    >
                        Reports ({reportCount})
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'system' ? 'active' : ''}`}
                        onClick={() => setFilterType('system')}
                    >
                        System ({systemCount})
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="notification-history-loading">
                    <div className="notification-history-spinner"></div>
                    Loading notifications...
                </div>
            ) : (
                <>
                    <div className="notification-history-list">
                        {filteredNotifications.length === 0 ? (
                            <div className="notification-history-empty">
                                <div className="notification-history-empty-icon">
                                    <Bell size={32} />
                                </div>
                                <h3 className="notification-history-empty-title">No notifications</h3>
                                <p className="notification-history-empty-text">
                                    {filterType === 'all'
                                        ? "You don't have any notifications yet."
                                        : `No ${filterType === 'unread' ? 'unread' : filterType} notifications.`
                                    }
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`notification-history-item ${!n.isRead ? 'unread' : ''}`}
                                    onClick={() => {
                                        if (!n.isRead) handleMarkAsRead(n.id);
                                        setSelectedNotification(n);
                                    }}
                                >
                                    <div className={`notification-history-icon ${n.type}`}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="notification-history-content">
                                        <h3 className="notification-history-item-title">{n.title}</h3>
                                        <p className="notification-history-item-message">{n.message}</p>
                                        <span className="notification-history-item-time">
                                            {formatTime(n.timestamp)}
                                        </span>
                                    </div>
                                    <div className="notification-history-item-actions">
                                        <button
                                            className="notification-action-delete"
                                            onClick={(e) => handleDelete(n.id, e)}
                                            title="Delete notification"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    {!n.isRead && <div className="notification-unread-badge" />}
                                </div>
                            ))
                        )}
                    </div>

                    {hasMore && !loading && filteredNotifications.length > 0 && (
                        <div className="notification-history-load-more">
                            <button className="btn-load-more" onClick={fetchMore}>
                                Load More Notifications
                            </button>
                        </div>
                    )}
                </>
            )}

            <NotificationDetailsModal
                notification={selectedNotification}
                onClose={() => setSelectedNotification(null)}
                onNavigate={onNavigate}
            />
        </div>
    );
};

export default NotificationHistory;
