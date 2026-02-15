import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

const NOTIF_COLLECTION = 'notifications';

export function listenToNotifications(userId, callback) {
    const q = query(
        collection(db, NOTIF_COLLECTION),
        where('toUserId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
    });
}

export async function sendNotification(toUserId, type, data) {
    if (!toUserId) return;

    await addDoc(collection(db, NOTIF_COLLECTION), {
        toUserId,
        type, // 'like', 'comment'
        data, // { postId, userName, userAvatar, content }
        read: false,
        createdAt: serverTimestamp()
    });
}

export async function markAsRead(notifId) {
    await updateDoc(doc(db, NOTIF_COLLECTION, notifId), {
        read: true
    });
}

export async function markAllAsRead(userId, notifications) {
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n => updateDoc(doc(db, NOTIF_COLLECTION, n.id), { read: true }));
    await Promise.all(promises);
}
