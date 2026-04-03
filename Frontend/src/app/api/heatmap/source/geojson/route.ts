import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function GET(req: NextRequest) {
  const res = await fetch(`${BACKEND}/api/heatmap/source/geojson${req.nextUrl.search}`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
