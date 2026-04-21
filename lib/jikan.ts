// Tiny Jikan (MyAnimeList) v4 client. Public, no auth. Cached on the server via
// Next's fetch cache. Keep queries minimal — free tier has rate limits.

export type Anime = {
  id: number;
  title: string;
  titleRomaji?: string;
  titleUa?: string;
  year?: number | null;
  type?: string;
  episodes?: number | null;
  status?: string;
  score?: number | null;
  synopsis?: string | null;
  image: string;
  imageLarge?: string;
  genres: string[];
  studios: string[];
  trailerEmbedUrl?: string | null;
  trailerId?: string | null;
};

type JikanAnime = {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  images?: { webp?: { large_image_url?: string; image_url?: string }; jpg?: { large_image_url?: string; image_url?: string } };
  year?: number | null;
  type?: string;
  episodes?: number | null;
  status?: string;
  score?: number | null;
  synopsis?: string | null;
  genres?: { name: string }[];
  studios?: { name: string }[];
  trailer?: { embed_url?: string | null; youtube_id?: string | null };
};

const BASE = "https://api.jikan.moe/v4";

function normalize(raw: JikanAnime): Anime {
  const img =
    raw.images?.webp?.large_image_url ||
    raw.images?.jpg?.large_image_url ||
    raw.images?.webp?.image_url ||
    raw.images?.jpg?.image_url ||
    "";
  return {
    id: raw.mal_id,
    title: raw.title_english || raw.title,
    titleRomaji: raw.title,
    year: raw.year ?? null,
    type: raw.type,
    episodes: raw.episodes ?? null,
    status: raw.status,
    score: raw.score ?? null,
    synopsis: raw.synopsis ?? null,
    image: img,
    imageLarge: raw.images?.webp?.large_image_url || raw.images?.jpg?.large_image_url,
    genres: raw.genres?.map((g) => g.name) ?? [],
    studios: raw.studios?.map((s) => s.name) ?? [],
    trailerEmbedUrl: raw.trailer?.embed_url ?? null,
    trailerId: raw.trailer?.youtube_id ?? null,
  };
}

async function jikan<T>(path: string, revalidate = 3600): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Jikan ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getTopAiring(limit = 10): Promise<Anime[]> {
  const data = await jikan<{ data: JikanAnime[] }>(
    `/top/anime?filter=airing&limit=${limit}`
  );
  return data.data.map(normalize);
}

export async function getLatestUpdates(limit = 24): Promise<Anime[]> {
  const data = await jikan<{ data: JikanAnime[] }>(
    `/seasons/now?limit=${limit}`
  );
  return data.data.map(normalize);
}

export async function getAnimeById(id: number): Promise<Anime> {
  const data = await jikan<{ data: JikanAnime }>(`/anime/${id}/full`);
  return normalize(data.data);
}

export async function searchAnime(query: string, limit = 24): Promise<Anime[]> {
  const data = await jikan<{ data: JikanAnime[] }>(
    `/anime?q=${encodeURIComponent(query)}&limit=${limit}&order_by=popularity`
  );
  return data.data.map(normalize);
}

export type CatalogFilter = {
  q?: string;
  genres?: string; // comma-separated Jikan genre IDs
  type?: string; // tv, movie, ova, special, ona, music
  year?: string; // "2024"
  orderBy?: string;
  sort?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export async function filterAnime(
  filter: CatalogFilter
): Promise<{ items: Anime[]; hasNextPage: boolean; page: number }> {
  const limit = Math.min(filter.limit ?? 24, 25);
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.genres) params.set("genres", filter.genres);
  if (filter.type) params.set("type", filter.type);
  if (filter.year) {
    params.set("start_date", `${filter.year}-01-01`);
    params.set("end_date", `${filter.year}-12-31`);
  }
  params.set("order_by", filter.orderBy ?? "popularity");
  params.set("sort", filter.sort ?? "asc");
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(limit));
  params.set("sfw", "true");

  const data = await jikan<{
    data: JikanAnime[];
    pagination?: { has_next_page?: boolean; current_page?: number };
  }>(`/anime?${params.toString()}`, 600);
  return {
    items: data.data.map(normalize),
    hasNextPage: Boolean(data.pagination?.has_next_page),
    page: data.pagination?.current_page ?? filter.page ?? 1,
  };
}

export type Genre = { mal_id: number; name: string; count?: number };

export async function getGenres(): Promise<Genre[]> {
  const data = await jikan<{ data: Genre[] }>(`/genres/anime`, 86400);
  return data.data;
}
