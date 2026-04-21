"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimeCardGrid } from "@/components/AnimeCard";
import { FilterBar } from "@/components/FilterBar";
import { filterAnime, getGenres, type Anime, type Genre } from "@/lib/anihub";

type SP = {
  q?: string;
  genres?: string;
  type?: string;
  year?: string;
  season?: string;
  status?: string;
  ordering?: string;
  order_by?: string;
  dub?: string;
  page?: string;
};

function readSP(sp: URLSearchParams): SP {
  const out: SP = {};
  for (const k of [
    "q",
    "genres",
    "type",
    "year",
    "season",
    "status",
    "ordering",
    "order_by",
    "dub",
    "page",
  ] as const) {
    const v = sp.get(k);
    if (v) out[k] = v;
  }
  return out;
}

function toSearchQuery(sp: SP): string | undefined {
  const parts: string[] = [];
  if (sp.q) parts.push(sp.q.trim());
  if (sp.genres) {
    const first = sp.genres.split(",").map((s) => s.trim()).filter(Boolean)[0];
    if (first && !/^\d+$/.test(first)) parts.push(first);
  }
  return parts.length ? parts.join(" ").trim() : undefined;
}

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

export function CatalogClient() {
  const searchParams = useSearchParams();
  const sp = readSP(searchParams);
  const [items, setItems] = useState<Anime[] | null>(null);
  const [meta, setMeta] = useState<{ page: number; hasNextPage: boolean }>({
    page: 1,
    hasNextPage: false,
  });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    getGenres()
      .then(setGenres)
      .catch(() => setGenres([]));
  }, []);

  const spKey = searchParams.toString();
  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(false);
    filterAnime({
      q: toSearchQuery(sp),
      status: sp.status,
      type: sp.type,
      year: sp.year,
      season: sp.season,
      ordering: legacyOrdering(sp) ?? "-rating",
      hasUkrainianDub: sp.dub === "1" ? true : undefined,
      page: Number(sp.page) || 1,
      pageSize: 20,
    })
      .then((r) => {
        if (cancelled) return;
        setItems(r.items);
        setMeta({ page: r.page, hasNextPage: r.hasNextPage });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spKey]);

  return (
    <>
      <FilterBar genres={genres} />
      <div className="mt-6">
        {items === null && !error && <SkeletonGrid />}
        {error && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-sm text-red-300">
            Не вдалося завантажити каталог. Відкрийте сайт у браузері (api.anihub.in.ua
            доступний лише з клієнта).
          </div>
        )}
        {items && items.length > 0 && <AnimeCardGrid items={items} />}
        {items && items.length === 0 && !error && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
            Нічого не знайдено. Спробуйте змінити фільтри.
          </div>
        )}
      </div>
      {(meta.page > 1 || meta.hasNextPage) && (
        <Pager sp={sp} page={meta.page} hasNextPage={meta.hasNextPage} />
      )}
    </>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] w-full animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"
        />
      ))}
    </div>
  );
}

function Pager({
  sp,
  page,
  hasNextPage,
}: {
  sp: SP;
  page: number;
  hasNextPage: boolean;
}) {
  function buildQuery(p: number) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
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
        <span className="rounded-lg border border-slate-800 px-3 py-1.5 text-slate-600">
          ← Попередня
        </span>
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
        <span className="rounded-lg border border-slate-800 px-3 py-1.5 text-slate-600">
          Наступна →
        </span>
      )}
    </nav>
  );
}
