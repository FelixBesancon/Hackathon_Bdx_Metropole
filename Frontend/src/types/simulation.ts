import type { CitizenAction } from "./action";

export interface SimulationRequest {
  actions: Pick<CitizenAction, "type" | "lat" | "lng" | "radius">[];
  targetZoneId?: number;
}

export interface SimulationResult {
  originalTemperature: number;
  simulatedTemperature: number;
  deltaTemperature: number; // négatif = réduction
  affectedZones: number;
  breakdown: {
    actionId: number;
    contribution: number; // °C
  }[];
}
