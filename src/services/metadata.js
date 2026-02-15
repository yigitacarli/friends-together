const OMDB_API_BASE = 'https://www.omdbapi.com/';
const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVER = 'https://covers.openlibrary.org/b/id/';

function safeTrim(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function getYearFromDate(dateString) {
    if (!dateString) return '';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return '';
    return String(parsed.getFullYear());
}

function buildCoverUrl(coverId) {
    if (!coverId) return '';
    return `${OPEN_LIBRARY_COVER}${coverId}-L.jpg`;
}

export function extractImdbId(input) {
    const value = safeTrim(input);
    if (!value) return '';
    const match = value.match(/tt\d{6,10}/i);
    return match ? match[0] : '';
}

export async function fetchBookMetadata(queryOrUrl) {
    const query = safeTrim(queryOrUrl);
    if (!query) {
        throw new Error('Lutfen bir kitap adi veya baglanti gir.');
    }

    const url = new URL(OPEN_LIBRARY_SEARCH);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error('Kitap bilgisi alinamadi. Daha sonra tekrar dene.');
    }

    const data = await response.json();
    const first = data?.docs?.[0];
    if (!first) {
        throw new Error('Bu kitap icin sonuc bulunamadi.');
    }

    return {
        title: first.title || '',
        author: Array.isArray(first.author_name) ? first.author_name[0] || '' : '',
        date: first.first_publish_year ? `${first.first_publish_year}-01-01` : '',
        coverUrl: buildCoverUrl(first.cover_i),
        tags: Array.isArray(first.subject) ? first.subject.slice(0, 5) : [],
    };
}

export async function fetchMovieSeriesMetadata(queryOrImdbUrl, type) {
    const query = safeTrim(queryOrImdbUrl);
    if (!query) {
        throw new Error('Lutfen bir IMDb baglantisi veya baslik gir.');
    }

    const apiKey = safeTrim(import.meta.env.VITE_OMDB_API_KEY);
    if (!apiKey) {
        throw new Error('OMDb API anahtari eksik. .env dosyasina VITE_OMDB_API_KEY eklemelisin.');
    }

    const imdbId = extractImdbId(query);
    const url = new URL(OMDB_API_BASE);
    url.searchParams.set('apikey', apiKey);

    if (imdbId) {
        url.searchParams.set('i', imdbId);
    } else {
        url.searchParams.set('t', query);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error('Film/Dizi bilgisi alinamadi. Daha sonra tekrar dene.');
    }

    const data = await response.json();
    if (data?.Response === 'False') {
        throw new Error(data?.Error || 'Kayit bulunamadi.');
    }

    const normalizedType = data?.Type === 'series' ? 'series' : 'movie';
    const seasonCount = data?.totalSeasons || '';
    const year = data?.Year?.split('–')?.[0] || '';
    const date = year ? `${year}-01-01` : '';

    return {
        title: data?.Title || '',
        director: data?.Director && data.Director !== 'N/A' ? data.Director : '',
        seasonCount: normalizedType === 'series' ? seasonCount : '',
        coverUrl: data?.Poster && data.Poster !== 'N/A' ? data.Poster : '',
        date,
        review: data?.Plot && data.Plot !== 'N/A' ? data.Plot : '',
        tags: data?.Genre && data.Genre !== 'N/A'
            ? data.Genre.split(',').map((part) => part.trim()).filter(Boolean)
            : [],
        type: type === 'series' ? 'series' : normalizedType,
        imdbId: data?.imdbID || '',
    };
}

export function mergeTags(currentTags, nextTags) {
    const current = safeTrim(currentTags)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    const combined = [...current, ...(Array.isArray(nextTags) ? nextTags : [])];
    return Array.from(new Set(combined)).join(', ');
}

export function toIsoDateOrFallback(dateCandidate, fallbackDate) {
    const year = safeTrim(dateCandidate);
    if (!year) return fallbackDate;

    if (/^\d{4}-\d{2}-\d{2}$/.test(year)) return year;
    if (/^\d{4}$/.test(year)) return `${year}-01-01`;

    const derivedYear = getYearFromDate(year);
    return derivedYear ? `${derivedYear}-01-01` : fallbackDate;
}

