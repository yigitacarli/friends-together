import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/storage';
import { sendFriendRequest, getFriendStatus, removeFriendRequest, acceptFriendRequest } from '../services/friends';

export default function Community() {
    const { user, profile: myProfile, getUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // id of user being acted upon

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const all = await getAllUsers();
        setUsers(all);
        setLoading(false);
    };

    const handleSend = async (targetUserId) => {
        setActionLoading(targetUserId);
        try {
            await sendFriendRequest(user.uid, myProfile, targetUserId);
            // Refresh logic handled by realtime listeners usually, but for instant UI feedback we force update or rely on getUser
        } catch (e) {
            console.error(e);
            alert('Hata oluştu');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="empty-state">Yükleniyor...</div>;

    const otherUsers = users.filter(u => u.id !== user.uid);

    return (
        <div className="collection-page">
            <div className="feed-header">
                <h2 className="section-title">🌐 Topluluk</h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {otherUsers.length} Kişi
                </div>
            </div>

            <div className="feed-list">
                {otherUsers.map(u => {
                    const myData = getUser(user.uid);
                    const status = getFriendStatus(myData, u.id); // 'none', 'sent', 'received', 'friends'

                    let actionBtn = null;
                    if (status === 'none') {
                        actionBtn = (
                            <button className="btn btn-primary btn-sm" onClick={() => handleSend(u.id)} disabled={actionLoading === u.id}>
                                {actionLoading === u.id ? '...' : '➕ Ekle'}
                            </button>
                        );
                    } else if (status === 'sent') {
                        actionBtn = <button className="btn btn-secondary btn-sm" disabled>⏳ Gönderildi</button>;
                    } else if (status === 'friends') {
                        actionBtn = <button className="btn btn-secondary btn-sm" disabled>🤝 Arkadaşsınız</button>;
                    } else if (status === 'received') {
                        // On community page, maybe just direct to profile? Or allow accept here.
                        // Let's keep it simple: "See Request" or Redirect
                        actionBtn = <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>📩 İsteği Var</span>;
                    }

                    return (
                        <div key={u.id} className="post-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className="feed-avatar" style={{ fontSize: '1.5rem', width: 48, height: 48 }}>{u.avatar || '🧑‍💻'}</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {u.displayName}
                                        {/* Admin Check visually */}
                                        {u.email === 'acarliyigit@gmail.com' && (
                                            <span className="user-profile-title-badge admin-badge" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>👑 Admin</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.title || 'Çaylak Üye'}</div>
                                </div>
                            </div>
                            <div>
                                {actionBtn}
                            </div>
                        </div>
                    );
                })}
                {otherUsers.length === 0 && (
                    <div className="empty-state">
                        <p>Henüz kimse yok. Arkadaşlarını davet et!</p>
                        <p style={{ marginTop: 8, fontWeight: 700 }}>Davet Kodu: TRACKER2026</p>
                    </div>
                )}
            </div>
        </div>
    );
}
