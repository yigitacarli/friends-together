import { MEDIA_TYPES } from './storage';

// All stats functions now take items as a parameter instead of reading from storage directly

export function getCategoryCounts(items) {
    const counts = {};
    Object.keys(MEDIA_TYPES).forEach(type => {
        counts[type] = items.filter(i => i.type === type).length;
    });
    counts.total = items.length;
    return counts;
}

export function getCategoryDistribution(items) {
    const counts = getCategoryCounts(items);
    const total = counts.total || 1;
    return Object.keys(MEDIA_TYPES).map(type => ({
        type,
        ...MEDIA_TYPES[type],
        count: counts[type],
        percentage: Math.round((counts[type] / total) * 100),
    }));
}

export function getStatusDistribution(items) {
    const statuses = { completed: 0, 'in-progress': 0, planned: 0, dropped: 0 };
    items.forEach(i => {
        if (statuses[i.status] !== undefined) statuses[i.status]++;
    });
    return statuses;
}

export function getAverageRating(items) {
    const rated = items.filter(i => i.rating > 0);
    if (rated.length === 0) return 0;
    const sum = rated.reduce((acc, i) => acc + i.rating, 0);
    return (sum / rated.length).toFixed(1);
}

export function getAverageRatingByType(items) {
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

export function getRecentMedia(items, limit = 6) {
    return items.slice(0, limit);
}

export function getTopRated(items, limit = 6) {
    return [...items]
        .filter(i => i.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
}

export function getMonthlyActivity(items) {
    const months = {};
    items.forEach(item => {
        const d = item.date;
        if (d) {
            const month = d.substring(0, 7);
            months[month] = (months[month] || 0) + 1;
        }
    });
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
