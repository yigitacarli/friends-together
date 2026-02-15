import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MediaForm from './components/MediaForm';
import Dashboard from './pages/Dashboard';
import MediaDetail from './pages/MediaDetail';
import Stats from './pages/Stats';
import Feed from './pages/Feed';
import Events from './pages/Events';
import Lobby from './pages/Lobby'; // New
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import EditProfileModal from './components/EditProfileModal'; // New
import { useMedia } from './context/MediaContext';
import { useAuth } from './context/AuthContext';
import { getAllUsers } from './services/storage';

export default function App() {
  const { add, update, remove } = useMedia();
  const { user, profile, isLoggedIn, isAdmin, loading: authLoading } = useAuth();
  const [page, setPage] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    getAllUsers().then(setUsers);
  }, [isLoggedIn]);

  const navigate = useCallback((p) => {
    setPage(p);
    setDetailId(null);
    setSearchQuery('');
    setSidebarOpen(false);
  }, []);

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
    return <Login />;
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

    if (page === 'feed') return <Feed onViewDetail={viewDetail} />;
    if (page === 'events') return <Events />;
    if (page === 'lobby') return <Lobby />;
    if (page === 'stats') return <Stats />;
    if (page === 'dashboard') return <Dashboard onNavigate={navigate} onViewDetail={viewDetail} />;

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

    return <Feed onViewDetail={viewDetail} />;
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={detailId ? '' : page}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        onEditProfile={() => setShowEditProfile(true)} // Pass trigger
      />
      {sidebarOpen && (
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
        />

        <main className="page-content">
          {renderPage()}
        </main>
      </div>

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
