import { getLatestUpdates, getTopAiring } from "@/lib/jikan";
import { AnimeCardGrid } from "@/components/AnimeCard";
import { Hero } from "@/components/Hero";

export const revalidate = 3600;

export default async function HomePage() {
  const [top, latest] = await Promise.all([
    getTopAiring(5).catch(() => []),
    getLatestUpdates(24).catch(() => []),
  ]);

  return (
    <>
      <Hero items={top} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Останні оновлення</h2>
            <p className="text-sm text-slate-400">
              Новинки сезону з MyAnimeList (оновлюється щогодини).
            </p>
          </div>
        </div>
        {latest.length ? (
          <AnimeCardGrid items={latest} priorityCount={6} />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
            Не вдалося завантажити список. Спробуйте оновити сторінку.
          </div>
        )}
      </section>
    </>
  );
}
