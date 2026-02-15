import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';

const CHAT_COLLECTION = 'chat_messages';
const NSFW_CHAT_COLLECTION = 'nsfw_chat_messages';

export function subscribeToChat(callback) {
    const q = query(
        collection(db, CHAT_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(50)
    );
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(messages.reverse());
    });
}

export async function sendChatMessage(text, user) {
    if (!text.trim()) return;
    await addDoc(collection(db, CHAT_COLLECTION), {
        text: text.trim(),
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL || '🧑‍💻',
        createdAt: serverTimestamp()
    });
}

// +18 Sohbet
export function subscribeToNsfwChat(callback) {
    const q = query(
        collection(db, NSFW_CHAT_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(50)
    );
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(messages.reverse());
    });
}

export async function sendNsfwChatMessage(text, user) {
    if (!text.trim()) return;
    await addDoc(collection(db, NSFW_CHAT_COLLECTION), {
        text: text.trim(),
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL || '🧑‍💻',
        createdAt: serverTimestamp()
    });
}
