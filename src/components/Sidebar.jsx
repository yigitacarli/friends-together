import { useMedia } from '../context/MediaContext';
import { MEDIA_TYPES } from '../services/storage';
import { getCategoryCounts } from '../services/stats';

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
    const counts = getCategoryCounts(items);

    return (
        <>
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">📋</div>
                    <h1>MediaTracker</h1>
                </div>
                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">Ana Menü</div>
                    <div
                        className={`sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                        onClick={() => onNavigate('dashboard')}
                    >
                        <span className="sidebar-link-icon">🏠</span>
                        <span>Dashboard</span>
                    </div>

                    <div className="sidebar-section-title" style={{ marginTop: 12 }}>Kategoriler</div>
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
                </nav>
            </aside>
        </>
    );
}
