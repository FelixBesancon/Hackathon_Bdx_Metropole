export type ActionType = "VEGETATION" | "WATER_POINT" | "SHADE";

export interface CitizenAction {
  id: number;
  type: ActionType;
  lat: number;
  lng: number;
  radius: number;
  impact: number;
  col: number | null;
  row: number | null;
  mx: number | null;
  my: number | null;
  tileName: string | null;
  createdAt: Date;
}

export interface CreateActionPayload {
  type: ActionType;
  lat: number;
  lng: number;
  radius: number;
  col?: number;
  row?: number;
  mx?: number;
  my?: number;
  tileName?: string;
}
