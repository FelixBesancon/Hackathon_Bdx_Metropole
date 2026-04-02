ALTER TABLE "HeatSourceFeature"
ADD COLUMN "minLng" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "minLat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "maxLng" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "maxLat" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "VegetationFeature"
ADD COLUMN "minLng" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "minLat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "maxLng" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "maxLat" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX "HeatSourceFeature_minLng_maxLng_idx" ON "HeatSourceFeature"("minLng", "maxLng");
CREATE INDEX "HeatSourceFeature_minLat_maxLat_idx" ON "HeatSourceFeature"("minLat", "maxLat");
CREATE INDEX "VegetationFeature_minLng_maxLng_idx" ON "VegetationFeature"("minLng", "maxLng");
CREATE INDEX "VegetationFeature_minLat_maxLat_idx" ON "VegetationFeature"("minLat", "maxLat");