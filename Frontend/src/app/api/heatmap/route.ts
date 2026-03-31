import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const zones = await prisma.heatZone.findMany({
    orderBy: { intensity: "desc" },
  });

  return NextResponse.json({ zones, total: zones.length });
}
