import { Router } from "express";
import { runSimulation } from "../controllers/simulation.controller";

const router = Router();

router.post("/", runSimulation);

export default router;
