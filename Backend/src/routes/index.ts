import { Router } from "express";
import heatmapRoutes from "./heatmap.routes";
import actionsRoutes from "./actions.routes";
import simulationRoutes from "./simulation.routes";

const router = Router();

router.use("/heatmap", heatmapRoutes);
router.use("/actions", actionsRoutes);
router.use("/simulation", simulationRoutes);

export default router;
