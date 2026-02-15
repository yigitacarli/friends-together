import { MEDIA_TYPES, STATUS_TYPES, TYPE_EXTRA_FIELDS } from '../services/storage';
import StarRating from './StarRating';

export default function MediaCard({ item, onClick, view = 'grid' }) {
    const typeInfo = MEDIA_TYPES[item.type] || MEDIA_TYPES.movie;
    const statusInfo = STATUS_TYPES[item.status] || STATUS_TYPES.completed;
    const extraFields = TYPE_EXTRA_FIELDS[item.type] || [];
    const subtitle = extraFields.map(f => item[f.key]).filter(Boolean).join(' · ');

    if (view === 'list') {
        return (
            <div className="media-list-item" onClick={() => onClick && onClick(item)}>
                <div className="media-list-item-cover">
                    {item.coverUrl ? (
                        <img src={item.coverUrl} alt={item.title} />
                    ) : (
                        <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>{typeInfo.icon}</span>
                    )}
                </div>
                <div className="media-list-item-info">
                    <div className="media-list-item-title">{item.title}</div>
                    <div className="media-list-item-subtitle">
                        {typeInfo.icon} {typeInfo.label}
                        {subtitle ? ` · ${subtitle}` : ''}
                        {' · '}{statusInfo.label}
                        {item.userName ? ` · ${item.userName}` : ''}
                        {item.date ? ` · ${item.date}` : ''}
                    </div>
                </div>
                <div className="media-list-item-actions">
                    <StarRating rating={item.rating} readOnly />
                </div>
            </div>
        );
    }

    return (
        <div className="media-card" onClick={() => onClick && onClick(item)}>
            <div className="media-card-cover">
                {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.title} loading="lazy" />
                ) : (
                    <span className="media-card-cover-placeholder">{typeInfo.icon}</span>
                )}
                <span
                    className="media-card-type-badge"
                    style={{ borderColor: typeInfo.color }}
                >
                    {typeInfo.icon} {typeInfo.label}
                </span>
            </div>
            <div className="media-card-body">
                <div className="media-card-title">{item.title}</div>
                {item.userName && (
                    <div className="media-card-owner">👤 {item.userName}</div>
                )}
                {subtitle && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {subtitle}
                    </div>
                )}
                <div className="media-card-meta">
                    <StarRating rating={item.rating} readOnly />
                    <span
                        className="media-card-status-inline"
                        style={{ color: statusInfo.color, fontSize: '0.72rem', fontWeight: 600 }}
                    >
                        {statusInfo.label}
                    </span>
                </div>
            </div>
        </div>
    );
}
