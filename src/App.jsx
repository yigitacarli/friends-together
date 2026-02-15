import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MediaForm from './components/MediaForm';
import Dashboard from './pages/Dashboard';
import MediaList from './pages/MediaList';
import MediaDetail from './pages/MediaDetail';
import Stats from './pages/Stats';
import { addMedia, updateMedia, deleteMedia, MEDIA_TYPES } from './services/storage';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const refresh = () => setRefreshKey(k => k + 1);

  const navigate = useCallback((p) => {
    setPage(p);
    setDetailId(null);
    setSearchQuery('');
  }, []);

  const viewDetail = useCallback((id) => {
    setDetailId(id);
  }, []);

  const handleSave = (data) => {
    if (editItem) {
      updateMedia(editItem.id, data);
    } else {
      addMedia(data);
    }
    setShowForm(false);
    setEditItem(null);
    refresh();
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteMedia(showDeleteConfirm);
      setShowDeleteConfirm(null);
      setDetailId(null);
      refresh();
    }
  };

  const handleAddClick = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const renderPage = () => {
    // Detail view
    if (detailId) {
      return (
        <MediaDetail
          key={refreshKey}
          mediaId={detailId}
          onBack={() => setDetailId(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      );
    }

    // Dashboard
    if (page === 'dashboard') {
      return (
        <Dashboard
          key={refreshKey}
          onNavigate={navigate}
          onViewDetail={viewDetail}
        />
      );
    }

    // Stats
    if (page === 'stats') {
      return <Stats key={refreshKey} />;
    }

    // Category pages
    if (MEDIA_TYPES[page]) {
      return (
        <MediaList
          key={`${page}-${refreshKey}`}
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

      <div className="main-area">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={handleAddClick}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />

        <main className="page-content" key={refreshKey}>
          {renderPage()}
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <MediaForm
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}

      {/* Delete Confirmation */}
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
