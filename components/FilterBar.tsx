"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Genre } from "@/lib/anime";

const TYPES = [
  { value: "", label: "Всі типи" },
  { value: "tv", label: "ТБ" },
  { value: "movie", label: "Фільм" },
  { value: "ova", label: "OVA" },
  { value: "ona", label: "ONA" },
  { value: "special", label: "Спешл" },
  { value: "music", label: "Музика" },
];

const STATUSES = [
  { value: "", label: "Всі статуси" },
  { value: "airing", label: "Транслюється" },
  { value: "complete", label: "Завершено" },
  { value: "upcoming", label: "Незабаром" },
];

const ORDERING = [
  { value: "popularity", label: "За популярністю" },
  { value: "score", label: "За оцінкою" },
  { value: "start_date", label: "За датою виходу" },
  { value: "title", label: "За назвою" },
  { value: "rank", label: "За рангом" },
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
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [orderBy, setOrderBy] = useState(params.get("order_by") ?? "popularity");

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setGenre(params.get("genres") ?? "");
    setType(params.get("type") ?? "");
    setYear(params.get("year") ?? "");
    setStatus(params.get("status") ?? "");
    setOrderBy(params.get("order_by") ?? "popularity");
  }, [params]);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (genre) next.set("genres", genre);
    if (type) next.set("type", type);
    if (year) next.set("year", year);
    if (status) next.set("status", status);
    if (orderBy && orderBy !== "popularity") next.set("order_by", orderBy);
    const qs = next.toString();
    startTransition(() => router.push(qs ? `/catalog?${qs}` : "/catalog"));
  }

  function reset() {
    setQ("");
    setGenre("");
    setType("");
    setYear("");
    setStatus("");
    setOrderBy("popularity");
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
          ...genres.map((g) => ({ value: String(g.id), label: g.name })),
        ]}
      />
      <Select label="Тип" value={type} onChange={setType} options={TYPES} />
      <Select label="Статус" value={status} onChange={setStatus} options={STATUSES} />
      <Select
        label="Рік"
        value={year}
        onChange={setYear}
        options={[
          { value: "", label: "Будь-який" },
          ...YEARS.map((y) => ({ value: y, label: y })),
        ]}
      />
      <Select
        label="Сортування"
        value={orderBy}
        onChange={setOrderBy}
        options={ORDERING}
      />

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6 lg:justify-end">
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
