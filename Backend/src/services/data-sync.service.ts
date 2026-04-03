import { createHash } from "crypto";
import { DatasetSyncStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

interface DatahubRecord {
  [key: string]: unknown;
}

interface DatahubRecordsResponse {
  results: DatahubRecord[];
  total_count?: number;
}

interface DatahubDatasetMeta {
  modified?: string;
  data_processed?: string;
  records_count?: number;
  metas?: {
    modified?: string;
    data_processed?: string;
  };
}

interface DatasetSyncResult {
  datasetKey: string;
  status: "updated" | "skipped" | "failed";
  fetchedRecords?: number;
  message: string;
}

export interface SyncReport {
  startedAt: string;
  finishedAt: string;
  force: boolean;
  results: DatasetSyncResult[];
}

interface SyncOptions {
  force?: boolean;
  reason?: string;
}

const DATAHUB_BASE = "https://datahub.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const PAGE_SIZE = 100;
const SAFETY_MAX_RECORDS = 150_000;

const BORDEAUX_METRO_INSEE_CODES = [
  "33449", "33063", "33281", "33318", "33376", "33056", "33004", "33273", "33003", "33550",
  "33312", "33192", "33519", "33487", "33075", "33162", "33434", "33039", "33032", "33200",
  "33167", "33065", "33522", "33013", "33249", "33119", "33069", "33096",
];

const SOURCE_DATASET = "ri_icu_ifu_s";
const VEGETATION_DATASET = "met_vegetation_urbaine";
const ICTU_DATASET = "ri_ictu_s";
const FOUNTAINS_DATASETS = [
  { datasetId: "bor_fontaines_eau_potable", sourceName: "Bordeaux Métropole" },
  { datasetId: "mer_points-d-eau-potable", sourceName: "Mérignac" },
  { datasetId: "tal_pointseaulibreacces", sourceName: "Talence" },
];

let runningSyncPromise: Promise<SyncReport> | null = null;

export async function syncAllDatasets(options: SyncOptions = {}): Promise<SyncReport> {
  if (runningSyncPromise) {
    console.log("[Sync] Synchronisation déjà en cours, réutilisation de la même promesse");
    return runningSyncPromise;
  }

  const force = Boolean(options.force);
  const reason = options.reason ?? "manual";

  runningSyncPromise = runSync(force, reason)
    .catch(async (error) => {
      console.error("[Sync] Échec global de synchronisation:", error);
      throw error;
    })
    .finally(() => {
      runningSyncPromise = null;
    });

  return runningSyncPromise;
}

export function startBackgroundSync(): void {
  void syncAllDatasets({ force: false, reason: "startup" })
    .then((report) => {
      console.log(`[Sync] Sync au démarrage terminée (${report.results.length} datasets traités)`);
    })
    .catch((error) => {
      console.error("[Sync] Échec sync au démarrage (non bloquant):", error);
    });
}

export async function getSyncStatus() {
  const states = await prisma.datasetSyncState.findMany({
    orderBy: { datasetKey: "asc" },
  });

  return {
    running: runningSyncPromise !== null,
    states,
  };
}

async function runSync(force: boolean, reason: string): Promise<SyncReport> {
  const startedAt = new Date();
  console.log(`[Sync] Démarrage synchronisation (reason=${reason}, force=${force})`);

  const results: DatasetSyncResult[] = [];
  results.push(await syncSourceDataset(force));
  results.push(await syncVegetationDataset(force));
  results.push(await syncICTUDataset(force));
  results.push(await syncFountainsDataset(force));

  const finishedAt = new Date();

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    force,
    results,
  };
}

