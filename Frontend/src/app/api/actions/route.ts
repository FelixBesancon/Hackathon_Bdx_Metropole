import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { CreateActionPayload } from "@/types/action";

export async function GET() {
  const actions = await prisma.citizenAction.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(actions);
}

export async function POST(req: NextRequest) {
  const body: CreateActionPayload = await req.json();

  // Impact thermique estimé selon le type d'action
  const impactByType: Record<string, number> = {
    VEGETATION: 1.5,
    WATER_POINT: 2.0,
    SHADE: 1.0,
  };

  const action = await prisma.citizenAction.create({
    data: {
      type: body.type,
      lat: body.lat,
      lng: body.lng,
      radius: body.radius,
      impact: impactByType[body.type] ?? 1.0,
    },
  });

  return NextResponse.json(action, { status: 201 });
}
