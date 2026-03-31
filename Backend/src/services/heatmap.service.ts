import * as heatmapRepo from "../repositories/heatmap.repository";

export async function getAllZones() {
  return heatmapRepo.findAll();
}

export async function getZoneById(id: number) {
  return heatmapRepo.findById(id);
}
