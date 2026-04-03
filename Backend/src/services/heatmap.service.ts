import * as heatmapRepo from "../repositories/heatmap.repository";
import { getSyncStatus, syncAllDatasets } from "./data-sync.service";

interface GeoJSONGeometry {
  type: string;
  coordinates: unknown;
}

interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONGeometry;
  properties: Record<string, unknown>;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
  meta?: {
    displayedCount: number;
    totalMatching: number;
    simplified: boolean;
  };
}

interface DbFeatureRow {
  id: number;
  sourceId: string;
  geometry: unknown;
  properties: unknown;
}

interface BoundsFilter {
  west: number;
  south: number;
  east: number;
  north: number;
}

interface ViewportQuery {
  bounds?: BoundsFilter;
  zoom?: number;
}

export async function getAllZones() {
  return heatmapRepo.findAll();
}

export async function getZoneById(id: number) {
  return heatmapRepo.findById(id);
}

export async function getHeatmapSource(query: ViewportQuery = {}): Promise<GeoJSONFeatureCollection> {
  const totalMatching = query.bounds
    ? await heatmapRepo.countSourceFeatures(query.bounds)
    : (await heatmapRepo.findAllSourceFeatures()).length;

  const take = getFeatureCap(query.zoom, "heat", totalMatching);
  const rows = query.bounds || take
    ? await heatmapRepo.findSourceFeatures({ bounds: query.bounds, take })
    : await heatmapRepo.findAllSourceFeatures();

  return rowsToGeoJson(rows, {
    displayedCount: rows.length,
    totalMatching,
    simplified: typeof take === "number" && totalMatching > rows.length,
  });
}

export async function getVegetationSource(query: ViewportQuery = {}): Promise<GeoJSONFeatureCollection> {
  const totalMatching = query.bounds
    ? await heatmapRepo.countVegetationFeatures(query.bounds)
    : (await heatmapRepo.findAllVegetationFeatures()).length;

  const take = getFeatureCap(query.zoom, "vegetation", totalMatching);
  const rows = query.bounds || take
    ? await heatmapRepo.findVegetationFeatures({ bounds: query.bounds, take })
    : await heatmapRepo.findAllVegetationFeatures();

  return rowsToGeoJson(rows, {
    displayedCount: rows.length,
    totalMatching,
    simplified: typeof take === "number" && totalMatching > rows.length,
  });
}

export async function getICTUSource(query: ViewportQuery = {}): Promise<GeoJSONFeatureCollection> {
  const totalMatching = query.bounds
    ? await heatmapRepo.countICTUFeatures(query.bounds)
    : (await heatmapRepo.findAllICTUFeatures()).length;

  const take = getFeatureCap(query.zoom, "ictu", totalMatching);
  const rows = query.bounds || take
    ? await heatmapRepo.findICTUFeatures({ bounds: query.bounds, take })
    : await heatmapRepo.findAllICTUFeatures();

  return rowsToGeoJson(rows, {
    displayedCount: rows.length,
    totalMatching,
    simplified: typeof take === "number" && totalMatching > rows.length,
  });
}

export async function getFountainsSource(): Promise<GeoJSONFeatureCollection> {
  const rows = await heatmapRepo.findAllFountainFeatures();
  return rowsToGeoJson(rows);
}

export async function refreshData(options: { force?: boolean; reason?: string } = {}) {
  return syncAllDatasets(options);
}

export async function getDataSyncStatus() {
  return getSyncStatus();
}

function rowsToGeoJson(
  rows: DbFeatureRow[],
  meta?: GeoJSONFeatureCollection["meta"]
): GeoJSONFeatureCollection {
  const features = rows
    .map((row) => toGeoJsonFeature(row))
    .filter((feature): feature is GeoJSONFeature => feature !== null);

  return {
    type: "FeatureCollection",
    features,
    meta,
  };
}

function getFeatureCap(
  zoom: number | undefined,
  dataset: "heat" | "vegetation" | "ictu",
  totalMatching: number
): number | undefined {
  if (zoom == null) {
    return dataset === "heat" ? Math.min(totalMatching, 20_000) : undefined;
  }

  if (dataset === "heat") {
    if (zoom <= 11) return 5_000;
    if (zoom <= 12) return 12_000;
    if (zoom <= 13) return 25_000;
    return undefined;
  }

  if (dataset === "ictu") {
    if (zoom <= 11) return 2_000;
    if (zoom <= 12) return 5_000;
    if (zoom <= 13) return 15_000;
    return undefined;
  }

  if (zoom <= 11) return 4_000;
  if (zoom <= 12) return 8_000;
  return undefined;
}

function toGeoJsonFeature(row: DbFeatureRow): GeoJSONFeature | null {
  const geometry = parseGeometry(row.geometry);
  if (!geometry) {
    return null;
  }

  return {
    type: "Feature",
    geometry,
    properties: parseProperties(row),
  };
}

function parseGeometry(value: unknown): GeoJSONGeometry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const geometry = value as Record<string, unknown>;
  if (typeof geometry.type !== "string" || geometry.coordinates == null) {
    return null;
  }

  return {
    type: geometry.type,
    coordinates: geometry.coordinates,
  };
}

function parseProperties(row: DbFeatureRow): Record<string, unknown> {
  if (!row.properties || typeof row.properties !== "object" || Array.isArray(row.properties)) {
    return {
      source_id: row.sourceId,
      db_id: row.id,
    };
  }

  return {
    ...(row.properties as Record<string, unknown>),
    source_id: row.sourceId,
    db_id: row.id,
  };
}
