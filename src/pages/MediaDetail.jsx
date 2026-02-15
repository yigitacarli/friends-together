import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMedia } from '../context/MediaContext';
import { MEDIA_TYPES, STATUS_TYPES, TYPE_EXTRA_FIELDS } from '../services/storage';
import { getComments, addComment, deleteComment } from '../services/comments';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import StarRating from '../components/StarRating';

function timeAgo(date) {
    if (!date) return '';
    const now = new Date();
    const d = date.toDate ? date.toDate() : new Date(date);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
    return `${Math.floor(diff / 86400)}g önce`;
}

export default function MediaDetail({ mediaId, onBack, onEdit, onDelete, currentUserId }) {
    const { getById, loading } = useMedia();
    const { user, profile, isAdmin } = useAuth();
    const item = getById(mediaId);

    // States for comments & owner profile
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [loadingOwner, setLoadingOwner] = useState(false);

    // Load owner profile (realtime avatar/title)
    useEffect(() => {
        if (!item?.userId) return;
        async function fetchOwner() {
            setLoadingOwner(true);
            try {
                const snap = await getDoc(doc(db, 'users', item.userId));
                if (snap.exists()) setOwnerProfile(snap.data());
            } catch (e) { console.error(e); } finally { setLoadingOwner(false); }
        }
        fetchOwner();
    }, [item?.userId]);

    // Load comments
    const loadItemComments = async () => {
        if (!mediaId) return;
        const data = await getComments(mediaId, 'media-items');
        setComments(data);
    };

    useEffect(() => {
        loadItemComments();
    }, [mediaId]);

    const handleAddComment = async () => {
        if (!commentText.trim() || !user) return;
        try {
            await addComment(mediaId, commentText, user.uid, profile.displayName, profile.avatar, 'media-items');
            setCommentText('');
            loadItemComments();
        } catch (err) { console.error(err); }
    };

    const handleDeleteComment = async (cid) => {
        if (!window.confirm('Yorumu silmek istediğine emin misin?')) return;
        try {
            await deleteComment(mediaId, cid, 'media-items');
            loadItemComments();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="detail-page">Yükleniyor...</div>;
    if (!item) return <div className="detail-page">İçerik bulunamadı <button onClick={onBack}>Geri</button></div>;

    const typeInfo = MEDIA_TYPES[item.type] || MEDIA_TYPES.movie;
    const statusInfo = STATUS_TYPES[item.status] || STATUS_TYPES.completed;
    const isOwner = currentUserId && item.userId === currentUserId;
    const canEdit = isOwner || isAdmin;

    // Use owner profile if loaded, fallback to item data
    const displayAvatar = ownerProfile?.avatar || item.userAvatar || '🧑‍💻';
    const displayName = ownerProfile?.displayName || item.userName || 'Kullanıcı';
    const displayTitle = ownerProfile?.title || 'Çaylak Üye';

    return (
        <div className="detail-page">
            {/* Navbar-like top bar inside modal/page */}
            <button className="btn-icon back-btn" onClick={onBack} style={{ marginBottom: 16 }}>⬅ Geri</button>

            {/* Main Content Card */}
            <div className="detail-card">
                {/* Header with Type Icon on Right */}
                <div className="detail-header-new" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    {/* User Info */}
                    <div className="detail-user-info" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span className="feed-avatar" style={{ fontSize: '2.5rem' }}>{displayAvatar}</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{displayName}</div>
                            <div className="user-profile-title-badge" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                {displayTitle}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {new Date(item.date || new Date()).toLocaleDateString('tr-TR')} tarihinde paylaştı
                            </div>
                        </div>
                    </div>

                    {/* Type Icon Badge */}
                    <div className="detail-type-badge" style={{
                        background: typeInfo.color,
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                    </div>
                </div>

                <div className="detail-hero">
                    <img
                        src={item.coverUrl || 'https://via.placeholder.com/200x300?text=No+Cover'}
                        alt={item.title}
                        className="detail-cover"
                    />
                    <div className="detail-info">
                        <h1 className="detail-title">{item.title}</h1>

                        <div className="detail-meta-row">
                            <span className={`status-badge ${item.status}`}>
                                {statusInfo.icon} {statusInfo.label}
                            </span>
                            {item.rating > 0 && <StarRating rating={item.rating} readOnly size={24} />}
                        </div>

                        {/* Extra Fields */}
                        <div className="detail-extras">
                            {TYPE_EXTRA_FIELDS[item.type]?.map(field => item[field.key] && (
                                <div key={field.key} className="detail-extra-item">
                                    <strong>{field.label}:</strong> {item[field.key]}
                                </div>
                            ))}
                        </div>

                        {canEdit && (
                            <div className="detail-actions" style={{ marginTop: 24 }}>
                                <button className="btn btn-secondary" onClick={() => onEdit(item)}>✏️ Düzenle</button>
                                <button className="btn btn-danger" onClick={() => onDelete(item.id, item.userId)}>🗑️ Sil</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Review Section */}
                {item.review && (
                    <div className="detail-section">
                        <h3 className="detail-section-title">💬 İnceleme</h3>
                        <p className="detail-review-text" style={{ fontSize: '1rem', lineHeight: 1.6 }}>"{item.review}"</p>
                    </div>
                )}

                {/* Comments Section */}
                <div className="detail-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginTop: 24 }}>
                    <h3 className="detail-section-title">Yorumlar ({comments.length})</h3>

                    <div className="comments-list" style={{ marginTop: 16 }}>
                        {comments.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="comment-item">
                                    <span className="comment-avatar">{c.userAvatar}</span>
                                    <div className="comment-body">
                                        <div className="comment-header">
                                            <span className="comment-author">{c.userName}</span>
                                            <span className="comment-time">{timeAgo(c.createdAt)}</span>
                                            {/* TODO: Add user title here as well if needed */}
                                            {(c.userId === user?.uid || isAdmin) && (
                                                <button className="comment-delete" onClick={() => handleDeleteComment(c.id)}>✕</button>
                                            )}
                                        </div>
                                        <div className="comment-text">{c.content}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {user && (
                        <div className="comment-input-row" style={{ marginTop: 20 }}>
                            <input
                                type="text"
                                placeholder="Bu inceleme hakkında bir şeyler yaz..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                            />
                            <button className="btn btn-primary" onClick={handleAddComment}>Gönder</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
