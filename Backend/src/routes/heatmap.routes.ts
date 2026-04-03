import { Router } from "express";
import {
	getHeatZones,
	getHeatZoneById,
	getHeatmapSource,
	getFountainsSource,
	getVegetationSource,
	getICTUSource,
	clearCache,
	refreshHeatmapData,
	getHeatmapSyncStatus,
} from "../controllers/heatmap.controller";

const router = Router();

router.get("/source/geojson", getHeatmapSource);
router.get("/fountains/geojson", getFountainsSource);
router.get("/vegetation/geojson", getVegetationSource);
router.get("/ictu/geojson", getICTUSource);
router.get("/sync/status", getHeatmapSyncStatus);
router.post("/sync/refresh", refreshHeatmapData);
router.post("/cache/clear", clearCache);
router.get("/", getHeatZones);
router.get("/:id", getHeatZoneById);

export default router;
