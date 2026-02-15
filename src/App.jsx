import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MediaForm from './components/MediaForm';
import Dashboard from './pages/Dashboard';
import MediaList from './pages/MediaList';
import MediaDetail from './pages/MediaDetail';
import Stats from './pages/Stats';
import Feed from './pages/Feed';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import { useMedia } from './context/MediaContext';
import { useAuth } from './context/AuthContext';
import { getAllUsers, MEDIA_TYPES } from './services/storage';

export default function App() {
  const { add, update, remove } = useMedia();
  const { user, profile, isLoggedIn, loading: authLoading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    // Load users for both logged-in users and guests
    getAllUsers().then(setUsers);
  }, [isLoggedIn, guestMode]);

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
    if (item.userId && item.userId !== user?.uid) {
      alert('Sadece kendi eklediğin medyaları düzenleyebilirsin!');
      return;
    }
    setEditItem(item);
    setShowForm(true);
  };

  const handleDelete = (id, ownerId) => {
    if (!isLoggedIn) return;
    if (ownerId && ownerId !== user?.uid) {
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

  // Auth loading
  if (authLoading) {
    return (
      <div className="login-page">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'float 2s ease infinite' }}>📋</div>
          <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Not logged in and not guest → show login page
  if (!isLoggedIn && !guestMode) {
    return <Login onGuestBrowse={() => setGuestMode(true)} />;
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

    if (page === 'dashboard') {
      return <Dashboard onNavigate={navigate} onViewDetail={viewDetail} />;
    }

    if (page === 'feed') {
      return <Feed />;
    }

    if (page === 'stats') {
      return <Stats />;
    }

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

    if (MEDIA_TYPES[page]) {
      return (
        <MediaList
          type={page}
          searchQuery={searchQuery}
          onViewDetail={viewDetail}
        />
      );
    }

    return null;
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={detailId ? '' : page}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />
      {sidebarOpen && (
        <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-area">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => {
            if (!isLoggedIn) {
              setGuestMode(false);
              return;
            }
            setEditItem(null);
            setShowForm(true);
          }}
          onMenuToggle={() => setSidebarOpen(o => !o)}
          isGuest={!isLoggedIn}
          onLoginClick={() => setGuestMode(false)}
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
