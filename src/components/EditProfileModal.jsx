import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function EditProfileModal({ onClose }) {
    const { profile, user, updateUserProfile, AVATARS, FUNNY_TITLES } = useAuth();

    const [editName, setEditName] = useState(profile?.displayName || '');
    const [editAvatar, setEditAvatar] = useState(profile?.avatar || '🧑‍💻');
    const [editTitle, setEditTitle] = useState(profile?.title || 'Çaylak Üye');
    const [saving, setSaving] = useState(false);

    const availableTitles = user?.email === 'acarliyigit@gmail.com'
        ? ['👑 Admin', 'Kurucu', 'Yüce Yönetici', ...FUNNY_TITLES]
        : FUNNY_TITLES;

    const handleSave = async () => {
        // ... (unchanged handleSave body start)
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
            {/* ... modal content ... */}
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    {/* ... */}
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
                            {availableTitles.map(t => <option key={t} value={t} />)}
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
