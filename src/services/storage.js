const STORAGE_KEY = 'harmonic_media_items';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getAllMedia() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function getMediaById(id) {
    const items = getAllMedia();
    return items.find(item => item.id === id) || null;
}

export function addMedia(item) {
    const items = getAllMedia();
    const newItem = {
        id: generateId(),
        title: item.title || '',
        type: item.type || 'movie',
        status: item.status || 'completed',
        rating: item.rating || 0,
        review: item.review || '',
        coverUrl: item.coverUrl || '',
        date: item.date || new Date().toISOString().split('T')[0],
        tags: item.tags || [],
        // Category-specific extra fields
        author: item.author || '',
        director: item.director || '',
        platform: item.platform || '',
        seasonCount: item.seasonCount || '',
        studio: item.studio || '',
        artist: item.artist || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return newItem;
}

export function updateMedia(id, updates) {
    const items = getAllMedia();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = {
        ...items[index],
        ...updates,
        id, // don't allow id change
        updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return items[index];
}

export function deleteMedia(id) {
    const items = getAllMedia();
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
}

export function getMediaByType(type) {
    return getAllMedia().filter(item => item.type === type);
}

export function searchMedia(query) {
    const q = query.toLowerCase().trim();
    if (!q) return getAllMedia();
    return getAllMedia().filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.review?.toLowerCase().includes(q) ||
        item.author?.toLowerCase().includes(q) ||
        item.director?.toLowerCase().includes(q) ||
        item.artist?.toLowerCase().includes(q) ||
        item.tags?.some(tag => tag.toLowerCase().includes(q))
    );
}

export const MEDIA_TYPES = {
    book: { label: 'Kitap', icon: '📚', color: 'var(--color-book)' },
    movie: { label: 'Film', icon: '🎬', color: 'var(--color-movie)' },
    game: { label: 'Oyun', icon: '🎮', color: 'var(--color-game)' },
    series: { label: 'Dizi', icon: '📺', color: 'var(--color-series)' },
    anime: { label: 'Anime', icon: '🌸', color: 'var(--color-anime)' },
    music: { label: 'Müzik', icon: '🎵', color: 'var(--color-music)' },
};

export const STATUS_TYPES = {
    completed: { label: 'Tamamlandı', color: 'var(--status-completed)', bg: 'rgba(52, 211, 153, 0.15)' },
    'in-progress': { label: 'Devam Ediyor', color: 'var(--status-in-progress)', bg: 'rgba(96, 165, 250, 0.15)' },
    planned: { label: 'Planlanan', color: 'var(--status-planned)', bg: 'rgba(251, 191, 36, 0.15)' },
    dropped: { label: 'Bırakıldı', color: 'var(--status-dropped)', bg: 'rgba(248, 113, 113, 0.15)' },
};

// Category-specific extra fields
export const TYPE_EXTRA_FIELDS = {
    book: [{ key: 'author', label: 'Yazar', placeholder: 'Yazar adı...', icon: '✍️' }],
    movie: [{ key: 'director', label: 'Yönetmen', placeholder: 'Yönetmen adı...', icon: '🎥' }],
    game: [{ key: 'platform', label: 'Platform', placeholder: 'PC, PS5, Xbox...', icon: '🕹️' }],
    series: [{ key: 'seasonCount', label: 'Sezon', placeholder: 'Sezon sayısı...', icon: '📋' }],
    anime: [{ key: 'studio', label: 'Stüdyo', placeholder: 'Animasyon stüdyosu...', icon: '🏢' }],
    music: [{ key: 'artist', label: 'Sanatçı', placeholder: 'Sanatçı / grup adı...', icon: '🎤' }],
};
