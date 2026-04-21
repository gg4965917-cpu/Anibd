import { Suspense } from "react";
import { CatalogClient } from "./CatalogClient";

export default function CatalogPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Каталог</h1>
        <p className="text-sm text-slate-400">
          Знайдіть аніме за жанром, роком чи типом. Дані: AniHub.
        </p>
      </header>
      <Suspense fallback={null}>
        <CatalogClient />
      </Suspense>
    </section>
  );
}
