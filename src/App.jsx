import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MediaForm from './components/MediaForm';
import LoginModal from './components/LoginModal';
import Dashboard from './pages/Dashboard';
import MediaList from './pages/MediaList';
import MediaDetail from './pages/MediaDetail';
import Stats from './pages/Stats';
import { useMedia } from './context/MediaContext';
import { useAuth } from './context/AuthContext';
import { MEDIA_TYPES } from './services/storage';

export default function App() {
  const { add, update, remove } = useMedia();
  const { isAdmin } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

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
    if (!isAdmin) {
      setShowLogin(true);
      return;
    }
    setEditItem(item);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!isAdmin) {
      setShowLogin(true);
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
        alert('Silme hatası! Lütfen tekrar dene.');
      }
    }
  };

  const handleAddClick = () => {
    if (!isAdmin) {
      setShowLogin(true);
      return;
    }
    setEditItem(null);
    setShowForm(true);
  };

  const renderPage = () => {
    if (detailId) {
      return (
        <MediaDetail
          mediaId={detailId}
          onBack={() => setDetailId(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isAdmin={isAdmin}
        />
      );
    }

    if (page === 'dashboard') {
      return <Dashboard onNavigate={navigate} onViewDetail={viewDetail} />;
    }

    if (page === 'stats') {
      return <Stats />;
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
          onAddClick={handleAddClick}
          onMenuToggle={() => setSidebarOpen(o => !o)}
          onLoginClick={() => setShowLogin(true)}
        />

        <main className="page-content">
          {renderPage()}
        </main>
      </div>

      {showForm && (
        <MediaForm
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          saving={saving}
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
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
                  <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                    Vazgeç
                  </button>
                  <button className="btn btn-danger" onClick={confirmDelete}>
                    Evet, Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
