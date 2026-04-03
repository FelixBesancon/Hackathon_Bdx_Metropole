import { Request, Response } from "express";
import * as heatmapService from "../services/heatmap.service";

function parseViewportQuery(req: Request) {
  const bboxParam = typeof req.query.bbox === "string" ? req.query.bbox : null;

  let bounds: { west: number; south: number; east: number; north: number } | undefined;

  if (bboxParam) {
    const values = bboxParam.split(",").map((value) => Number(value));
    if (values.length === 4 && values.every(Number.isFinite)) {
      const [west, south, east, north] = values;
      bounds = { west, south, east, north };
    }
  }

  return { bounds };
}

export async function getHeatZones(_req: Request, res: Response) {
  const zones = await heatmapService.getAllZones();
  res.json({ zones, total: zones.length });
}

export async function getHeatZoneById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const zone = await heatmapService.getZoneById(id);
  if (!zone) {
    res.status(404).json({ error: "Zone introuvable" });
    return;
  }

  res.json(zone);
}

export async function getHeatmapSource(req: Request, res: Response) {
  try {
    const geoJson = await heatmapService.getHeatmapSource(parseViewportQuery(req));
    res.json(geoJson);
  } catch (error) {
    console.error("Erreur lors de la récupération des données heatmap:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Impossible de récupérer les données des îlots de chaleur"
    });
  }
}

export async function getFountainsSource(_req: Request, res: Response) {
  try {
    const geoJson = await heatmapService.getFountainsSource();
    res.json(geoJson);
  } catch (error) {
    console.error("Erreur lors de la récupération des données fontaines:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Impossible de récupérer les données des fontaines"
    });
  }
}

export async function getVegetationSource(req: Request, res: Response) {
  try {
    const geoJson = await heatmapService.getVegetationSource(parseViewportQuery(req));
    res.json(geoJson);
  } catch (error) {
    console.error("Erreur lors de la récupération des données végétation:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Impossible de récupérer les données de végétation"
    });
  }
}

export async function clearCache(_req: Request, res: Response) {
  try {
    const report = await heatmapService.refreshData({
      force: true,
      reason: "manual-cache-clear-alias",
    });

    res.json({
      message: "Sync forcée exécutée (route legacy /cache/clear)",
      report,
    });
  } catch (error) {
    console.error("Erreur lors de la sync forcée:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Impossible de déclencher la synchronisation"
    });
  }
}

export async function refreshHeatmapData(req: Request, res: Response) {
  try {
    const force = Boolean(req.body?.force);
    const report = await heatmapService.refreshData({
      force,
      reason: "manual-refresh-endpoint",
    });

    res.json({
      message: "Synchronisation terminée",
      report,
    });
  } catch (error) {
    console.error("Erreur lors du refresh manuel:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Impossible de lancer la synchronisation",
    });
  }
}

export async function getHeatmapSyncStatus(_req: Request, res: Response) {
  try {
    const status = await heatmapService.getDataSyncStatus();
    res.json(status);
  } catch (error) {
    console.error("Erreur lors de la récupération du statut de sync:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Impossible de récupérer le statut de synchronisation",
    });
  }
}
