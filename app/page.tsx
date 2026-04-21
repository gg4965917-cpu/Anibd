"use client";

import { AnimeGridClient, AnimeRailClient } from "@/components/AnimeRail";
import { HeroClient } from "@/components/HeroClient";
import {
  filterAnime,
  getAnnounced,
  getNewest,
  getPopular,
  getSeasonal,
} from "@/lib/anihub";

export default function HomePage() {
  return (
    <>
      <HeroClient />

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Цього сезону</h2>
            <p className="text-sm text-slate-400">
              Сезонні релізи з українським дубляжем та субтитрами.
            </p>
          </div>
          <a
            href="/catalog?ordering=-year"
            className="text-xs text-slate-400 hover:text-brand"
          >
            Дивитись усі →
          </a>
        </div>
        <AnimeGridClient
          fetcher={() => getSeasonal(20)}
          priorityCount={6}
          emptyMessage="Не вдалося завантажити сезонні релізи."
        />
      </section>

      <AnimeRailClient
        title="Популярне"
        href="/catalog?ordering=-rating"
        fetcher={() => getPopular(18)}
      />
      <AnimeRailClient
        title="Нещодавно додане"
        href="/catalog?ordering=-updated_at"
        fetcher={() => getNewest(18)}
      />
      <AnimeRailClient
        title="Кращі фільми"
        href="/catalog?type=movie&ordering=-rating"
        fetcher={() =>
          filterAnime({ type: "movie", ordering: "-rating", pageSize: 18 }).then(
            (r) => r.items,
          )
        }
      />
      <AnimeRailClient
        title="Скоро на екранах"
        href="/catalog?status=announced"
        fetcher={() => getAnnounced(18)}
      />
    </>
  );
}
