import type { ActionType } from "./action";

export interface SimulationRequest {
  actions: {
    type: ActionType;
    lat: number;
    lng: number;
    radius: number;
  }[];
  targetZoneId?: number;
}

export interface SimulationResult {
  originalTemperature: number;
  simulatedTemperature: number;
  deltaTemperature: number;
  affectedZones: number;
  breakdown: {
    actionId: number;
    contribution: number;
  }[];
}
