import { useState, useEffect } from 'react';
import { useMedia } from '../context/MediaContext';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/storage';

export default function Sidebar({ currentPage, onNavigate, isOpen, onEditProfile }) {
    const { items } = useMedia();
    const { user, profile, isLoggedIn, isOnline } = useAuth();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        getAllUsers().then(setUsers);
    }, [items, user]); // reload users if items change (active status maybe?)

    const otherUsers = users.filter(u => {
        if (u.id === user?.uid) return false;
        const myData = getUser(user?.uid);
        return myData?.friends?.includes(u.id);
    });
    const myCount = isLoggedIn ? items.filter(i => i.userId === user?.uid).length : 0;

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* User info */}
            {profile ? (
                <div className="sidebar-user">
                    <span className="sidebar-user-avatar" onClick={() => onNavigate('my-profile')}>{profile.avatar}</span>
                    <div className="sidebar-user-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="sidebar-user-name" onClick={() => onNavigate('my-profile')}>{profile.displayName}</span>
                            <button className="sidebar-edit-icon" onClick={onEditProfile} title="Profili Düzenle">⚙️</button>
                        </div>
                        <span className="sidebar-user-email" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                            {profile.title || 'Çaylak Üye'}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="sidebar-user">
                    <span className="sidebar-user-avatar">👀</span>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">Misafir</span>
                        <span className="sidebar-user-email">Sadece görüntüleme</span>
                    </div>
                </div>
            )}

            <nav className="sidebar-nav">
                <div className="sidebar-section-title">Ana Menü</div>

                <div
                    className={`sidebar-link ${currentPage === 'feed' ? 'active' : ''}`}
                    onClick={() => onNavigate('feed')}
                >
                    <span className="sidebar-link-icon">🏠</span>
                    <span>Akış</span>
                </div>

                <div
                    className={`sidebar-link ${currentPage === 'events' ? 'active' : ''}`}
                    onClick={() => onNavigate('events')}
                >
                    <span className="sidebar-link-icon">📅</span>
                    <span>Etkinlikler</span>
                </div>

                <div
                    className={`sidebar-link ${currentPage === 'lobby' ? 'active' : ''}`}
                    onClick={() => onNavigate('lobby')}
                >
                    <span className="sidebar-link-icon">💬</span>
                    <span>Meydan (Chat)</span>
                </div>

                {isLoggedIn && (
                    <div
                        className={`sidebar-link ${currentPage === 'my-profile' ? 'active' : ''}`}
                        onClick={() => onNavigate('my-profile')}
                    >
                        <span className="sidebar-link-icon">📦</span>
                        <span>Koleksiyonum</span>
                        {myCount > 0 && <span className="sidebar-link-count">{myCount}</span>}
                    </div>
                )}

                <div
                    className={`sidebar-link ${currentPage === 'stats' ? 'active' : ''}`}
                    onClick={() => onNavigate('stats')}
                >
                    <span className="sidebar-link-icon">📊</span>
                    <span>İstatistikler</span>
                </div>

                {otherUsers.length > 0 && (
                    <>
                        <div className="sidebar-section-title" style={{ marginTop: 12 }}>
                            Arkadaşlar ({otherUsers.length})
                        </div>
                        {otherUsers.map(u => {
                            const online = isOnline(u.id);
                            return (
                                <div
                                    key={u.id}
                                    className={`sidebar-link ${currentPage === `user-${u.id}` ? 'active' : ''}`}
                                    onClick={() => onNavigate(`user-${u.id}`)}
                                >
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <span className="sidebar-link-icon">{u.avatar || '🧑‍💻'}</span>
                                        <span style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: online ? '#34d399' : '#d1d5db',
                                            border: '2px solid var(--bg-card)',
                                            display: 'block'
                                        }} />
                                    </div>
                                    <span>{u.displayName}</span>
                                </div>
                            );
                        })}
                    </>
                )}
            </nav>
        </aside>
    );
}
