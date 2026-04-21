"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Genre } from "@/lib/anihub";

const TYPES = [
  { value: "", label: "Всі типи" },
  { value: "tv", label: "ТБ" },
  { value: "movie", label: "Фільм" },
  { value: "ova", label: "OVA" },
  { value: "ona", label: "ONA" },
  { value: "special", label: "Спешл" },
  { value: "tv_special", label: "ТБ-спешл" },
];

const STATUSES = [
  { value: "", label: "Всі статуси" },
  { value: "ongoing", label: "Транслюється" },
  { value: "completed", label: "Завершено" },
  { value: "announced", label: "Незабаром" },
  { value: "dropped", label: "Покинуто" },
];

const SEASONS = [
  { value: "", label: "Будь-який сезон" },
  { value: "winter", label: "Зима" },
  { value: "spring", label: "Весна" },
  { value: "summer", label: "Літо" },
  { value: "fall", label: "Осінь" },
];

const ORDERING = [
  { value: "-rating", label: "Рейтинг (спадання)" },
  { value: "rating", label: "Рейтинг (зростання)" },
  { value: "-library_count", label: "Популярність" },
  { value: "-year", label: "Новіші" },
  { value: "year", label: "Старіші" },
  { value: "-updated_at", label: "Нещодавно оновлено" },
  { value: "title_ukrainian", label: "Назва (А–Я)" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS: string[] = [];
for (let y = CURRENT_YEAR; y >= 1990; y--) YEARS.push(String(y));

export function FilterBar({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [genre, setGenre] = useState(params.get("genres") ?? "");
  const [type, setType] = useState(params.get("type") ?? "");
  const [year, setYear] = useState(params.get("year") ?? "");
  const [season, setSeason] = useState(params.get("season") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [ordering, setOrdering] = useState(params.get("ordering") ?? "-rating");
  const [dub, setDub] = useState(params.get("dub") === "1");

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setGenre(params.get("genres") ?? "");
    setType(params.get("type") ?? "");
    setYear(params.get("year") ?? "");
    setSeason(params.get("season") ?? "");
    setStatus(params.get("status") ?? "");
    setOrdering(params.get("ordering") ?? "-rating");
    setDub(params.get("dub") === "1");
  }, [params]);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (genre) next.set("genres", genre);
    if (type) next.set("type", type);
    if (year) next.set("year", year);
    if (season) next.set("season", season);
    if (status) next.set("status", status);
    if (ordering && ordering !== "-rating") next.set("ordering", ordering);
    if (dub) next.set("dub", "1");
    const qs = next.toString();
    startTransition(() => router.push(qs ? `/catalog?${qs}` : "/catalog"));
  }

  function reset() {
    setQ("");
    setGenre("");
    setType("");
    setYear("");
    setSeason("");
    setStatus("");
    setOrdering("-rating");
    setDub(false);
    startTransition(() => router.push("/catalog"));
  }

  return (
    <form
      onSubmit={apply}
      className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <label className="flex flex-col gap-1 text-xs text-slate-400 lg:col-span-2">
        Пошук
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Назва аніме…"
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand/60"
        />
      </label>
      <Select
        label="Жанр"
        value={genre}
        onChange={setGenre}
        options={[
          { value: "", label: "Всі жанри" },
          ...genres.map((g) => ({ value: g.name, label: g.name })),
        ]}
      />
      <Select label="Тип" value={type} onChange={setType} options={TYPES} />
      <Select label="Статус" value={status} onChange={setStatus} options={STATUSES} />
      <Select
        label="Рік"
        value={year}
        onChange={setYear}
        options={[{ value: "", label: "Будь-який" }, ...YEARS.map((y) => ({ value: y, label: y }))]}
      />
      <Select label="Сезон" value={season} onChange={setSeason} options={SEASONS} />
      <Select
        label="Сортування"
        value={ordering}
        onChange={setOrdering}
        options={ORDERING}
      />

      <label className="flex items-center gap-2 text-xs text-slate-300 sm:col-span-2 lg:col-span-3">
        <input
          type="checkbox"
          checked={dub}
          onChange={(e) => setDub(e.target.checked)}
          className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-brand focus:ring-brand"
        />
        Лише з українським дубляжем
      </label>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3 lg:justify-end">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
        >
          Скинути
        </button>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-slate-950 shadow-glow hover:bg-brand-dim"
        >
          Застосувати
        </button>
      </div>
    </form>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand/60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-900">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
