import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
} from 'firebase/firestore';

const POSTS_COLLECTION = 'posts';

export const POST_TYPES = {
    thought: { label: 'Düşünce', icon: '💭', color: '#a78bfa' },
    review: { label: 'İnceleme', icon: '📝', color: '#60a5fa' },
    story: { label: 'Hikaye', icon: '📖', color: '#f472b6' },
};

export async function getAllPosts() {
    try {
        const q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error('getAllPosts error:', err);
        return [];
    }
}

export async function createPost(post, userId, userName, userAvatar) {
    const newPost = {
        content: post.content || '',
        postType: post.postType || 'thought',
        userId,
        userName,
        userAvatar: userAvatar || '🧑‍💻',
        likes: [],
        likeCount: 0,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), newPost);
    return { id: docRef.id, ...newPost };
}

const NOTIF_COLLECTION = 'notifications';
import { sendNotification } from './notifications';

export async function likePost(postId, userId, userName, userAvatar) { // Updated params
    const postRef = doc(db, POSTS_COLLECTION, postId);

    // Get post to know owner
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const postData = postSnap.data();

    await updateDoc(postRef, {
        likes: arrayUnion(userId)
    });

    // Notify if not self
    if (postData.userId !== userId) {
        await sendNotification(postData.userId, 'like', {
            postId,
            userId,
            userName,
            userAvatar: userAvatar || '🧑‍💻'
        });
    }
    // Also update likeCount manually (read current and increment)
    // For simplicity, we refetch after like
}

export async function unlikePost(postId, userId) {
    const ref = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(ref, {
        likes: arrayRemove(userId),
    });
}

export async function deletePost(postId) {
    await deleteDoc(doc(db, POSTS_COLLECTION, postId));
}
