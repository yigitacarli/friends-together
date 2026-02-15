import { useAuth } from '../context/AuthContext';

export default function Header({ searchQuery, onSearchChange, onAddClick, onMenuToggle, isGuest, onLoginClick }) {
    const { logout, profile, isLoggedIn } = useAuth();

    return (
        <header className="header">
            <div className="header-left">
                <button className="btn-icon mobile-menu-btn" onClick={onMenuToggle} style={{ display: 'none' }}>
                    ☰
                </button>
                <div className="header-search">
                    <span className="header-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Medya ara..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <div className="header-right">
                {isLoggedIn ? (
                    <>
                        <button className="btn btn-primary" onClick={onAddClick}>
                            <span>+</span>
                            <span>Yeni Ekle</span>
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={logout}
                            title="Çıkış Yap"
                            style={{ gap: 6 }}
                        >
                            <span>🚪</span>
                            <span>Çıkış</span>
                        </button>
                    </>
                ) : (
                    <button className="btn btn-primary" onClick={onLoginClick}>
                        <span>🔐</span>
                        <span>Giriş Yap</span>
                    </button>
                )}
            </div>
        </header>
    );
}
