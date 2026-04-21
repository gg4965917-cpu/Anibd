import type { AnimeEpisode } from "@/lib/jikan";

type Props = {
  episodes: AnimeEpisode[];
  totalHint?: number | null;
};

export function EpisodesList({ episodes, totalHint }: Props) {
  if (!episodes.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        Список серій недоступний.
      </div>
    );
  }
  return (
    <div>
      <header className="mb-2 flex items-end justify-between">
        <h3 className="text-base font-semibold tracking-tight">Серії</h3>
        <span className="text-xs text-slate-500">
          {episodes.length}
          {totalHint != null && totalHint > 0 && totalHint !== episodes.length
            ? ` / ${totalHint}`
            : ""}
        </span>
      </header>
      <ol className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        {episodes.map((ep) => (
          <li key={ep.mal_id} className="flex items-center gap-3 px-4 py-2 text-sm">
            <span className="w-10 shrink-0 text-right font-mono text-xs text-slate-500">
              {String(ep.mal_id).padStart(2, "0")}
            </span>
            <span className="flex-1 truncate text-slate-200">{ep.title}</span>
            {ep.filler && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                Filler
              </span>
            )}
            {ep.recap && (
              <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                Recap
              </span>
            )}
            {ep.aired && (
              <span className="hidden w-24 shrink-0 text-right text-xs text-slate-500 sm:inline">
                {new Date(ep.aired).toLocaleDateString("uk-UA")}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
