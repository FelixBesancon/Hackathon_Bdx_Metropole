// =============================================================================
// config.ts — Configuration globale Bordeaux Vert (carte pixel)
// =============================================================================

export interface TileMeta {
  label: string;
  eco: string;
  plantable: boolean;
  color: [number, number, number];
  icon: string;
}

export interface ClusterLevel {
  min: number;
  max: number;
  type: "tree" | "small_park" | "park" | "forest";
  label: string;
  size: number;
}

export interface GPS {
  lat: number;
  lon: number;
}

export interface PlantedEntity {
  id: number;
  col: number;
  row: number;
  mx: number;
  my: number;
  tileName: string | number;
  date: string;
  gps: GPS;
}

export interface Cluster {
  members: PlantedEntity[];
  count: number;
  cx: number;
  cy: number;
  col: number;
  row: number;
}

export interface PixelMapData {
  grid_b64: string;
  tile_names: string[];
  tile_colors: Record<string, { base: [number, number, number] }>;
  sprites: Record<string, string>;
}

export const CONFIG = {
  COLS: 747,
  ROWS: 725,
  TILE_PX: 16,
  CELL_M: 50,
  GPS: { S: 44.73, N: 45.07, W: -0.82, E: -0.37 },

  MIN_ZOOM: 0.04,
  MAX_ZOOM: 9,

  CLUSTER: {
    RADIUS_PX: 3,
    SMALL_PARK: 5,
    GROVE: 10,
    FOREST: 15,
  },

  TREE_PX: 40,
  CLUSTER_PX: { SMALL_PARK: 48, GROVE: 72, FOREST: 96 },
  FOUNTAIN_PX: 48,

  ECO: {
    TREE_CO2: 22,
    TREE_WATER: 150,
    TREE_TEMP: 0.02,
    FOUNTAIN_L: 500,
  },

  MILESTONES_TREES: [10, 25, 50, 100, 250, 500, 1000],
  MILESTONES_FOUNTAINS: [5, 10, 25, 50, 100],
} as const;

export const TILE_META: Record<string, TileMeta> = {
  BUILD_LARGE: { label: "Batiment", eco: "Impermeable", plantable: true, color: [185, 178, 165], icon: "\u{1F3E2}" },
  FOREST: { label: "Foret", eco: "Puits de CO2", plantable: false, color: [52, 100, 52], icon: "\u{1F332}" },
  GRASS: { label: "Prairie", eco: "Permeable", plantable: true, color: [106, 153, 78], icon: "\u{1F33F}" },
  INDUSTRY: { label: "Zone indus.", eco: "Polluante", plantable: true, color: [155, 150, 142], icon: "\u{1F3ED}" },
  PARK: { label: "Parc / Jardin", eco: "Zone verte", plantable: true, color: [130, 185, 90], icon: "\u{1F333}" },
  RAIL: { label: "Voie ferree", eco: "Neutre", plantable: false, color: [140, 130, 120], icon: "\u{1F682}" },
  ROAD_MAJOR: { label: "Route princ.", eco: "Emetteur CO2", plantable: false, color: [190, 175, 145], icon: "\u{1F6E3}" },
  ROAD_MINOR: { label: "Rue second.", eco: "Emetteur CO2", plantable: false, color: [200, 188, 162], icon: "\u{1F6E4}" },
  WATER: { label: "Eau / Garonne", eco: "Ressource", plantable: false, color: [80, 140, 200], icon: "\u{1F4A7}" },
};

export const CLUSTER_LEVELS: ClusterLevel[] = [
  { min: 1, max: 4, type: "tree", label: "Arbre(s)", size: 40 },
  { min: 5, max: 9, type: "small_park", label: "Petit parc", size: 48 },
  { min: 10, max: 14, type: "park", label: "Parc", size: 72 },
  { min: 15, max: Infinity, type: "forest", label: "Foret", size: 96 },
];
