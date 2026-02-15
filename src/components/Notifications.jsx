import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { listenToNotifications, markAsRead, markAllAsRead } from '../services/notifications';

function timeAgo(date) {
    if (!date) return '';
    const now = new Date();
    const d = date.toDate ? date.toDate() : new Date(date);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Şimdi';
    if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
    return `${Math.floor(diff / 86400)}g`;
}

export default function Notifications() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        const unsub = listenToNotifications(user.uid, (data) => {
            setItems(data);
        });
        return unsub;
    }, [user]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const unreadCount = items.filter(i => !i.read).length;

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            markAllAsRead(user.uid, items);
        }
    };

    if (!user) return null;

    return (
        <div className="notifications-container" ref={dropdownRef}>
            <button className="btn-icon notifications-btn" onClick={handleOpen}>
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notifications-dropdown">
                    <div className="notifications-header">
                        <h3>Bildirimler</h3>
                        {unreadCount > 0 && (
                            <button className="btn-text-sm" onClick={() => markAllAsRead(user.uid, items)}>
                                Tümünü Oku
                            </button>
                        )}
                    </div>

                    <div className="notifications-list">
                        {items.length === 0 ? (
                            <div className="notifications-empty">Henüz bildirim yok 💤</div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className={`notification-item ${!item.read ? 'unread' : ''}`}>
                                    <span className="notif-avatar">{item.data?.userAvatar || '👤'}</span>
                                    <div className="notif-content">
                                        <p>
                                            <strong>{item.data?.userName || 'Biri'}</strong>
                                            {item.type === 'like' && ' gönderini beğendi ❤️'}
                                            {item.type === 'comment' && ' gönderine yorum yaptı 💬'}
                                        </p>
                                        <span className="notif-time">{timeAgo(item.createdAt)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
