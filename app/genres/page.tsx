import Link from "next/link";
import { getGenres } from "@/lib/anime";
import { translateGenre } from "@/lib/i18n";

export const metadata = { title: "Жанри" };
export const revalidate = 86400;

export default async function GenresPage() {
  const genres = await getGenres();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Жанри аніме</h1>
        <p className="text-sm text-slate-400">
          Оберіть жанр — побачите всі аніме цього жанру в каталозі.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {genres.map((g) => (
          <Link
            key={g.id}
            href={`/catalog?genres=${g.id}`}
            className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 transition hover:border-brand/50 hover:bg-slate-900"
          >
            <span className="font-medium text-slate-100 group-hover:text-brand">
              {translateGenre(g.name)}
            </span>
            {typeof g.count === "number" && (
              <span className="text-xs text-slate-500">{g.count}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
