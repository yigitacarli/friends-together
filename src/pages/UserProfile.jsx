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
    removeFriendRequest,
    cancelFriendRequest
} from '../services/friends';

export default function UserProfile({ userId, userName, userAvatar, onViewDetail }) {
    const { user, profile: myProfile, getUser } = useAuth();
    const { items, getByUser } = useMedia();
    const { isAdmin } = useAuth();
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

    const userItems = useMemo(() => {
        const rawItems = getByUser(userId);
        // Kendi profilim — hepsini gör (private dahil)
        if (isMe) return rawItems;

        // Başkasının profili — private olanları HİÇ gösterme (admin bile)
        return rawItems.filter(item => {
            const visibility = item.visibility || 'friends';
            if (visibility === 'private') return false;
            if (visibility === 'public') return true;
            if (visibility === 'friends') return friendStatus === 'friends';
            return false;
        });
    }, [items, userId, getByUser, isMe, friendStatus]);

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

    const handleCancelRequest = async () => {
        if (loadingAction) return;
        if (!window.confirm('İsteği iptal etmek istiyor musun?')) return;
        setLoadingAction(true);
        try {
            await cancelFriendRequest(user.uid, userId);
        } catch (e) {
            console.error(e);
            alert('İptal edilemedi.');
        } finally { setLoadingAction(false); }
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
                            <button
                                className="btn"
                                onClick={handleSendRequest}
                                disabled={loadingAction}
                                style={{ background: '#16a34a', color: 'white', padding: '8px 24px', fontWeight: 600, boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)' }}
                            >
                                Arkadaş Ekle
                            </button>
                        )}
                        {friendStatus === 'sent' && (
                            <button
                                className="btn"
                                onClick={handleCancelRequest}
                                disabled={loadingAction}
                                style={{ background: '#dc2626', color: 'white', padding: '8px 24px', fontWeight: 600 }}
                            >
                                ✕ İptal Et
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
