import { useState, useEffect } from 'react';
import { MEDIA_TYPES, STATUS_TYPES, TYPE_EXTRA_FIELDS } from '../services/storage';
import StarRating from './StarRating';

const EMPTY_FORM = {
    title: '',
    type: 'movie',
    status: 'completed',
    rating: 0,
    review: '',
    coverUrl: '',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    author: '',
    director: '',
    platform: '',
    seasonCount: '',
    studio: '',
    artist: '',
    techStack: '',
    githubUrl: '',
    visibility: 'public', // public, friends, private
};

export default function MediaForm({ item, onSave, onClose, saving }) {
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (item) {
            setForm({
                title: item.title || '',
                type: item.type || 'movie',
                status: item.status || 'completed',
                rating: item.rating || 0,
                review: item.review || '',
                coverUrl: item.coverUrl || '',
                date: item.date || new Date().toISOString().split('T')[0],
                tags: (item.tags || []).join(', '),
                author: item.author || '',
                director: item.director || '',
                platform: item.platform || '',
                seasonCount: item.seasonCount || '',
                studio: item.studio || '',
                artist: item.artist || '',
                techStack: item.techStack || '',
                githubUrl: item.githubUrl || '',
                visibility: item.visibility || 'public',
            });
        }
    }, [item]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        onSave({
            ...form,
            tags: form.tags
                .split(',')
                .map(t => t.trim())
                .filter(Boolean),
        });
    };

    const isEdit = !!item;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">{isEdit ? 'Medya Düzenle' : 'Yeni Medya Ekle'}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Başlık *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Medya adı..."
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Tür</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                >
                                    {Object.entries(MEDIA_TYPES).map(([key, val]) => (
                                        <option key={key} value={key}>{val.icon} {val.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Durum</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                >
                                    {Object.entries(STATUS_TYPES).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Category-specific extra fields */}
                        {TYPE_EXTRA_FIELDS[form.type]?.map(field => (
                            <div className="form-group" key={field.key}>
                                <label className="form-label">{field.icon} {field.label}</label>
                                <input
                                    type="text"
                                    value={form[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                />
                            </div>
                        ))}

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Tarih</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => handleChange('date', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Puan</label>
                                <div style={{ paddingTop: 4 }}>
                                    <StarRating
                                        rating={form.rating}
                                        onChange={(r) => handleChange('rating', r)}
                                        size="large"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Kapak Resmi URL (opsiyonel)</label>
                            <input
                                type="url"
                                value={form.coverUrl}
                                onChange={(e) => handleChange('coverUrl', e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Etiketler (virgülle ayır)</label>
                            <input
                                type="text"
                                value={form.tags}
                                onChange={(e) => handleChange('tags', e.target.value)}
                                placeholder="aksiyon, bilim kurgu, favoriler..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Kimler Görebilir?</label>
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                {[
                                    { id: 'public', label: '🌍 Herkes', color: '#3b82f6' },
                                    { id: 'friends', label: '👥 Arkadaşlar', color: '#22c55e' },
                                    { id: 'private', label: '🔒 Sadece Ben', color: '#64748b' }
                                ].map(opt => (
                                    <label key={opt.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '8px 12px', borderRadius: 8,
                                        border: `1px solid ${form.visibility === opt.id ? opt.color : 'var(--border)'}`,
                                        background: form.visibility === opt.id ? `${opt.color}15` : 'transparent',
                                        cursor: 'pointer', flex: 1, justifyContent: 'center'
                                    }}>
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value={opt.id}
                                            checked={form.visibility === opt.id}
                                            onChange={() => handleChange('visibility', opt.id)}
                                            style={{ accentColor: opt.color }}
                                        />
                                        <span style={{ fontWeight: 500, fontSize: '0.9rem', color: form.visibility === opt.id ? opt.color : 'inherit' }}>
                                            {opt.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                {form.visibility === 'public' && 'Topluluk sayfasında ve herkesin akışında görünebilir.'}
                                {form.visibility === 'friends' && 'Sadece arkadaş listenizdekiler görebilir.'}
                                {form.visibility === 'private' && 'Gizli günlük modunda, sadece siz görebilirsiniz.'}
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Yorum / İnceleme</label>
                            <textarea
                                value={form.review}
                                onChange={(e) => handleChange('review', e.target.value)}
                                placeholder="Bu medya hakkında düşüncelerin..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Vazgeç</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
