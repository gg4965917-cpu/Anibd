import Link from "next/link";
import { AnimeCard } from "@/components/AnimeCard";
import type { Anime } from "@/lib/jikan";

type Props = {
  title: string;
  items: Anime[];
  href?: string;
  priorityCount?: number;
};

export function AnimeRow({ title, items, href, priorityCount = 0 }: Props) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="text-xs text-slate-400 hover:text-brand"
          >
            Дивитись усі →
          </Link>
        )}
      </header>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
        {items.map((a, i) => (
          <div
            key={a.id}
            className="w-[140px] shrink-0 snap-start sm:w-[160px] md:w-[180px] lg:w-[200px]"
          >
            <AnimeCard anime={a} priority={i < priorityCount} />
          </div>
        ))}
      </div>
    </section>
  );
}
