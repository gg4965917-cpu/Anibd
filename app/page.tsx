import { AnimeCardGrid } from "@/components/AnimeCard";
import { AnimeRow } from "@/components/AnimeRow";
import { Hero } from "@/components/Hero";
import {
  getAnnounced,
  getNewest,
  getPopular,
  getSeasonal,
  getTopMovies,
} from "@/lib/anime";

export const revalidate = 3600;

export default async function HomePage() {
  const [top, seasonal, popular, newest, movies, announced] = await Promise.all([
    getPopular(5),
    getSeasonal(20),
    getPopular(18),
    getNewest(18),
    getTopMovies(18),
    getAnnounced(18),
  ]);

  return (
    <>
      <Hero items={top} />

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Цього сезону</h2>
            <p className="text-sm text-slate-400">
              Сезонні релізи, які зараз транслюються.
            </p>
          </div>
          <a
            href="/catalog?status=airing"
            className="text-xs text-slate-400 hover:text-brand"
          >
            Дивитись усі →
          </a>
        </div>
        {seasonal.length ? (
          <AnimeCardGrid items={seasonal} priorityCount={6} />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
            Не вдалося завантажити сезонні релізи.
          </div>
        )}
      </section>

      <AnimeRow
        title="Популярне"
        href="/catalog?order_by=popularity"
        items={popular}
      />
      <AnimeRow
        title="Нещодавно додане"
        href="/catalog?order_by=start_date"
        items={newest}
      />
      <AnimeRow
        title="Кращі фільми"
        href="/catalog?type=movie&order_by=score"
        items={movies}
      />
      <AnimeRow
        title="Скоро на екранах"
        href="/catalog?status=upcoming"
        items={announced}
      />
    </>
  );
}
