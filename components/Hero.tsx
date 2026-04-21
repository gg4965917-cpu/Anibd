"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Anime } from "@/lib/jikan";
import { translateType } from "@/lib/i18n";

export function Hero({ items }: { items: Anime[] }) {
  const slides = useMemo(() => items.slice(0, 5), [items]);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      setI((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) return null;
  const current = slides[i];

  return (
    <section className="relative isolate overflow-hidden">
      {current.imageLarge || current.image ? (
        <Image
          key={current.id}
          src={current.imageLarge || current.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-center opacity-40 blur-sm"
        />
      ) : null}
      <div className="-z-10 absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/70 to-slate-950" />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:px-8 lg:py-16">
        <div className="relative mx-auto hidden h-72 w-48 shrink-0 overflow-hidden rounded-2xl ring-1 ring-slate-800 sm:block lg:h-[22rem] lg:w-60">
          {current.image && (
            <Image
              src={current.image}
              alt={current.title}
              fill
              sizes="(max-width: 1024px) 200px, 240px"
              className="object-cover"
            />
          )}
        </div>

        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
            <span>#{i + 1} у топі зараз</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {current.title}
          </h1>
          {current.titleRomaji && current.titleRomaji !== current.title && (
            <div className="mt-1 text-sm text-slate-400">{current.titleRomaji}</div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            {typeof current.score === "number" && current.score > 0 && (
              <span className="rounded-md bg-slate-800/80 px-2 py-0.5 font-semibold text-brand">★ {current.score.toFixed(2)}</span>
            )}
            {current.year && <span className="rounded-md bg-slate-800/80 px-2 py-0.5">{current.year}</span>}
            {current.type && <span className="rounded-md bg-slate-800/80 px-2 py-0.5">{translateType(current.type)}</span>}
            {current.episodes ? (
              <span className="rounded-md bg-slate-800/80 px-2 py-0.5">{current.episodes} еп.</span>
            ) : null}
          </div>
          {current.synopsis && (
            <p className="mt-4 line-clamp-4 text-slate-300">{current.synopsis}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/watch/${current.id}`}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow hover:bg-brand-dim"
            >
              ▶ Дивитися
            </Link>
            <Link
              href={`/watch/${current.id}`}
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
            >
              Детальніше
            </Link>
          </div>

          {slides.length > 1 && (
            <div className="mt-6 flex items-center gap-1.5">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  aria-label={`Слайд ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={[
                    "h-1.5 rounded-full transition-all",
                    idx === i ? "w-8 bg-brand" : "w-3 bg-slate-700 hover:bg-slate-600",
                  ].join(" ")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
