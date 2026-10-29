-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "unitCategory" TEXT NOT NULL,
    "isBaseUnit" BOOLEAN NOT NULL DEFAULT false,
    "conversionFactor" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "units_updatedAt_idx" ON "units"("updatedAt");

-- CreateIndex
CREATE INDEX "units_unitCategory_idx" ON "units"("unitCategory");

