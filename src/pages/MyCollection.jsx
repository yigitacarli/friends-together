import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMedia } from '../context/MediaContext';
import { MEDIA_TYPES, STATUS_TYPES } from '../services/storage';
import MediaCard from '../components/MediaCard';

export default function MyCollection({ onViewDetail }) {
    const { user, profile } = useAuth();
    const { items, loading } = useMedia();
    const [activeType, setActiveType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');
    const [view, setView] = useState('grid');

    const myItems = useMemo(() => {
        if (!user) return [];
        return items.filter(i => i.userId === user.uid);
    }, [items, user]);

    const filtered = useMemo(() => {
        let data = activeType === 'all' ? [...myItems] : myItems.filter(i => i.type === activeType);
        if (filterStatus !== 'all') data = data.filter(i => i.status === filterStatus);

        switch (sortBy) {
            case 'date-desc': data.sort((a, b) => (b.date || '').localeCompare(a.date || '')); break;
            case 'date-asc': data.sort((a, b) => (a.date || '').localeCompare(b.date || '')); break;
            case 'rating-desc': data.sort((a, b) => b.rating - a.rating); break;
            case 'title-asc': data.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'tr')); break;
        }
        return data;
    }, [myItems, activeType, filterStatus, sortBy]);

    // Category counts
    const counts = useMemo(() => {
        const c = { total: myItems.length };
        Object.keys(MEDIA_TYPES).forEach(k => { c[k] = myItems.filter(i => i.type === k).length; });
        return c;
    }, [myItems]);

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>⏳</div>
                <h3 className="empty-state-title">Yükleniyor...</h3>
            </div>
        );
    }

    return (
        <div className="collection-page">
            {/* Profile hero */}
            <div className="user-profile-hero">
                <div className="user-profile-avatar">{profile?.avatar || '🧑‍💻'}</div>
                <h2 className="user-profile-name">{profile?.displayName || 'Ben'}</h2>
                <div className="user-profile-stats">
                    <div className="user-profile-stat">
                        <span className="user-profile-stat-value">{counts.total}</span>
                        <span className="user-profile-stat-label">Toplam</span>
                    </div>
                    {Object.entries(MEDIA_TYPES).map(([key, val]) =>
                        counts[key] > 0 ? (
                            <div className="user-profile-stat" key={key}>
                                <span className="user-profile-stat-value">{val.icon} {counts[key]}</span>
                                <span className="user-profile-stat-label">{val.label}</span>
                            </div>
                        ) : null
                    )}
                </div>
            </div>

            {/* Category tabs */}
            <div className="collection-tabs">
                <button className={`collection-tab ${activeType === 'all' ? 'active' : ''}`} onClick={() => setActiveType('all')}>
                    📦 Tümü ({counts.total})
                </button>
                {Object.entries(MEDIA_TYPES).map(([key, val]) =>
                    counts[key] > 0 ? (
                        <button key={key} className={`collection-tab ${activeType === key ? 'active' : ''}`} onClick={() => setActiveType(key)}>
                            {val.icon} {val.label} ({counts[key]})
                        </button>
                    ) : null
                )}
            </div>

            {/* Controls */}
            <div className="media-list-controls">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">Tüm Durumlar</option>
                    {Object.entries(STATUS_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="date-desc">Yeni → Eski</option>
                    <option value="date-asc">Eski → Yeni</option>
                    <option value="rating-desc">Puan (Yüksek)</option>
                    <option value="title-asc">İsim (A-Z)</option>
                </select>
                <div className="view-toggle">
                    <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>▦</button>
                    <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>☰</button>
                </div>
            </div>

            {/* Items */}
            {filtered.length > 0 ? (
                <div className={view === 'grid' ? 'media-grid' : 'media-list-view'}>
                    {filtered.map(item => (
                        <MediaCard key={item.id} item={item} onClick={() => onViewDetail(item.id)} view={view} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3 className="empty-state-title">
                        {activeType !== 'all' ? `Henüz ${MEDIA_TYPES[activeType]?.label || ''} eklenmemiş` : 'Koleksiyonun boş'}
                    </h3>
                    <p className="empty-state-text">+ Yeni Ekle butonuyla koleksiyonunu oluşturmaya başla!</p>
                </div>
            )}
        </div>
    );
}
