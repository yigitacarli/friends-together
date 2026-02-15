import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';
import { sendNotification } from './notifications';

const MEDIA_COLLECTION = 'media';

export async function getAllMedia() {
    try {
        const q = query(collection(db, MEDIA_COLLECTION), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error('getAllMedia error:', err);
        return [];
    }
}

export async function getMediaByUser(userId) {
    try {
        const q = query(
            collection(db, MEDIA_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error('getMediaByUser error:', err);
        return [];
    }
}

export async function getMediaById(id) {
    try {
        const snap = await getDoc(doc(db, MEDIA_COLLECTION, id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() };
    } catch (err) {
        console.error('getMediaById error:', err);
        return null;
    }
}

export async function addMedia(item, userId, userDisplayName) {
    const newItem = {
        title: item.title || '',
        type: item.type || 'movie',
        status: item.status || 'completed',
        rating: item.rating || 0,
        review: item.review || '',
        coverUrl: item.coverUrl || '',
        date: item.date || new Date().toISOString().split('T')[0],
        tags: item.tags || [],
        author: item.author || '',
        director: item.director || '',
        platform: item.platform || '',
        seasonCount: item.seasonCount || '',
        studio: item.studio || '',
        artist: item.artist || '',
        techStack: item.techStack || '',
        githubUrl: item.githubUrl || '',
        visibility: item.visibility || 'friends',
        userId: userId,
        userName: userDisplayName,
        upvotes: [],
        downvotes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, MEDIA_COLLECTION), newItem);
    return { id: docRef.id, ...newItem };
}

export async function voteMedia(mediaId, userId, voteType, userName, userAvatar) {
    const mediaRef = doc(db, MEDIA_COLLECTION, mediaId);
    const mediaSnap = await getDoc(mediaRef);
    if (!mediaSnap.exists()) return;
    const mediaData = mediaSnap.data();

    const upvotes = mediaData.upvotes || [];
    const downvotes = mediaData.downvotes || [];

    const hasUpvoted = upvotes.includes(userId);
    const hasDownvoted = downvotes.includes(userId);

    if (voteType === 'up') {
        if (hasUpvoted) {
            // Geri al
            await updateDoc(mediaRef, { upvotes: arrayRemove(userId) });
        } else {
            await updateDoc(mediaRef, {
                upvotes: arrayUnion(userId),
                downvotes: arrayRemove(userId)
            });
            // Bildirim gönder
            if (mediaData.userId && mediaData.userId !== userId) {
                try {
                    await sendNotification(mediaData.userId, 'like', {
                        postId: mediaId,
                        userId,
                        userName: userName || 'Birisi',
                        userAvatar: userAvatar || '🧑‍💻',
                        isMedia: true
                    });
                } catch (e) { console.error('[MediaVote] Bildirim hatası:', e); }
            }
        }
    } else if (voteType === 'down') {
        if (hasDownvoted) {
            await updateDoc(mediaRef, { downvotes: arrayRemove(userId) });
        } else {
            await updateDoc(mediaRef, {
                downvotes: arrayUnion(userId),
                upvotes: arrayRemove(userId)
            });
        }
    }
}

export async function updateMedia(id, updates) {
    const ref = doc(db, MEDIA_COLLECTION, id);
    await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
    return { id, ...updates };
}

export async function deleteMedia(id) {
    await deleteDoc(doc(db, MEDIA_COLLECTION, id));
}

// --- Users ---
export async function getAllUsers() {
    try {
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error('getAllUsers error:', err);
        return [];
    }
}

export const MEDIA_TYPES = {
    book: { label: 'Kitap', icon: '📚', color: 'var(--color-book)' },
    movie: { label: 'Film', icon: '🎬', color: 'var(--color-movie)' },
    game: { label: 'Oyun', icon: '🎮', color: 'var(--color-game)' },
    series: { label: 'Dizi', icon: '📺', color: 'var(--color-series)' },
    anime: { label: 'Anime', icon: '🌸', color: 'var(--color-anime)' },
    music: { label: 'Müzik', icon: '🎵', color: 'var(--color-music)' },
    software: { label: 'Yazılım', icon: '💻', color: 'var(--color-software)' },
};

export const STATUS_TYPES = {
    completed: { label: 'Tamamlandı', color: 'var(--status-completed)', bg: 'rgba(52, 211, 153, 0.15)' },
    'in-progress': { label: 'Devam Ediyor', color: 'var(--status-in-progress)', bg: 'rgba(96, 165, 250, 0.15)' },
    planned: { label: 'Planlanan', color: 'var(--status-planned)', bg: 'rgba(251, 191, 36, 0.15)' },
    dropped: { label: 'Bırakıldı', color: 'var(--status-dropped)', bg: 'rgba(248, 113, 113, 0.15)' },
};

export const TYPE_EXTRA_FIELDS = {
    book: [{ key: 'author', label: 'Yazar', placeholder: 'Yazar adı...', icon: '✍️' }],
    movie: [{ key: 'director', label: 'Yönetmen', placeholder: 'Yönetmen adı...', icon: '🎥' }],
    game: [{ key: 'platform', label: 'Platform', placeholder: 'PC, PS5, Xbox...', icon: '🕹️' }],
    series: [{ key: 'seasonCount', label: 'Sezon', placeholder: 'Sezon sayısı...', icon: '📋' }],
    anime: [{ key: 'studio', label: 'Stüdyo', placeholder: 'Animasyon stüdyosu...', icon: '🏢' }],
    music: [{ key: 'artist', label: 'Sanatçı', placeholder: 'Sanatçı / grup adı...', icon: '🎤' }],
    software: [
        { key: 'techStack', label: 'Teknoloji', placeholder: 'React, Flutter, Python...', icon: '⚙️' },
        { key: 'githubUrl', label: 'GitHub', placeholder: 'https://github.com/...', icon: '🔗' },
    ],
};