async function syncSourceDataset(force: boolean): Promise<DatasetSyncResult> {
  const datasetKey = "source";

  try {
    await markRunning(datasetKey);

    const meta = await fetchDatasetMetadata(SOURCE_DATASET);
    const signature = buildSignature(meta);
    const previous = await prisma.datasetSyncState.findUnique({ where: { datasetKey } });

    if (!force && previous?.signature === signature) {
      await markSuccess(datasetKey, meta, signature, "Aucun changement détecté");
      return {
        datasetKey,
        status: "skipped",
        message: "Aucun changement détecté",
      };
    }

    const records = await fetchAllRecordsFromExport(SOURCE_DATASET);
    const rows = records
      .map((record) => {
        const geometry = extractPolygonGeometry(record);
        if (!geometry) return null;

        const bounds = computeGeometryBounds(geometry);
        if (!bounds) return null;

        const properties = sanitizeProperties(record);
        const sourceId = buildStableSourceId(SOURCE_DATASET, record, geometry, properties);

        return {
          sourceId,
          geometry: geometry as Prisma.InputJsonValue,
          properties: properties as Prisma.InputJsonValue,
          minLng: bounds.minLng,
          minLat: bounds.minLat,
          maxLng: bounds.maxLng,
          maxLat: bounds.maxLat,
        };
      })
      .filter((row): row is {
        sourceId: string;
        geometry: Prisma.InputJsonValue;
        properties: Prisma.InputJsonValue;
        minLng: number;
        minLat: number;
        maxLng: number;
        maxLat: number;
      } => Boolean(row));

    await prisma.$transaction(async (tx) => {
      await tx.heatSourceFeature.deleteMany();
      if (rows.length > 0) {
        await tx.heatSourceFeature.createMany({ data: rows, skipDuplicates: true });
      }

      await tx.datasetSyncState.upsert({
        where: { datasetKey },
        update: {
          signature,
          remoteModified: getRemoteModified(meta),
          remoteProcessed: getRemoteProcessed(meta),
          remoteRecords: getRemoteRecords(meta),
          lastStatus: DatasetSyncStatus.SUCCESS,
          lastSuccessAt: new Date(),
          lastError: null,
        },
        create: {
          datasetKey,
          signature,
          remoteModified: getRemoteModified(meta),
          remoteProcessed: getRemoteProcessed(meta),
          remoteRecords: getRemoteRecords(meta),
          lastStatus: DatasetSyncStatus.SUCCESS,
          lastAttemptAt: new Date(),
          lastSuccessAt: new Date(),
          lastError: null,
        },
      });
    }, { timeout: 120_000, maxWait: 10_000 });

    return {
      datasetKey,
      status: "updated",
      fetchedRecords: rows.length,
      message: `Source mise à jour (${rows.length} enregistrements)`,
    };
  } catch (error) {
    await markFailure(datasetKey, error);
    return {
      datasetKey,
      status: "failed",
      message: `Échec sync source: ${toErrorMessage(error)}`,
    };
  }
}

