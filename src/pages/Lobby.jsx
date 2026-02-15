import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToChat, sendChatMessage } from '../services/chat';

function getChatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function Lobby() {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        const unsub = subscribeToChat(setMessages);
        return unsub;
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        try {
            await sendChatMessage(text, {
                uid: user.uid,
                displayName: profile?.displayName || 'Anonim',
                photoURL: profile?.avatar || '🧑‍💻'
            });
            setText('');
        } catch (err) { console.error(err); }
    };

    return (
        <div className="lobby-page">
            <div className="feed-header">
                <h2 className="section-title">💬 Meydan (Sohbet Odası)</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Herkes burayı görür. Ne konuşmak istersen yaz!
                </div>
            </div>

            <div className="chat-container">
                <div className="chat-messages">
                    {messages.map(msg => {
                        const isMe = msg.userId === user?.uid;
                        return (
                            <div key={msg.id} className={`chat-message ${isMe ? 'mine' : ''}`}>
                                {!isMe && <span className="chat-avatar" title={msg.userName}>{msg.userAvatar || '🧑‍💻'}</span>}
                                <div className="chat-bubble">
                                    {!isMe && <div className="chat-author">{msg.userName}</div>}
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
                    <button type="submit" className="btn btn-primary chat-send-btn">Gönder ➤</button>
                </form>
            </div>
        </div>
    );
}
