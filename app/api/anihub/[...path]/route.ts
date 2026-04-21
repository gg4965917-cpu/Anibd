import { NextRequest, NextResponse } from "next/server";

// AniHub's public API (api.anihub.in.ua) is behind a Cloudflare managed
// challenge that returns 403 "Just a moment…" to every server-side request
// (Vercel, curl, Node). Browsers pass the challenge but then hit CORS because
// AniHub does not send Access-Control-Allow-Origin.
//
// Workaround: proxy through api.allorigins.win, which successfully fetches
// AniHub and returns the raw bytes. We host this proxy on our own domain so
// browser requests are same-origin (no CORS) and we can add short-TTL caching
// to stay under the 40 req/min AniHub rate limit.

export const runtime = "nodejs";

const UPSTREAM = "https://api.anihub.in.ua";
const ALLORIGINS = "https://api.allorigins.win/raw?url=";

function cacheControl(path: string): string {
  if (/^\/anime\/\d+/.test(path)) return "public, s-maxage=3600, stale-while-revalidate=86400";
  if (path.startsWith("/genres")) return "public, s-maxage=3600, stale-while-revalidate=86400";
  return "public, s-maxage=300, stale-while-revalidate=600";
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const subpath = "/" + (path?.join("/") ?? "");
  const search = req.nextUrl.search;
  const upstreamUrl = `${UPSTREAM}${subpath}${search}`;

  // Try the upstream directly first (cheap + avoids allorigins when possible).
  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });
  } catch {
    upstream = new Response(null, { status: 599 });
  }

  if (upstream.status === 200) {
    const body = await upstream.text();
    // Reject Cloudflare's HTML challenge even if status is 200 (edge case).
    if (!body.trimStart().startsWith("<")) {
      return new NextResponse(body, {
        status: 200,
        headers: {
          "content-type": upstream.headers.get("content-type") ?? "application/json",
          "cache-control": cacheControl(subpath),
        },
      });
    }
  }

  // Fallback via allorigins which bypasses Cloudflare challenge.
  const proxied = await fetch(`${ALLORIGINS}${encodeURIComponent(upstreamUrl)}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 },
  });
  const body = await proxied.text();
  return new NextResponse(body, {
    status: proxied.status,
    headers: {
      "content-type": proxied.headers.get("content-type") ?? "application/json",
      "cache-control": cacheControl(subpath),
    },
  });
}