async function syncVegetationDataset(force: boolean): Promise<DatasetSyncResult> {
  const datasetKey = "vegetation";

  try {
    await markRunning(datasetKey);

    const meta = await fetchDatasetMetadata(VEGETATION_DATASET);
    const signature = buildSignature(meta);
    const previous = await prisma.datasetSyncState.findUnique({ where: { datasetKey } });

    if (!force && previous?.signature === signature) {
      await markSuccess(datasetKey, meta, signature, "Aucun changement détecté");
      return {
        datasetKey,
        status: "skipped",
        message: "Aucun changement détecté",
      };
    }

    const records = await fetchAllRecordsFromExport(VEGETATION_DATASET);
    const rows = records
      .map((record) => {
        const geometry = extractPolygonGeometry(record);
        if (!geometry) return null;

        const bounds = computeGeometryBounds(geometry);
        if (!bounds) return null;

        const properties = sanitizeProperties(record);
        const sourceId = buildStableSourceId(VEGETATION_DATASET, record, geometry, properties);

        return {
          sourceId,
          geometry: geometry as Prisma.InputJsonValue,
          properties: properties as Prisma.InputJsonValue,
          minLng: bounds.minLng,
          minLat: bounds.minLat,
          maxLng: bounds.maxLng,
          maxLat: bounds.maxLat,
        };
      })
      .filter((row): row is {
        sourceId: string;
        geometry: Prisma.InputJsonValue;
        properties: Prisma.InputJsonValue;
        minLng: number;
        minLat: number;
        maxLng: number;
        maxLat: number;
      } => Boolean(row));

    await prisma.$transaction(async (tx) => {
      await tx.vegetationFeature.deleteMany();
      if (rows.length > 0) {
        await tx.vegetationFeature.createMany({ data: rows, skipDuplicates: true });
      }

      await tx.datasetSyncState.upsert({
        where: { datasetKey },
        update: {
          signature,
          remoteModified: getRemoteModified(meta),
          remoteProcessed: getRemoteProcessed(meta),
          remoteRecords: getRemoteRecords(meta),
          lastStatus: DatasetSyncStatus.SUCCESS,
          lastSuccessAt: new Date(),
          lastError: null,
        },
        create: {
          datasetKey,
          signature,
          remoteModified: getRemoteModified(meta),
          remoteProcessed: getRemoteProcessed(meta),
          remoteRecords: getRemoteRecords(meta),
          lastStatus: DatasetSyncStatus.SUCCESS,
          lastAttemptAt: new Date(),
          lastSuccessAt: new Date(),
          lastError: null,
        },
      });
    }, { timeout: 120_000, maxWait: 10_000 });

    return {
      datasetKey,
      status: "updated",
      fetchedRecords: rows.length,
      message: `Végétation mise à jour (${rows.length} enregistrements)`,
    };
  } catch (error) {
    await markFailure(datasetKey, error);
    return {
      datasetKey,
      status: "failed",
      message: `Échec sync végétation: ${toErrorMessage(error)}`,
    };
  }
}

async function syncICTUDataset(force: boolean): Promise<DatasetSyncResult> {
  const datasetKey = "ictu";

  try {
    await markRunning(datasetKey);

    const meta = await fetchDatasetMetadata(ICTU_DATASET);
    const signature = buildSignature(meta);
    const previous = await prisma.datasetSyncState.findUnique({ where: { datasetKey } });

    if (!force && previous?.signature === signature) {
      await markSuccess(datasetKey, meta, signature, "Aucun changement détecté");
      return {
        datasetKey,
        status: "skipped",
        message: "Aucun changement détecté",
      };
    }

    const records = await fetchAllRecordsFromExport(ICTU_DATASET);
    const rows = records
      .map((record) => {
        const geometry = extractPointGeometry(record);
        if (!geometry) return null;

        const bounds = computeGeometryBounds(geometry);
        if (!bounds) return null;

        const properties = sanitizeProperties(record);
        const sourceId = buildStableSourceId(ICTU_DATASET, record, geometry, properties);

        // Extract ICTU metrics
        const ictuMin = extractNumericProperty(properties, "ictu_min");
        const ictuMean = extractNumericProperty(properties, "ictu_mean");
        const ictuMedian = extractNumericProperty(properties, "ictu_median");
        const ictuMax = extractNumericProperty(properties, "ictu_max");

        return {
          sourceId,
          geometry: geometry as Prisma.InputJsonValue,
          properties: properties as Prisma.InputJsonValue,
          ictuMin,
          ictuMean,
          ictuMedian,
          ictuMax,
          minLng: bounds.minLng,
          minLat: bounds.minLat,
          maxLng: bounds.maxLng,
          maxLat: bounds.maxLat,
        };
      })
      .filter((row): row is {
        sourceId: string;
        geometry: Prisma.InputJsonValue;
        properties: Prisma.InputJsonValue;
        ictuMin: number | null;
        ictuMean: number | null;
        ictuMedian: number | null;
        ictuMax: number | null;
        minLng: number;
        minLat: number;
        maxLng: number;
        maxLat: number;
      } => Boolean(row));

    await prisma.$transaction(async (tx) => {
      await tx.iCTUFeature.deleteMany();
      if (rows.length > 0) {
        await tx.iCTUFeature.createMany({ data: rows, skipDuplicates: true });
      }

      await tx.datasetSyncState.upsert({
        where: { datasetKey },
        update: {
          signature,
          remoteModified: getRemoteModified(meta),
          remoteProcessed: getRemoteProcessed(meta),
          remoteRecords: getRemoteRecords(meta),
          lastStatus: DatasetSyncStatus.SUCCESS,
          lastSuccessAt: new Date(),
          lastError: null,
        },
        create: {
          datasetKey,
          signature,
          remoteModified: getRemoteModified(meta),
          remoteProcessed: getRemoteProcessed(meta),
          remoteRecords: getRemoteRecords(meta),
          lastStatus: DatasetSyncStatus.SUCCESS,
          lastAttemptAt: new Date(),
          lastSuccessAt: new Date(),
          lastError: null,
        },
      });
    }, { timeout: 120_000, maxWait: 10_000 });

    return {
      datasetKey,
      status: "updated",
      fetchedRecords: rows.length,
      message: `Indice de confort thermique urbain (ICTU) mis à jour (${rows.length} enregistrements)`,
    };
  } catch (error) {
    await markFailure(datasetKey, error);
    return {
      datasetKey,
      status: "failed",
      message: `Échec sync ICTU: ${toErrorMessage(error)}`,
    };
  }
}

