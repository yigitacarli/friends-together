import { useMedia } from '../context/MediaContext';
import { getCategoryCounts, getCategoryDistribution, getRecentMedia, getTopRated, getAverageRating } from '../services/stats';
import MediaCard from '../components/MediaCard';

export default function Dashboard({ onNavigate, onViewDetail }) {
    const { items, loading } = useMedia();
    const counts = getCategoryCounts(items);
    const distribution = getCategoryDistribution(items);
    const recent = getRecentMedia(items, 6);
    const topRated = getTopRated(items, 6);
    const avgRating = getAverageRating(items);

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>⏳</div>
                <h3 className="empty-state-title">Yükleniyor...</h3>
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-greeting">
                <h2>Hoş Geldin! 👋</h2>
                <p>Medya kütüphaneni buradan takip edebilirsin.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card" style={{ animationDelay: '0s' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0', background: 'var(--accent-gradient)' }} />
                    <div className="stat-card-icon">📦</div>
                    <div className="stat-card-value">{counts.total}</div>
                    <div className="stat-card-label">Toplam Medya</div>
                </div>
                {distribution.filter(d => d.count > 0).map((d, i) => (
                    <div
                        key={d.type}
                        className="stat-card"
                        style={{ animationDelay: `${(i + 1) * 0.08}s`, cursor: 'pointer' }}
                        onClick={() => onNavigate(d.type)}
                    >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0', background: d.color }} />
                        <div className="stat-card-icon">{d.icon}</div>
                        <div className="stat-card-value">{d.count}</div>
                        <div className="stat-card-label">{d.label}</div>
                    </div>
                ))}
                {counts.total > 0 && (
                    <div className="stat-card" style={{ animationDelay: '0.5s' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0', background: 'var(--star-filled)' }} />
                        <div className="stat-card-icon">⭐</div>
                        <div className="stat-card-value">{avgRating}</div>
                        <div className="stat-card-label">Ort. Puan</div>
                    </div>
                )}
            </div>

            {recent.length > 0 && (
                <div className="section">
                    <div className="section-header">
                        <h3 className="section-title">🕐 Son Eklenenler</h3>
                    </div>
                    <div className="media-grid">
                        {recent.map(item => (
                            <MediaCard key={item.id} item={item} onClick={() => onViewDetail(item.id)} />
                        ))}
                    </div>
                </div>
            )}

            {topRated.length > 0 && (
                <div className="section">
                    <div className="section-header">
                        <h3 className="section-title">🏆 En Yüksek Puanlılar</h3>
                    </div>
                    <div className="media-grid">
                        {topRated.map(item => (
                            <MediaCard key={item.id} item={item} onClick={() => onViewDetail(item.id)} />
                        ))}
                    </div>
                </div>
            )}

            {counts.total === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3 className="empty-state-title">Henüz bir şey eklenmemiş</h3>
                    <p className="empty-state-text">
                        İlk medyanı eklemek için yukarıdaki "Yeni Ekle" butonuna tıkla!
                    </p>
                </div>
            )}
        </div>
    );
}
