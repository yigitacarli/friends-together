export default function Header({ searchQuery, onSearchChange, onAddClick, onMenuToggle }) {
    return (
        <header className="header">
            <div className="header-left">
                <button className="btn-icon" onClick={onMenuToggle} style={{ display: 'none' }}>
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
                <button className="btn btn-primary" onClick={onAddClick}>
                    <span>+</span>
                    <span>Yeni Ekle</span>
                </button>
            </div>
        </header>
    );
}
