import { useAuth } from '../context/AuthContext';
import Notifications from './Notifications';

export default function Header({ searchQuery, onSearchChange, onAddClick, onMenuToggle, isGuest, onLoginClick }) {
    const { logout, profile, isLoggedIn } = useAuth();

    return (
        <header className="header">
            <div className="header-left">
                <button className="btn-icon mobile-menu-btn" onClick={onMenuToggle}>
                    ☰
                </button>
            </div>

            <div className="app-logo-text">Friends Together</div>

            <div className="header-right">
                {isLoggedIn ? (
                    <>
                        <Notifications /> {/* Bildirimler burada */}
                        <button className="btn btn-primary" onClick={onAddClick}>
                            <span>+</span>
                            <span className="hide-mobile">Yeni Ekle</span>
                        </button>
                        <button
                            className="btn logout-btn"
                            onClick={logout}
                            title="Çıkış Yap"
                        >
                            <span>🚪</span>
                            <span className="hide-mobile">Çıkış Yap</span>
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
