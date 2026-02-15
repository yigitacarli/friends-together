import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToNsfwChat, sendNsfwChatMessage } from '../services/chat';

function getChatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function NsfwLobby() {
    const { user, profile, getUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    // Erişim kontrolü
    const hasAccess = profile?.nsfwAccess === true;

    useEffect(() => {
        if (!hasAccess) return;
        const unsub = subscribeToNsfwChat(setMessages);
        return unsub;
    }, [hasAccess]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || !hasAccess) return;
        try {
            await sendNsfwChatMessage(text, {
                uid: user.uid,
                displayName: profile?.displayName || 'Anonim',
                photoURL: profile?.avatar || '🧑‍💻'
            });
            setText('');
        } catch (err) { console.error(err); }
    };

    if (!hasAccess) {
        return (
            <div className="lobby-page">
                <div className="empty-state">
                    <div className="empty-state-icon">🔒</div>
                    <h3 className="empty-state-title">Erişim Kısıtlı</h3>
                    <p className="empty-state-text">Bu sohbet odasına erişim iznin yok.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lobby-page">
            <div className="feed-header">
                <h2 className="section-title" style={{ color: '#f87171' }}>🔞 +18 Sohbet Odası</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Sadece seçili kişiler görebilir. Dışarıdan erişilemez.
                </div>
            </div>

            <div className="chat-container nsfw-chat">
                <div className="chat-messages">
                    {messages.map(msg => {
                        const isMe = msg.userId === user?.uid;
                        const author = getUser(msg.userId);
                        const displayName = author?.displayName || msg.userName || 'Anonim';
                        const avatar = author?.avatar || msg.userAvatar || '🧑‍💻';
                        const title = author?.title;

                        return (
                            <div key={msg.id} className={`chat-message ${isMe ? 'mine' : ''}`}>
                                {!isMe && <span className="chat-avatar" title={displayName}>{avatar}</span>}
                                <div className="chat-bubble nsfw-bubble">
                                    {!isMe && (
                                        <div className="chat-author">
                                            {displayName}
                                            {title && <span style={{ fontSize: '0.6rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>({title})</span>}
                                        </div>
                                    )}
                                    <div className="chat-text">{msg.text}</div>
                                    <div className="chat-time">{getChatTime(msg.createdAt)}</div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="chat-input"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Bir şeyler yaz..."
                    />
                    <button type="submit" className="btn btn-primary chat-send-btn" style={{ background: '#dc2626' }}>Gönder ➤</button>
                </form>
            </div>
        </div>
    );
}

