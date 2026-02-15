import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, register, AVATARS } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('🧑‍💻');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegister) {
                if (!displayName.trim()) {
                    setError('Görünen isim gerekli!');
                    setLoading(false);
                    return;
                }
                await register(email, password, displayName.trim(), selectedAvatar);
            } else {
                await login(email, password);
            }
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('E-posta veya şifre hatalı!');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Bu e-posta zaten kullanılıyor!');
            } else if (err.code === 'auth/weak-password') {
                setError('Şifre en az 6 karakter olmalı!');
            } else if (err.code === 'auth/invalid-email') {
                setError('Geçersiz e-posta adresi!');
            } else {
                setError('Bir hata oluştu: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">📋</div>
                    <h1 className="login-title">MediaTracker</h1>
                    <p className="login-subtitle">
                        {isRegister ? 'Yeni hesap oluştur' : 'Arkadaşlarınla medya takibi'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {isRegister && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Görünen İsim</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Adın..."
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Avatar Seç</label>
                                <div className="avatar-picker">
                                    {AVATARS.map(av => (
                                        <button
                                            key={av}
                                            type="button"
                                            className={`avatar-option ${selectedAvatar === av ? 'selected' : ''}`}
                                            onClick={() => setSelectedAvatar(av)}
                                        >
                                            {av}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label">E-posta</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && <p className="login-error">{error}</p>}

                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? '...' : (isRegister ? 'Hesap Oluştur' : 'Giriş Yap')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isRegister ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
                        <button
                            className="login-toggle"
                            onClick={() => { setIsRegister(!isRegister); setError(''); }}
                        >
                            {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
