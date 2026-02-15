import { useState, useEffect } from 'react';
import { MEDIA_TYPES, STATUS_TYPES, TYPE_EXTRA_FIELDS } from '../services/storage';
import StarRating from './StarRating';
import {
    fetchBookMetadata,
    fetchMovieSeriesMetadata,
    mergeTags,
    toIsoDateOrFallback,
} from '../services/metadata';

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
    visibility: 'public',
};

export default function MediaForm({ item, onSave, onClose, saving }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [lookupValue, setLookupValue] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

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
            setShowAdvanced(true); // Düzenlemede tüm alanları göster
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

    const handleAutoFill = async () => {
        if (!lookupValue.trim()) {
            alert('Lütfen bir başlık veya bağlantı gir.');
            return;
        }

        setLookupLoading(true);
        try {
            const isBook = form.type === 'book';
            const metadata = isBook
                ? await fetchBookMetadata(lookupValue)
                : await fetchMovieSeriesMetadata(lookupValue, form.type);

            setForm((prev) => ({
                ...prev,
                title: metadata.title || prev.title,
                coverUrl: metadata.coverUrl || prev.coverUrl,
                date: toIsoDateOrFallback(metadata.date, prev.date),
                review: metadata.review || prev.review,
                director: metadata.director || prev.director,
                author: metadata.author || prev.author,
                seasonCount: metadata.seasonCount || prev.seasonCount,
                type: metadata.type || prev.type,
                tags: mergeTags(prev.tags, metadata.tags),
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Bilgi çekilirken bir hata oluştu.';
            alert(message);
        } finally {
            setLookupLoading(false);
        }
    };

    const isEdit = !!item;
    const canAutoFill = ['book', 'movie', 'series', 'anime'].includes(form.type);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">{isEdit ? '✏️ Düzenle' : '✨ Yeni Ekle'}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">

                        {/* STEP 1: Tür Seçimi - Büyük Butonlar */}
                        <div className="form-group">
                            <label className="form-label">Ne eklemek istiyorsun?</label>
                            <div className="media-type-picker">
                                {Object.entries(MEDIA_TYPES).map(([key, val]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`media-type-pick-btn ${form.type === key ? 'active' : ''}`}
                                        onClick={() => handleChange('type', key)}
                                        style={form.type === key ? { borderColor: val.color, color: val.color, background: `${val.color}15` } : {}}
                                    >
                                        <span style={{ fontSize: '1.3rem' }}>{val.icon}</span>
                                        <span>{val.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* STEP 2: Otomatik Ara & Doldur */}
                        {canAutoFill && (
                            <div className="autofill-card">
                                <div className="autofill-row">
                                    <input
                                        type="text"
                                        value={lookupValue}
                                        onChange={(e) => setLookupValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAutoFill())}
                                        placeholder={form.type === 'book'
                                            ? '📚 Kitap adı yaz... (ör: Suç ve Ceza)'
                                            : '🎬 Film/dizi adı veya IMDb linki...'}
                                        style={{ fontSize: '0.95rem' }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleAutoFill}
                                        disabled={lookupLoading}
                                        style={{ minWidth: 120 }}
                                    >
                                        {lookupLoading ? '⏳ Aranıyor...' : '🔍 Ara'}
                                    </button>
                                </div>
                                <p className="form-help">
                                    {form.type === 'book'
                                        ? 'Open Library\'den kitap bilgisi otomatik doldurulur.'
                                        : 'OMDb\'den başlık, yönetmen ve kapak otomatik doldurulur.'}
                                </p>
                            </div>
                        )}

                        {/* STEP 3: Temel Bilgiler */}
                        <div className="form-group">
                            <label className="form-label">Başlık *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="İsim..."
                                required
                                autoFocus={!canAutoFill}
                            />
                        </div>

                        {/* Kategori-spesifik alan (tek satırda) */}
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

                        {/* Puan ve Durum - tek satır */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">⭐ Puan</label>
                                <div style={{ paddingTop: 4 }}>
                                    <StarRating
                                        rating={form.rating}
                                        onChange={(r) => handleChange('rating', r)}
                                        size="large"
                                    />
                                </div>
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

                        {/* İnceleme */}
                        <div className="form-group">
                            <label className="form-label">💭 Yorum / İnceleme</label>
                            <textarea
                                value={form.review}
                                onChange={(e) => handleChange('review', e.target.value)}
                                placeholder="Kısa bir yorum yaz..."
                                rows={3}
                            />
                        </div>

                        {/* Görünürlük - Basit butonlar */}
                        <div className="form-group">
                            <label className="form-label">Kimler görsün?</label>
                            <div className="visibility-options">
                                {[
                                    { id: 'public', label: '🌍 Herkes', color: '#3b82f6' },
                                    { id: 'friends', label: '👥 Arkadaşlar', color: '#22c55e' },
                                    { id: 'private', label: '🔒 Sadece Ben', color: '#64748b' }
                                ].map(opt => (
                                    <label
                                        key={opt.id}
                                        className="visibility-option"
                                        style={{
                                            border: `1px solid ${form.visibility === opt.id ? opt.color : 'var(--border)'}`,
                                            background: form.visibility === opt.id ? `${opt.color}15` : 'transparent',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value={opt.id}
                                            checked={form.visibility === opt.id}
                                            onChange={() => handleChange('visibility', opt.id)}
                                            style={{ accentColor: opt.color, display: 'none' }}
                                        />
                                        <span style={{ fontWeight: 500, fontSize: '0.85rem', color: form.visibility === opt.id ? opt.color : 'inherit' }}>
                                            {opt.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Gelişmiş Seçenekler (Toggle) */}
                        <button
                            type="button"
                            className="advanced-toggle-btn"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            {showAdvanced ? '▼' : '▶'} Gelişmiş Seçenekler
                        </button>

                        {showAdvanced && (
                            <div className="advanced-section animate-fade-in">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">📅 Tarih</label>
                                        <input
                                            type="date"
                                            value={form.date}
                                            onChange={(e) => handleChange('date', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">🖼️ Kapak URL</label>
                                        <input
                                            type="url"
                                            value={form.coverUrl}
                                            onChange={(e) => handleChange('coverUrl', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">🏷️ Etiketler (virgülle ayır)</label>
                                    <input
                                        type="text"
                                        value={form.tags}
                                        onChange={(e) => handleChange('tags', e.target.value)}
                                        placeholder="aksiyon, bilim kurgu, favoriler..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Vazgeç</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? '⏳ Kaydediliyor...' : (isEdit ? '✏️ Güncelle' : '✨ Kaydet')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
