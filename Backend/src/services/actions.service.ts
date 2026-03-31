import * as actionsRepo from "../repositories/actions.repository";
import type { CreateActionPayload } from "../types/action";

const IMPACT_BY_TYPE: Record<string, number> = {
  VEGETATION: 1.5,
  WATER_POINT: 2.0,
  SHADE: 1.0,
};

export async function getAllActions() {
  return actionsRepo.findAll();
}

export async function createAction(payload: CreateActionPayload) {
  const impact = IMPACT_BY_TYPE[payload.type] ?? 1.0;
  return actionsRepo.create({ ...payload, impact });
}

export async function deleteAction(id: number) {
  return actionsRepo.remove(id);
}
