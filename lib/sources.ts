// Video source aggregator for a given anime (keyed by MAL id).
//
// - AniLibria (primary): direct Ukrainian HLS streams — https://anilibria.top
// - YouTube (trailer): optional, from Jikan/AniList
// - Kodik (fallback iframe with Ukrainian dub filter) — https://kodik.info
//
// AniLibria is matched by romaji/English title since MAL ids are not a
// first-class key on their side. We use their v1 search endpoint.

import { getAnimeById, type Anime } from "@/lib/anime";

/** Kodik translation IDs that correspond to Ukrainian dub teams. */
const UA_TRANSLATION_IDS = "610,735,2398,2224,2095,1948,2501,2600,2344";

export type HlsEpisode = {
  ordinal: number;
  hls_1080?: string | null;
  hls_720?: string | null;
  hls_480?: string | null;
};

export type HlsSource = {
  kind: "hls";
  provider: "anilibria";
  label: string;
  firstUrl: string;
  episodes: HlsEpisode[];
  externalUrl?: string;
  totalEpisodes?: number;
};

export type IframeSource = {
  kind: "iframe";
  provider: "kodik";
  label: string;
  url: string;
};

export type TrailerSource = {
  kind: "trailer";
  provider: "youtube";
  label: string;
  url: string;
};

export type Source = HlsSource | IframeSource | TrailerSource;

export type SourcesPayload = {
  anime: Pick<Anime, "id" | "title" | "titleRomaji" | "year" | "episodes">;
  sources: Source[];
};

async function anilibriaLookup(title: string): Promise<HlsSource | null> {
  const q = title.split("(")[0].trim();
  if (!q) return null;
  try {
    const searchRes = await fetch(
      `https://anilibria.top/api/v1/app/search/releases?query=${encodeURIComponent(q)}`,
      { next: { revalidate: 1800 } }
    );
    if (!searchRes.ok) return null;
    const list = (await searchRes.json()) as Array<{ alias?: string }>;
    const hit = Array.isArray(list) ? list[0] : null;
    if (!hit?.alias) return null;

    const rel = await fetch(
      `https://anilibria.top/api/v1/anime/releases/${encodeURIComponent(hit.alias)}`,
      { next: { revalidate: 1800 } }
    );
    if (!rel.ok) return null;
    const release = (await rel.json()) as {
      episodes?: Array<{
        ordinal?: number;
        hls_1080?: string;
        hls_720?: string;
        hls_480?: string;
      }>;
      episodes_total?: number;
    };
    const raw = Array.isArray(release.episodes) ? release.episodes : [];
    const episodes: HlsEpisode[] = raw
      .slice()
      .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
      .filter((e) => e.hls_1080 || e.hls_720 || e.hls_480)
      .map((e) => ({
        ordinal: e.ordinal ?? 0,
        hls_1080: e.hls_1080 ?? null,
        hls_720: e.hls_720 ?? null,
        hls_480: e.hls_480 ?? null,
      }));
    const first = episodes[0];
    const firstUrl = first?.hls_1080 || first?.hls_720 || first?.hls_480;
    if (!firstUrl) return null;

    return {
      kind: "hls",
      provider: "anilibria",
      label: "Онлайн · AniLibria (HLS)",
      firstUrl,
      episodes,
      externalUrl: `https://anilibria.top/anime/releases/release/${hit.alias}`,
      totalEpisodes: release.episodes_total ?? episodes.length,
    };
  } catch {
    return null;
  }
}

export async function getSourcesForMalId(
  malId: number
): Promise<SourcesPayload | null> {
  const anime = await getAnimeById(malId).catch(() => null);
  if (!anime) return null;

  const sources: Source[] = [];

  const hls = await anilibriaLookup(anime.titleRomaji || anime.title);
  if (hls) sources.push(hls);

  if (anime.trailerEmbedUrl) {
    sources.push({
      kind: "trailer",
      provider: "youtube",
      url: anime.trailerEmbedUrl,
      label: "Трейлер (YouTube)",
    });
  }

  sources.push({
    kind: "iframe",
    provider: "kodik",
    url: `https://kodik.info/find-player?shikimoriID=${malId}&only_translations=${UA_TRANSLATION_IDS}`,
    label: "Kodik · UA-дубляж",
  });

  return {
    anime: {
      id: anime.id,
      title: anime.title,
      titleRomaji: anime.titleRomaji,
      year: anime.year,
      episodes: anime.episodes,
    },
    sources,
  };
}
