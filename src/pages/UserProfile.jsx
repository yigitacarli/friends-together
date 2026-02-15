import { useState, useEffect } from 'react';
import { useMedia } from '../context/MediaContext';
import { MEDIA_TYPES } from '../services/storage';
import { getCategoryCounts, getAverageRating } from '../services/stats';
import MediaCard from '../components/MediaCard';

export default function UserProfile({ userId, userName, userAvatar, onViewDetail }) {
    const { getByUser, loading } = useMedia();
    const [filter, setFilter] = useState('all');

    const userItems = getByUser(userId);
    const counts = getCategoryCounts(userItems);
    const avgRating = getAverageRating(userItems);

    const filtered = filter === 'all'
        ? userItems
        : userItems.filter(i => i.type === filter);

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>⏳</div>
                <h3 className="empty-state-title">Yükleniyor...</h3>
            </div>
        );
    }

    return (
        <div className="user-profile-page">
            <div className="user-profile-hero">
                <div className="user-profile-avatar">{userAvatar || '🧑‍💻'}</div>
                <h2 className="user-profile-name">{userName || 'Kullanıcı'}</h2>
                <div className="user-profile-stats">
                    <div className="user-profile-stat">
                        <span className="user-profile-stat-value">{counts.total}</span>
                        <span className="user-profile-stat-label">Medya</span>
                    </div>
                    <div className="user-profile-stat">
                        <span className="user-profile-stat-value">{avgRating || '-'}</span>
                        <span className="user-profile-stat-label">Ort. Puan</span>
                    </div>
                    {Object.entries(MEDIA_TYPES).map(([key, val]) => (
                        counts[key] > 0 ? (
                            <div className="user-profile-stat" key={key}>
                                <span className="user-profile-stat-value">{val.icon} {counts[key]}</span>
                                <span className="user-profile-stat-label">{val.label}</span>
                            </div>
                        ) : null
                    ))}
                </div>
            </div>

            <div className="user-profile-filter">
                <button
                    className={`feed-type-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    📦 Tümü ({counts.total})
                </button>
                {Object.entries(MEDIA_TYPES).map(([key, val]) => (
                    counts[key] > 0 ? (
                        <button
                            key={key}
                            className={`feed-type-btn ${filter === key ? 'active' : ''}`}
                            onClick={() => setFilter(key)}
                        >
                            {val.icon} {val.label} ({counts[key]})
                        </button>
                    ) : null
                ))}
            </div>

            {filtered.length > 0 ? (
                <div className="media-grid">
                    {filtered.map(item => (
                        <MediaCard key={item.id} item={item} onClick={() => onViewDetail(item.id)} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3 className="empty-state-title">Henüz bir şey eklenmemiş</h3>
                </div>
            )}
        </div>
    );
}
