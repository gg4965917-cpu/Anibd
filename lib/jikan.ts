// Jikan (MyAnimeList) v4 REST client.
//
// Jikan is an unofficial, public, unauthenticated wrapper over the MAL
// website. Rate limit: 3 req/s, 60 req/min (free tier). We rely on Next's
// fetch cache to avoid hammering it.
//
// Docs: https://docs.api.jikan.moe/

const BASE = "https://api.jikan.moe/v4";

export type JikanImages = {
  jpg?: {
    image_url?: string | null;
    small_image_url?: string | null;
    large_image_url?: string | null;
  };
  webp?: {
    image_url?: string | null;
    small_image_url?: string | null;
    large_image_url?: string | null;
  };
};

export type JikanAnime = {
  mal_id: number;
  url?: string;
  images?: JikanImages;
  trailer?: {
    youtube_id?: string | null;
    url?: string | null;
    embed_url?: string | null;
  };
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  title_synonyms?: string[];
  type?: string | null;
  episodes?: number | null;
  status?: string | null;
  airing?: boolean;
  duration?: string | null;
  rating?: string | null;
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  synopsis?: string | null;
  background?: string | null;
  year?: number | null;
  season?: string | null;
  genres?: { mal_id: number; name: string }[];
  themes?: { mal_id: number; name: string }[];
  studios?: { mal_id: number; name: string }[];
  producers?: { mal_id: number; name: string }[];
};

export type JikanGenre = { mal_id: number; name: string; count?: number };

type Pagination = {
  current_page?: number;
  has_next_page?: boolean;
  last_visible_page?: number;
  items?: { count?: number; total?: number; per_page?: number };
};

async function jikan<T>(path: string, revalidate = 3600): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Jikan ${path} → HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function jikanTopAiring(limit = 10): Promise<JikanAnime[]> {
  const data = await jikan<{ data: JikanAnime[] }>(
    `/top/anime?filter=airing&limit=${limit}`,
    1800
  );
  return data.data;
}

export async function jikanSeasonNow(limit = 24): Promise<JikanAnime[]> {
  const data = await jikan<{ data: JikanAnime[] }>(
    `/seasons/now?limit=${limit}`,
    1800
  );
  return data.data;
}

export async function jikanSeasonUpcoming(limit = 18): Promise<JikanAnime[]> {
  const data = await jikan<{ data: JikanAnime[] }>(
    `/seasons/upcoming?limit=${limit}`,
    1800
  );
  return data.data;
}

export async function jikanTopMovies(limit = 18): Promise<JikanAnime[]> {
  const data = await jikan<{ data: JikanAnime[] }>(
    `/top/anime?type=movie&filter=bypopularity&limit=${limit}`,
    3600
  );
  return data.data;
}

export async function jikanRecentlyAdded(limit = 18): Promise<JikanAnime[]> {
  // No dedicated "recently added" endpoint on MAL; newest-by-start_date proxy.
  const data = await jikan<{ data: JikanAnime[] }>(
    `/anime?order_by=start_date&sort=desc&limit=${limit}&sfw=true`,
    900
  );
  return data.data;
}

export async function jikanById(malId: number): Promise<JikanAnime | null> {
  try {
    const data = await jikan<{ data: JikanAnime }>(
      `/anime/${malId}/full`,
      3600
    );
    return data.data;
  } catch {
    return null;
  }
}

export async function jikanSearch(
  query: string,
  limit = 24
): Promise<JikanAnime[]> {
  const data = await jikan<{ data: JikanAnime[] }>(
    `/anime?q=${encodeURIComponent(query)}&limit=${limit}&order_by=popularity&sort=asc&sfw=true`,
    600
  );
  return data.data;
}

export type JikanFilter = {
  q?: string;
  genres?: string; // comma-separated MAL genre IDs
  type?: string; // tv | movie | ova | special | ona | music | tv_special
  year?: string;
  status?: string; // airing | complete | upcoming
  orderBy?: string; // score | popularity | start_date | title | rank
  sort?: "asc" | "desc";
  page?: number;
  limit?: number; // Jikan caps at 25
};

export async function jikanFilter(filter: JikanFilter): Promise<{
  items: JikanAnime[];
  pagination: Pagination;
}> {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.genres) params.set("genres", filter.genres);
  // "tv_special" isn't a valid Jikan value — collapse to "special".
  if (filter.type) {
    params.set("type", filter.type === "tv_special" ? "special" : filter.type);
  }
  if (filter.year) {
    params.set("start_date", `${filter.year}-01-01`);
    params.set("end_date", `${filter.year}-12-31`);
  }
  if (filter.status) params.set("status", filter.status);
  params.set("order_by", filter.orderBy ?? "popularity");
  params.set(
    "sort",
    filter.sort ?? (filter.orderBy === "score" ? "desc" : "asc")
  );
  params.set("page", String(filter.page ?? 1));
  params.set("limit", String(Math.min(filter.limit ?? 24, 25)));
  params.set("sfw", "true");

  const data = await jikan<{ data: JikanAnime[]; pagination?: Pagination }>(
    `/anime?${params.toString()}`,
    600
  );
  return { items: data.data, pagination: data.pagination ?? {} };
}

export async function jikanGenres(): Promise<JikanGenre[]> {
  const data = await jikan<{ data: JikanGenre[] }>(`/genres/anime`, 86400);
  return data.data;
}
