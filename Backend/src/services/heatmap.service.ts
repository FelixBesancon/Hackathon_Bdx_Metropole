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
}

export async function getAllZones() {
  return heatmapRepo.findAll();
}

export async function getZoneById(id: number) {
  return heatmapRepo.findById(id);
}

export async function getHeatmapSource(query: ViewportQuery = {}): Promise<GeoJSONFeatureCollection> {
  const rows = await heatmapRepo.findSourceFeatures({ bounds: query.bounds });
  return rowsToGeoJson(rows, {
    displayedCount: rows.length,
    totalMatching: rows.length,
    simplified: false,
  });
}

export async function getVegetationSource(query: ViewportQuery = {}): Promise<GeoJSONFeatureCollection> {
  const rows = await heatmapRepo.findVegetationFeatures({ bounds: query.bounds });
  return rowsToGeoJson(rows, {
    displayedCount: rows.length,
    totalMatching: rows.length,
    simplified: false,
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