async function syncFountainsDataset(force: boolean): Promise<DatasetSyncResult> {
  const datasetKey = "fountains";

  try {
    await markRunning(datasetKey);

    const metadataList = await Promise.all(
      FOUNTAINS_DATASETS.map(async ({ datasetId }) => ({
        datasetId,
        meta: await fetchDatasetMetadata(datasetId),
      }))
    );

    const signature = metadataList
      .map(({ datasetId, meta }) => `${datasetId}:${buildSignature(meta)}`)
      .sort()
      .join("||");

    const previous = await prisma.datasetSyncState.findUnique({ where: { datasetKey } });

    if (!force && previous?.signature === signature) {
      await prisma.datasetSyncState.upsert({
        where: { datasetKey },
        update: {
          signature,
          remoteModified: metadataList.map(({ meta }) => getRemoteModified(meta)).filter(Boolean).join("|"),
          remoteProcessed: metadataList.map(({ meta }) => getRemoteProcessed(meta)).filter(Boolean).join("|"),
          remoteRecords: metadataList.reduce((acc, { meta }) => acc + (getRemoteRecords(meta) ?? 0), 0),
          lastStatus: DatasetSyncStatus.SUCCESS,
          lastSuccessAt: new Date(),
          lastError: null,
        },
        create: {
          datasetKey,
          signature,
          remoteModified: metadataList.map(({ meta }) => getRemoteModified(meta)).filter(Boolean).join("|"),
          remoteProcessed: metadataList.map(({ meta }) => getRemoteProcessed(meta)).filter(Boolean).join("|"),
          remoteRecords: metadataList.reduce((acc, { meta }) => acc + (getRemoteRecords(meta) ?? 0), 0),
          lastStatus: DatasetSyncStatus.SUCCESS,
          lastAttemptAt: new Date(),
          lastSuccessAt: new Date(),
          lastError: null,
        },
      });

      return {
        datasetKey,
        status: "skipped",
        message: "Aucun changement détecté",
      };
    }

    const rows: Array<{
      sourceId: string;
      datasetId: string;
      geometry: Prisma.InputJsonValue;
      properties: Prisma.InputJsonValue;
    }> = [];

    for (const { datasetId, sourceName } of FOUNTAINS_DATASETS) {
      const records = await fetchAllRecords(datasetId);

      for (const record of records) {
        const geometry = extractPointGeometry(record);
        if (!geometry) continue;

        const properties = {
          source: sourceName,
          ...sanitizeProperties(record),
        };

        rows.push({
          sourceId: buildStableSourceId(datasetId, record, geometry, properties),
          datasetId,
          geometry: geometry as Prisma.InputJsonValue,
          properties: properties as Prisma.InputJsonValue,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.fountainFeature.deleteMany();
      if (rows.length > 0) {
        await tx.fountainFeature.createMany({ data: rows, skipDuplicates: true });
      }

      await tx.datasetSyncState.upsert({
        where: { datasetKey },
        update: {
          signature,
          remoteModified: metadataList.map(({ meta }) => getRemoteModified(meta)).filter(Boolean).join("|"),
          remoteProcessed: metadataList.map(({ meta }) => getRemoteProcessed(meta)).filter(Boolean).join("|"),
          remoteRecords: metadataList.reduce((acc, { meta }) => acc + (getRemoteRecords(meta) ?? 0), 0),
          lastStatus: DatasetSyncStatus.SUCCESS,
          lastSuccessAt: new Date(),
          lastError: null,
        },
        create: {
          datasetKey,
          signature,
          remoteModified: metadataList.map(({ meta }) => getRemoteModified(meta)).filter(Boolean).join("|"),
          remoteProcessed: metadataList.map(({ meta }) => getRemoteProcessed(meta)).filter(Boolean).join("|"),
          remoteRecords: metadataList.reduce((acc, { meta }) => acc + (getRemoteRecords(meta) ?? 0), 0),
          lastStatus: DatasetSyncStatus.SUCCESS,
          lastAttemptAt: new Date(),
          lastSuccessAt: new Date(),
          lastError: null,
        },
      });
    }, { timeout: 120_000, maxWait: 10_000 });

    return {
      datasetKey,
      status: "updated",
      fetchedRecords: rows.length,
      message: `Fontaines mises à jour (${rows.length} enregistrements)`,
    };
  } catch (error) {
    await markFailure(datasetKey, error);
    return {
      datasetKey,
      status: "failed",
      message: `Échec sync fontaines: ${toErrorMessage(error)}`,
    };
  }
}

async function markRunning(datasetKey: string): Promise<void> {
  await prisma.datasetSyncState.upsert({
    where: { datasetKey },
    update: {
      lastStatus: DatasetSyncStatus.RUNNING,
      lastAttemptAt: new Date(),
      lastError: null,
    },
    create: {
      datasetKey,
      lastStatus: DatasetSyncStatus.RUNNING,
      lastAttemptAt: new Date(),
      signature: null,
      remoteModified: null,
      remoteProcessed: null,
      remoteRecords: null,
      lastSuccessAt: null,
      lastError: null,
    },
  });
}

async function markSuccess(
  datasetKey: string,
  meta: DatahubDatasetMeta,
  signature: string,
  message?: string
): Promise<void> {
  if (message) {
    console.log(`[Sync] ${datasetKey}: ${message}`);
  }

  await prisma.datasetSyncState.upsert({
    where: { datasetKey },
    update: {
      signature,
      remoteModified: getRemoteModified(meta),
      remoteProcessed: getRemoteProcessed(meta),
      remoteRecords: getRemoteRecords(meta),
      lastStatus: DatasetSyncStatus.SUCCESS,
      lastSuccessAt: new Date(),
      lastError: null,
    },
    create: {
      datasetKey,
      signature,
      remoteModified: getRemoteModified(meta),
      remoteProcessed: getRemoteProcessed(meta),
      remoteRecords: getRemoteRecords(meta),
      lastStatus: DatasetSyncStatus.SUCCESS,
      lastAttemptAt: new Date(),
      lastSuccessAt: new Date(),
      lastError: null,
    },
  });
}

async function markFailure(datasetKey: string, error: unknown): Promise<void> {
  const message = toErrorMessage(error);

  console.error(`[Sync] ${datasetKey}: ${message}`);

  await prisma.datasetSyncState.upsert({
    where: { datasetKey },
    update: {
      lastStatus: DatasetSyncStatus.ERROR,
      lastError: message,
    },
    create: {
      datasetKey,
      lastStatus: DatasetSyncStatus.ERROR,
      lastAttemptAt: new Date(),
      lastSuccessAt: null,
      signature: null,
      remoteModified: null,
      remoteProcessed: null,
      remoteRecords: null,
      lastError: message,
    },
  });
}

function buildSignature(meta: DatahubDatasetMeta): string {
  return [getRemoteModified(meta), getRemoteProcessed(meta), getRemoteRecords(meta) ?? "0"].join("|");
}

function getRemoteModified(meta: DatahubDatasetMeta): string {
  return meta.modified ?? meta.metas?.modified ?? "";
}

function getRemoteProcessed(meta: DatahubDatasetMeta): string {
  return meta.data_processed ?? meta.metas?.data_processed ?? "";
}

function getRemoteRecords(meta: DatahubDatasetMeta): number | null {
  const count = meta.records_count;
  return typeof count === "number" ? count : null;
}

async function fetchDatasetMetadata(datasetId: string): Promise<DatahubDatasetMeta> {
  const url = `${DATAHUB_BASE}/${datasetId}`;
  return retry(async () => {
    const response = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} sur metadata ${datasetId}`);
    }

    return response.json() as Promise<DatahubDatasetMeta>;
  }, `metadata:${datasetId}`);
}

async function fetchAllRecords(
  datasetId: string,
  options: { splitByCommune?: boolean } = {}
): Promise<DatahubRecord[]> {
  if (options.splitByCommune) {
    const splitRecords = await fetchAllRecordsByCommune(datasetId);
    if (splitRecords.length > 0) {
      return splitRecords;
    }

    console.warn(`[Sync] ${datasetId}: fallback vers pagination globale (split commune indisponible)`);
  }

  return fetchAllRecordsPaginated(datasetId);
}

async function fetchAllRecordsFromExport(datasetId: string): Promise<DatahubRecord[]> {
  const url = `${DATAHUB_BASE}/${datasetId}/exports/json`;

  try {
    const payload = await retry(async () => {
      const response = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS * 4);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} sur exports ${datasetId}`);
      }

      return response.json() as Promise<unknown>;
    }, `exports:${datasetId}`);

    if (!Array.isArray(payload)) {
      throw new Error(`Réponse exports invalide pour ${datasetId}`);
    }

    const records = payload as DatahubRecord[];
    if (records.length > SAFETY_MAX_RECORDS) {
      console.warn(`[Sync] ${datasetId}: exports depasse la limite de securite, troncature a ${SAFETY_MAX_RECORDS}`);
      return records.slice(0, SAFETY_MAX_RECORDS);
    }

    return records;
  } catch (error) {
    console.warn(`[Sync] ${datasetId}: exports indisponible, fallback records (${toErrorMessage(error)})`);
    return fetchAllRecords(datasetId, { splitByCommune: true });
  }
}

