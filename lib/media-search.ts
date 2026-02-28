import type { PostContentType } from "@/types/firestore";

export type CatalogSearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  year?: string;
  coverUrl?: string;
};

type OpenLibraryResponse = {
  docs?: Array<{
    key?: string;
    title?: string;
    author_name?: string[];
    first_publish_year?: number;
    cover_i?: number;
  }>;
};

type ItunesResponse = {
  results?: Array<{
    trackId?: number;
    trackName?: string;
    artistName?: string;
    releaseDate?: string;
    artworkUrl100?: string;
  }>;
};

function toYear(value?: string | number): string | undefined {
  if (!value) return undefined;
  if (typeof value === "number") return String(value);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return String(parsed.getFullYear());
}

async function searchBooks(queryText: string): Promise<CatalogSearchItem[]> {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(queryText)}&limit=12`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Kitap arama servisine ulaşılamadı.");
  }

  const payload = (await response.json()) as OpenLibraryResponse;
  return (payload.docs ?? [])
    .filter((item) => (item.title ?? "").trim().length > 0)
    .map((item, index) => ({
      id: item.key ?? `book-${index}`,
      title: item.title ?? "Kitap",
      subtitle: item.author_name?.[0],
      year: toYear(item.first_publish_year),
      coverUrl: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : undefined,
    }));
}

async function searchMovies(queryText: string): Promise<CatalogSearchItem[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(queryText)}&entity=movie&limit=12`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Film arama servisine ulaşılamadı.");
  }

  const payload = (await response.json()) as ItunesResponse;
  return (payload.results ?? [])
    .filter((item) => (item.trackName ?? "").trim().length > 0)
    .map((item, index) => ({
      id: String(item.trackId ?? `movie-${index}`),
      title: item.trackName ?? "Film",
      subtitle: item.artistName,
      year: toYear(item.releaseDate),
      coverUrl: item.artworkUrl100?.replace("100x100bb.jpg", "600x600bb.jpg"),
    }));
}

export async function searchCatalog(
  type: PostContentType,
  queryText: string,
): Promise<CatalogSearchItem[]> {
  const cleanQuery = queryText.trim();
  if (cleanQuery.length < 2) {
    return [];
  }

  if (type === "kitap") {
    return searchBooks(cleanQuery);
  }

  if (type === "film") {
    return searchMovies(cleanQuery);
  }

  return [];
}
