import { NextResponse } from "next/server";
import { getSourcesForMalId } from "@/lib/sources";

// GET /api/sources/<malId>
// Aggregates video sources for a given anime by MAL id.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const malId = Number(id);
  if (!Number.isFinite(malId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const payload = await getSourcesForMalId(malId);
  if (!payload) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(payload);
}
