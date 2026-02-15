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
        limit(30)
    );

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
    }, (error) => {
        console.error('Notification listener error:', error);
        // Firestore composite index gerekebilir
        // Console'da index oluşturma linki görünür
        callback([]);
    });
}

export async function sendNotification(toUserId, type, data) {
    if (!toUserId) return;

    try {
        await addDoc(collection(db, NOTIF_COLLECTION), {
            toUserId,
            type,
            data: data || {},
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error(`sendNotification error (type: ${type}):`, error);
    }
}

export async function markAsRead(notifId) {
    try {
        await updateDoc(doc(db, NOTIF_COLLECTION, notifId), {
            read: true
        });
    } catch (error) {
        console.error('markAsRead error:', error);
    }
}

export async function markAllAsRead(userId, notifications) {
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n =>
        updateDoc(doc(db, NOTIF_COLLECTION, n.id), { read: true }).catch(e => console.error('markRead error:', e))
    );
    await Promise.all(promises);
}
