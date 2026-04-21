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

// Requests go through our same-origin proxy at /api/anihub/* which bypasses
// both Cloudflare's challenge (via allorigins) and browser CORS. On the
// server, relative URLs aren't allowed for fetch, so we resolve against
// NEXT_PUBLIC_SITE_URL (set in Vercel env to https://anibd-one.vercel.app).
function proxyBase(): string {
  if (typeof window !== "undefined") return "/api/anihub";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${site.replace(/\/$/, "")}/api/anihub`;
}

async function anihub<T>(path: string): Promise<T> {
  const res = await fetch(`${proxyBase()}${path}`, {
    headers: {
      accept: "application/json",
    },
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

async function listEndpoint(path: string, limit: number): Promise<Anime[]> {
  const data = await anihub<ListResponse | { items?: AniHubRaw[] }>(
    `${path}${path.includes("?") ? "&" : "?"}limit=${limit}`
  );
  const items = (data as ListResponse).items ?? [];
  return items.map(normalize);
}

export async function getAnimeById(id: number): Promise<Anime> {
  return normalize(await anihub<AniHubRaw>(`/anime/${id}`));
}

export async function getPopular(limit = 18): Promise<Anime[]> {
  return listEndpoint(`/anime/popular`, limit);
}

export async function getSeasonal(limit = 24): Promise<Anime[]> {
  return listEndpoint(`/anime/seasonal`, limit);
}

export async function getNewest(limit = 18): Promise<Anime[]> {
  return listEndpoint(`/anime/newest`, limit);
}

export async function getAnnounced(limit = 18): Promise<Anime[]> {
  return listEndpoint(`/anime/announced`, limit);
}

export async function getRecommended(limit = 18): Promise<Anime[]> {
  return listEndpoint(`/anime/recommended`, limit);
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

  const data = await anihub<ListResponse>(`/anime?${params.toString()}`);
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
  const data = await anihub<{ items: GenreRaw[] }>(`/genres`);
  return (data.items ?? []).map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    count: g.anime_count,
  }));
}
