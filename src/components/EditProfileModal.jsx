import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function EditProfileModal({ onClose }) {
    const { profile, updateUserProfile, AVATARS, FUNNY_TITLES } = useAuth();

    const [editName, setEditName] = useState(profile?.displayName || '');
    const [editAvatar, setEditAvatar] = useState(profile?.avatar || '🧑‍💻');
    const [editTitle, setEditTitle] = useState(profile?.title || 'Çaylak Üye');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            await updateUserProfile({
                displayName: editName.trim(),
                avatar: editAvatar,
                title: editTitle.trim()
            });
            onClose();
        } catch (err) {
            console.error('Update error:', err);
            alert('Güncelleme hatası!');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Profili Düzenle</h3>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Avatar Seç</label>
                        <div className="avatar-picker" style={{ maxHeight: 150, overflowY: 'auto' }}>
                            {AVATARS.map(av => (
                                <button key={av} type="button"
                                    className={`avatar-option ${editAvatar === av ? 'selected' : ''}`}
                                    onClick={() => setEditAvatar(av)}
                                >
                                    {av}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Görünen İsim</label>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Ünvan (Title)</label>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            placeholder="Kendine bir ünvan seç..."
                            list="titles-list"
                        />
                        <datalist id="titles-list">
                            {FUNNY_TITLES.map(t => <option key={t} value={t} />)}
                        </datalist>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Listedeki komik ünvanlardan seç veya kendi havalı ünvanını yaz!
                        </p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
}
