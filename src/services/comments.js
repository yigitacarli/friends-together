import { db } from './firebase';
import { sendNotification } from './notifications';
import {
    collection,
    addDoc,
    getDoc,
    doc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';

// Helper to confirm collection name. Default is 'posts' to support legacy calls if any.
const getCommentsRef = (parentId, parentCollection = 'posts') => collection(db, parentCollection, parentId, 'comments');

export async function getComments(parentId, parentCollection = 'posts') {
    try {
        const q = query(getCommentsRef(parentId, parentCollection), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error('getComments error:', err);
        return [];
    }
}

export async function addComment(parentId, content, userId, userName, userAvatar, parentCollection = 'posts') {
    const comment = {
        content: content.trim(),
        userId,
        userName,
        userAvatar: userAvatar || '🧑‍💻',
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(getCommentsRef(parentId, parentCollection), comment);

    // Bildirim gönder (yorum sahibine)
    try {
        const parentRef = doc(db, parentCollection, parentId);
        const parentSnap = await getDoc(parentRef);
        if (parentSnap.exists()) {
            const parentData = parentSnap.data();
            console.log('[Yorum] Parent bulundu. Sahibi:', parentData.userId, 'Yorum yapan:', userId);
            if (parentData.userId && parentData.userId !== userId) {
                console.log('[Yorum] Bildirim gönderiliyor:', parentData.userId);
                await sendNotification(parentData.userId, 'comment', {
                    postId: parentId,
                    userId,
                    userName,
                    userAvatar: comment.userAvatar,
                    content: comment.content,
                    isMedia: parentCollection === 'media-items'
                });
            } else {
                console.log('[Yorum] Bildirim atlandı (kendi gönderisine yorum)');
            }
        } else {
            console.warn('[Yorum] Parent döküman bulunamadı:', parentCollection, parentId);
        }
    } catch (err) {
        console.error('[Yorum] Bildirim hatası:', err);
    }

    return { id: docRef.id, ...comment };
}

export async function deleteComment(parentId, commentId, parentCollection = 'posts') {
    await deleteDoc(doc(db, parentCollection, parentId, 'comments', commentId));
}
