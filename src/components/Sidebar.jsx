import { useState, useEffect } from 'react';
import { useMedia } from '../context/MediaContext';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/storage';

export default function Sidebar({ currentPage, onNavigate, isOpen }) {
    const { items } = useMedia();
    const { user, profile, isLoggedIn } = useAuth();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        getAllUsers().then(setUsers);
    }, []);

    const otherUsers = users.filter(u => u.id !== user?.uid);
    const myCount = isLoggedIn ? items.filter(i => i.userId === user?.uid).length : 0;

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* User info */}
            {profile ? (
                <div className="sidebar-user" onClick={() => onNavigate('my-profile')}>
                    <span className="sidebar-user-avatar">{profile.avatar}</span>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{profile.displayName}</span>
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
                        <div className="sidebar-section-title" style={{ marginTop: 12 }}>Arkadaşlar</div>
                        {otherUsers.map(u => (
                            <div
                                key={u.id}
                                className={`sidebar-link ${currentPage === `user-${u.id}` ? 'active' : ''}`}
                                onClick={() => onNavigate(`user-${u.id}`)}
                            >
                                <span className="sidebar-link-icon">{u.avatar || '🧑‍💻'}</span>
                                <span>{u.displayName}</span>
                            </div>
                        ))}
                    </>
                )}
            </nav>
        </aside>
    );
}
