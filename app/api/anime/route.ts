import { NextResponse } from "next/server";
import {
  getNewest,
  getPopular,
  getSeasonal,
  searchAnime,
} from "@/lib/anime";

// GET /api/anime?list=popular|seasonal|latest|search&q=<query>&limit=24
//
// Public read-only endpoint used by any client-side widgets that want
// to pull metadata without re-invoking server components.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const list = url.searchParams.get("list") ?? "seasonal";
  const q = url.searchParams.get("q") ?? "";
  const limit = Math.max(
    1,
    Math.min(Number(url.searchParams.get("limit") ?? 24) || 24, 48)
  );

  try {
    if (list === "popular") {
      return NextResponse.json({ items: await getPopular(limit) });
    }
    if (list === "search") {
      if (!q) return NextResponse.json({ items: [] });
      return NextResponse.json({ items: await searchAnime(q, limit) });
    }
    if (list === "latest") {
      return NextResponse.json({ items: await getNewest(limit) });
    }
    return NextResponse.json({ items: await getSeasonal(limit) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ items: [], error: message }, { status: 502 });
  }
}
