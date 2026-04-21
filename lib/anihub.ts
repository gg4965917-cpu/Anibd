// AniHub API client — https://api.anihub.in.ua
//
// AniHub is a Ukrainian anime aggregator. The API is behind Cloudflare's
// managed challenge, which blocks naked curl-like User-Agents. We send a full
// browser-shaped header set so requests from Vercel's serverless environment
// pass the challenge. Rate limit is 40 req/min per IP.

export type Anime = {
  /** AniHub internal ID (same ID Ashdi.vip indexes by). */
  id: number;
  malId?: number | null;
  anilistId?: number | null;
  imdbId?: string | null;
  slug?: string;
  title: string; // Ukrainian title preferred, falls back to english/original
  titleRomaji?: string; // original (Japanese romaji)
  titleEnglish?: string;
  titleUkrainian?: string;
  year?: number | null;
  type?: string; // tv, movie, ova, ona, special, tv_special
  episodes?: number | null;
  status?: string; // ongoing, completed, announced, dropped
  score?: number | null; // AniHub rating (0..10)
  synopsis?: string | null;
  image: string;
  imageLarge?: string;
  banner?: string;
  genres: string[];
  studios: string[]; // dubbing studios
  hasUkrainianDub?: boolean;
  youtubeTrailerId?: string | null;
};

type AniHubRaw = {
  id: number;
  mal_id?: number | null;
  anilist_id?: number | null;
  imdb_id?: string | null;
  slug?: string;
  title_ukrainian?: string | null;
  title_original?: string | null;
  title_english?: string | null;
  status?: string;
  type?: string;
  year?: number | null;
  has_ukrainian_dub?: boolean;
  poster_url?: string | null;
  banner_url?: string | null;
  episodes_count?: number | null;
  description?: string | null;
  genres?: (string | { name?: string })[];
  dubbing_studios?: ({ name?: string } | string)[];
  rating?: number | null;
  site_rating?: number | null;
  youtube_trailer?: string | null;
};

const BASE = "https://api.anihub.in.ua";

// Browser-shaped headers. Cloudflare blocks generic UAs (curl/node/python) on
// this zone, so we mimic Chrome making a CORS request from the anihub.in.ua
// origin.
const BROWSER_HEADERS: HeadersInit = {
  accept: "application/json, text/plain, */*",
  "accept-language": "uk,en-US;q=0.9,en;q=0.8",
  "user-agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  referer: "https://anihub.in.ua/",
  origin: "https://anihub.in.ua",
  "sec-ch-ua":
    '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Linux"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
};

async function anihub<T>(path: string, revalidate = 1800): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: BROWSER_HEADERS,
    next: { revalidate },
  });
  if (!res.ok) {
    throw new Error(`AniHub ${path} → ${res.status}`);
  }
  return (await res.json()) as T;
}

function pickTitle(raw: AniHubRaw): string {
  return (
    raw.title_ukrainian?.trim() ||
    raw.title_english?.trim() ||
    raw.title_original?.trim() ||
    `#${raw.id}`
  );
}

function normalize(raw: AniHubRaw): Anime {
  const genres = (raw.genres ?? []).map((g) =>
    typeof g === "string" ? g : g?.name ?? ""
  ).filter(Boolean);
  const studios = (raw.dubbing_studios ?? []).map((s) =>
    typeof s === "string" ? s : s?.name ?? ""
  ).filter(Boolean);
  return {
    id: raw.id,
    malId: raw.mal_id ?? null,
    anilistId: raw.anilist_id ?? null,
    imdbId: raw.imdb_id ?? null,
    slug: raw.slug,
    title: pickTitle(raw),
    titleRomaji: raw.title_original ?? undefined,
    titleEnglish: raw.title_english ?? undefined,
    titleUkrainian: raw.title_ukrainian ?? undefined,
    year: raw.year ?? null,
    type: raw.type ?? undefined,
    episodes: raw.episodes_count ?? null,
    status: raw.status ?? undefined,
    score: raw.rating ?? raw.site_rating ?? null,
    synopsis: raw.description ?? null,
    image: raw.poster_url ?? "",
    imageLarge: raw.banner_url ?? raw.poster_url ?? undefined,
    banner: raw.banner_url ?? undefined,
    genres,
    studios,
    hasUkrainianDub: raw.has_ukrainian_dub ?? undefined,
    youtubeTrailerId: raw.youtube_trailer ?? null,
  };
}

