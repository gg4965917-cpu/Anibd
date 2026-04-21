import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-900 bg-slate-950/70">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 text-sm text-slate-400 sm:grid-cols-4 sm:px-6 lg:px-8">
        <div>
          <div className="mb-3 text-base font-semibold text-slate-100">
            Anime<span className="text-brand">Hub</span>
          </div>
          <p>Каталог аніме українською. Агрегатор — всі права на тайтли та дубляж належать правовласникам.</p>
        </div>
        <div>
          <div className="mb-3 font-medium text-slate-200">Навігація</div>
          <ul className="space-y-1.5">
            <li><Link className="hover:text-white" href="/">Головна</Link></li>
            <li><Link className="hover:text-white" href="/catalog">Каталог</Link></li>
            <li><Link className="hover:text-white" href="/genres">Жанри</Link></li>
            <li><Link className="hover:text-white" href="/studios">Студії</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-medium text-slate-200">Джерела даних</div>
          <ul className="space-y-1.5">
            <li><a className="hover:text-white" href="https://jikan.moe/">Jikan (MAL)</a></li>
            <li><a className="hover:text-white" href="https://shikimori.one/">Shikimori</a></li>
            <li><a className="hover:text-white" href="https://anilibria.top/">AniLibria</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-medium text-slate-200">UA-студії</div>
          <ul className="space-y-1.5">
            <li><a className="hover:text-white" href="https://amanogawa.space">Amanogawa</a></li>
            <li><a className="hover:text-white" href="https://anitube.in.ua">AniTube</a></li>
            <li><a className="hover:text-white" href="https://anihub.in.ua">AniHub</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Anime Hub
      </div>
    </footer>
  );
}
