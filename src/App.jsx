import { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MediaForm from './components/MediaForm';
import EditProfileModal from './components/EditProfileModal';
import { useMedia } from './context/MediaContext';
import { useAuth } from './context/AuthContext';
import { getAllUsers } from './services/storage';

// Lazy Load Pages for Performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MediaDetail = lazy(() => import('./pages/MediaDetail'));
const Stats = lazy(() => import('./pages/Stats'));
const Feed = lazy(() => import('./pages/Feed'));
const Events = lazy(() => import('./pages/Events'));
const Lobby = lazy(() => import('./pages/Lobby'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Login = lazy(() => import('./pages/Login'));
const Community = lazy(() => import('./pages/Community'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-muted)' }}>
    <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⏳</div>
    <div style={{ marginLeft: 10 }}>Yükleniyor...</div>
  </div>
);

export default function App() {
  const { add, update, remove } = useMedia();
  const { user, profile, isLoggedIn, isAdmin, loading: authLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [page, setPage] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      getAllUsers().then(setUsers);
    }
  }, [isLoggedIn]);

  const navigate = useCallback((p) => {
    setPage(p);
    setDetailId(null);
    setSearchQuery('');
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const viewDetail = useCallback((id) => {
    setDetailId(id);
  }, []);

  const handleSave = async (data) => {
    if (!isLoggedIn) return;
    setSaving(true);
    try {
      if (editItem) {
        await update(editItem.id, data);
      } else {
        await add(data);
      }
      setShowForm(false);
      setEditItem(null);
    } catch (err) {
      console.error('Save error:', err);
      alert('Kaydetme hatası! Lütfen tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    if (!isLoggedIn) return;
    if (item.userId && item.userId !== user?.uid && !isAdmin) {
      alert('Sadece kendi eklediğin medyaları düzenleyebilirsin!');
      return;
    }
    setEditItem(item);
    setShowForm(true);
  };

  const handleDelete = (id, ownerId) => {
    if (!isLoggedIn) return;
    if (ownerId && ownerId !== user?.uid && !isAdmin) {
      alert('Sadece kendi eklediğin medyaları silebilirsin!');
      return;
    }
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      try {
        await remove(showDeleteConfirm);
        setShowDeleteConfirm(null);
        setDetailId(null);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="login-page">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'float 2s ease infinite' }}>✨</div>
          <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Friends Together...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    );
  }

  const renderPage = () => {
    if (detailId) {
      return (
        <MediaDetail
          mediaId={detailId}
          onBack={() => setDetailId(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentUserId={user?.uid}
        />
      );
    }

    if (page === 'feed') return <Feed onViewDetail={viewDetail} onNavigate={navigate} />;
    if (page === 'events') return <Events />;
    if (page === 'lobby') return <Lobby />;
    if (page === 'stats') return <Stats />;
    if (page === 'community') return <Community onNavigate={navigate} />;
    if (page === 'dashboard') return <Dashboard onNavigate={navigate} onViewDetail={viewDetail} />;
    if (page === 'admin' && isAdmin) return <AdminPanel onNavigate={navigate} />;

    if (page === 'my-profile' && isLoggedIn) {
      return (
        <UserProfile
          userId={user?.uid}
          userName={profile?.displayName}
          userAvatar={profile?.avatar}
          onViewDetail={viewDetail}
        />
      );
    }

    // user-{userId} pages
    if (page.startsWith('user-')) {
      const uid = page.replace('user-', '');
      const targetUser = users.find(u => u.id === uid);
      return (
        <UserProfile
          userId={uid}
          userName={targetUser?.displayName || 'Kullanıcı'}
          userAvatar={targetUser?.avatar || '🧑‍💻'}
          onViewDetail={viewDetail}
        />
      );
    }

    return <Feed onViewDetail={viewDetail} onNavigate={navigate} />;
  };

  return (
    <div className={`app-layout ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <Sidebar
        currentPage={detailId ? '' : page}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        onEditProfile={() => setShowEditProfile(true)}
      />
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-area">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => {
            setEditItem(null);
            setShowForm(true);
          }}
          onMenuToggle={() => setSidebarOpen(o => !o)}
          isGuest={false}
          onLoginClick={() => { }}
          onLogoClick={() => navigate('feed')}
        />

        <main className="page-content" style={isMobile ? { paddingBottom: 80 } : {}}>
          <Suspense fallback={<LoadingSpinner />}>
            {renderPage()}
          </Suspense>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      {isMobile && isLoggedIn && !detailId && (
        <nav className="bottom-nav">
          <button
            className={`bottom-nav-item ${page === 'feed' ? 'active' : ''}`}
            onClick={() => navigate('feed')}
          >
            <span className="bottom-nav-icon">🏠</span>
            <span className="bottom-nav-label">Akış</span>
          </button>
          <button
            className={`bottom-nav-item ${page === 'community' ? 'active' : ''}`}
            onClick={() => navigate('community')}
          >
            <span className="bottom-nav-icon">🌐</span>
            <span className="bottom-nav-label">Topluluk</span>
          </button>
          <button
            className="bottom-nav-item bottom-nav-add"
            onClick={() => { setEditItem(null); setShowForm(true); }}
          >
            <span className="bottom-nav-add-icon">+</span>
          </button>
          <button
            className={`bottom-nav-item ${page === 'lobby' ? 'active' : ''}`}
            onClick={() => navigate('lobby')}
          >
            <span className="bottom-nav-icon">💬</span>
            <span className="bottom-nav-label">Meydan</span>
          </button>
          <button
            className={`bottom-nav-item ${page === 'my-profile' ? 'active' : ''}`}
            onClick={() => navigate('my-profile')}
          >
            <span className="bottom-nav-icon">{profile?.avatar || '🧑‍💻'}</span>
            <span className="bottom-nav-label">Profil</span>
          </button>
        </nav>
      )}

      {showForm && isLoggedIn && (
        <MediaForm
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          saving={saving}
        />
      )}

      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="confirm-dialog">
                <div className="confirm-dialog-icon">⚠️</div>
                <h3 className="confirm-dialog-title">Silmek istediğine emin misin?</h3>
                <p className="confirm-dialog-text">Bu işlem geri alınamaz.</p>
                <div className="confirm-dialog-buttons">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Vazgeç</button>
                  <button className="btn btn-danger" onClick={confirmDelete}>Evet, Sil</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