async function fetchAllRecordsByCommune(datasetId: string): Promise<DatahubRecord[]> {
  const allRecords: DatahubRecord[] = [];
  const seenIds = new Set<string>();

  for (const codeInsee of BORDEAUX_METRO_INSEE_CODES) {
    const where = `insee=\"${codeInsee}\"`;

    let records: DatahubRecord[];
    try {
      records = await fetchAllRecordsPaginated(datasetId, where);
    } catch (error) {
      console.warn(`[Sync] ${datasetId}: filtre commune indisponible (${toErrorMessage(error)})`);
      return [];
    }

    for (const record of records) {
      const stableId = String(
        record.recordid ??
        record.record_id ??
        record.id ??
        `${datasetId}:${codeInsee}:${JSON.stringify(record).slice(0, 200)}`
      );

      if (seenIds.has(stableId)) continue;
      seenIds.add(stableId);
      allRecords.push(record);
    }

    if (allRecords.length >= SAFETY_MAX_RECORDS) {
      console.warn(`[Sync] ${datasetId}: limite de securite atteinte (${SAFETY_MAX_RECORDS})`);
      break;
    }
  }

  return allRecords;
}

async function fetchAllRecordsPaginated(datasetId: string, where?: string): Promise<DatahubRecord[]> {
  const allRecords: DatahubRecord[] = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${DATAHUB_BASE}/${datasetId}/records`);
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));
    if (where) {
      url.searchParams.set("where", where);
    }

    const payload = await retry(async () => {
      const response = await fetchWithTimeout(url.toString(), REQUEST_TIMEOUT_MS);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} sur records ${datasetId} offset=${offset}${where ? ` where=${where}` : ""}`);
      }

      return response.json() as Promise<DatahubRecordsResponse>;
    }, `records:${datasetId}:${offset}`);

    const records = Array.isArray(payload.results) ? payload.results : [];
    if (records.length === 0) {
      break;
    }

    allRecords.push(...records);
    offset += PAGE_SIZE;

    if (allRecords.length >= SAFETY_MAX_RECORDS) {
      console.warn(`[Sync] ${datasetId}: limite de securite atteinte (${SAFETY_MAX_RECORDS})`);
      break;
    }
  }

  return allRecords;
}

