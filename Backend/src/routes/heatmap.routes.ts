import { Router } from "express";
import { getHeatZones, getHeatZoneById } from "../controllers/heatmap.controller";

const router = Router();

router.get("/", getHeatZones);
router.get("/:id", getHeatZoneById);

export default router;
