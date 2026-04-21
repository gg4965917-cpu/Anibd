import type { MetadataRoute } from "next";
import { getPopular } from "@/lib/anihub";

export const revalidate = 86400;

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://anibd-one.vercel.app"
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/catalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/catalog?ordering=-updated_at`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/catalog?ordering=-rating`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/genres`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/studios`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const top = await getPopular(50).catch(() => []);
  const watchRoutes: MetadataRoute.Sitemap = top.map((a) => ({
    url: `${base}/watch/${a.id}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...watchRoutes];
}
