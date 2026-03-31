import { Request, Response } from "express";
import * as heatmapService from "../services/heatmap.service";

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
