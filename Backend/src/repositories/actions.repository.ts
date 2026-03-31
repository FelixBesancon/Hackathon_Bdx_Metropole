import { prisma } from "../config/database";
import type { ActionType } from "../types/action";

interface CreateActionData {
  type: ActionType;
  lat: number;
  lng: number;
  radius: number;
  impact: number;
}

export async function findAll() {
  return prisma.citizenAction.findMany({ orderBy: { createdAt: "desc" } });
}

export async function create(data: CreateActionData) {
  return prisma.citizenAction.create({ data });
}

export async function remove(id: number) {
  return prisma.citizenAction.delete({ where: { id } });
}
