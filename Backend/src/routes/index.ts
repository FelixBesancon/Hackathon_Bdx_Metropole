import { Router } from "express";
import heatmapRoutes from "./heatmap.routes";
import actionsRoutes from "./actions.routes";
import simulationRoutes from "./simulation.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/heatmap", heatmapRoutes);
router.use("/actions", actionsRoutes);
router.use("/simulation", simulationRoutes);

export default router;
