// Unified metadata facade.
//
// Jikan (MyAnimeList) is the primary source: it has the richest catalog,
// stable numeric ids, and genre/type/year/search filters.
// AniList is used for enrichment: better banners, trailers, and additional
// synonyms (sometimes including Ukrainian spellings).
//
// The canonical anime id across the site is the MAL id.

import {
  anilistByMalId,
  anilistByMalIds,
  anilistTrailerEmbed,
  type AniListMedia,
} from "@/lib/anilist";
import {
  jikanById,
  jikanFilter,
  jikanGenres,
  jikanRecentlyAdded,
  jikanSearch,
  jikanSeasonNow,
  jikanSeasonUpcoming,
  jikanTopAiring,
  jikanTopMovies,
  type JikanAnime,
  type JikanFilter,
  type JikanGenre,
} from "@/lib/jikan";

export type Anime = {
  /** MyAnimeList id — canonical id across the site. */
  id: number;
  anilistId?: number | null;
  title: string;
  titleRomaji?: string;
  titleEnglish?: string;
  titleJapanese?: string;
  /** All alternative titles (synonyms + cross-provider). Includes potential Cyrillic/UA titles from AniList. */
  synonyms?: string[];
  year?: number | null;
  type?: string | null; // MAL: TV | Movie | OVA | Special | ONA | Music | TV Special
  episodes?: number | null;
  status?: string | null; // MAL: "Currently Airing" | "Finished Airing" | "Not yet aired"
  score?: number | null;
  synopsis?: string | null;
  image: string;
  imageLarge?: string;
  banner?: string;
  genres: string[];
  studios: string[];
  trailerEmbedUrl?: string | null;
};

export type Genre = { id: number; name: string; count?: number };

/**
 * AniList description can contain HTML tags (<br>, <i>, ...). Strip them
 * conservatively so we can show the description as plain text.
 */
function stripHtml(s: string | null | undefined): string | null {
  if (!s) return null;
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .trim();
}

function bestCoverImage(j: JikanAnime, a?: AniListMedia | null): {
  image: string;
  imageLarge?: string;
} {
  const jikanLarge =
    j.images?.webp?.large_image_url ||
    j.images?.jpg?.large_image_url ||
    undefined;
  const jikanSmall =
    j.images?.webp?.image_url || j.images?.jpg?.image_url || "";
  const anilistLarge = a?.coverImage?.extraLarge || a?.coverImage?.large || undefined;
  return {
    image: anilistLarge || jikanLarge || jikanSmall,
    imageLarge: anilistLarge || jikanLarge,
  };
}

function mergeSynonyms(j: JikanAnime, a?: AniListMedia | null): string[] {
  const s = new Set<string>();
  for (const x of j.title_synonyms ?? []) if (x) s.add(x);
  for (const x of a?.synonyms ?? []) if (x) s.add(x);
  if (a?.title?.romaji) s.add(a.title.romaji);
  if (a?.title?.english) s.add(a.title.english);
  if (a?.title?.native) s.add(a.title.native);
  // Drop the primary titles from synonyms.
  if (j.title) s.delete(j.title);
  if (j.title_english) s.delete(j.title_english);
  if (j.title_japanese) s.delete(j.title_japanese);
  return Array.from(s);
}

export function mergeJikanAnilist(j: JikanAnime, a?: AniListMedia | null): Anime {
  const cover = bestCoverImage(j, a);
  const synopsis = j.synopsis || stripHtml(a?.description) || null;
  return {
    id: j.mal_id,
    anilistId: a?.id ?? null,
    title: j.title_english || j.title,
    titleRomaji: j.title,
    titleEnglish: j.title_english ?? undefined,
    titleJapanese: j.title_japanese ?? undefined,
    synonyms: mergeSynonyms(j, a),
    year: j.year ?? null,
    type: j.type ?? null,
    episodes: j.episodes ?? null,
    status: j.status ?? null,
    score: j.score ?? (a?.averageScore ? a.averageScore / 10 : null),
    synopsis,
    image: cover.image,
    imageLarge: cover.imageLarge,
    banner: a?.bannerImage ?? undefined,
    genres: (j.genres ?? []).map((g) => g.name),
    studios: (j.studios ?? []).map((s) => s.name),
    trailerEmbedUrl:
      j.trailer?.embed_url || anilistTrailerEmbed(a?.trailer) || null,
  };
}

