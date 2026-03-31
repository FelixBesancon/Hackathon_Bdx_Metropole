import { prisma } from "../config/database";

export async function findAll() {
  return prisma.heatZone.findMany({ orderBy: { intensity: "desc" } });
}

export async function findById(id: number) {
  return prisma.heatZone.findUnique({ where: { id } });
}
