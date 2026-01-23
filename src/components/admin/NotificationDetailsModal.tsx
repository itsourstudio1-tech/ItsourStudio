import { X, Calendar, AlertTriangle, Bell, ExternalLink } from 'lucide-react';
import './NotificationHub.css'; // Use existing styles

interface Notification {
    id: string;
    type: 'booking' | 'report' | 'system';
    title: string;
    message: string;
    timestamp: any;
    isRead: boolean;
    link?: string;
}

interface NotificationDetailsModalProps {
    notification: Notification | null;
    onClose: () => void;
    onNavigate: (tab: string) => void;
}

const NotificationDetailsModal = ({ notification, onClose, onNavigate }: NotificationDetailsModalProps) => {
    if (!notification) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking': return <Calendar size={32} className="text-blue-500" />;
            case 'report': return <AlertTriangle size={32} className="text-amber-500" />;
            default: return <Bell size={32} className="text-slate-500" />;
        }
    };

    const handleAction = () => {
        if (notification.link) {
            onNavigate(notification.link);
            onClose();
        }
    };

    return (
        <div className="notification-modal-overlay" onClick={onClose}>
            <div className="notification-modal-content" onClick={e => e.stopPropagation()}>
                <button className="notification-modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="notification-modal-header">
                    <div className="notification-modal-icon">
                        {getIcon(notification.type)}
                    </div>
                    <div>
                        <h2 className="notification-modal-title">{notification.title}</h2>
                        <span className="notification-modal-time">
                            {notification.timestamp?.toDate().toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="notification-modal-body">
                    <p>{notification.message}</p>
                </div>

                {notification.link && (
                    <div className="notification-modal-footer">
                        <button className="notification-action-btn" onClick={handleAction}>
                            {notification.link === 'patch-notes'
                                ? 'View Patch Notes'
                                : `View Related ${notification.type === 'booking' ? 'Booking' : 'Report'}`
                            }
                            <ExternalLink size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDetailsModal;
