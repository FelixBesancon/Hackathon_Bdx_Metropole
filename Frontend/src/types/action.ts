export type ActionType = "VEGETATION" | "WATER_POINT" | "SHADE";

export interface CitizenAction {
  id: number;
  type: ActionType;
  lat: number;
  lng: number;
  radius: number;  // rayon d'impact en mètres
  impact: number;  // réduction thermique estimée en °C
  createdAt: Date;
}

export interface CreateActionPayload {
  type: ActionType;
  lat: number;
  lng: number;
  radius: number;
}
