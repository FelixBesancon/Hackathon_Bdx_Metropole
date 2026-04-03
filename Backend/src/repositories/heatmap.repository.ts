import { prisma } from "../config/database";

interface BoundsFilter {
  west: number;
  south: number;
  east: number;
  north: number;
}

interface FeatureQueryOptions {
  bounds?: BoundsFilter;
  take?: number;
}

export async function findAll() {
  return prisma.heatSourceFeature.findMany({ orderBy: { id: "asc" } });
}

export async function findById(id: number) {
  return prisma.heatSourceFeature.findUnique({ where: { id } });
}

export async function findAllSourceFeatures() {
  return prisma.heatSourceFeature.findMany({ orderBy: { id: "asc" } });
}

export async function findAllVegetationFeatures() {
  return prisma.vegetationFeature.findMany({ orderBy: { id: "asc" } });
}

export async function findAllICTUFeatures() {
  return prisma.iCTUFeature.findMany({ orderBy: { id: "asc" } });
}

export async function countSourceFeatures(bounds?: BoundsFilter) {
  return prisma.heatSourceFeature.count({
    where: bounds ? buildBoundsWhere(bounds) : undefined,
  });
}

export async function countVegetationFeatures(bounds?: BoundsFilter) {
  return prisma.vegetationFeature.count({
    where: bounds ? buildBoundsWhere(bounds) : undefined,
  });
}

export async function countICTUFeatures(bounds?: BoundsFilter) {
  return prisma.iCTUFeature.count({
    where: bounds ? buildBoundsWhere(bounds) : undefined,
  });
}

export async function findSourceFeatures(options: FeatureQueryOptions = {}) {
  return prisma.heatSourceFeature.findMany({
    where: options.bounds ? buildBoundsWhere(options.bounds) : undefined,
    orderBy: { id: "asc" },
    take: options.take,
  });
}

export async function findVegetationFeatures(options: FeatureQueryOptions = {}) {
  return prisma.vegetationFeature.findMany({
    where: options.bounds ? buildBoundsWhere(options.bounds) : undefined,
    orderBy: { id: "asc" },
    take: options.take,
  });
}

export async function findICTUFeatures(options: FeatureQueryOptions = {}) {
  return prisma.iCTUFeature.findMany({
    where: options.bounds ? buildBoundsWhere(options.bounds) : undefined,
    orderBy: { id: "asc" },
    take: options.take,
  });
}

export async function findAllFountainFeatures() {
  return prisma.fountainFeature.findMany({ orderBy: { id: "asc" } });
}

function buildBoundsWhere(bounds: BoundsFilter) {
  return {
    minLng: { lte: bounds.east },
    maxLng: { gte: bounds.west },
    minLat: { lte: bounds.north },
    maxLat: { gte: bounds.south },
  };
}
