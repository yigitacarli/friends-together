import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ onClose, onSuccess }) {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const success = login(username, password);
        if (success) {
            onSuccess?.();
        } else {
            setError('Kullanıcı adı veya şifre hatalı!');
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 400 }}>
                <div className="modal-header">
                    <h3 className="modal-title">🔐 Admin Girişi</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                            Medya eklemek, düzenlemek veya silmek için giriş yapmalısın.
                        </p>
                        <div className="form-group">
                            <label className="form-label">Kullanıcı Adı</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Kullanıcı adı..."
                                autoFocus
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Şifre..."
                                required
                            />
                        </div>
                        {error && (
                            <p style={{ color: '#f87171', fontSize: '0.82rem', marginTop: -8 }}>{error}</p>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Vazgeç</button>
                        <button type="submit" className="btn btn-primary">Giriş Yap</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
