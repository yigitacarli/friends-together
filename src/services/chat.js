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

export function subscribeToChat(callback) {
    const q = query(
        collection(db, CHAT_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(50)
    );
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(messages.reverse()); // Show newest at bottom
    });
}

export async function sendChatMessage(text, user) {
    if (!text.trim()) return;
    await addDoc(collection(db, CHAT_COLLECTION), {
        text: text.trim(),
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL || '🧑‍💻', // auth context defines user.photoURL only via updateProfile, but we use our own profile doc. Let's rely on passed user obj.
        createdAt: serverTimestamp()
    });
}
