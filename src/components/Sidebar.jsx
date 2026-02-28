import { useState, useEffect } from 'react';
import { useMedia } from '../context/MediaContext';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/storage';

function SidebarLink({ active, onClick, icon, label, extra, className = '' }) {
    return (
        <button
            type="button"
            className={`sidebar-link ${active ? 'active' : ''} ${className}`.trim()}
            onClick={onClick}
        >
            <span className="sidebar-link-icon" aria-hidden="true">{icon}</span>
            <span className="sidebar-link-label">{label}</span>
            {extra}
        </button>
    );
}

export default function Sidebar({ currentPage, onNavigate, isOpen, onEditProfile }) {
    const { items } = useMedia();
    const { user, profile, isLoggedIn, isOnline, getUser, isAdmin } = useAuth();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        getAllUsers().then(setUsers);
    }, [items, user]);

    const members = users.filter((member) => member.id !== user?.uid);
    const myFriends = profile?.friends || [];
    const myCount = isLoggedIn ? items.filter((item) => item.userId === user?.uid).length : 0;

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
                <button type="button" className="sidebar-brand" onClick={() => onNavigate('feed')}>
                    <span className="sidebar-logo-icon" aria-hidden="true">FT</span>
                    <span className="sidebar-brand-title">Friends Together</span>
                </button>
            </div>

            {profile ? (
                <div className="sidebar-user">
                    <button
                        type="button"
                        className="sidebar-user-avatar-btn"
                        onClick={() => onNavigate('my-profile')}
                        aria-label="Profilime git"
                    >
                        <span className="sidebar-user-avatar">{profile.avatar}</span>
                    </button>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-main">
                            <button
                                type="button"
                                className="sidebar-user-name"
                                onClick={() => onNavigate('my-profile')}
                            >
                                {profile.displayName}
                            </button>
                            <button
                                type="button"
                                className="sidebar-edit-icon"
                                onClick={onEditProfile}
                                title="Profili Duzenle"
                                aria-label="Profili duzenle"
                            >
                                ⚙
                            </button>
                        </div>
                        <span className="sidebar-user-email sidebar-user-meta">
                            {profile.title || 'Uye'}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="sidebar-user">
                    <span className="sidebar-user-avatar">👀</span>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">Misafir</span>
                        <span className="sidebar-user-email">Sadece goruntuleme</span>
                    </div>
                </div>
            )}

            <nav className="sidebar-nav" aria-label="Ana menu">
                <div className="sidebar-section-title">Ana Menu</div>

                <SidebarLink
                    active={currentPage === 'feed'}
                    onClick={() => onNavigate('feed')}
                    icon="🏠"
                    label="Akis"
                />

                <SidebarLink
                    active={currentPage === 'events'}
                    onClick={() => onNavigate('events')}
                    icon="📅"
                    label="Etkinlikler"
                />

                <SidebarLink
                    active={currentPage === 'community'}
                    onClick={() => onNavigate('community')}
                    icon="🌐"
                    label="Topluluk"
                />

                <SidebarLink
                    active={currentPage === 'lobby'}
                    onClick={() => onNavigate('lobby')}
                    icon="💬"
                    label="Meydan (Chat)"
                />

                {profile?.nsfwAccess && (
                    <SidebarLink
                        active={currentPage === 'nsfw-lobby'}
                        onClick={() => onNavigate('nsfw-lobby')}
                        icon="🔞"
                        label="+18 Sohbet"
                        className="sidebar-link-nsfw"
                    />
                )}

                {isLoggedIn && (
                    <SidebarLink
                        active={currentPage === 'my-profile'}
                        onClick={() => onNavigate('my-profile')}
                        icon="📦"
                        label="Koleksiyonum"
                        extra={myCount > 0 ? <span className="sidebar-link-count">{myCount}</span> : null}
                    />
                )}

                <SidebarLink
                    active={currentPage === 'stats'}
                    onClick={() => onNavigate('stats')}
                    icon="📊"
                    label="Istatistikler"
                />

                {isAdmin && (
                    <SidebarLink
                        active={currentPage === 'admin'}
                        onClick={() => onNavigate('admin')}
                        icon="👑"
                        label="Admin Paneli"
                        className="sidebar-link-admin"
                    />
                )}

                {members.length > 0 && (
                    <>
                        <div className="sidebar-section-title sidebar-members-title">Uyeler ({members.length})</div>
                        {members.map((member) => {
                            const online = isOnline(member.id);
                            const isFriend = myFriends.includes(member.id);
                            const memberData = getUser(member.id) || member;
                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    className={`sidebar-link ${currentPage === `user-${member.id}` ? 'active' : ''}`}
                                    onClick={() => onNavigate(`user-${member.id}`)}
                                >
                                    <span className="sidebar-member-avatar-wrap">
                                        <span className="sidebar-link-icon">{memberData.avatar || '🧑'}</span>
                                        <span
                                            className={`sidebar-member-status ${online ? 'online' : 'offline'}`}
                                            title={online ? 'Cevrimici' : 'Cevrimdisi'}
                                        />
                                    </span>
                                    <span className={`sidebar-link-label sidebar-member-name ${isFriend ? 'friend' : ''}`}>
                                        {memberData.displayName}
                                    </span>
                                    {isFriend && <span className="sidebar-friend-badge" title="Arkadasin">🤝</span>}
                                </button>
                            );
                        })}
                    </>
                )}
            </nav>
        </aside>
    );
}
