import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/storage';
import { sendFriendRequest, getFriendStatus, cancelFriendRequest } from '../services/friends';

export default function Community({ onNavigate }) {
    const { user, profile: myProfile, getUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

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
        } catch (e) {
            console.error(e);
            alert('Hata oluştu');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (targetUserId) => {
        if (!window.confirm('Arkadaşlık isteğini iptal etmek istiyor musun?')) return;
        setActionLoading(targetUserId);
        try {
            await cancelFriendRequest(user.uid, targetUserId);
        } catch (e) {
            console.error(e);
            alert('İptal edilemedi');
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
                    const status = getFriendStatus(myData, u.id);
                    const isAdminUser = u.email === 'acarliyigit@gmail.com';

                    let actionBtn = null;
                    if (status === 'none') {
                        actionBtn = (
                            <button className="btn btn-primary btn-sm" onClick={() => handleSend(u.id)} disabled={actionLoading === u.id}>
                                {actionLoading === u.id ? '...' : '➕ Ekle'}
                            </button>
                        );
                    } else if (status === 'sent') {
                        actionBtn = (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleCancel(u.id)} disabled={actionLoading === u.id} style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                                {actionLoading === u.id ? '...' : 'İptal Et'}
                            </button>
                        );
                    } else if (status === 'friends') {
                        actionBtn = <span className="status-badge completed" style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>🤝 Arkadaşsınız</span>;
                    } else if (status === 'received') {
                        actionBtn = <button className="btn btn-primary btn-sm" onClick={() => onNavigate(`user-${u.id}`)}>📩 İsteği Gör</button>;
                    }

                    return (
                        <div key={u.id} className="post-card"
                            onClick={() => onNavigate(`user-${u.id}`)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px 20px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className="feed-avatar" style={{ fontSize: '1.5rem', width: 48, height: 48 }}>{u.avatar || '🧑‍💻'}</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {u.displayName}
                                        <span className={`user-profile-title-badge ${isAdminUser ? 'admin-badge' : ''}`} style={{ fontSize: '0.65rem', padding: '2px 6px', marginTop: 0 }}>
                                            {isAdminUser ? '👑 Admin' : (u.title || 'Çaylak Üye')}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {status === 'friends' ? 'Arkadaş' : 'Kullanıcı'}
                                    </div>
                                </div>
                            </div>
                            <div onClick={e => e.stopPropagation()}>
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
