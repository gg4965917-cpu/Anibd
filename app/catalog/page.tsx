import { Suspense } from "react";
import { AnimeCardGrid } from "@/components/AnimeCard";
import { FilterBar } from "@/components/FilterBar";
import { filterAnime, getGenres } from "@/lib/jikan";

export const revalidate = 300;

type SP = {
  q?: string;
  genres?: string;
  type?: string;
  year?: string;
  order_by?: string;
  page?: string;
};

// Catalog genre params can be either numeric Jikan IDs (from FilterBar) or genre
// name slugs coming from /watch/[id] links. Resolve names here.
function resolveGenreIds(
  raw: string | undefined,
  all: { mal_id: number; name: string }[]
): string | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const ids: string[] = [];
  for (const p of parts) {
    if (/^\d+$/.test(p)) {
      ids.push(p);
    } else {
      const match = all.find(
        (g) => g.name.toLowerCase() === p.toLowerCase()
      );
      if (match) ids.push(String(match.mal_id));
    }
  }
  return ids.length ? ids.join(",") : undefined;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const genres = await getGenres().catch(() => []);
  const genreIds = resolveGenreIds(sp.genres, genres);

  const { items, hasNextPage, page } = await filterAnime({
    q: sp.q,
    genres: genreIds,
    type: sp.type,
    year: sp.year,
    orderBy: sp.order_by,
    sort: sp.order_by === "score" || sp.order_by === "popularity" ? "desc" : "asc",
    page: Number(sp.page) || 1,
    limit: 24,
  }).catch(() => ({ items: [], hasNextPage: false, page: 1 }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Каталог</h1>
        <p className="text-sm text-slate-400">
          Знайдіть аніме за жанром, роком чи типом. Дані: MyAnimeList через Jikan API.
        </p>
      </header>

      <Suspense fallback={null}>
        <FilterBar genres={genres} />
      </Suspense>

      <div className="mt-6">
        {items.length ? (
          <AnimeCardGrid items={items} />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
            Нічого не знайдено. Спробуйте змінити фільтри.
          </div>
        )}
      </div>

      {(page > 1 || hasNextPage) && (
        <Pager searchParams={sp} page={page} hasNextPage={hasNextPage} />
      )}
    </section>
  );
}

function Pager({
  searchParams,
  page,
  hasNextPage,
}: {
  searchParams: SP;
  page: number;
  hasNextPage: boolean;
}) {
  function buildQuery(p: number) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) next.set(k, v);
    }
    next.set("page", String(p));
    return `/catalog?${next.toString()}`;
  }
  return (
    <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
      {page > 1 ? (
        <a
          href={buildQuery(page - 1)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 hover:bg-slate-800"
        >
          ← Попередня
        </a>
      ) : (
        <span className="rounded-lg border border-slate-800 px-3 py-1.5 text-slate-600">← Попередня</span>
      )}
      <span className="text-slate-400">Сторінка {page}</span>
      {hasNextPage ? (
        <a
          href={buildQuery(page + 1)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 hover:bg-slate-800"
        >
          Наступна →
        </a>
      ) : (
        <span className="rounded-lg border border-slate-800 px-3 py-1.5 text-slate-600">Наступна →</span>
      )}
    </nav>
  );
}
