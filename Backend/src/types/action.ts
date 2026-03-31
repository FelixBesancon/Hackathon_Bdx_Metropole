export type ActionType = "VEGETATION" | "WATER_POINT" | "SHADE";

export interface CitizenAction {
  id: number;
  type: ActionType;
  lat: number;
  lng: number;
  radius: number;
  impact: number;
  createdAt: Date;
}

export interface CreateActionPayload {
  type: ActionType;
  lat: number;
  lng: number;
  radius: number;
}
