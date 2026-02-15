import { useState, useMemo } from 'react';
import { getAllMedia, getMediaByType, MEDIA_TYPES, STATUS_TYPES } from '../services/storage';
import MediaCard from '../components/MediaCard';

export default function MediaList({ type, searchQuery, onViewDetail }) {
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterRating, setFilterRating] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');
    const [view, setView] = useState('grid');

    const typeInfo = MEDIA_TYPES[type];

    const items = useMemo(() => {
        let data = type ? getMediaByType(type) : getAllMedia();

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.review?.toLowerCase().includes(q) ||
                i.tags?.some(t => t.toLowerCase().includes(q))
            );
        }

        // Status filter
        if (filterStatus !== 'all') {
            data = data.filter(i => i.status === filterStatus);
        }

        // Rating filter
        if (filterRating !== 'all') {
            const r = parseInt(filterRating);
            data = data.filter(i => i.rating === r);
        }

        // Sort
        switch (sortBy) {
            case 'date-desc':
                data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                break;
            case 'date-asc':
                data.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
                break;
            case 'rating-desc':
                data.sort((a, b) => b.rating - a.rating);
                break;
            case 'rating-asc':
                data.sort((a, b) => a.rating - b.rating);
                break;
            case 'title-asc':
                data.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
                break;
            case 'title-desc':
                data.sort((a, b) => b.title.localeCompare(a.title, 'tr'));
                break;
        }

        return data;
    }, [type, searchQuery, filterStatus, filterRating, sortBy]);

    const LABELS = {
        book: 'Kitaplar',
        movie: 'Filmler',
        game: 'Oyunlar',
        series: 'Diziler',
        anime: 'Animeler',
        music: 'Müzikler',
    };

    const pageTitle = type ? `${typeInfo?.icon || ''} ${LABELS[type] || type}` : '📖 Tüm Medyalar';

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title" style={{ fontSize: '1.4rem' }}>{pageTitle}</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{items.length} öğe</span>
            </div>

            {/* Controls */}
            <div className="media-list-controls">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">Tüm Durumlar</option>
                    {Object.entries(STATUS_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>

                <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
                    <option value="all">Tüm Puanlar</option>
                    {[5, 4, 3, 2, 1].map(r => (
                        <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>
                    ))}
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="date-desc">Tarihe Göre (Yeni → Eski)</option>
                    <option value="date-asc">Tarihe Göre (Eski → Yeni)</option>
                    <option value="rating-desc">Puana Göre (Yüksek → Düşük)</option>
                    <option value="rating-asc">Puana Göre (Düşük → Yüksek)</option>
                    <option value="title-asc">İsme Göre (A → Z)</option>
                    <option value="title-desc">İsme Göre (Z → A)</option>
                </select>

                <div className="view-toggle">
                    <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>▦</button>
                    <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>☰</button>
                </div>
            </div>

            {/* Items */}
            {items.length > 0 ? (
                view === 'grid' ? (
                    <div className="media-grid">
                        {items.map(item => (
                            <MediaCard key={item.id} item={item} onClick={() => onViewDetail(item.id)} view="grid" />
                        ))}
                    </div>
                ) : (
                    <div className="media-list-view">
                        {items.map(item => (
                            <MediaCard key={item.id} item={item} onClick={() => onViewDetail(item.id)} view="list" />
                        ))}
                    </div>
                )
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">{typeInfo?.icon || '📭'}</div>
                    <h3 className="empty-state-title">
                        {searchQuery ? 'Sonuç bulunamadı' : 'Henüz bir şey eklenmemiş'}
                    </h3>
                    <p className="empty-state-text">
                        {searchQuery
                            ? 'Farklı bir arama terimi deneyin.'
                            : '"Yeni Ekle" butonuyla ilk medyanı ekleyebilirsin!'}
                    </p>
                </div>
            )}
        </div>
    );
}
