import { NextRequest, NextResponse } from "next/server";
import type { SimulationRequest, SimulationResult } from "@/types/simulation";

export async function POST(req: NextRequest) {
  const body: SimulationRequest = await req.json();

  // Simulation simplifiée : chaque action réduit la température selon son type
  const impactByType: Record<string, number> = {
    VEGETATION: 1.5,
    WATER_POINT: 2.0,
    SHADE: 1.0,
  };

  const originalTemperature = 38; // °C référence été Bordeaux
  let totalDelta = 0;

  const breakdown = body.actions.map((action, i) => {
    // L'impact diminue avec la distance (simplifié : plein impact dans le rayon)
    const contribution = impactByType[action.type] ?? 1.0;
    totalDelta -= contribution;
    return { actionId: i, contribution };
  });

  const result: SimulationResult = {
    originalTemperature,
    simulatedTemperature: Math.max(originalTemperature + totalDelta, 20),
    deltaTemperature: totalDelta,
    affectedZones: body.actions.length,
    breakdown,
  };

  return NextResponse.json(result);
}
