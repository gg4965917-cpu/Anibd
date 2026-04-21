import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAnimeById } from "@/lib/jikan";

export const revalidate = 1800;

type Params = { id: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { id } = await params;
  const anime = await getAnimeById(Number(id)).catch(() => null);
  if (!anime) return { title: "Аніме" };
  return {
    title: anime.title,
    description: anime.synopsis?.slice(0, 160) ?? undefined,
    openGraph: {
      title: anime.title,
      description: anime.synopsis?.slice(0, 200) ?? undefined,
      images: anime.image ? [{ url: anime.image }] : [],
    },
  };
}

export default async function WatchPage(
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  const anime = await getAnimeById(Number(id)).catch(() => null);

  if (!anime) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Аніме не знайдено</h1>
        <p className="mt-2 text-slate-400">
          Перевірте посилання або поверніться до{" "}
          <Link className="text-brand hover:underline" href="/catalog">каталогу</Link>.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            {anime.trailerEmbedUrl ? (
              <iframe
                src={anime.trailerEmbedUrl}
                title={`Трейлер ${anime.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-400">
                Плеєр зʼявиться у наступній ітерації (AniLibria HLS + Kodik + YouTube).
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-slate-800/80 px-2 py-1">Онлайн (HLS)</span>
            <span className="rounded-md bg-slate-800/80 px-2 py-1">Трейлер</span>
            <span className="rounded-md bg-slate-800/80 px-2 py-1">Kodik · UA-дубляж</span>
            <span className="rounded-md bg-slate-800/80 px-2 py-1 text-slate-400">Епізоди — WIP</span>
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight">{anime.title}</h1>
          {anime.titleRomaji && anime.titleRomaji !== anime.title && (
            <div className="text-sm text-slate-400">{anime.titleRomaji}</div>
          )}
          {anime.synopsis && (
            <p className="mt-4 whitespace-pre-line text-slate-300">{anime.synopsis}</p>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-sm">
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
            {anime.type && <Row label="Тип">{anime.type}</Row>}
            {anime.year && <Row label="Рік">{anime.year}</Row>}
            {anime.episodes != null && <Row label="Епізоди">{anime.episodes}</Row>}
            {anime.status && <Row label="Статус">{anime.status}</Row>}
            {anime.studios.length > 0 && (
              <Row label="Студія">{anime.studios.join(", ")}</Row>
            )}
            {anime.genres.length > 0 && (
              <Row label="Жанри">
                <span className="flex flex-wrap gap-1.5">
                  {anime.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-md bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300"
                    >
                      {g}
                    </span>
                  ))}
                </span>
              </Row>
            )}
          </dl>
          <div className="mt-5 flex flex-col gap-2">
            <a
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs text-slate-200 hover:bg-slate-800"
              href={`https://myanimelist.net/anime/${anime.id}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              MyAnimeList
            </a>
            <a
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs text-slate-200 hover:bg-slate-800"
              href={`https://shikimori.one/animes/${anime.id}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Shikimori
            </a>
          </div>
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
