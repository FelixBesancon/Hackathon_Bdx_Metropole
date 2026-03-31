import type { SimulationRequest, SimulationResult } from "../types/simulation";

const IMPACT_BY_TYPE: Record<string, number> = {
  VEGETATION: 1.5,
  WATER_POINT: 2.0,
  SHADE: 1.0,
};

const BASE_TEMPERATURE = 38; // °C référence été Bordeaux

export function computeSimulation(req: SimulationRequest): SimulationResult {
  let totalDelta = 0;

  const breakdown = req.actions.map((action, i) => {
    const contribution = IMPACT_BY_TYPE[action.type] ?? 1.0;
    totalDelta -= contribution;
    return { actionId: i, contribution };
  });

  return {
    originalTemperature: BASE_TEMPERATURE,
    simulatedTemperature: Math.max(BASE_TEMPERATURE + totalDelta, 20),
    deltaTemperature: totalDelta,
    affectedZones: req.actions.length,
    breakdown,
  };
}
