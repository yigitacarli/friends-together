import { useState, useEffect } from 'react';
import { useMedia } from '../context/MediaContext';
import { useAuth } from '../context/AuthContext';
import { MEDIA_TYPES } from '../services/storage';
import { getCategoryCounts } from '../services/stats';
import { getAllUsers } from '../services/storage';

const LABELS = {
    book: 'Kitaplar',
    movie: 'Filmler',
    game: 'Oyunlar',
    series: 'Diziler',
    anime: 'Animeler',
    music: 'Müzikler',
    software: 'Yazılım',
};

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle }) {
    const { items } = useMedia();
    const { user, profile } = useAuth();
    const [users, setUsers] = useState([]);

    // Get counts from current user's items only for sidebar
    const myItems = user ? items.filter(i => i.userId === user.uid) : items;
    const counts = getCategoryCounts(myItems);

    useEffect(() => {
        getAllUsers().then(setUsers);
    }, []);

    const otherUsers = users.filter(u => u.id !== user?.uid);

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* User avatar in sidebar */}
            {profile && (
                <div className="sidebar-user" onClick={() => onNavigate('my-profile')}>
                    <span className="sidebar-user-avatar">{profile.avatar}</span>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{profile.displayName}</span>
                        <span className="sidebar-user-email">{profile.email}</span>
                    </div>
                </div>
            )}

            <nav className="sidebar-nav">
                <div className="sidebar-section-title">Ana Menü</div>
                <div
                    className={`sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                    onClick={() => onNavigate('dashboard')}
                >
                    <span className="sidebar-link-icon">🏠</span>
                    <span>Dashboard</span>
                </div>
                <div
                    className={`sidebar-link ${currentPage === 'feed' ? 'active' : ''}`}
                    onClick={() => onNavigate('feed')}
                >
                    <span className="sidebar-link-icon">💬</span>
                    <span>Akış</span>
                </div>

                <div className="sidebar-section-title" style={{ marginTop: 12 }}>Kategorilerim</div>
                {Object.keys(MEDIA_TYPES).map(key => (
                    <div
                        key={key}
                        className={`sidebar-link ${currentPage === key ? 'active' : ''}`}
                        onClick={() => onNavigate(key)}
                    >
                        <span className="sidebar-link-icon">{MEDIA_TYPES[key].icon}</span>
                        <span>{LABELS[key]}</span>
                        {counts[key] > 0 && (
                            <span className="sidebar-link-count">{counts[key]}</span>
                        )}
                    </div>
                ))}

                <div className="sidebar-section-title" style={{ marginTop: 12 }}>Diğer</div>
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
