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

const getCommentsRef = (postId) => collection(db, 'posts', postId, 'comments');

export async function getComments(postId) {
    try {
        const q = query(getCommentsRef(postId), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error('getComments error:', err);
        return [];
    }
}

export async function addComment(postId, content, userId, userName, userAvatar) {
    const comment = {
        content: content.trim(),
        userId,
        userName,
        userAvatar: userAvatar || '🧑‍💻',
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(getCommentsRef(postId), comment);

    // Notify post owner
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const postData = postSnap.data();
            if (postData.userId !== userId) {
                await sendNotification(postData.userId, 'comment', {
                    postId,
                    userId,
                    userName,
                    userAvatar: comment.userAvatar,
                    content: comment.content
                });
            }
        }
    } catch (err) {
        console.error('Notification error:', err);
    }

    return { id: docRef.id, ...comment };
}

export async function deleteComment(postId, commentId) {
    await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
}
