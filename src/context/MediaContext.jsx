import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { addMedia, updateMedia, deleteMedia } from '../services/storage';
import { useAuth } from './AuthContext';

const MediaContext = createContext(null);

export function MediaProvider({ children }) {
    const { user, profile } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Realtime listener — anında güncellenir
    useEffect(() => {
        const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setItems(data);
            setLoading(false);
        }, (err) => {
            console.error('Realtime listener error:', err);
            setLoading(false);
        });
        return unsub;
    }, []);

    const add = useCallback(async (item) => {
        if (!user || !profile) return;
        await addMedia(item, user.uid, profile.displayName);
    }, [user, profile]);

    const update = useCallback(async (id, data) => {
        await updateMedia(id, data);
    }, []);

    const remove = useCallback(async (id) => {
        await deleteMedia(id);
    }, []);

    const getById = useCallback((id) => {
        return items.find(i => i.id === id) || null;
    }, [items]);

    const getByUser = useCallback((userId) => {
        return items.filter(i => i.userId === userId);
    }, [items]);

    const search = useCallback((q) => {
        if (!q) return items;
        const query = q.toLowerCase().trim();
        return items.filter(i =>
            i.title?.toLowerCase().includes(query) ||
            i.review?.toLowerCase().includes(query) ||
            i.author?.toLowerCase().includes(query) ||
            i.director?.toLowerCase().includes(query) ||
            i.artist?.toLowerCase().includes(query) ||
            i.userName?.toLowerCase().includes(query) ||
            i.tags?.some(t => t.toLowerCase().includes(query))
        );
    }, [items]);

    return (
        <MediaContext.Provider value={{
            items,
            loading,
            add,
            update,
            remove,
            getById,
            getByUser,
            search,
        }}>
            {children}
        </MediaContext.Provider>
    );
}

export function useMedia() {
    const ctx = useContext(MediaContext);
    if (!ctx) throw new Error('useMedia must be used within MediaProvider');
    return ctx;
}
