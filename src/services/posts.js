import { db } from './firebase';
import { sendNotification } from './notifications';
import {
    collection,
    addDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    serverTimestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';

const POSTS_COLLECTION = 'posts';

export async function addPost(content, type, userId, userName, userAvatar) {
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
        content,
        type,
        userId,
        userName,
        userAvatar: userAvatar || '🧑‍💻',
        likes: [],
        upvotes: [],
        downvotes: [],
        createdAt: serverTimestamp()
    });
    return { id: docRef.id };
}

// Used for feed filtering (avoids pagination issues with client-side filtering)
export async function getAllPosts() {
    try {
        const q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc')); // No limit
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error getting all posts: ", error);
        return [];
    }
}

export async function getPosts(lastDoc = null) {
    try {
        let q = query(
            collection(db, POSTS_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }
        const snapshot = await getDocs(q);
        const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        return { posts, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
    } catch (error) {
        console.error("Error getting posts: ", error);
        return { posts: [], lastDoc: null };
    }
}

export async function votePost(postId, userId, voteType, userName, userAvatar) {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const postData = postSnap.data();

    const upvotes = postData.upvotes || postData.likes || [];
    const downvotes = postData.downvotes || [];

    const hasUpvoted = upvotes.includes(userId);
    const hasDownvoted = downvotes.includes(userId);

    if (voteType === 'up') {
        if (hasUpvoted) {
            await updateDoc(postRef, {
                upvotes: arrayRemove(userId),
                likes: arrayRemove(userId)
            });
        } else {
            await updateDoc(postRef, {
                upvotes: arrayUnion(userId),
                likes: arrayUnion(userId),
                downvotes: arrayRemove(userId)
            });

            if (postData.userId !== userId) {
                await sendNotification(postData.userId, 'like', {
                    postId,
                    userId,
                    userName: userName || 'Birisi',
                    userAvatar: userAvatar || '🧑‍💻'
                });
            }
        }
    } else if (voteType === 'down') {
        if (hasDownvoted) {
            await updateDoc(postRef, { downvotes: arrayRemove(userId) });
        } else {
            await updateDoc(postRef, {
                downvotes: arrayUnion(userId),
                upvotes: arrayRemove(userId),
                likes: arrayRemove(userId)
            });
        }
    }
}

export async function deletePost(postId) {
    await deleteDoc(doc(db, POSTS_COLLECTION, postId));
}
