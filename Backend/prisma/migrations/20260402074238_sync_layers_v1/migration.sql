-- CreateEnum
CREATE TYPE "DatasetSyncStatus" AS ENUM ('IDLE', 'RUNNING', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('VEGETATION', 'WATER_POINT', 'SHADE');

-- CreateTable
CREATE TABLE "HeatZone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "geometry" JSONB NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "intensity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeatZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatSourceFeature" (
    "id" SERIAL NOT NULL,
    "sourceId" TEXT NOT NULL,
    "geometry" JSONB NOT NULL,
    "properties" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeatSourceFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VegetationFeature" (
    "id" SERIAL NOT NULL,
    "sourceId" TEXT NOT NULL,
    "geometry" JSONB NOT NULL,
    "properties" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VegetationFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FountainFeature" (
    "id" SERIAL NOT NULL,
    "sourceId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "geometry" JSONB NOT NULL,
    "properties" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FountainFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetSyncState" (
    "datasetKey" TEXT NOT NULL,
    "signature" TEXT,
    "remoteModified" TEXT,
    "remoteProcessed" TEXT,
    "remoteRecords" INTEGER,
    "lastAttemptAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastStatus" "DatasetSyncStatus" NOT NULL DEFAULT 'IDLE',
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatasetSyncState_pkey" PRIMARY KEY ("datasetKey")
);

-- CreateTable
CREATE TABLE "CitizenAction" (
    "id" SERIAL NOT NULL,
    "type" "ActionType" NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "radius" DOUBLE PRECISION NOT NULL,
    "impact" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitizenAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeatSourceFeature_sourceId_key" ON "HeatSourceFeature"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "VegetationFeature_sourceId_key" ON "VegetationFeature"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "FountainFeature_sourceId_key" ON "FountainFeature"("sourceId");

-- CreateIndex
CREATE INDEX "FountainFeature_datasetId_idx" ON "FountainFeature"("datasetId");
