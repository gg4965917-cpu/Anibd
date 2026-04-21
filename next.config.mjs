/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // MyAnimeList (Jikan) CDN
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "myanimelist.net" },
      { protocol: "https", hostname: "api-cdn.myanimelist.net" },
      // AniList CDN
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "cdn.anilist.co" },
      // YouTube thumbnails (for trailer previews)
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  eslint: {
    // Lint runs separately; don't block prod builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