// ---------- endpoints ----------

type ListResponse = {
  total?: number;
  page?: number;
  page_size?: number;
  items: AniHubRaw[];
};

async function listEndpoint(
  path: string,
  limit: number,
  revalidate = 1800
): Promise<Anime[]> {
  const data = await anihub<ListResponse | { items?: AniHubRaw[] }>(
    `${path}${path.includes("?") ? "&" : "?"}limit=${limit}`,
    revalidate
  );
  const items = (data as ListResponse).items ?? [];
  return items.map(normalize);
}

export async function getAnimeById(id: number): Promise<Anime> {
  return normalize(await anihub<AniHubRaw>(`/anime/${id}`, 1800));
}

export async function getPopular(limit = 18): Promise<Anime[]> {
  return listEndpoint(`/anime/popular`, limit, 3600);
}

export async function getSeasonal(limit = 24): Promise<Anime[]> {
  return listEndpoint(`/anime/seasonal`, limit, 3600);
}

export async function getNewest(limit = 18): Promise<Anime[]> {
  return listEndpoint(`/anime/newest`, limit, 1800);
}

export async function getAnnounced(limit = 18): Promise<Anime[]> {
  return listEndpoint(`/anime/announced`, limit, 3600);
}

export async function getRecommended(limit = 18): Promise<Anime[]> {
  return listEndpoint(`/anime/recommended`, limit, 3600);
}

// ---------- catalog ----------

export type CatalogFilter = {
  q?: string;
  status?: string; // ongoing | completed | announced | dropped
  type?: string; // tv | tv_special | movie | ova | ona | special
  year?: string;
  season?: string; // winter | spring | summer | fall
  ordering?: string; // -rating, rating, -year, year, -updated_at, ...
  hasUkrainianDub?: boolean;
  page?: number;
  pageSize?: number;
};

export async function filterAnime(
  f: CatalogFilter
): Promise<{ items: Anime[]; hasNextPage: boolean; page: number; total: number }> {
  const pageSize = Math.min(f.pageSize ?? 20, 20); // public API limit
  const params = new URLSearchParams();
  if (f.q) params.set("search", f.q);
  if (f.status) params.set("status", f.status);
  if (f.type) params.set("type", f.type);
  if (f.year) params.set("year", f.year);
  if (f.season) params.set("season_name", f.season);
  if (f.ordering) params.set("ordering", f.ordering);
  if (typeof f.hasUkrainianDub === "boolean") {
    params.set("has_ukrainian_dub", String(f.hasUkrainianDub));
  }
  params.set("page", String(f.page ?? 1));
  params.set("page_size", String(pageSize));

  const data = await anihub<ListResponse>(`/anime?${params.toString()}`, 600);
  const items = (data.items ?? []).map(normalize);
  const total = data.total ?? items.length;
  const page = data.page ?? f.page ?? 1;
  const hasNextPage = page * pageSize < total;
  return { items, hasNextPage, page, total };
}

// ---------- genres ----------

export type Genre = { id: number; slug?: string; name: string; count?: number };

type GenreRaw = {
  id: number;
  slug?: string;
  name: string;
  anime_count?: number;
};

export async function getGenres(): Promise<Genre[]> {
  const data = await anihub<{ items: GenreRaw[] }>(`/genres`, 86400);
  return (data.items ?? []).map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    count: g.anime_count,
  }));
}
