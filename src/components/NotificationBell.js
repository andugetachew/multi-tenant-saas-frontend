import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import webSocketService from '../services/websocket';
import './NotificationBell.css';

const NotificationBell = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchNotifications();

            // Connect WebSocket for live notifications
            webSocketService.connectNotifications(user.id, (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show browser notification if supported
                if (Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: '/favicon.ico'
                    });
                }
            });
        }

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            webSocketService.disconnect('notifications');
        };
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications/');
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unread_count || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.delete(`/notifications/${id}/`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-read/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown && unreadCount > 0) {
            // Optionally mark as read when opening dropdown
            // markAllAsRead();
        }
    };

    const getTimeAgo = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    return (
        <div className="notification-bell">
            <button onClick={toggleDropdown} className="bell-button">
                🔔
                {unreadCount > 0 && <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>

            {showDropdown && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <h4>Notifications</h4>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="mark-all-btn">
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="dropdown-content">
                        {loading ? (
                            <div className="loading-notifications">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="no-notifications">
                                <span>🔔</span>
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                                    onClick={() => markAsRead(notif.id)}
                                >
                                    <div className="notification-icon">
                                        {notif.notification_type === 'success' && '✅'}
                                        {notif.notification_type === 'error' && '❌'}
                                        {notif.notification_type === 'warning' && '⚠️'}
                                        {!notif.notification_type && '📢'}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">{notif.title}</div>
                                        <div className="notification-message">{notif.message}</div>
                                        <div className="notification-time">{getTimeAgo(notif.created_at)}</div>
                                    </div>
                                    {!notif.is_read && <div className="unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;