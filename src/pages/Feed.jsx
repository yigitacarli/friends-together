import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMedia } from '../context/MediaContext';
import { getAllPosts, createPost, likePost, unlikePost, deletePost, POST_TYPES } from '../services/posts';
import { getComments, addComment, deleteComment } from '../services/comments';
import { MEDIA_TYPES, STATUS_TYPES } from '../services/storage';
import StarRating from '../components/StarRating';

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}g önce`;
    return date.toLocaleDateString('tr-TR');
}

function getTimestamp(item) {
    if (!item.createdAt) return 0;
    if (item.createdAt.toDate) return item.createdAt.toDate().getTime();
    return new Date(item.createdAt).getTime();
}

export default function Feed({ onViewDetail }) {
    const { user, profile, isLoggedIn, isAdmin, getUser } = useAuth();
    const { items: mediaItems } = useMedia();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState('thought');
    const [posting, setPosting] = useState(false);

    // Comments state
    const [commentsByPost, setCommentsByPost] = useState({});
    const [expandedComments, setExpandedComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllPosts();
            setPosts(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPosts(); }, [loadPosts]);

    // Merge posts + media into a single timeline
    const timeline = useMemo(() => {
        const postItems = posts.map(p => ({ ...p, _type: 'post' }));
        const mediaActivity = mediaItems.map(m => ({ ...m, _type: 'media' }));
        const combined = [...postItems, ...mediaActivity];
        combined.sort((a, b) => getTimestamp(b) - getTimestamp(a));
        return combined;
    }, [posts, mediaItems]);

    const handlePost = async () => {
        if (!newContent.trim() || !user) return;
        setPosting(true);
        try {
            await createPost(
                { content: newContent.trim(), postType: newType },
                user.uid, profile?.displayName || 'Anonim', profile?.avatar || '🧑‍💻'
            );
            setNewContent('');
            setShowCreate(false);
            await loadPosts();
        } finally { setPosting(false); }
    };

    const handleLike = async (post) => {
        if (!user) return;
        try {
            if (post.likes?.includes(user.uid)) {
                await unlikePost(post.id, user.uid);
            } else {
                await likePost(post.id, user.uid);
            }
            await loadPosts();
        } catch (err) { console.error('Like error:', err); }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Bu gönderiyi silmek istediğine emin misin?')) return;
        try { await deletePost(postId); await loadPosts(); } catch (err) { console.error(err); }
    };

    // Comments
    const toggleComments = async (postId) => {
        const isOpen = expandedComments[postId];
        setExpandedComments(prev => ({ ...prev, [postId]: !isOpen }));
        if (!isOpen && !commentsByPost[postId]) {
            const cmts = await getComments(postId);
            setCommentsByPost(prev => ({ ...prev, [postId]: cmts }));
        }
    };

    const handleAddComment = async (postId) => {
        const text = commentInputs[postId]?.trim();
        if (!text || !user) return;
        try {
            await addComment(postId, text, user.uid, profile?.displayName || 'Anonim', profile?.avatar || '🧑‍💻');
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
            const cmts = await getComments(postId);
            setCommentsByPost(prev => ({ ...prev, [postId]: cmts }));
        } catch (err) { console.error(err); }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            await deleteComment(postId, commentId);
            const cmts = await getComments(postId);
            setCommentsByPost(prev => ({ ...prev, [postId]: cmts }));
        } catch (err) { console.error(err); }
    };

    // Render a post card
    const renderPost = (post) => {
        const typeInfo = POST_TYPES[post.postType] || POST_TYPES.thought;
        const liked = user && post.likes?.includes(user.uid);
        const likeCount = post.likes?.length || 0;
        const comments = commentsByPost[post.id] || [];
        const isExpanded = expandedComments[post.id];

        const author = getUser(post.userId);
        const displayName = author?.displayName || post.userName;
        const avatar = author?.avatar || post.userAvatar || '🧑‍💻';
        const title = author?.title || 'Çaylak Üye';

        return (
            <div key={`post-${post.id}`} className="post-card">
                <div className="post-header">
                    <span className="feed-avatar">{avatar}</span>
                    <div className="post-header-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="post-author">{displayName}</span>
                            <span className="user-profile-title-badge" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{title}</span>
                        </div>
                        <span className="post-time">{timeAgo(post.createdAt)}</span>
                    </div>
                    <span className="post-type-badge" style={{ color: typeInfo.color, borderColor: typeInfo.color }}>
                        {typeInfo.icon} {typeInfo.label}
                    </span>
                </div>

                <div className="post-content">{post.content}</div>

                <div className="post-actions">
                    <button className={`post-like-btn ${liked ? 'liked' : ''}`} onClick={() => handleLike(post)} disabled={!isLoggedIn}>
                        {liked ? '❤️' : '🤍'} {likeCount > 0 ? likeCount : ''}
                    </button>
                    <button className="post-comment-btn" onClick={() => toggleComments(post.id)}>
                        💬 {comments.length > 0 ? comments.length : ''}
                    </button>
                    {user && (post.userId === user.uid || isAdmin) && (
                        <button className="post-delete-btn" onClick={() => handleDeletePost(post.id)}>🗑️</button>
                    )}
                </div>

                {/* Comments */}
                {isExpanded && (
                    <div className="comments-section">
                        {comments.map(c => {
                            const cAuthor = getUser(c.userId);
                            return (
                                <div key={c.id} className="comment-item">
                                    <span className="comment-avatar">{cAuthor?.avatar || c.userAvatar || '🧑‍💻'}</span>
                                    <div className="comment-body">
                                        <div className="comment-header">
                                            <span className="comment-author">{cAuthor?.displayName || c.userName}</span>
                                            <span className="user-profile-title-badge" style={{ fontSize: '0.55rem', padding: '1px 4px', marginRight: 6 }}>
                                                {cAuthor?.title || 'Çaylak Üye'}
                                            </span>
                                            <span className="comment-time">{timeAgo(c.createdAt)}</span>
                                            {user && (c.userId === user.uid || isAdmin) && (
                                                <button className="comment-delete" onClick={() => handleDeleteComment(post.id, c.id)}>✕</button>
                                            )}
                                        </div>
                                        <div className="comment-text">{c.content}</div>
                                    </div>
                                </div>
                            );
                        })}
                        {isLoggedIn && (
                            <div className="comment-input-row">
                                <input
                                    type="text"
                                    placeholder="Yorum yaz..."
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                />
                                <button className="btn btn-primary btn-sm" onClick={() => handleAddComment(post.id)}>Gönder</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Render a media activity card
    const renderMediaActivity = (item) => {
        const typeInfo = MEDIA_TYPES[item.type] || MEDIA_TYPES.movie;
        const statusInfo = STATUS_TYPES[item.status] || STATUS_TYPES.completed;

        const author = getUser(item.userId);
        const displayName = author?.displayName || item.userName || 'Bilinmeyen';
        const avatar = author?.avatar || '🧑‍💻'; // activity items don't store avatar usually, fallback needed
        const title = author?.title || 'Çaylak Üye';

        return (
            <div key={`media-${item.id}`} className="activity-card" onClick={() => onViewDetail?.(item.id)}>
                <div className="post-header">
                    <span className="feed-avatar" style={{ fontSize: '1.5rem' }}>{typeInfo.icon}</span>
                    <div className="post-header-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="post-author">{displayName}</span>
                            <span className="user-profile-title-badge" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{title}</span>
                        </div>
                        <span className="post-time">
                            {statusInfo.label} · {timeAgo(item.createdAt)}
                        </span>
                    </div>
                    <span className="post-type-badge" style={{ color: typeInfo.color, borderColor: typeInfo.color }}>
                        {typeInfo.label}
                    </span>
                </div>

                <div className="activity-body">
                    {item.coverUrl && (
                        <img src={item.coverUrl} alt={item.title} className="activity-cover" />
                    )}
                    <div className="activity-info">
                        <h4 className="activity-title">{item.title}</h4>
                        {item.rating > 0 && <StarRating rating={item.rating} readOnly />}
                        {item.review && (
                            <p className="activity-review">"{item.review.length > 150 ? item.review.slice(0, 150) + '...' : item.review}"</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="feed-page">
            <div className="feed-header">
                <h2 className="section-title" style={{ fontSize: '1.4rem' }}>🏠 Akış</h2>
                {isLoggedIn && (
                    <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                        <span>✏️</span>
                        <span>Paylaş</span>
                    </button>
                )}
            </div>

            {showCreate && (
                <div className="feed-create-card">
                    <div className="feed-create-header">
                        <span className="feed-avatar">{profile?.avatar || '🧑‍💻'}</span>
                        <span className="feed-create-name">{profile?.displayName}</span>
                    </div>
                    <div className="feed-create-types">
                        {Object.entries(POST_TYPES).map(([key, val]) => (
                            <button key={key} className={`feed-type-btn ${newType === key ? 'active' : ''}`}
                                style={newType === key ? { borderColor: val.color, color: val.color } : {}}
                                onClick={() => setNewType(key)}>
                                {val.icon} {val.label}
                            </button>
                        ))}
                    </div>
                    <textarea className="feed-create-input" value={newContent} onChange={(e) => setNewContent(e.target.value)}
                        placeholder={newType === 'thought' ? 'Aklında ne var?...' : newType === 'review' ? 'Bir inceleme yaz...' : 'Hikayeni anlat...'}
                        rows={4} autoFocus />
                    <div className="feed-create-actions">
                        <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Vazgeç</button>
                        <button className="btn btn-primary" onClick={handlePost} disabled={posting || !newContent.trim()}>
                            {posting ? 'Paylaşılıyor...' : 'Paylaş'}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>⏳</div>
                    <h3 className="empty-state-title">Yükleniyor...</h3>
                </div>
            ) : timeline.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💬</div>
                    <h3 className="empty-state-title">Henüz hiçbir şey yok</h3>
                    <p className="empty-state-text">İlk medyanı ekle veya bir şeyler paylaş!</p>
                </div>
            ) : (
                <div className="feed-list">
                    {timeline.map(item =>
                        item._type === 'post' ? renderPost(item) : renderMediaActivity(item)
                    )}
                </div>
            )}
        </div>
    );
}
