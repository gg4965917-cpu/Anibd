import {
  getAnnounced,
  getNewest,
  getPopular,
  getSeasonal,
  filterAnime,
} from "@/lib/anihub";
import { AnimeCardGrid } from "@/components/AnimeCard";
import { AnimeRow } from "@/components/AnimeRow";
import { Hero } from "@/components/Hero";

export const revalidate = 3600;

export default async function HomePage() {
  const [hero, seasonal, popular, movies, announced, newest] = await Promise.all([
    getPopular(5).catch(() => []),
    getSeasonal(20).catch(() => []),
    getPopular(18).catch(() => []),
    filterAnime({ type: "movie", ordering: "-rating", pageSize: 18 })
      .then((r) => r.items)
      .catch(() => []),
    getAnnounced(18).catch(() => []),
    getNewest(18).catch(() => []),
  ]);

  return (
    <>
      <Hero items={hero} />

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Цього сезону</h2>
            <p className="text-sm text-slate-400">
              Сезонні релізи з українським дубляжем та субтитрами.
            </p>
          </div>
          <a
            href="/catalog?season=current"
            className="text-xs text-slate-400 hover:text-brand"
          >
            Дивитись усі →
          </a>
        </div>
        {seasonal.length ? (
          <AnimeCardGrid items={seasonal} priorityCount={6} />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
            Не вдалося завантажити список. Спробуйте оновити сторінку.
          </div>
        )}
      </section>

      <AnimeRow
        title="Популярне"
        items={popular}
        href="/catalog?ordering=-rating"
      />
      <AnimeRow
        title="Нещодавно додане"
        items={newest}
        href="/catalog?ordering=-updated_at"
      />
      <AnimeRow
        title="Кращі фільми"
        items={movies}
        href="/catalog?type=movie&ordering=-rating"
      />
      <AnimeRow
        title="Скоро на екранах"
        items={announced}
        href="/catalog?status=announced"
      />
    </>
  );
}
