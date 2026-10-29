/*
  Warnings:

  - You are about to drop the column `category` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `vendors` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "categories_name_key";

-- DropIndex
DROP INDEX "vendors_category_idx";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "category",
DROP COLUMN "contactEmail",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "industryId" TEXT,
ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "category_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "vendorId" TEXT,
    "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postalCode" TEXT,
    "countryId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_tags" (
    "vendorId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "vendor_tags_pkey" PRIMARY KEY ("vendorId","tagId")
);

-- CreateTable
CREATE TABLE "company_tags" (
    "companyId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "company_tags_pkey" PRIMARY KEY ("companyId","tagId")
);

-- CreateTable
CREATE TABLE "location_tags" (
    "locationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "location_tags_pkey" PRIMARY KEY ("locationId","tagId")
);

-- CreateTable
CREATE TABLE "category_tags" (
    "categoryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "category_tags_pkey" PRIMARY KEY ("categoryId","tagId")
);

-- CreateTable
CREATE TABLE "industry_tags" (
    "industryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "industry_tags_pkey" PRIMARY KEY ("industryId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_updatedAt_idx" ON "companies"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "category_groups_name_key" ON "category_groups"("name");

-- CreateIndex
CREATE INDEX "category_groups_updatedAt_idx" ON "category_groups"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "industries_name_key" ON "industries"("name");

-- CreateIndex
CREATE INDEX "industries_updatedAt_idx" ON "industries"("updatedAt");

-- CreateIndex
CREATE INDEX "locations_updatedAt_idx" ON "locations"("updatedAt");

-- CreateIndex
CREATE INDEX "locations_companyId_idx" ON "locations"("companyId");

-- CreateIndex
CREATE INDEX "locations_vendorId_idx" ON "locations"("vendorId");

-- CreateIndex
CREATE INDEX "locations_countryId_idx" ON "locations"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "vendor_tags_tagId_idx" ON "vendor_tags"("tagId");

-- CreateIndex
CREATE INDEX "company_tags_tagId_idx" ON "company_tags"("tagId");

-- CreateIndex
CREATE INDEX "location_tags_tagId_idx" ON "location_tags"("tagId");

-- CreateIndex
CREATE INDEX "category_tags_tagId_idx" ON "category_tags"("tagId");

-- CreateIndex
CREATE INDEX "industry_tags_tagId_idx" ON "industry_tags"("tagId");

-- CreateIndex
CREATE INDEX "categories_groupId_idx" ON "categories"("groupId");

-- CreateIndex
CREATE INDEX "vendors_companyId_idx" ON "vendors"("companyId");

-- CreateIndex
CREATE INDEX "vendors_categoryId_idx" ON "vendors"("categoryId");

-- CreateIndex
CREATE INDEX "vendors_industryId_idx" ON "vendors"("industryId");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "category_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_tags" ADD CONSTRAINT "vendor_tags_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_tags" ADD CONSTRAINT "vendor_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_tags" ADD CONSTRAINT "company_tags_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_tags" ADD CONSTRAINT "company_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_tags" ADD CONSTRAINT "location_tags_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_tags" ADD CONSTRAINT "location_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_tags" ADD CONSTRAINT "category_tags_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_tags" ADD CONSTRAINT "category_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_tags" ADD CONSTRAINT "industry_tags_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_tags" ADD CONSTRAINT "industry_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
