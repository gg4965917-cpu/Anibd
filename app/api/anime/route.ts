import { NextResponse } from "next/server";
import { getLatestUpdates, getTopAiring, searchAnime } from "@/lib/jikan";

// GET /api/anime?list=top|latest|search&q=<query>&limit=24
export async function GET(req: Request) {
  const url = new URL(req.url);
  const list = url.searchParams.get("list") ?? "latest";
  const q = url.searchParams.get("q") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 24) || 24, 48);

  try {
    if (list === "top") {
      return NextResponse.json({ items: await getTopAiring(limit) });
    }
    if (list === "search") {
      if (!q) return NextResponse.json({ items: [] });
      return NextResponse.json({ items: await searchAnime(q, limit) });
    }
    return NextResponse.json({ items: await getLatestUpdates(limit) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ items: [], error: message }, { status: 502 });
  }
}
