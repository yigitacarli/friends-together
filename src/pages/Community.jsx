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
                    const joinDate = u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Eski Üye';

                    let actionBtn = null;
                    if (status === 'none') {
                        actionBtn = (
                            <button
                                className="btn btn-primary"
                                onClick={(e) => { e.stopPropagation(); handleSend(u.id); }}
                                disabled={actionLoading === u.id}
                                style={{
                                    width: 48, height: 48, borderRadius: '50%', padding: 0,
                                    fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}
                                title="Arkadaş Ekle"
                            >
                                {actionLoading === u.id ? '...' : '➕'}
                            </button>
                        );
                    } else if (status === 'sent') {
                        actionBtn = (
                            <button
                                className="btn btn-secondary"
                                onClick={(e) => { e.stopPropagation(); handleCancel(u.id); }}
                                disabled={actionLoading === u.id}
                                style={{
                                    width: 48, height: 48, borderRadius: '50%', padding: 0,
                                    fontSize: '1.2rem', color: 'var(--text-muted)', border: '2px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}
                                title="İsteği İptal Et (Bekliyor)"
                            >
                                {actionLoading === u.id ? '...' : '⏳'}
                            </button>
                        );
                    } else if (status === 'friends') {
                        actionBtn = (
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--bg-secondary)', color: 'var(--accent-success)',
                                fontSize: '1.5rem', flexShrink: 0
                            }} title="Arkadaşsınız">
                                🤝
                            </div>
                        );
                    } else if (status === 'received') {
                        actionBtn = (
                            <button
                                className="btn btn-primary"
                                onClick={(e) => { e.stopPropagation(); onNavigate(`user-${u.id}`); }}
                                style={{
                                    width: 48, height: 48, borderRadius: '50%', padding: 0,
                                    fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'var(--accent-primary)', color: 'white',
                                    flexShrink: 0, animation: 'pulse 2s infinite'
                                }}
                                title="İstek Var"
                            >
                                📩
                            </button>
                        );
                    }

                    return (
                        <div key={u.id} className="post-card"
                            onClick={() => onNavigate(`user-${u.id}`)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 16,
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
                            {/* LEFT: Action Button */}
                            <div onClick={e => e.stopPropagation()}>
                                {actionBtn}
                            </div>

                            {/* MIDDLE: Avatar + Info */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                                <span className="feed-avatar" style={{ fontSize: '2rem', width: 60, height: 60 }}>{u.avatar || '🧑‍💻'}</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        {u.displayName}
                                        <span className={`user-profile-title-badge ${isAdminUser ? 'admin-badge' : ''}`} style={{ fontSize: '0.65rem', padding: '2px 6px', marginTop: 0 }}>
                                            {isAdminUser ? '👑 Admin' : (u.title || 'Çaylak Üye')}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        Katılım: {joinDate}
                                    </div>
                                </div>
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
