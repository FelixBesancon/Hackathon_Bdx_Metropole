import { Request, Response } from "express";
import * as simulationService from "../services/simulation.service";
import type { SimulationRequest } from "../types/simulation";

export async function runSimulation(req: Request, res: Response) {
  const body: SimulationRequest = req.body;

  if (!body.actions || body.actions.length === 0) {
    res.status(400).json({ error: "Au moins une action est requise" });
    return;
  }

  const result = simulationService.computeSimulation(body);
  res.json(result);
}
