import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDocs,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';

const EVENTS_COLLECTION = 'events';

// Create a new event
export async function createEvent(data, userId, userName, userAvatar) {
    const newEvent = {
        ...data,
        userId,
        userName,
        userAvatar,
        participants: { [userId]: 'yes' }, // creator auto-joins
        createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), newEvent);
    return { id: docRef.id, ...newEvent };
}

// Get events where user is invited OR is the creator
// Since Firestore doesn't support logical OR directly in where clause easily for array-contains + owner check without complex indexing,
// we'll fetch two queries and merge them client-side or check logical OR after fetch.
// Actually, simpler approach: inviting creator to their own event in 'invitedUserIds' avoids complex queries.
export async function getMyEvents(userId) {
    try {
        const q = query(
            collection(db, EVENTS_COLLECTION),
            where('invitedUserIds', 'array-contains', userId),
            orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error('getEvents error:', err);
        return [];
    }
}

// Respond to an event
export async function respondToEvent(eventId, userId, status) {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    // We use dot notation to update a specific key in a map field
    await updateDoc(eventRef, {
        [`participants.${userId}`]: status
    });
}

// Delete event
export async function deleteEvent(eventId) {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
}
