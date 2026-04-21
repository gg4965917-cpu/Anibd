/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "shikimori.one" },
      { protocol: "https", hostname: "*.shikimori.one" },
      { protocol: "https", hostname: "anilibria.top" },
      { protocol: "https", hostname: "cache.libria.fun" },
    ],
  },
  eslint: {
    // Lint runs separately; don't block prod builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
