import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, limit, where, writeBatch, doc } from 'firebase/firestore';
import { Bell, Calendar, AlertTriangle } from 'lucide-react';
import NotificationDetailsModal from './NotificationDetailsModal';
import './NotificationHub.css'; // We'll create this CSS

interface Notification {
    id: string;
    type: 'booking' | 'report' | 'system';
    title: string;
    message: string;
    timestamp: any;
    isRead: boolean;
    link?: string;
    relatedId?: string;
}

interface NotificationHubProps {
    onViewAll: () => void;
    onNavigate: (tab: string) => void;
}

const NotificationHub = ({ onViewAll, onNavigate }: NotificationHubProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    useEffect(() => {
        // We only fetch the latest 10 for the dropdown
        const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(10));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];
            setNotifications(data);

            // Calculate unread count (this might be inaccurate if we only fetch 10, 
            // but for a dropdown badge relying on client-side 'isRead' field, we probably want 
            // a separate query for count if we want total unread. 
            // For now, let's just count unread in the latest 10 or fetch a separate count.)

            // Actually, let's just count from the latest fetch for simplicity 
            // OR do a separate aggregate query if needed. 
            // Let's do a separate query for unread count to be accurate.
        });

        // Separate listener for unread count
        const unreadQuery = query(collection(db, 'notifications'), where('isRead', '==', false));
        const unsubscribeCount = onSnapshot(unreadQuery, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => {
            unsubscribe();
            unsubscribeCount();
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;

        try {
            const batch = writeBatch(db);
            const unreadSnapshot = await import('firebase/firestore').then(mod =>
                mod.getDocs(query(collection(db, 'notifications'), where('isRead', '==', false)))
            );

            unreadSnapshot.forEach(doc => {
                batch.update(doc.ref, { isRead: true });
            });

            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await import('firebase/firestore').then(mod =>
                    mod.updateDoc(doc(db, 'notifications', notification.id), { isRead: true })
                );
            } catch (error) {
                console.error("Error marking as read:", error);
            }
        }

        // Open details modal
        setSelectedNotification(notification);
        setIsOpen(false);
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking': return <Calendar size={18} className="text-blue-500" />;
            case 'report': return <AlertTriangle size={18} className="text-amber-500" />;
            default: return <Bell size={18} className="text-slate-500" />;
        }
    };



    return (
        <div className="notification-hub" ref={dropdownRef}>
            <button className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <button className="mark-read-btn" onClick={handleMarkAllRead}>Mark all read</button>
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="empty-notifications">No notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div className="notification-icon">{getIcon(n.type)}</div>
                                    <div className="notification-content">
                                        <div className="notification-title">{n.title}</div>
                                        <div className="notification-message">{n.message}</div>
                                        <div className="notification-time">{formatTime(n.timestamp)}</div>
                                    </div>
                                    {!n.isRead && <div className="unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="notification-footer">
                        <button onClick={() => { onViewAll(); setIsOpen(false); }}>See all notifications</button>
                    </div>
                </div>
            )}

            <NotificationDetailsModal
                notification={selectedNotification}
                onClose={() => setSelectedNotification(null)}
                onNavigate={onNavigate}
            />
        </div>
    );
};

export default NotificationHub;
