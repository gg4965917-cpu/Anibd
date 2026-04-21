"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAnimeById, type Anime } from "@/lib/anihub";
import { VideoPlayer } from "@/components/VideoPlayer";
import { translateStatus, translateType } from "@/lib/i18n";

export function WatchClient({ anihubId }: { anihubId: number }) {
  const [anime, setAnime] = useState<Anime | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(anihubId)) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getAnimeById(anihubId)
      .then((data) => {
        if (!cancelled) {
          setAnime(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [anihubId]);

  useEffect(() => {
    if (anime?.title) {
      document.title = `Дивитися ${anime.title} українською онлайн · Anime Hub`;
    }
  }, [anime?.title]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <VideoPlayer anihubId={anihubId} title={anime?.title ?? `#${anihubId}`} />

          {anime ? (
            <>
              <h1 className="mt-6 text-3xl font-bold tracking-tight">{anime.title}</h1>
              {anime.titleRomaji && anime.titleRomaji !== anime.title && (
                <div className="text-sm text-slate-400">{anime.titleRomaji}</div>
              )}
              {anime.titleEnglish && anime.titleEnglish !== anime.title && (
                <div className="text-xs text-slate-500">{anime.titleEnglish}</div>
              )}
              {anime.synopsis && (
                <p className="mt-4 whitespace-pre-line text-slate-300">
                  {anime.synopsis}
                </p>
              )}
            </>
          ) : loading ? (
            <div className="mt-6 space-y-3">
              <div className="h-8 w-3/4 animate-pulse rounded bg-slate-800" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800" />
              <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-10/12 animate-pulse rounded bg-slate-800" />
            </div>
          ) : error ? (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
              <h1 className="text-xl font-semibold">Аніме #{anihubId}</h1>
              <p className="mt-1 text-slate-400">
                Метадані не завантажились (перевірте зʼєднання з api.anihub.in.ua).
                Плеєр вище має працювати незалежно від метаданих.
              </p>
            </div>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-sm">
          {anime ? (
            <>
              {anime.image && (
                <div className="relative mb-4 aspect-[2/3] w-full overflow-hidden rounded-xl">
                  <Image
                    src={anime.image}
                    alt={anime.title}
                    fill
                    sizes="320px"
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              <dl className="space-y-2 text-slate-300">
                {typeof anime.score === "number" && anime.score > 0 && (
                  <Row label="Оцінка">★ {anime.score.toFixed(2)}</Row>
                )}
                {anime.type && <Row label="Тип">{translateType(anime.type)}</Row>}
                {anime.year && <Row label="Рік">{anime.year}</Row>}
                {anime.episodes != null && <Row label="Епізоди">{anime.episodes}</Row>}
                {anime.status && (
                  <Row label="Статус">{translateStatus(anime.status)}</Row>
                )}
                {anime.hasUkrainianDub && (
                  <Row label="Озвучка">
                    <span className="rounded-md bg-brand/15 px-1.5 py-0.5 text-[11px] font-semibold text-brand">
                      українська
                    </span>
                  </Row>
                )}
                {anime.studios.length > 0 && (
                  <Row label="Студія">{anime.studios.join(", ")}</Row>
                )}
                {anime.genres.length > 0 && (
                  <Row label="Жанри">
                    <span className="flex flex-wrap gap-1.5">
                      {anime.genres.map((g) => (
                        <Link
                          key={g}
                          href={`/catalog?q=${encodeURIComponent(g)}`}
                          className="rounded-md bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          {g}
                        </Link>
                      ))}
                    </span>
                  </Row>
                )}
              </dl>
              <div className="mt-5 flex flex-col gap-2">
                {anime.slug && (
                  <a
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs text-slate-200 hover:bg-slate-800"
                    href={`https://anihub.in.ua/anime/${anime.slug}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    AniHub
                  </a>
                )}
                {anime.malId && (
                  <a
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs text-slate-200 hover:bg-slate-800"
                    href={`https://myanimelist.net/anime/${anime.malId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    MyAnimeList
                  </a>
                )}
                {anime.anilistId && (
                  <a
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs text-slate-200 hover:bg-slate-800"
                    href={`https://anilist.co/anime/${anime.anilistId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    AniList
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-slate-800" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800" />
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[auto,1fr] items-start gap-x-3 gap-y-1">
      <dt className="text-slate-400">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
