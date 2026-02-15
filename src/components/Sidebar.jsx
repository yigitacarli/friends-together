import { MEDIA_TYPES } from '../services/storage';
import { getCategoryCounts } from '../services/stats';

const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
];

const CATEGORY_ITEMS = Object.keys(MEDIA_TYPES).map(key => ({
    key,
    label: MEDIA_TYPES[key].label + 'lar',
    icon: MEDIA_TYPES[key].icon,
    type: key,
}));

// Turkish plural fix
const LABELS = {
    book: 'Kitaplar',
    movie: 'Filmler',
    game: 'Oyunlar',
    series: 'Diziler',
    anime: 'Animeler',
    music: 'Müzikler',
};

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle }) {
    const counts = getCategoryCounts();

    return (
        <>
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 99,
                        display: 'none',
                    }}
                    onClick={onToggle}
                />
            )}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">📋</div>
                    <h1>MediaTracker</h1>
                </div>
                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">Ana Menü</div>
                    {NAV_ITEMS.map(item => (
                        <div
                            key={item.key}
                            className={`sidebar-link ${currentPage === item.key ? 'active' : ''}`}
                            onClick={() => onNavigate(item.key)}
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}

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
