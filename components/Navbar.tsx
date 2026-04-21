"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type NavLink = {
  href: string;
  label: string;
  // Optional required query params for distinguishing links that share a base path.
  match?: Record<string, string>;
};

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Головна" },
  { href: "/catalog", label: "Каталог" },
  {
    href: "/catalog?order_by=start_date",
    label: "Новинки",
    match: { order_by: "start_date" },
  },
  { href: "/genres", label: "Жанри" },
  { href: "/studios", label: "Студії" },
];

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/catalog?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Anime Hub">
          <Image
            src="/logo.png"
            alt="Anime Hub"
            width={36}
            height={36}
            className="rounded-lg ring-1 ring-slate-800"
            priority
          />
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">
            Anime<span className="text-brand">Hub</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const basePath = link.href.split("?")[0];
            const pathMatches =
              link.href === "/" ? pathname === "/" : pathname.startsWith(basePath);
            // If the link declares required query params, ALL of them must
            // match the current URL for the link to be considered active.
            // Otherwise, the link is active only when the current URL has no
            // conflicting params that belong to a sibling link (keeps base-path
            // links like "Каталог" unhighlighted when a sibling like "Новинки"
            // is the true match).
            const siblingKeys = NAV_LINKS.filter(
              (l) => l !== link && l.href.split("?")[0] === basePath && l.match
            ).flatMap((l) => Object.keys(l.match ?? {}));
            let active = pathMatches;
            if (pathMatches && link.match) {
              active = Object.entries(link.match).every(
                ([k, v]) => searchParams.get(k) === v
              );
            } else if (pathMatches && !link.match && siblingKeys.length) {
              active = siblingKeys.every((k) => !searchParams.get(k));
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "rounded-md px-3 py-1.5 text-sm transition",
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={onSearch} className="ml-auto flex-1 max-w-md">
          <label className="sr-only" htmlFor="global-search">
            Пошук
          </label>
          <div className="relative">
            <input
              id="global-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Пошук аніме…"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-9 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-0 transition focus:border-brand/60 focus:bg-slate-900"
              autoComplete="off"
            />
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>
        </form>

        <button
          type="button"
          className="ml-1 rounded-full border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
          aria-label="Профіль"
          title="Профіль (заглушка)"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-9 1.6-9 4.9V21h18v-2.1c0-3.3-5.7-4.9-9-4.9Z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