async function retry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const remaining = MAX_RETRIES - attempt;
      if (remaining <= 0) {
        break;
      }

      const delayMs = 400 * (attempt + 1);
      console.warn(`[Sync] ${label}: tentative échouée (${toErrorMessage(error)}), retry dans ${delayMs}ms`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeProperties(record: DatahubRecord): Record<string, unknown> {
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (["geo_shape", "geometry", "geom", "geo_point", "geo_point_2d"].includes(key)) {
      continue;
    }

    if (value !== undefined) {
      clean[key] = value;
    }
  }

  return clean;
}

function extractPolygonGeometry(record: DatahubRecord): Record<string, unknown> | null {
  const geoShape = record.geo_shape as Record<string, unknown> | undefined;
  if (!geoShape || typeof geoShape !== "object") {
    return null;
  }

  const nestedGeometry = geoShape.geometry as Record<string, unknown> | undefined;
  const geometry = nestedGeometry ?? geoShape;

  if (!geometry || typeof geometry !== "object") {
    return null;
  }

  if (typeof geometry.type !== "string" || geometry.coordinates == null) {
    return null;
  }

  return geometry;
}

function extractPointGeometry(record: DatahubRecord): Record<string, unknown> | null {
  const coordCandidates = [
    record.geom as Record<string, unknown> | undefined,
    record.geo_point as Record<string, unknown> | undefined,
    record.geo_point_2d as Record<string, unknown> | undefined,
  ];

  for (const candidate of coordCandidates) {
    const latRaw = candidate?.lat;
    const lonRaw = candidate?.lon;

    const lat = typeof latRaw === "number" ? latRaw : Number(latRaw);
    const lon = typeof lonRaw === "number" ? lonRaw : Number(lonRaw);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return {
        type: "Point",
        coordinates: [lon, lat],
      };
    }
  }

  return null;
}

