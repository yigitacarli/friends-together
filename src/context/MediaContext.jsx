import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllMedia, addMedia, updateMedia, deleteMedia } from '../services/storage';

const MediaContext = createContext(null);

export function MediaProvider({ children }) {
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
        await addMedia(item);
        await refresh();
    }, [refresh]);

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

    const getByType = useCallback((type) => {
        return items.filter(i => i.type === type);
    }, [items]);

    const search = useCallback((query) => {
        if (!query) return items;
        const q = query.toLowerCase().trim();
        return items.filter(i =>
            i.title?.toLowerCase().includes(q) ||
            i.review?.toLowerCase().includes(q) ||
            i.author?.toLowerCase().includes(q) ||
            i.director?.toLowerCase().includes(q) ||
            i.artist?.toLowerCase().includes(q) ||
            i.tags?.some(t => t.toLowerCase().includes(q))
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
            getByType,
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
