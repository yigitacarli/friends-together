import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllPosts, createPost, likePost, unlikePost, deletePost, POST_TYPES } from '../services/posts';

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

export default function Feed() {
    const { user, profile } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState('thought');
    const [posting, setPosting] = useState(false);

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllPosts();
            setPosts(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const handlePost = async () => {
        if (!newContent.trim() || !user) return;
        setPosting(true);
        try {
            await createPost(
                { content: newContent.trim(), postType: newType },
                user.uid,
                profile?.displayName || 'Anonim',
                profile?.avatar || '🧑‍💻'
            );
            setNewContent('');
            setShowCreate(false);
            await loadPosts();
        } catch (err) {
            console.error('Post error:', err);
        } finally {
            setPosting(false);
        }
    };

    const handleLike = async (post) => {
        if (!user) return;
        const liked = post.likes?.includes(user.uid);
        try {
            if (liked) {
                await unlikePost(post.id, user.uid);
            } else {
                await likePost(post.id, user.uid);
            }
            await loadPosts();
        } catch (err) {
            console.error('Like error:', err);
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Bu gönderiyi silmek istediğine emin misin?')) return;
        try {
            await deletePost(postId);
            await loadPosts();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    return (
        <div className="feed-page">
            <div className="feed-header">
                <h2 className="section-title" style={{ fontSize: '1.4rem' }}>💬 Akış</h2>
                {user && (
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
                            <button
                                key={key}
                                className={`feed-type-btn ${newType === key ? 'active' : ''}`}
                                style={newType === key ? { borderColor: val.color, color: val.color } : {}}
                                onClick={() => setNewType(key)}
                            >
                                {val.icon} {val.label}
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="feed-create-input"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder={
                            newType === 'thought' ? 'Aklında ne var?...' :
                                newType === 'review' ? 'Bir inceleme yaz...' :
                                    'Hikayeni anlat...'
                        }
                        rows={4}
                        autoFocus
                    />
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
            ) : posts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💬</div>
                    <h3 className="empty-state-title">Henüz paylaşım yok</h3>
                    <p className="empty-state-text">İlk gönderiyi sen paylaş!</p>
                </div>
            ) : (
                <div className="feed-list">
                    {posts.map(post => {
                        const typeInfo = POST_TYPES[post.postType] || POST_TYPES.thought;
                        const liked = user && post.likes?.includes(user.uid);
                        const likeCount = post.likes?.length || 0;

                        return (
                            <div key={post.id} className="post-card">
                                <div className="post-header">
                                    <span className="feed-avatar">{post.userAvatar || '🧑‍💻'}</span>
                                    <div className="post-header-info">
                                        <span className="post-author">{post.userName}</span>
                                        <span className="post-time">{timeAgo(post.createdAt)}</span>
                                    </div>
                                    <span
                                        className="post-type-badge"
                                        style={{ color: typeInfo.color, borderColor: typeInfo.color }}
                                    >
                                        {typeInfo.icon} {typeInfo.label}
                                    </span>
                                </div>

                                <div className="post-content">{post.content}</div>

                                <div className="post-actions">
                                    <button
                                        className={`post-like-btn ${liked ? 'liked' : ''}`}
                                        onClick={() => handleLike(post)}
                                        disabled={!user}
                                    >
                                        {liked ? '❤️' : '🤍'} {likeCount > 0 ? likeCount : ''}
                                    </button>

                                    {user && post.userId === user.uid && (
                                        <button className="post-delete-btn" onClick={() => handleDelete(post.id)}>
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