function computeGeometryBounds(geometry: Record<string, unknown>): {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
} | null {
  const coordinates = geometry.coordinates;
  if (coordinates == null) {
    return null;
  }

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  const visit = (value: unknown) => {
    if (!Array.isArray(value)) return;

    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      const lng = value[0];
      const lat = value[1];

      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
      return;
    }

    for (const item of value) {
      visit(item);
    }
  };

  visit(coordinates);

  if (![minLng, minLat, maxLng, maxLat].every(Number.isFinite)) {
    return null;
  }

  return { minLng, minLat, maxLng, maxLat };
}

function buildStableSourceId(
  datasetId: string,
  record: DatahubRecord,
  geometry: Record<string, unknown>,
  properties: Record<string, unknown>
): string {
  const candidates = [
    record.recordid,
    record.record_id,
    record.id,
    record.identifiant,
    record.objectid,
    record.gid,
  ];

  for (const candidate of candidates) {
    if (candidate == null) continue;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return `${datasetId}:${candidate}`;
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return `${datasetId}:${candidate}`;
    }
  }

  const signature = JSON.stringify({ geometry, properties });
  const hash = createHash("sha1").update(signature).digest("hex");
  return `${datasetId}:hash:${hash}`;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function extractNumericProperty(properties: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = properties[key];
    if (value !== undefined && value !== null) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }
  return null;
}
