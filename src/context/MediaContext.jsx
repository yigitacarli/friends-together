import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllMedia, addMedia, updateMedia, deleteMedia } from '../services/storage';
import { useAuth } from './AuthContext';

const MediaContext = createContext(null);

export function MediaProvider({ children }) {
    const { user, profile } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllMedia();
            setItems(data);
        } catch (err) {
            console.error('Failed to load media:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const add = useCallback(async (item) => {
        if (!user || !profile) return;
        await addMedia(item, user.uid, profile.displayName);
        await refresh();
    }, [refresh, user, profile]);

    const update = useCallback(async (id, data) => {
        await updateMedia(id, data);
        await refresh();
    }, [refresh]);

    const remove = useCallback(async (id) => {
        await deleteMedia(id);
        await refresh();
    }, [refresh]);

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
            refresh,
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
