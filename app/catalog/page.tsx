import { Suspense } from "react";
import { AnimeCardGrid } from "@/components/AnimeCard";
import { FilterBar } from "@/components/FilterBar";
import { filterAnime, getGenres } from "@/lib/anihub";

export const revalidate = 300;

type SP = {
  q?: string;
  genres?: string;
  type?: string;
  year?: string;
  season?: string;
  status?: string;
  ordering?: string;
  // legacy (kept working for bookmarks from older pages)
  order_by?: string;
  dub?: string;
  page?: string;
};

// AniHub /anime supports only a single `search` field (no genre ID filter in
// public API), so if user clicks a genre chip we translate it into a search
// query. Not perfect but works acceptably while the public API lacks genre
// filtering.
function toSearchQuery(sp: SP): string | undefined {
  const parts: string[] = [];
  if (sp.q) parts.push(sp.q.trim());
  if (sp.genres) {
    const first = sp.genres.split(",").map((s) => s.trim()).filter(Boolean)[0];
    if (first && !/^\d+$/.test(first)) parts.push(first);
  }
  return parts.length ? parts.join(" ").trim() : undefined;
}

// Legacy Jikan order_by → AniHub ordering.
function legacyOrdering(sp: SP): string | undefined {
  if (sp.ordering) return sp.ordering;
  switch (sp.order_by) {
    case "score":
      return "-rating";
    case "popularity":
      return "-library_count";
    case "start_date":
      return "-year";
    case "title":
      return "title_ukrainian";
    default:
      return undefined;
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const genres = await getGenres().catch(() => []);

  const { items, hasNextPage, page } = await filterAnime({
    q: toSearchQuery(sp),
    status: sp.status,
    type: sp.type,
    year: sp.year,
    season: sp.season,
    ordering: legacyOrdering(sp) ?? "-rating",
    hasUkrainianDub: sp.dub === "1" ? true : undefined,
    page: Number(sp.page) || 1,
    pageSize: 20,
  }).catch(() => ({ items: [], hasNextPage: false, page: 1, total: 0 }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Каталог</h1>
        <p className="text-sm text-slate-400">
          Знайдіть аніме за жанром, роком чи типом. Дані: AniHub.
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
