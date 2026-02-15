import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMedia } from '../context/MediaContext';
import { getPosts, addPost, votePost, deletePost } from '../services/posts';
import { getComments, addComment, deleteComment } from '../services/comments';
import { MEDIA_TYPES, STATUS_TYPES } from '../services/storage';
import StarRating from '../components/StarRating';

function timeAgo(date) {
    if (!date) return '';
    const now = new Date();
    const d = date.toDate ? date.toDate() : new Date(date);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}g önce`;
    return d.toLocaleDateString('tr-TR');
}

function getTimestamp(item) {
    if (!item.createdAt) return 0;
    if (item.createdAt.toDate) return item.createdAt.toDate().getTime();
    return new Date(item.createdAt).getTime();
}

const POST_TYPES = {
    thought: { label: 'Düşünce', icon: '💭', color: '#818cf8' },
    review: { label: 'İnceleme', icon: '📝', color: '#f472b6' },
    memory: { label: 'Anı', icon: '📸', color: '#fbbf24' },
    quote: { label: 'Alıntı', icon: '💬', color: '#34d399' }
};

export default function Feed({ onViewDetail }) {
    const { user, profile, isLoggedIn, isAdmin, getUser } = useAuth();
    const { items: mediaItems } = useMedia();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState('thought');
    const [posting, setPosting] = useState(false);

    const [expandedComments, setExpandedComments] = useState({});
    const [commentsByPost, setCommentsByPost] = useState({});
    const [commentInputs, setCommentInputs] = useState({});

    const loadPosts = useCallback(async () => {
        const { posts: p } = await getPosts();
        setPosts(p);
        setLoading(false);
        // Pre-fetch comment counts for visible posts? 
        // For simpler logic, we fetch comments when expanding or rely on denormalized count if we had one.
        // Currently we fetch on toggle.
        // To show "Comment Preview" we might need to fetch comments for ALL posts initially? That's expensive.
        // Let's implement lazy load: click to load.
        // But user asked for "comments or number visible without click".
        // The number is best handled by fetching comments for all posts or storing commentCount on post.
        // Storing commentCount on post is ideal but requires cloud function or careful management.
        // Let's iterate posts and fetch comments for each silently?
        // Or just lazy load on scroll.
        // Let's fetch lightweight comments for top 10 posts.
        p.forEach(post => {
            getComments(post.id).then(cmts => {
                setCommentsByPost(prev => ({ ...prev, [post.id]: cmts }));
            });
        });

    }, []);

    useEffect(() => { loadPosts(); }, [loadPosts]);

    // Merge
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
            await addPost(
                newContent.trim(),
                newType,
                user.uid,
                profile?.displayName || 'Anonim',
                profile?.avatar || '🧑‍💻'
            );
            setNewContent('');
            setShowCreate(false);
            await loadPosts();
        } finally { setPosting(false); }
    };

    const handleVote = async (post, type) => {
        if (!user) return;
        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id !== post.id) return p;

            const upvotes = p.upvotes || p.likes || [];
            const downvotes = p.downvotes || [];
            let newUp = [...upvotes];
            let newDown = [...downvotes];

            if (type === 'up') {
                if (newUp.includes(user.uid)) {
                    newUp = newUp.filter(id => id !== user.uid);
                } else {
                    newUp.push(user.uid);
                    newDown = newDown.filter(id => id !== user.uid);
                }
            } else if (type === 'down') {
                if (newDown.includes(user.uid)) {
                    newDown = newDown.filter(id => id !== user.uid);
                } else {
                    newDown.push(user.uid);
                    newUp = newUp.filter(id => id !== user.uid);
                }
            }
            return { ...p, upvotes: newUp, downvotes: newDown, likes: newUp };
        }));

        try {
            await votePost(post.id, user.uid, type, profile.displayName, profile.avatar);
        } catch (error) {
            console.error(error);
            loadPosts();
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Silmek istediğine emin misin?')) return;
        try { await deletePost(postId); await loadPosts(); } catch (err) { console.error(err); }
    };

    const toggleComments = async (postId) => {
        setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
        // If not loaded, load (though we are preloading now)
        if (!commentsByPost[postId]) {
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

    const renderPost = (post) => {
        let typeInfo = POST_TYPES[post.type] || POST_TYPES.thought;
        // Fallback for old posts
        if (!post.type && post.postType) typeInfo = POST_TYPES[post.postType] || POST_TYPES.thought;

        const upvotes = post.upvotes || post.likes || [];
        const downvotes = post.downvotes || [];
        const score = upvotes.length - downvotes.length;
        const userVote = upvotes.includes(user?.uid) ? 'up' : downvotes.includes(user?.uid) ? 'down' : null;

        const comments = commentsByPost[post.id] || [];
        const isExpanded = expandedComments[post.id];

        const author = getUser(post.userId);
        const displayName = author?.displayName || post.userName;
        const avatar = author?.avatar || post.userAvatar || '🧑‍💻';
        const title = author?.title || 'Çaylak Üye';

        const lastComment = comments.length > 0 ? comments[comments.length - 1] : null;

        return (
            <div key={`post-${post.id}`} className="post-card">
                <div className="post-header">
                    <span className="feed-avatar">{avatar}</span>
                    <div className="post-header-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="post-author">{displayName}</span>
                            <span className="user-profile-title-badge" style={{ fontSize: '0.6rem', padding: '2px 6px', marginTop: 0 }}>{title}</span>
                        </div>
                        <span className="post-time">{timeAgo(post.createdAt)}</span>
                    </div>
                    <span className="post-type-badge" style={{ color: typeInfo.color, borderColor: typeInfo.color }}>
                        {typeInfo.icon} {typeInfo.label}
                    </span>
                </div>

                <p className="post-content">{post.content}</p>

                <div className="post-actions">
                    <div className="vote-actions">
                        <button
                            className={`vote-btn up ${userVote === 'up' ? 'active' : ''}`}
                            onClick={() => handleVote(post, 'up')}
                            disabled={!isLoggedIn}
                        >
                            ▲
                        </button>
                        <span className="vote-score">{score}</span>
                        <button
                            className={`vote-btn down ${userVote === 'down' ? 'active' : ''}`}
                            onClick={() => handleVote(post, 'down')}
                            disabled={!isLoggedIn}
                        >
                            ▼
                        </button>
                    </div>

                    <button className="post-comment-btn" onClick={() => toggleComments(post.id)}>
                        💬 {comments.length}
                    </button>
                    {user && (post.userId === user.uid || isAdmin) && (
                        <button className="post-delete-btn" onClick={() => handleDeletePost(post.id)}>🗑️</button>
                    )}
                </div>

                {/* Comment Preview */}
                {!isExpanded && lastComment && (
                    <div className="comment-preview" onClick={() => toggleComments(post.id)}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {getUser(lastComment.userId)?.displayName || lastComment.userName}:
                        </span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                            {lastComment.content}
                        </span>
                    </div>
                )}

                {/* Comments Section */}
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

    const renderMediaActivity = (item) => {
        const typeInfo = MEDIA_TYPES[item.type] || MEDIA_TYPES.movie;
        const statusInfo = STATUS_TYPES[item.status] || STATUS_TYPES.completed;

        const author = getUser(item.userId);
        const displayName = author?.displayName || item.userName || 'Bilinmeyen';
        const avatar = author?.avatar || '🧑‍💻';
        const title = author?.title || 'Çaylak Üye';

        return (
            <div key={`media-${item.id}`} className="activity-card" onClick={() => onViewDetail?.(item.id)}>
                <div className="post-header">
                    <span className="feed-avatar">{avatar}</span>
                    <div className="post-header-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="post-author">{displayName}</span>
                            <span className="user-profile-title-badge" style={{ fontSize: '0.6rem', padding: '2px 6px', marginTop: 0 }}>{title}</span>
                        </div>
                        <span className="post-time">
                            {statusInfo.label} · {timeAgo(item.createdAt)}
                        </span>
                    </div>
                    <span className="post-type-badge" style={{ color: typeInfo.color, borderColor: typeInfo.color }}>
                        {typeInfo.icon} {typeInfo.label}
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
