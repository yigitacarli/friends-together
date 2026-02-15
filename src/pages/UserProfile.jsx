import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMedia } from '../context/MediaContext';
import { MEDIA_TYPES } from '../services/storage';
import MediaCard from '../components/MediaCard';
import {
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    getFriendStatus,
    removeFriendRequest
} from '../services/friends';

export default function UserProfile({ userId, userName, userAvatar, onViewDetail }) {
    const { user, profile: myProfile, getUser } = useAuth();
    const { items, getByUser } = useMedia();
    const [activeType, setActiveType] = useState('all');
    const [friendStatus, setFriendStatus] = useState('none');
    const [loadingAction, setLoadingAction] = useState(false);

    const isMe = user && user.uid === userId;

    // Get realtime profile data
    const userProfile = getUser(userId);
    const displayProfile = isMe ? myProfile : (userProfile || { displayName: userName, avatar: userAvatar, id: userId, title: 'Çaylak Üye' });

    // Calculate friend status
    useEffect(() => {
        if (!user || isMe) return;
        const myData = getUser(user.uid);
        if (myData) {
            setFriendStatus(getFriendStatus(myData, userId));
        }
    }, [user, userId, getUser, isMe]);

    const userItems = useMemo(() => getByUser(userId), [items, userId, getByUser]);

    const counts = useMemo(() => {
        const c = { total: userItems.length };
        Object.keys(MEDIA_TYPES).forEach(k => { c[k] = userItems.filter(i => i.type === k).length; });
        return c;
    }, [userItems]);

    const filtered = useMemo(() => {
        let data = activeType === 'all' ? [...userItems] : userItems.filter(i => i.type === activeType);
        data.sort((a, b) => (b.date || '').localeCompare(a.date || '')); // Newest first
        return data; // No slice, show all
    }, [userItems, activeType]);

    // Handlers
    const handleSendRequest = async () => {
        if (loadingAction) return;
        setLoadingAction(true);
        try {
            await sendFriendRequest(user.uid, myProfile, userId);
        } catch (e) {
            console.error(e);
            alert('İstek gönderilemedi.');
        } finally { setLoadingAction(false); }
    };

    const handleAccept = async () => {
        if (loadingAction) return;
        setLoadingAction(true);
        try {
            await acceptFriendRequest(user.uid, myProfile, userId);
        } catch (e) { console.error(e); } finally { setLoadingAction(false); }
    };

    const handleReject = async () => {
        try { await removeFriendRequest(user.uid, userId); } catch (e) { console.error(e); }
    };

    const handleRemoveFriend = async () => {
        if (!window.confirm('Arkadaşlıktan çıkarmak istediğine emin misin?')) return;
        try { await removeFriend(user.uid, userId); } catch (e) { console.error(e); }
    };

    return (
        <div className="user-profile-page">
            <div className="user-profile-hero">
                <div className="user-profile-avatar">{displayProfile?.avatar || '🧑‍💻'}</div>
                <h2 className="user-profile-name">{displayProfile?.displayName}</h2>

                {/* Title Badge */}
                <div className="user-profile-title-badge">
                    {displayProfile?.title || 'Çaylak Üye'}
                </div>

                {/* Friend Actions */}
                {!isMe && user && (
                    <div style={{ marginTop: 16 }}>
                        {friendStatus === 'none' && (
                            <button className="btn btn-primary" onClick={handleSendRequest} disabled={loadingAction}>
                                ➕ Arkadaş Ekle
                            </button>
                        )}
                        {friendStatus === 'sent' && (
                            <button className="btn btn-secondary" disabled>
                                ⏳ İstek Gönderildi
                            </button>
                        )}
                        {friendStatus === 'friends' && (
                            <button className="btn btn-secondary" onClick={handleRemoveFriend}>
                                🤝 Arkadaşsınız
                            </button>
                        )}
                        {friendStatus === 'received' && (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <button className="btn btn-primary" onClick={handleAccept} disabled={loadingAction}>Kabul Et</button>
                                <button className="btn btn-secondary" onClick={handleReject} disabled={loadingAction}>Reddet</button>
                            </div>
                        )}
                    </div>
                )}

                <div className="user-profile-stats" style={{ marginTop: 24 }}>
                    <div className="user-profile-stat">
                        <span className="user-profile-stat-value">{counts.total}</span>
                        <span className="user-profile-stat-label">Toplam</span>
                    </div>
                    {Object.entries(MEDIA_TYPES).map(([key, val]) =>
                        counts[key] > 0 ? (
                            <div className="user-profile-stat" key={key}>
                                <span className="user-profile-stat-value">{val.icon} {counts[key]}</span>
                                <span className="user-profile-stat-label">{val.label}</span>
                            </div>
                        ) : null
                    )}
                </div>
            </div>

            <div className="user-profile-filter">
                <button className={`collection-tab ${activeType === 'all' ? 'active' : ''}`} onClick={() => setActiveType('all')}>
                    Tümü
                </button>
                {Object.entries(MEDIA_TYPES).map(([key, val]) =>
                    counts[key] > 0 ? (
                        <button key={key} className={`collection-tab ${activeType === key ? 'active' : ''}`} onClick={() => setActiveType(key)}>
                            {val.icon} {val.label}
                        </button>
                    ) : null
                )}
            </div>

            <div className="media-grid">
                {filtered.map(item => (
                    <MediaCard key={item.id} item={item} onClick={() => onViewDetail(item.id)} />
                ))}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Bu kategoride içerik yok.
                </div>
            )}
        </div>
    );
}
