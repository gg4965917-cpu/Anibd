"use client";

import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { getPopular, type Anime } from "@/lib/anihub";

export function HeroClient() {
  const [items, setItems] = useState<Anime[]>([]);

  useEffect(() => {
    let cancelled = false;
    getPopular(5)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        /* silently ignore — hero is optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items.length) {
    return (
      <section className="relative isolate h-80 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 sm:h-[28rem]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 h-4 w-96 animate-pulse rounded bg-slate-800" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-800" />
        </div>
      </section>
    );
  }
  return <Hero items={items} />;
}
