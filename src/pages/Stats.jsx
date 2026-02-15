import { getCategoryDistribution, getStatusDistribution, getAverageRatingByType, getMonthlyActivity } from '../services/stats';
import { MEDIA_TYPES, STATUS_TYPES } from '../services/storage';
import { getCategoryCounts } from '../services/stats';

export default function Stats() {
    const distribution = getCategoryDistribution();
    const statusDist = getStatusDistribution();
    const avgByType = getAverageRatingByType();
    const monthly = getMonthlyActivity();
    const counts = getCategoryCounts();

    const maxCount = Math.max(...distribution.map(d => d.count), 1);
    const totalStatus = Object.values(statusDist).reduce((a, b) => a + b, 0) || 1;
    const maxMonthly = Math.max(...monthly.map(m => m.count), 1);

    if (counts.total === 0) {
        return (
            <div>
                <h2 className="section-title" style={{ fontSize: '1.4rem', marginBottom: 24 }}>📊 İstatistikler</h2>
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h3 className="empty-state-title">Henüz veri yok</h3>
                    <p className="empty-state-text">İstatistikleri görmek için medya eklemeye başla!</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="section-title" style={{ fontSize: '1.4rem', marginBottom: 24 }}>📊 İstatistikler</h2>

            <div className="stats-page-grid">
                {/* Category Distribution */}
                <div className="stats-chart-card">
                    <h3 className="stats-chart-title">Kategori Dağılımı</h3>
                    {distribution.map(d => (
                        <div key={d.type} className="stats-bar">
                            <span className="stats-bar-label">{d.icon} {d.label}</span>
                            <div className="stats-bar-track">
                                <div
                                    className="stats-bar-fill"
                                    style={{
                                        width: `${(d.count / maxCount) * 100}%`,
                                        background: d.color,
                                    }}
                                >
                                    <span className="stats-bar-value">{d.count}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Status Distribution */}
                <div className="stats-chart-card">
                    <h3 className="stats-chart-title">Durum Dağılımı</h3>
                    {Object.entries(STATUS_TYPES).map(([key, val]) => (
                        <div key={key} className="stats-bar">
                            <span className="stats-bar-label">{val.label}</span>
                            <div className="stats-bar-track">
                                <div
                                    className="stats-bar-fill"
                                    style={{
                                        width: `${(statusDist[key] / totalStatus) * 100}%`,
                                        background: val.color,
                                    }}
                                >
                                    <span className="stats-bar-value">{statusDist[key]}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Average Rating by Type */}
                <div className="stats-chart-card">
                    <h3 className="stats-chart-title">Kategori Bazlı Ort. Puan</h3>
                    {Object.entries(MEDIA_TYPES).map(([key, val]) => (
                        <div key={key} className="stats-bar">
                            <span className="stats-bar-label">{val.icon} {val.label}</span>
                            <div className="stats-bar-track">
                                <div
                                    className="stats-bar-fill"
                                    style={{
                                        width: `${(avgByType[key] / 5) * 100}%`,
                                        background: val.color,
                                    }}
                                >
                                    <span className="stats-bar-value">
                                        {avgByType[key] > 0 ? `${avgByType[key]} ★` : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Monthly Activity */}
                {monthly.length > 0 && (
                    <div className="stats-chart-card">
                        <h3 className="stats-chart-title">Aylık Aktivite</h3>
                        {monthly.map(m => (
                            <div key={m.month} className="stats-bar">
                                <span className="stats-bar-label">{m.label}</span>
                                <div className="stats-bar-track">
                                    <div
                                        className="stats-bar-fill"
                                        style={{
                                            width: `${(m.count / maxMonthly) * 100}%`,
                                            background: 'var(--accent-gradient)',
                                        }}
                                    >
                                        <span className="stats-bar-value">{m.count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
