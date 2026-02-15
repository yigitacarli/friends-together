import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMedia } from '../context/MediaContext';
import { MEDIA_TYPES } from '../services/storage';
import { deleteMedia } from '../services/storage';
import { deletePost, getAllPosts } from '../services/posts';
import { useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function AdminPanel({ onNavigate }) {
    const { user, isAdmin, allUsers, FUNNY_TITLES } = useAuth();
    const { items: mediaItems, remove: removeMedia } = useMedia();
    const [tab, setTab] = useState('overview');
    const [posts, setPosts] = useState([]);
    const [editingTitle, setEditingTitle] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [searchUser, setSearchUser] = useState('');

    useEffect(() => {
        getAllPosts().then(setPosts);
    }, []);

    if (!isAdmin) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🚫</div>
                <h3 className="empty-state-title">Erişim Reddedildi</h3>
                <p className="empty-state-text">Bu sayfaya sadece admin erişebilir.</p>
            </div>
        );
    }

    const userList = Object.entries(allUsers).map(([uid, data]) => ({ uid, ...data }));
    const totalUsers = userList.length;
    const totalMedia = mediaItems.length;
    const totalPosts = posts.length;

    const onlineUsers = userList.filter(u => {
        if (!u.lastSeen) return false;
        const last = u.lastSeen.toDate ? u.lastSeen.toDate() : new Date(u.lastSeen);
        return (new Date() - last) / 1000 < 5 * 60;
    });

    const mediaByType = {};
    Object.keys(MEDIA_TYPES).forEach(t => {
        mediaByType[t] = mediaItems.filter(m => m.type === t).length;
    });

    const filteredUsers = searchUser
        ? userList.filter(u =>
            u.displayName?.toLowerCase().includes(searchUser.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchUser.toLowerCase())
        )
        : userList;

    const handleChangeTitle = async (uid) => {
        if (!newTitle.trim()) return;
        try {
            await updateDoc(doc(db, 'users', uid), { title: newTitle.trim() });
            setEditingTitle(null);
            setNewTitle('');
        } catch (e) {
            console.error(e);
            alert('Unvan güncellenemedi.');
        }
    };

    const handleDeleteMedia = async (id) => {
        if (!window.confirm('Bu medyayı silmek istediğine emin misin?')) return;
        try {
            await removeMedia(id);
        } catch (e) { console.error(e); }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm('Bu paylaşımı silmek istediğine emin misin?')) return;
        try {
            await deletePost(id);
            setPosts(prev => prev.filter(p => p.id !== id));
        } catch (e) { console.error(e); }
    };

    const tabs = [
        { id: 'overview', label: '📊 Genel Bakış', icon: '📊' },
        { id: 'users', label: '👥 Kullanıcılar', icon: '👥' },
        { id: 'content', label: '📝 İçerikler', icon: '📝' },
    ];

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h2 className="section-title" style={{ fontSize: '1.4rem' }}>👑 Admin Paneli</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                    Siteyi buradan yönetebilirsin
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="admin-tabs">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        className={`admin-tab ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* OVERVIEW TAB */}
            {tab === 'overview' && (
                <div className="admin-content animate-fade-in">
                    <div className="admin-stats-grid">
                        <div className="admin-stat-card">
                            <div className="admin-stat-icon">👥</div>
                            <div className="admin-stat-value">{totalUsers}</div>
                            <div className="admin-stat-label">Toplam Üye</div>
                        </div>
                        <div className="admin-stat-card">
                            <div className="admin-stat-icon">🟢</div>
                            <div className="admin-stat-value">{onlineUsers.length}</div>
                            <div className="admin-stat-label">Çevrimiçi</div>
                        </div>
                        <div className="admin-stat-card">
                            <div className="admin-stat-icon">📦</div>
                            <div className="admin-stat-value">{totalMedia}</div>
                            <div className="admin-stat-label">Toplam Medya</div>
                        </div>
                        <div className="admin-stat-card">
                            <div className="admin-stat-icon">💬</div>
                            <div className="admin-stat-value">{totalPosts}</div>
                            <div className="admin-stat-label">Toplam Paylaşım</div>
                        </div>
                    </div>

                    {/* Media Type Breakdown */}
                    <div className="admin-section-card">
                        <h3 className="admin-section-title">📊 Medya Dağılımı</h3>
                        <div className="admin-type-grid">
                            {Object.entries(MEDIA_TYPES).map(([key, val]) => (
                                <div key={key} className="admin-type-item">
                                    <span className="admin-type-icon">{val.icon}</span>
                                    <span className="admin-type-label">{val.label}</span>
                                    <span className="admin-type-count">{mediaByType[key] || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Online Users */}
                    <div className="admin-section-card">
                        <h3 className="admin-section-title">🟢 Çevrimiçi Kullanıcılar</h3>
                        {onlineUsers.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Şu an çevrimiçi kimse yok.</p>
                        ) : (
                            <div className="admin-online-list">
                                {onlineUsers.map(u => (
                                    <div key={u.uid} className="admin-online-user" onClick={() => onNavigate?.(`user-${u.uid}`)}>
                                        <span className="admin-user-avatar">{u.avatar || '🧑‍💻'}</span>
                                        <span>{u.displayName}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* USERS TAB */}
            {tab === 'users' && (
                <div className="admin-content animate-fade-in">
                    <div className="admin-search-bar">
                        <input
                            type="text"
                            placeholder="🔍 Kullanıcı ara..."
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                        />
                    </div>
                    <div className="admin-user-list">
                        {filteredUsers.map(u => {
                            const userMediaCount = mediaItems.filter(m => m.userId === u.uid).length;
                            const userPostCount = posts.filter(p => p.userId === u.uid).length;
                            const isOnline = u.lastSeen && ((new Date() - (u.lastSeen.toDate ? u.lastSeen.toDate() : new Date(u.lastSeen))) / 1000 < 5 * 60);
                            const isAdminUser = u.email === 'acarliyigit@gmail.com';

                            return (
                                <div key={u.uid} className="admin-user-card">
                                    <div className="admin-user-card-header">
                                        <div className="admin-user-card-avatar-wrap">
                                            <span className="admin-user-card-avatar">{u.avatar || '🧑‍💻'}</span>
                                            <span className={`admin-user-status ${isOnline ? 'online' : ''}`} />
                                        </div>
                                        <div className="admin-user-card-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span className="admin-user-card-name" onClick={() => onNavigate?.(`user-${u.uid}`)}>{u.displayName}</span>
                                                {isAdminUser && <span className="user-profile-title-badge admin-badge" style={{ fontSize: '0.55rem', padding: '2px 6px' }}>👑 Admin</span>}
                                            </div>
                                            <span className="admin-user-card-email">{u.email}</span>
                                        </div>
                                    </div>
                                    <div className="admin-user-card-stats">
                                        <span>📦 {userMediaCount} medya</span>
                                        <span>💬 {userPostCount} paylaşım</span>
                                        <span>👥 {(u.friends || []).length} arkadaş</span>
                                    </div>
                                    <div className="admin-user-card-title-row">
                                        {editingTitle === u.uid ? (
                                            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                                                <input
                                                    type="text"
                                                    value={newTitle}
                                                    onChange={(e) => setNewTitle(e.target.value)}
                                                    placeholder="Yeni unvan..."
                                                    style={{ flex: 1, fontSize: '0.82rem', padding: '6px 10px' }}
                                                />
                                                <button className="btn btn-primary btn-sm" onClick={() => handleChangeTitle(u.uid)}>✓</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingTitle(null)}>✕</button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="user-profile-title-badge" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                                    {u.title || 'Çaylak Üye'}
                                                </span>
                                                <button
                                                    className="admin-edit-title-btn"
                                                    onClick={() => { setEditingTitle(u.uid); setNewTitle(u.title || ''); }}
                                                    title="Unvan Değiştir"
                                                >
                                                    ✏️
                                                </button>
                                                <select
                                                    className="admin-quick-title-select"
                                                    value=""
                                                    onChange={async (e) => {
                                                        if (!e.target.value) return;
                                                        try {
                                                            await updateDoc(doc(db, 'users', u.uid), { title: e.target.value });
                                                        } catch (err) { console.error(err); }
                                                    }}
                                                >
                                                    <option value="">Hızlı Seç...</option>
                                                    {FUNNY_TITLES.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CONTENT TAB */}
            {tab === 'content' && (
                <div className="admin-content animate-fade-in">
                    <h3 className="admin-section-title" style={{ marginBottom: 16 }}>📝 Son Paylaşımlar</h3>
                    {posts.slice(0, 20).map(p => {
                        const author = allUsers[p.userId];
                        return (
                            <div key={p.id} className="admin-content-item">
                                <div className="admin-content-item-header">
                                    <span>{author?.avatar || '🧑‍💻'}</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{author?.displayName || 'Bilinmeyen'}</span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        {p.visibility === 'public' ? '🌍' : p.visibility === 'private' ? '🔒' : '👥'}
                                    </span>
                                    <button className="admin-delete-btn" onClick={() => handleDeletePost(p.id)} title="Sil">🗑️</button>
                                </div>
                                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                                    {p.content?.length > 200 ? p.content.slice(0, 200) + '...' : p.content}
                                </p>
                            </div>
                        );
                    })}

                    <h3 className="admin-section-title" style={{ marginTop: 24, marginBottom: 16 }}>📦 Son Medyalar</h3>
                    {mediaItems.slice(0, 20).map(m => {
                        const author = allUsers[m.userId];
                        const typeInfo = MEDIA_TYPES[m.type] || MEDIA_TYPES.movie;
                        return (
                            <div key={m.id} className="admin-content-item">
                                <div className="admin-content-item-header">
                                    <span>{author?.avatar || '🧑‍💻'}</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{author?.displayName || 'Bilinmeyen'}</span>
                                    <span style={{ fontSize: '0.78rem', color: typeInfo.color, marginLeft: 8 }}>{typeInfo.icon} {m.title}</span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        {m.visibility === 'public' ? '🌍' : m.visibility === 'private' ? '🔒' : '👥'}
                                    </span>
                                    <button className="admin-delete-btn" onClick={() => handleDeleteMedia(m.id)} title="Sil">🗑️</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

