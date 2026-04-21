import { NextResponse } from "next/server";
import { getAnimeById } from "@/lib/jikan";

// GET /api/sources/<malId>
// Aggregates video sources for a given anime by MAL id.
// Current providers:
//   - YouTube trailer (from Jikan)
//   - AniLibria v1 (search + release by alias) — returns a direct HLS URL if found
//   - Kodik mirror iframe URL with UA-dub translation filter (no auth)
// The actual <video>/<iframe> rendering is handled client-side on /watch/[id].

const UA_TRANSLATION_IDS = "610,735,2398,2224,2095,1948,2501,2600,2344";

type HlsSource = {
  kind: "hls";
  provider: "anilibria";
  url: string;
  label: string;
  externalUrl?: string;
  totalEpisodes?: number;
};
type IframeSource = {
  kind: "iframe";
  provider: "kodik";
  url: string;
  label: string;
};
type TrailerSource = {
  kind: "trailer";
  provider: "youtube";
  url: string;
  label: string;
};
type Source = HlsSource | IframeSource | TrailerSource;

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
    episodes?: Array<{ ordinal?: number; hls_1080?: string; hls_720?: string; hls_480?: string }>;
    episodes_total?: number;
  };
  const episodes = Array.isArray(release.episodes) ? release.episodes : [];
  const sorted = episodes.slice().sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
  const ep = sorted[0];
  const stream = ep?.hls_1080 || ep?.hls_720 || ep?.hls_480;
  if (!stream) return null;

  return {
    kind: "hls",
    provider: "anilibria",
    url: stream,
    label: "Онлайн (HLS · AniLibria)",
    externalUrl: `https://anilibria.top/anime/releases/release/${hit.alias}`,
    totalEpisodes: release.episodes_total ?? sorted.length,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const malId = Number(id);
  if (!Number.isFinite(malId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const anime = await getAnimeById(malId).catch(() => null);
  if (!anime) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const sources: Source[] = [];

  if (anime.trailerEmbedUrl) {
    sources.push({
      kind: "trailer",
      provider: "youtube",
      url: anime.trailerEmbedUrl,
      label: "Трейлер (YouTube)",
    });
  }

  const hls = await anilibriaLookup(anime.titleRomaji || anime.title).catch(
    () => null
  );
  if (hls) sources.unshift(hls);

  sources.push({
    kind: "iframe",
    provider: "kodik",
    url: `https://kodik.biz/find-player?shikimoriID=${malId}&only_translations=${UA_TRANSLATION_IDS}`,
    label: "Kodik · UA-дубляж",
  });

  return NextResponse.json({
    anime: {
      id: anime.id,
      title: anime.title,
      titleRomaji: anime.titleRomaji,
      year: anime.year,
      episodes: anime.episodes,
    },
    sources,
  });
}
