"use client";

import { useEffect, useState } from "react";
import type { Anime } from "@/lib/anihub";
import { AnimeCard, AnimeCardGrid } from "@/components/AnimeCard";
import { AnimeRow } from "@/components/AnimeRow";

type Fetcher = () => Promise<Anime[]>;

export function AnimeRailClient({
  title,
  href,
  fetcher,
  priorityCount = 0,
}: {
  title: string;
  href?: string;
  fetcher: Fetcher;
  priorityCount?: number;
}) {
  const [items, setItems] = useState<Anime[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  if (error || (items && items.length === 0)) return null;
  if (!items) return <SkeletonRow title={title} href={href} />;
  return (
    <AnimeRow
      title={title}
      items={items}
      href={href}
      priorityCount={priorityCount}
    />
  );
}

export function AnimeGridClient({
  fetcher,
  priorityCount = 6,
  emptyMessage = "Нічого не знайдено.",
}: {
  fetcher: Fetcher;
  priorityCount?: number;
  emptyMessage?: string;
}) {
  const [items, setItems] = useState<Anime[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    fetcher()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-sm text-red-300">
        Не вдалося завантажити список (перевірте, що відкриваєте сайт у браузері).
      </div>
    );
  }
  if (!items) return <SkeletonGrid />;
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }
  return <AnimeCardGrid items={items} priorityCount={priorityCount} />;
}

export function AnimeCardFromAnime({ anime }: { anime: Anime }) {
  return <AnimeCard anime={anime} />;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] w-full animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"
        />
      ))}
    </div>
  );
}

function SkeletonRow({ title, href }: { title: string; href?: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        {href && <span className="text-xs text-slate-600">…</span>}
      </header>
      <div className="-mx-4 flex gap-3 overflow-hidden px-4 pb-3 sm:mx-0 sm:px-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] w-[140px] shrink-0 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40 sm:w-[160px] md:w-[180px] lg:w-[200px]"
          />
        ))}
      </div>
    </section>
  );
}
