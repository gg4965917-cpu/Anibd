import { NextResponse } from "next/server";
import { filterAnime, getNewest, getPopular } from "@/lib/anihub";

// GET /api/anime?list=top|latest|search&q=<query>&limit=24
export async function GET(req: Request) {
  const url = new URL(req.url);
  const list = url.searchParams.get("list") ?? "latest";
  const q = url.searchParams.get("q") ?? "";
  const limit = Math.max(
    1,
    Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 20)
  );

  try {
    if (list === "top") {
      return NextResponse.json({ items: await getPopular(limit) });
    }
    if (list === "search") {
      if (!q) return NextResponse.json({ items: [] });
      const { items } = await filterAnime({ q, pageSize: limit });
      return NextResponse.json({ items });
    }
    return NextResponse.json({ items: await getNewest(limit) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ items: [], error: message }, { status: 502 });
  }
}
