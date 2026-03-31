export interface HeatZone {
  id: number;
  name: string;
  geometry: GeoJSON.Geometry;
  temperature: number; // °C moyenne
  intensity: 1 | 2 | 3 | 4 | 5;
  createdAt: Date;
}

export interface HeatmapApiResponse {
  zones: HeatZone[];
  total: number;
}
