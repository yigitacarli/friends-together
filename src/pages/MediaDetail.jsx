import { useMedia } from '../context/MediaContext';
import { MEDIA_TYPES, STATUS_TYPES, TYPE_EXTRA_FIELDS } from '../services/storage';
import StarRating from '../components/StarRating';

import { useAuth } from '../context/AuthContext';

export default function MediaDetail({ mediaId, onBack, onEdit, onDelete, currentUserId }) {
    const { getById, loading } = useMedia();
    const { isAdmin } = useAuth();
    const item = getById(mediaId);

    if (loading) {
        return (
            <div className="detail-page">
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>⏳</div>
                    <h3 className="empty-state-title">Yükleniyor...</h3>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="detail-page">
                <div className="empty-state">
                    <div className="empty-state-icon">❌</div>
                    <h3 className="empty-state-title">Medya bulunamadı</h3>
                    <p className="empty-state-text">Bu medya silinmiş veya mevcut değil.</p>
                    <button className="btn btn-secondary" onClick={onBack}>← Geri Dön</button>
                </div>
            </div>
        );
    }

    const typeInfo = MEDIA_TYPES[item.type] || MEDIA_TYPES.movie;
    const statusInfo = STATUS_TYPES[item.status] || STATUS_TYPES.completed;
    const isOwner = currentUserId && item.userId === currentUserId;
    const canEdit = isOwner || isAdmin;

    return (
        <div className="detail-page">
            <div className="detail-back" onClick={onBack}>← Geri Dön</div>

            <div className="detail-hero">
                <div className="detail-cover">
                    {item.coverUrl ? (
                        <img src={item.coverUrl} alt={item.title} />
                    ) : (
                        <span className="detail-cover-placeholder">{typeInfo.icon}</span>
                    )}
                </div>

                <div className="detail-info">
                    <span
                        className="detail-type-badge"
                        style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}
                    >
                        {typeInfo.icon} {typeInfo.label}
                    </span>

                    <h1 className="detail-title">{item.title}</h1>

                    {item.userName && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>
                            Ekleyen: <strong style={{ color: 'var(--text-secondary)' }}>{item.userName}</strong>
                        </p>
                    )}

                    <div className="detail-meta">
                        <div className="detail-meta-item">
                            <StarRating rating={item.rating} readOnly />
                            {item.rating > 0 && <span>({item.rating}/5)</span>}
                        </div>
                        {item.date && (
                            <div className="detail-meta-item">📅 {item.date}</div>
                        )}
                        {TYPE_EXTRA_FIELDS[item.type]?.map(field => (
                            item[field.key] ? (
                                <div className="detail-meta-item" key={field.key}>
                                    {field.icon} {field.label}: <strong>{item[field.key]}</strong>
                                </div>
                            ) : null
                        ))}
                    </div>

                    <span
                        className="detail-status"
                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                    >
                        {statusInfo.label}
                    </span>

                    {item.tags && item.tags.length > 0 && (
                        <div className="detail-tags">
                            {item.tags.map(tag => (
                                <span key={tag} className="detail-tag">#{tag}</span>
                            ))}
                        </div>
                    )}

                    {canEdit && (
                        <div className="detail-actions">
                            <button className="btn btn-secondary" onClick={() => onEdit(item)}>
                                ✏️ Düzenle
                            </button>
                            <button className="btn btn-danger" onClick={() => onDelete(item.id, item.userId)}>
                                🗑️ Sil
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {item.review && (
                <div className="detail-section">
                    <h3 className="detail-section-title">💬 Yorum & İnceleme</h3>
                    <div className="detail-review-text">{item.review}</div>
                </div>
            )}

            {!item.review && canEdit && (
                <div className="detail-section">
                    <h3 className="detail-section-title">💬 Yorum & İnceleme</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        Henüz bir yorum eklenmemiş. Düzenle butonuyla yorum ekleyebilirsin.
                    </p>
                </div>
            )}
        </div>
    );
}
