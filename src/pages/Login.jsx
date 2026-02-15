import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, register, resetPassword, AVATARS } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('🧑‍💻');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            if (mode === 'reset') {
                await resetPassword(email);
                setSuccess('Şifre sıfırlama bağlantısı e-postana gönderildi!');
                setLoading(false);
                return;
            }
            if (mode === 'register') {
                if (!displayName.trim()) { setError('Görünen isim gerekli!'); setLoading(false); return; }
                if (!inviteCode.trim()) { setError('Davet kodu gerekli!'); setLoading(false); return; }
                await register(email, password, displayName.trim(), selectedAvatar, inviteCode.trim());
            } else {
                await login(email, password);
            }
        } catch (err) {
            console.error(err);
            const msgs = {
                'auth/invalid-invite-code': 'Geçersiz davet kodu! Doğru kodu girin.',
                'auth/user-not-found': 'E-posta veya şifre hatalı!',
                'auth/wrong-password': 'E-posta veya şifre hatalı!',
                'auth/invalid-credential': 'E-posta veya şifre hatalı!',
                'auth/email-already-in-use': 'Bu e-posta zaten kullanılıyor!',
                'auth/weak-password': 'Şifre en az 6 karakter olmalı!',
                'auth/invalid-email': 'Geçersiz e-posta adresi!',
            };
            setError(msgs[err.code] || 'Bir hata oluştu: ' + (err.message || err));
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">📋</div>
                    <h1 className="login-title">Friends Together</h1>
                    <p className="login-subtitle">
                        {mode === 'register' ? 'Yeni hesap oluştur' :
                            mode === 'reset' ? 'Şifreni sıfırla' :
                                'Arkadaşlarınla medya takibi'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {mode === 'register' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Görünen İsim</label>
                                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Adın..." required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Avatar Seç</label>
                                <div className="avatar-picker">
                                    {AVATARS.map(av => (
                                        <button key={av} type="button" className={`avatar-option ${selectedAvatar === av ? 'selected' : ''}`} onClick={() => setSelectedAvatar(av)}>{av}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label">E-posta</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required autoFocus />
                    </div>

                    {mode !== 'reset' && (
                        <div className="form-group">
                            <label className="form-label">Şifre</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required minLength={6} />
                        </div>
                    )}

                    {mode === 'register' && (
                        <div className="form-group">
                            <label className="form-label">🔑 Davet Kodu</label>
                            <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Arkadaşından aldığın kodu gir..." required />
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Hesap oluşturmak için davet kodu gerekli.</p>
                        </div>
                    )}

                    {error && <p className="login-error">{error}</p>}
                    {success && <p className="login-success">{success}</p>}

                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? '...' : mode === 'register' ? 'Hesap Oluştur' : mode === 'reset' ? 'Sıfırlama Linki Gönder' : 'Giriş Yap'}
                    </button>
                </form>

                {mode === 'login' && (
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <button className="login-toggle" onClick={() => switchMode('reset')}>Şifremi unuttum</button>
                    </div>
                )}

                <div className="login-footer">
                    <p>
                        {mode === 'register' ? 'Zaten hesabın var mı?' : mode === 'reset' ? 'Hatırladın mı?' : 'Hesabın yok mu?'}
                        <button className="login-toggle" onClick={() => switchMode(mode === 'register' ? 'login' : mode === 'reset' ? 'login' : 'register')}>
                            {mode === 'register' ? 'Giriş Yap' : mode === 'reset' ? 'Giriş Yap' : 'Kayıt Ol'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
