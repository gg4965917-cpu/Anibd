export const metadata = { title: "Українські студії дубляжу" };

const studios = [
  { name: "Amanogawa", site: "https://amanogawa.space", blurb: "Одна з найбільших студій українського дубляжу аніме. Понад 280+ тайтлів." },
  { name: "AniTube", site: "https://anitube.in.ua", blurb: "Великий каталог аніме з українським дубляжем та субтитрами." },
  { name: "AniHub", site: "https://anihub.in.ua", blurb: "Агрегатор українських студій дубляжу з каталогом і плеєром." },
  { name: "NewComers", site: "https://t.me/newcomers_ua", blurb: "Студія фандубу аніме українською мовою." },
  { name: "FanVoxUA", site: "https://t.me/fanvoxua", blurb: "Українська фан-студія озвучення." },
];

export default function StudiosPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Українські студії дубляжу</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {studios.map((s) => (
          <a
            key={s.name}
            href={s.site}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-brand/50 hover:bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-white group-hover:text-brand">{s.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{s.blurb}</p>
            <div className="mt-3 text-xs text-slate-500">{s.site}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
