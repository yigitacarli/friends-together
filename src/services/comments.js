import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
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
    return { id: docRef.id, ...comment };
}

export async function deleteComment(postId, commentId) {
    await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
}
