import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { listenToNotifications, markAllAsRead } from '../services/notifications';
import { acceptFriendRequest, removeFriendRequest } from '../services/friends';

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

function getNotifText(item) {
    const name = item.data?.userName || 'Biri';
    switch (item.type) {
        case 'like':
        case 'upvote':
            return { text: `${name} gönderini beğendi`, emoji: '❤️' };
        case 'downvote':
            return { text: `${name} gönderine oy verdi`, emoji: '👎' };
        case 'comment':
            return {
                text: `${name} ${item.data?.content ? `yorum yaptı: "${item.data.content.slice(0, 50)}${item.data.content.length > 50 ? '...' : ''}"` : 'gönderine yorum yaptı'}`,
                emoji: '💬'
            };
        case 'friend_request':
            return { text: `${name} sana arkadaşlık isteği gönderdi`, emoji: '👋' };
        case 'friend_accept':
            return { text: `${name} arkadaşlık isteğini kabul etti`, emoji: '🤝' };
        default:
            return { text: `${name} bir bildirim gönderdi`, emoji: '🔔' };
    }
}

export default function Notifications() {
    const { user, profile } = useAuth();
    const [items, setItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [processingId, setProcessingId] = useState(null);
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

    const handleAcceptFriend = async (notif) => {
        if (processingId) return;
        const requesterId = notif.data?.userId;
        if (!requesterId) return;
        setProcessingId(notif.id);
        try {
            await acceptFriendRequest(user.uid, profile, requesterId);
        } catch (e) {
            console.error('Accept friend error:', e);
            alert('Kabul edilemedi, tekrar dene.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectFriend = async (notif) => {
        if (processingId) return;
        const requesterId = notif.data?.userId;
        if (!requesterId) return;
        setProcessingId(notif.id);
        try {
            await removeFriendRequest(user.uid, requesterId);
        } catch (e) {
            console.error('Reject friend error:', e);
        } finally {
            setProcessingId(null);
        }
    };

    if (!user) return null;

    return (
        <div className="notifications-container" ref={dropdownRef}>
            <button className="btn-icon notifications-btn" onClick={handleOpen}>
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {/* Mobilde arka plan overlay */}
            {isOpen && <div className="notif-overlay" onClick={() => setIsOpen(false)} />}

            {isOpen && (
                <div className="notifications-dropdown">
                    <div className="notifications-header">
                        <h3>🔔 Bildirimler {unreadCount > 0 && <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 400 }}>({unreadCount} yeni)</span>}</h3>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {unreadCount > 0 && (
                                <button
                                    className="notif-mark-read-btn"
                                    onClick={() => markAllAsRead(user.uid, items)}
                                >
                                    ✓ Okundu
                                </button>
                            )}
                            <button
                                className="notif-close-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="notifications-list">
                        {items.length === 0 ? (
                            <div className="notifications-empty">
                                <span style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}>💤</span>
                                Henüz bildirim yok
                            </div>
                        ) : (
                            items.map(item => {
                                const { text, emoji } = getNotifText(item);
                                const isFriendRequest = item.type === 'friend_request';
                                const isProcessing = processingId === item.id;

                                return (
                                    <div key={item.id} className={`notification-item ${!item.read ? 'unread' : ''}`}>
                                        <span className="notif-avatar">{item.data?.userAvatar || '👤'}</span>
                                        <div className="notif-content">
                                            <p style={{ margin: 0, lineHeight: 1.5 }}>
                                                {emoji} {text}
                                            </p>

                                            {isFriendRequest && (
                                                <div className="notif-friend-actions">
                                                    <button
                                                        className="notif-accept-btn"
                                                        onClick={() => handleAcceptFriend(item)}
                                                        disabled={isProcessing}
                                                    >
                                                        {isProcessing ? '⏳' : '✓ Kabul Et'}
                                                    </button>
                                                    <button
                                                        className="notif-reject-btn"
                                                        onClick={() => handleRejectFriend(item)}
                                                        disabled={isProcessing}
                                                    >
                                                        ✕ Reddet
                                                    </button>
                                                </div>
                                            )}

                                            <span className="notif-time">{timeAgo(item.createdAt)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
