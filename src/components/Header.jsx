import { useAuth } from '../context/AuthContext';
import Notifications from './Notifications';

export default function Header({
    searchQuery,
    onSearchChange,
    onAddClick,
    onMenuToggle,
    isGuest,
    onLoginClick,
    onLogoClick
}) {
    const { logout, isLoggedIn } = useAuth();

    return (
        <header className="header">
            <div className="header-left">
                <button type="button" className="btn-icon mobile-menu-btn" onClick={onMenuToggle} aria-label="Menuyu ac">
                    ☰
                </button>
                <button type="button" className="app-logo-text" onClick={onLogoClick}>
                    Friends Together
                </button>
            </div>

            <div className="header-search">
                <span className="header-search-icon" aria-hidden="true">⌕</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Film, kitap, dizi veya kisi ara..."
                    aria-label="Arama"
                />
            </div>

            <div className="header-right">
                {isLoggedIn && !isGuest ? (
                    <>
                        <Notifications />
                        <button type="button" className="btn btn-primary" onClick={onAddClick}>
                            <span aria-hidden="true">+</span>
                            <span className="hide-mobile">Yeni Ekle</span>
                        </button>
                        <button
                            type="button"
                            className="btn logout-btn"
                            onClick={logout}
                            title="Cikis Yap"
                        >
                            <span className="hide-mobile">Cikis Yap</span>
                        </button>
                    </>
                ) : (
                    <button type="button" className="btn btn-primary" onClick={onLoginClick}>
                        <span aria-hidden="true">🔐</span>
                        <span>Giris Yap</span>
                    </button>
                )}
            </div>
        </header>
    );
}
