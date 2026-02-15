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

    // Notify owner
    try {
        const parentRef = doc(db, parentCollection, parentId);
        const parentSnap = await getDoc(parentRef);
        if (parentSnap.exists()) {
            const parentData = parentSnap.data();
            // Media items stored userId differently than posts? 
            // Posts: userId. Media: userId. It's consistent.
            if (parentData.userId !== userId) {
                await sendNotification(parentData.userId, 'comment', {
                    postId: parentId, // keep key as postId for compatibility or change logic in notification display
                    userId,
                    userName,
                    userAvatar: comment.userAvatar,
                    content: comment.content,
                    isMedia: parentCollection === 'media-items' // flag for frontend
                });
            }
        }
    } catch (err) {
        console.error('Notification error:', err);
    }

    return { id: docRef.id, ...comment };
}

export async function deleteComment(parentId, commentId, parentCollection = 'posts') {
    await deleteDoc(doc(db, parentCollection, parentId, 'comments', commentId));
}