async function enrichMany(items: JikanAnime[]): Promise<Anime[]> {
  if (!items.length) return [];
  const enrichments = await anilistByMalIds(items.map((j) => j.mal_id));
  return items.map((j) => mergeJikanAnilist(j, enrichments.get(j.mal_id) ?? null));
}

// -------- Home rails --------

export async function getPopular(limit = 5): Promise<Anime[]> {
  const items = await jikanTopAiring(limit).catch(() => []);
  return enrichMany(items);
}

export async function getSeasonal(limit = 24): Promise<Anime[]> {
  const items = await jikanSeasonNow(limit).catch(() => []);
  return enrichMany(items);
}

export async function getNewest(limit = 18): Promise<Anime[]> {
  const items = await jikanRecentlyAdded(limit).catch(() => []);
  return enrichMany(items);
}

export async function getAnnounced(limit = 18): Promise<Anime[]> {
  const items = await jikanSeasonUpcoming(limit).catch(() => []);
  return enrichMany(items);
}

export async function getTopMovies(limit = 18): Promise<Anime[]> {
  const items = await jikanTopMovies(limit).catch(() => []);
  return enrichMany(items);
}

// -------- Detail / search / filter --------

export async function getAnimeById(malId: number): Promise<Anime | null> {
  const j = await jikanById(malId);
  if (!j) return null;
  const a = await anilistByMalId(malId).catch(() => null);
  return mergeJikanAnilist(j, a);
}

export async function searchAnime(q: string, limit = 24): Promise<Anime[]> {
  if (!q.trim()) return [];
  const items = await jikanSearch(q, limit).catch(() => []);
  return enrichMany(items);
}

export type FilterArgs = {
  q?: string;
  genres?: string; // comma-separated MAL genre ids OR genre names (names are resolved)
  type?: string;
  year?: string;
  status?: string;
  orderBy?: string;
  sort?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export async function filterAnime(args: FilterArgs): Promise<{
  items: Anime[];
  hasNextPage: boolean;
  page: number;
}> {
  const jikanArgs: JikanFilter = {
    q: args.q,
    genres: args.genres,
    type: args.type,
    year: args.year,
    status: args.status,
    orderBy: args.orderBy,
    sort: args.sort,
    page: args.page,
    limit: args.limit,
  };
  const { items, pagination } = await jikanFilter(jikanArgs).catch(() => ({
    items: [] as JikanAnime[],
    pagination: {} as { current_page?: number; has_next_page?: boolean },
  }));
  return {
    items: await enrichMany(items),
    hasNextPage: Boolean(pagination.has_next_page),
    page: pagination.current_page ?? args.page ?? 1,
  };
}

export async function getGenres(): Promise<Genre[]> {
  const raw: JikanGenre[] = await jikanGenres().catch(() => []);
  return raw.map((g) => ({ id: g.mal_id, name: g.name, count: g.count }));
}

/**
 * Resolve a list of genre tokens (either numeric MAL ids or human names)
 * against the canonical MAL genre list, returning a comma-separated
 * list of numeric ids ready to pass to `filterAnime({ genres })`.
 */
export function resolveGenreIds(
  raw: string | undefined,
  all: Genre[]
): string | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const ids: string[] = [];
  for (const p of parts) {
    if (/^\d+$/.test(p)) {
      ids.push(p);
    } else {
      const match = all.find((g) => g.name.toLowerCase() === p.toLowerCase());
      if (match) ids.push(String(match.id));
    }
  }
  return ids.length ? ids.join(",") : undefined;
}
