import type { MetadataRoute } from "next";

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://anibd-one.vercel.app"
  );
}

// AniHub API is Cloudflare-protected from the server, so we can't build a
// dynamic watch-page sitemap at build time. Static routes only.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();
  return [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/catalog`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${base}/catalog?ordering=-updated_at`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/catalog?ordering=-rating`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: `${base}/genres`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/studios`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
