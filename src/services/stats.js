import { getAllMedia, MEDIA_TYPES } from './storage';

export function getCategoryCounts() {
    const items = getAllMedia();
    const counts = {};
    Object.keys(MEDIA_TYPES).forEach(type => {
        counts[type] = items.filter(i => i.type === type).length;
    });
    counts.total = items.length;
    return counts;
}

export function getCategoryDistribution() {
    const counts = getCategoryCounts();
    const total = counts.total || 1;
    return Object.keys(MEDIA_TYPES).map(type => ({
        type,
        ...MEDIA_TYPES[type],
        count: counts[type],
        percentage: Math.round((counts[type] / total) * 100),
    }));
}

export function getStatusDistribution() {
    const items = getAllMedia();
    const statuses = { completed: 0, 'in-progress': 0, planned: 0, dropped: 0 };
    items.forEach(i => {
        if (statuses[i.status] !== undefined) statuses[i.status]++;
    });
    return statuses;
}

export function getAverageRating() {
    const items = getAllMedia().filter(i => i.rating > 0);
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, i) => acc + i.rating, 0);
    return (sum / items.length).toFixed(1);
}

export function getAverageRatingByType() {
    const items = getAllMedia();
    const result = {};
    Object.keys(MEDIA_TYPES).forEach(type => {
        const typed = items.filter(i => i.type === type && i.rating > 0);
        if (typed.length === 0) {
            result[type] = 0;
        } else {
            result[type] = (typed.reduce((a, i) => a + i.rating, 0) / typed.length).toFixed(1);
        }
    });
    return result;
}

export function getRecentMedia(limit = 6) {
    return getAllMedia().slice(0, limit);
}

export function getTopRated(limit = 6) {
    return getAllMedia()
        .filter(i => i.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
}

export function getMonthlyActivity() {
    const items = getAllMedia();
    const months = {};
    items.forEach(item => {
        const d = item.date || item.createdAt?.split('T')[0];
        if (d) {
            const month = d.substring(0, 7); // YYYY-MM
            months[month] = (months[month] || 0) + 1;
        }
    });
    // Return last 6 months
    const sorted = Object.entries(months)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 6)
        .reverse();
    return sorted.map(([month, count]) => ({
        month,
        label: formatMonth(month),
        count,
    }));
}

function formatMonth(ym) {
    const [y, m] = ym.split('-');
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${months[parseInt(m) - 1]} ${y}`;
}
