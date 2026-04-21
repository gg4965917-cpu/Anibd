import { getAnimeById, type Anime } from "@/lib/jikan";

// Translation IDs used by Kodik player for UA dub teams.
const UA_TRANSLATION_IDS = "610,735,2398,2224,2095,1948,2501,2600,2344";

// Centralized player-source generators. Iframe-based sources are constructed
// dynamically from the MyAnimeList / Shikimori ID — MAL id and Shikimori id are
// the same value on both services, which is how Ashdi.vip and Kodik index
// their catalogs.
export const PLAYER_SOURCES: Record<
  "ashdi" | "kodikUa" | "kodikAll",
  { label: string; urlFor: (malId: number) => string; provider: IframeProvider }
> = {
  ashdi: {
    label: "Ashdi (UA)",
    provider: "ashdi",
    urlFor: (id) => `https://ashdi.vip/vod/${id}`,
  },
  kodikUa: {
    label: "Kodik · UA-дубляж",
    provider: "kodik",
    urlFor: (id) =>
      `https://kodik.biz/find-player?shikimoriID=${id}&only_translations=${UA_TRANSLATION_IDS}`,
  },
  kodikAll: {
    label: "Kodik · усі озвучки",
    provider: "kodik",
    urlFor: (id) => `https://kodik.biz/find-player?shikimoriID=${id}`,
  },
};

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

export type IframeProvider = "kodik" | "ashdi";

export type IframeSource = {
  kind: "iframe";
  provider: IframeProvider;
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
    label: "Онлайн (HLS · AniLibria)",
    firstUrl,
    episodes,
    externalUrl: `https://anilibria.top/anime/releases/release/${hit.alias}`,
    totalEpisodes: release.episodes_total ?? episodes.length,
  };
}

function buildIframeSource(
  key: keyof typeof PLAYER_SOURCES,
  malId: number
): IframeSource {
  const spec = PLAYER_SOURCES[key];
  return {
    kind: "iframe",
    provider: spec.provider,
    url: spec.urlFor(malId),
    label: spec.label,
  };
}

export async function getSourcesForMalId(
  malId: number
): Promise<SourcesPayload | null> {
  const anime = await getAnimeById(malId).catch(() => null);
  if (!anime) return null;

  const sources: Source[] = [];

  // Ashdi.vip is the preferred UA-friendly aggregator → first tab.
  sources.push(buildIframeSource("ashdi", malId));

  // AniLibria HLS (Russian dub with UA subs available server-side) comes next
  // — works even when iframe aggregators are blocked.
  const hls = await anilibriaLookup(anime.titleRomaji || anime.title).catch(
    () => null
  );
  if (hls) sources.push(hls);

  // Kodik UA-only filter.
  sources.push(buildIframeSource("kodikUa", malId));
  // Kodik fallback with every dub.
  sources.push(buildIframeSource("kodikAll", malId));

  if (anime.trailerEmbedUrl) {
    sources.push({
      kind: "trailer",
      provider: "youtube",
      url: anime.trailerEmbedUrl,
      label: "Трейлер (YouTube)",
    });
  }

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
