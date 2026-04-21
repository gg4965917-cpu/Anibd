import {
  getCurrentSeason,
  getTopAiring,
  getTopAnime,
  getTopMovies,
  getUpcomingSeason,
} from "@/lib/jikan";
import { AnimeCardGrid } from "@/components/AnimeCard";
import { AnimeRow } from "@/components/AnimeRow";
import { Hero } from "@/components/Hero";

export const revalidate = 3600;

export default async function HomePage() {
  // Fetch rails in parallel. Jikan is rate-limited (~3 req/s) so 5 parallel
  // requests are fine. All have their own Next fetch cache with revalidate.
  const [hero, latest, topRated, topMovies, upcoming] = await Promise.all([
    getTopAiring(5).catch(() => []),
    getCurrentSeason(24).catch(() => []),
    getTopAnime(18).catch(() => []),
    getTopMovies(18).catch(() => []),
    getUpcomingSeason(18).catch(() => []),
  ]);

  return (
    <>
      <Hero items={hero} />

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Цього сезону</h2>
            <p className="text-sm text-slate-400">
              Свіжі релізи з Jikan (оновлюється щогодини).
            </p>
          </div>
          <a
            href="/catalog?order_by=start_date"
            className="text-xs text-slate-400 hover:text-brand"
          >
            Дивитись усі →
          </a>
        </div>
        {latest.length ? (
          <AnimeCardGrid items={latest} priorityCount={6} />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
            Не вдалося завантажити список. Спробуйте оновити сторінку.
          </div>
        )}
      </section>

      <AnimeRow
        title="Топ-рейтинг"
        items={topRated}
        href="/catalog?order_by=score"
      />
      <AnimeRow
        title="Кращі фільми"
        items={topMovies}
        href="/catalog?type=movie&order_by=score"
      />
      <AnimeRow
        title="Скоро на екранах"
        items={upcoming}
        href="/catalog?order_by=start_date"
      />
    </>
  );
}
