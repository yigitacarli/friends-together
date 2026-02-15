import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMedia } from '../context/MediaContext';
import { MEDIA_TYPES, STATUS_TYPES } from '../services/storage';
import MediaCard from '../components/MediaCard';

export default function UserProfile({ userId, userName, userAvatar, onViewDetail }) {
    const { user, profile: myProfile, updateUserProfile, AVATARS, FUNNY_TITLES } = useAuth();
    const { items, getByUser } = useMedia();
    const [activeType, setActiveType] = useState('all');
    const [isEditing, setIsEditing] = useState(false);

    // Profile data might be different if viewing someone else
    // If viewing self, use realtime profile data from context
    const isMe = user && user.uid === userId;
    const currentProfile = isMe ? myProfile : { displayName: userName, avatar: userAvatar, id: userId };

    // Edit states
    const [editName, setEditName] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [editTitle, setEditTitle] = useState('');

    const userItems = useMemo(() => getByUser(userId), [items, userId]);

    const counts = useMemo(() => {
        const c = { total: userItems.length };
        Object.keys(MEDIA_TYPES).forEach(k => { c[k] = userItems.filter(i => i.type === k).length; });
        return c;
    }, [userItems]);

    const filtered = useMemo(() => {
        let data = activeType === 'all' ? [...userItems] : userItems.filter(i => i.type === activeType);
        data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return data;
    }, [userItems, activeType]);

    const handleEditOpen = () => {
        setEditName(currentProfile?.displayName || '');
        setEditAvatar(currentProfile?.avatar || '🧑‍💻');
        setEditTitle(currentProfile?.title || 'Çaylak Üye');
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editName.trim()) return;
        try {
            await updateUserProfile({
                displayName: editName.trim(),
                avatar: editAvatar,
                title: editTitle.trim()
            });
            setIsEditing(false);
        } catch (err) {
            console.error('Update error:', err);
            alert('Güncelleme hatası!');
        }
    };

    return (
        <div className="user-profile-page">
            <div className="user-profile-hero">
                <div className="user-profile-avatar">{currentProfile?.avatar || '🧑‍💻'}</div>
                <h2 className="user-profile-name">{currentProfile?.displayName}</h2>

                {/* Title Badge */}
                <div className="user-profile-title-badge">
                    {currentProfile?.title || 'Çaylak Üye'}
                </div>

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

            {/* EDIT MODAL */}
            {isEditing && (
                <div className="modal-overlay" onClick={() => setIsEditing(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Profili Düzenle</h3>
                            <button className="btn-icon" onClick={() => setIsEditing(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Avatar</label>
                                <div className="avatar-picker" style={{ maxHeight: 150, overflowY: 'auto' }}>
                                    {AVATARS.map(av => (
                                        <button key={av} type="button"
                                            className={`avatar-option ${editAvatar === av ? 'selected' : ''}`}
                                            onClick={() => setEditAvatar(av)}
                                        >
                                            {av}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Görünen İsim</label>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ünvan (Title)</label>
                                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Kendine bir ünvan seç..." list="titles-list" />
                                <datalist id="titles-list">
                                    {FUNNY_TITLES.map(t => <option key={t} value={t} />)}
                                </datalist>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    Listedeki komik ünvanlardan seç veya kendi havalı ünvanını yaz!
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>İptal</button>
                            <button className="btn btn-primary" onClick={handleSave}>Kaydet</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
