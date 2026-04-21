import type { MetadataRoute } from "next";
import { getGenres } from "@/lib/anime";

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://anibd-one.vercel.app"
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const genres = await getGenres().catch(() => []);

  return [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/catalog`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${base}/catalog?order_by=start_date`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/catalog?order_by=score`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: `${base}/genres`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/studios`, changeFrequency: "monthly", priority: 0.4 },
    ...genres.map((g) => ({
      url: `${base}/catalog?genres=${g.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
