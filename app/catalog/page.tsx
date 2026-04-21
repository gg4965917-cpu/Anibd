import { AnimeCardGrid } from "@/components/AnimeCard";
import { getLatestUpdates, searchAnime } from "@/lib/jikan";

export const revalidate = 300;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const items = query
    ? await searchAnime(query, 24).catch(() => [])
    : await getLatestUpdates(24).catch(() => []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Каталог</h1>
          <p className="text-sm text-slate-400">
            {query ? (
              <>Результати пошуку за «{query}»</>
            ) : (
              <>Актуальний сезон. Фільтри (жанри/роки/типи) — у наступній ітерації.</>
            )}
          </p>
        </div>
      </header>
      {items.length ? (
        <AnimeCardGrid items={items} />
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
          Нічого не знайдено.
        </div>
      )}
    </section>
  );
}
