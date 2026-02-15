import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

const NOTIF_COLLECTION = 'notifications';

export function listenToNotifications(userId, callback) {
    // Sadece where kullanıyoruz — composite index gerektirmez!
    // Sıralama client-side yapılıyor
    const q = query(
        collection(db, NOTIF_COLLECTION),
        where('toUserId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Client-side sıralama (en yeni en üstte)
        data.sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const tb = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return tb - ta;
        });
        // Son 50 bildirim ile sınırla
        callback(data.slice(0, 50));
    }, (error) => {
        console.error('Notification listener error:', error);
        callback([]);
    });
}

export async function sendNotification(toUserId, type, data) {
    if (!toUserId) {
        console.warn('[Bildirim] toUserId boş, bildirim gönderilmedi. type:', type);
        return;
    }

    try {
        const notifData = {
            toUserId,
            type,
            data: data || {},
            read: false,
            createdAt: serverTimestamp()
        };
        console.log('[Bildirim] Gönderiliyor:', type, '→', toUserId);
        const docRef = await addDoc(collection(db, NOTIF_COLLECTION), notifData);
        console.log('[Bildirim] Başarılı! docId:', docRef.id, 'type:', type);
    } catch (error) {
        console.error(`[Bildirim] HATA (type: ${type}, to: ${toUserId}):`, error);
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
