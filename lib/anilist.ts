// AniList GraphQL enrichment layer.
//
// Used to enrich Jikan (MAL) metadata with:
//   - Higher-quality banner images
//   - Trailer info (YouTube / Dailymotion)
//   - Additional synonyms (sometimes includes Cyrillic/Ukrainian titles)
//   - AniList internal id (for deep-links)
//
// AniList is free, unauthenticated. Rate limit: 90 req/min per IP.
// Docs: https://docs.anilist.co/

const ANILIST_GQL = "https://graphql.anilist.co";

export type AniListMedia = {
  id: number;
  idMal?: number | null;
  title?: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
  };
  synonyms?: (string | null)[] | null;
  bannerImage?: string | null;
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
    color?: string | null;
  };
  trailer?: {
    id?: string | null;
    site?: string | null;
    thumbnail?: string | null;
  } | null;
  averageScore?: number | null;
  description?: string | null;
};

type GqlResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  revalidate = 3600
): Promise<T | null> {
  try {
    const res = await fetch(ANILIST_GQL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as GqlResponse<T>;
    if (json.errors?.length) return null;
    return json.data ?? null;
  } catch {
    return null;
  }
}

const MEDIA_FIELDS = /* GraphQL */ `
  fragment MediaBits on Media {
    id
    idMal
    title { romaji english native }
    synonyms
    bannerImage
    coverImage { extraLarge large color }
    trailer { id site thumbnail }
    averageScore
    description(asHtml: false)
  }
`;

/** Fetch AniList media by MAL id, to enrich a Jikan-sourced record. */
export async function anilistByMalId(
  malId: number
): Promise<AniListMedia | null> {
  const query = `
    ${MEDIA_FIELDS}
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) { ...MediaBits }
    }
  `;
  const data = await gql<{ Media: AniListMedia | null }>(query, { idMal: malId });
  return data?.Media ?? null;
}

/** Batch-enrich multiple MAL ids in one request (25 max per page). */
export async function anilistByMalIds(
  malIds: number[]
): Promise<Map<number, AniListMedia>> {
  const out = new Map<number, AniListMedia>();
  const ids = Array.from(new Set(malIds)).filter((n) => Number.isFinite(n));
  if (!ids.length) return out;
  const query = `
    ${MEDIA_FIELDS}
    query ($idMal_in: [Int]) {
      Page(perPage: 50) {
        media(idMal_in: $idMal_in, type: ANIME) { ...MediaBits }
      }
    }
  `;
  // AniList caps perPage at 50 — chunk if needed.
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
  await Promise.all(
    chunks.map(async (chunk) => {
      const data = await gql<{ Page: { media: AniListMedia[] } }>(query, {
        idMal_in: chunk,
      });
      for (const m of data?.Page?.media ?? []) {
        if (m.idMal) out.set(m.idMal, m);
      }
    })
  );
  return out;
}

/** Convert AniList trailer into a YouTube embed URL where possible. */
export function anilistTrailerEmbed(
  trailer: AniListMedia["trailer"]
): string | null {
  if (!trailer?.id) return null;
  if (trailer.site === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${trailer.id}?autoplay=0&modestbranding=1&rel=0`;
  }
  if (trailer.site === "dailymotion") {
    return `https://www.dailymotion.com/embed/video/${trailer.id}`;
  }
  return null;
}
