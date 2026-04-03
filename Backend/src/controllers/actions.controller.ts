import { Request, Response } from "express";
import * as actionsService from "../services/actions.service";
import type { CreateActionPayload } from "../types/action";

export async function getActions(_req: Request, res: Response) {
  const actions = await actionsService.getAllActions();
  res.json(actions);
}

export async function createAction(req: Request, res: Response) {
  const payload: CreateActionPayload = req.body;

  if (!payload.type || payload.lat == null || payload.lng == null || payload.radius == null) {
    res.status(400).json({ error: "Champs manquants : type, lat, lng, radius" });
    return;
  }

  const action = await actionsService.createAction(payload);
  res.status(201).json(action);
}

export async function deleteAction(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  await actionsService.deleteAction(id);
  res.status(204).send();
}
