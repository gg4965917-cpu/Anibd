import Image from "next/image";
import Link from "next/link";
import type { Anime } from "@/lib/anihub";
import { translateType } from "@/lib/i18n";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "aspect-[2/3] w-32 sm:w-36",
  md: "aspect-[2/3] w-full",
  lg: "aspect-[2/3] w-full",
};

export function AnimeCard({
  anime,
  size = "md",
  priority = false,
}: {
  anime: Anime;
  size?: Size;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/watch/${anime.id}`}
      className="group relative block overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900/50 transition hover:border-brand/60 hover:shadow-glow"
    >
      <div className={`relative ${sizes[size]}`}>
        {anime.image ? (
          <Image
            src={anime.image}
            alt={anime.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
            priority={priority}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
            —
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent opacity-90" />

        {typeof anime.score === "number" && anime.score > 0 && (
          <div className="absolute left-2 top-2 rounded-md bg-slate-900/85 px-1.5 py-0.5 text-xs font-semibold text-brand ring-1 ring-slate-700">
            ★ {anime.score.toFixed(2)}
          </div>
        )}

        {anime.type && (
          <div className="absolute right-2 top-2 rounded-md bg-slate-900/85 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-300 ring-1 ring-slate-700">
            {translateType(anime.type)}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="line-clamp-2 text-sm font-medium text-slate-100">
            {anime.title}
          </h3>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
            {anime.year && <span>{anime.year}</span>}
            {anime.episodes ? (
              <span>
                <span className="mx-1 opacity-50">·</span>
                {anime.episodes} еп.
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function AnimeCardGrid({
  items,
  priorityCount = 4,
}: {
  items: Anime[];
  priorityCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((a, i) => (
        <AnimeCard key={a.id} anime={a} priority={i < priorityCount} />
      ))}
    </div>
  );
}
