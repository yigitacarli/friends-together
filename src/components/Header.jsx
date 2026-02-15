import { useAuth } from '../context/AuthContext';

export default function Header({ searchQuery, onSearchChange, onAddClick, onMenuToggle, onLoginClick }) {
    const { isAdmin, logout } = useAuth();

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
                {isAdmin ? (
                    <>
                        <button className="btn btn-primary" onClick={onAddClick}>
                            <span>+</span>
                            <span>Yeni Ekle</span>
                        </button>
                        <button className="btn btn-secondary" onClick={logout} title="Çıkış Yap">
                            🚪
                        </button>
                    </>
                ) : (
                    <button className="btn btn-secondary" onClick={onLoginClick}>
                        <span>🔐</span>
                        <span>Giriş</span>
                    </button>
                )}
            </div>
        </header>
    );
}
