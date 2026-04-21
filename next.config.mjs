/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.anihub.in.ua" },
      { protocol: "https", hostname: "*.anihub.in.ua" },
      { protocol: "https", hostname: "anihub.in.ua" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "myanimelist.net" },
      { protocol: "https", hostname: "api-cdn.myanimelist.net" },
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
