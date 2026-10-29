-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "bankId" TEXT;

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT,
    "swiftBic" TEXT,
    "website" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_tags" (
    "bankId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "bank_tags_pkey" PRIMARY KEY ("bankId","tagId")
);

-- CreateIndex
CREATE INDEX "banks_updatedAt_idx" ON "banks"("updatedAt");

-- CreateIndex
CREATE INDEX "banks_companyId_idx" ON "banks"("companyId");

-- CreateIndex
CREATE INDEX "bank_tags_tagId_idx" ON "bank_tags"("tagId");

-- CreateIndex
CREATE INDEX "locations_bankId_idx" ON "locations"("bankId");

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_tags" ADD CONSTRAINT "bank_tags_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_tags" ADD CONSTRAINT "bank_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

