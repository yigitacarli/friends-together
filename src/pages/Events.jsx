import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/storage';
import { createEvent, getMyEvents, respondToEvent, deleteEvent } from '../services/events';

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export default function Events() {
    const { user, profile, getUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [users, setUsers] = useState([]);

    // Form states
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFriends, setSelectedFriends] = useState([]);

    useEffect(() => {
        async function load() {
            if (!user) return;
            setLoading(true);
            const [u, e] = await Promise.all([getAllUsers(), getMyEvents(user.uid)]);
            setUsers(u);
            e.sort((a, b) => new Date(a.date) - new Date(b.date)); // client side sort (for upcoming)
            setEvents(e);
            setLoading(false);
        }
        load();
    }, [user]);

    const handleCreate = async () => {
        if (!title || !date || selectedFriends.length === 0) {
            alert('Lütfen başlık, tarih ve en az bir arkadaş seçin!');
            return;
        }
        try {
            const allInvited = [user.uid, ...selectedFriends];
            await createEvent(
                { title, date, description, invitedUserIds: allInvited, participants: {} },
                user.uid,
                profile.displayName,
                profile.avatar
            );
            setShowCreate(false);
            resetForm();
            // Reload events
            const e = await getMyEvents(user.uid);
            setEvents(e);
        } catch (err) {
            console.error(err);
            alert('Etkinlik oluşturulamadı!');
        }
    };

    const resetForm = () => {
        setTitle('');
        setDate('');
        setDescription('');
        setSelectedFriends([]);
    };

    const handleResponse = async (eventId, status) => {
        try {
            await respondToEvent(eventId, user.uid, status);
            // Update local state temporarily
            setEvents(prev => prev.map(ev =>
                ev.id === eventId
                    ? { ...ev, participants: { ...ev.participants, [user.uid]: status } }
                    : ev
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Bu etkinliği iptal etmek istediğine emin misin?')) return;
        try {
            await deleteEvent(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="empty-state">Yükleniyor...</div>;

    return (
        <div className="collection-page">
            <div className="feed-header">
                <h2 className="section-title">📅 Etkinlikler</h2>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    <span>➕</span>
                    <span>Yeni Etkinlik</span>
                </button>
            </div>

            {showCreate && (
                <div className="feed-create-card">
                    <h3 style={{ marginBottom: 16 }}>Yeni Etkinlik Düzenle</h3>
                    <div className="form-group">
                        <label className="form-label">Etkinlik Adı</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Hafta sonu mangal..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tarih ve Saat</label>
                        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Açıklama / Detaylar</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nerede buluşuyoruz? Ne getirelim?" rows={3} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Davet Et (Arkadaşlarını Seç)</label>
                        <div className="avatar-picker" style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {users.filter(u => getUser(user.uid)?.friends?.includes(u.id)).map(friend => (
                                <button
                                    key={friend.id}
                                    className={`friend-select-btn ${selectedFriends.includes(friend.id) ? 'selected' : ''}`}
                                    onClick={() => setSelectedFriends(prev =>
                                        prev.includes(friend.id) ? prev.filter(id => id !== friend.id) : [...prev, friend.id]
                                    )}
                                    type="button"
                                >
                                    <span style={{ fontSize: '1.2rem' }}>{friend.avatar || '🧑‍💻'}</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{friend.displayName}</span>
                                    {selectedFriends.includes(friend.id) && <span style={{ marginLeft: 'auto', color: '#34d399', fontWeight: 'bold' }}>✔ Seçildi</span>}
                                </button>
                            ))}
                            {users.filter(u => getUser(user.uid)?.friends?.includes(u.id)).length === 0 && (
                                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                                    <p>Henüz arkadaşın yok :(</p>
                                    <p style={{ fontSize: '0.8rem' }}>Profil sayfandan arkadaş ekleyebilirsin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="feed-create-actions">
                        <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>İptal</button>
                        <button className="btn btn-primary" onClick={handleCreate}>Oluştur</button>
                    </div>
                </div>
            )}

            {events.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🎉</div>
                    <h3 className="empty-state-title">Etkinlik Yok</h3>
                    <p className="empty-state-text">Yaklaşan bir etkinlik yok. Arkadaşlarını toplayıp bir şeyler düzenle!</p>
                </div>
            ) : (
                <div className="feed-list">
                    {events.map(ev => {
                        const myStatus = ev.participants?.[user.uid];
                        const isOrganizer = ev.userId === user.uid;
                        const participantCount = Object.values(ev.participants || {}).filter(s => s === 'yes').length;

                        return (
                            <div key={ev.id} className="post-card event-card">
                                <div className="post-header">
                                    <span className="feed-avatar">{ev.userAvatar}</span>
                                    <div className="post-header-info">
                                        <span className="post-author">{ev.userName} bir etkinlik düzenledi</span>
                                        <span className="post-time">Oluşturulma: {formatDate(ev.createdAt)}</span>
                                    </div>
                                    {isOrganizer && (
                                        <button className="post-delete-btn" onClick={() => handleDelete(ev.id)}>🗑️ İptal Et</button>
                                    )}
                                </div>

                                <div className="event-body">
                                    <h3 className="event-title">{ev.title}</h3>
                                    <div className="event-meta">
                                        <span>📅 {new Date(ev.date).toLocaleString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="event-desc">{ev.description}</p>
                                </div>

                                <div className="event-actions">
                                    <span className="event-status-label">Senin Durumun:</span>
                                    <div className="event-buttons">
                                        <button className={`btn-resp ${myStatus === 'yes' ? 'yes-active' : ''}`} onClick={() => handleResponse(ev.id, 'yes')}>✅ Geliyorum</button>
                                        <button className={`btn-resp ${myStatus === 'maybe' ? 'maybe-active' : ''}`} onClick={() => handleResponse(ev.id, 'maybe')}>🤔 Belki</button>
                                        <button className={`btn-resp ${myStatus === 'no' ? 'no-active' : ''}`} onClick={() => handleResponse(ev.id, 'no')}>❌ Gelemem</button>
                                    </div>
                                </div>

                                <div className="event-participants">
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Gelenler ({participantCount}):
                                    </span>
                                    <div className="participant-list">
                                        {users.filter(u => ev.participants?.[u.id] === 'yes').map(u => (
                                            <span key={u.id} className="participant-badge" title={u.displayName}>{u.avatar}</span>
                                        ))}
                                        {participantCount === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Henüz kimse onaylamadı.</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
