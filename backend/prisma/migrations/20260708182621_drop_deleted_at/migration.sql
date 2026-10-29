/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `category_groups` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `countries` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `currencies` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `industries` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `languages` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `timezones` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `vendors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "categories" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "category_groups" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "countries" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "currencies" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "industries" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "languages" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "timezones" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "deletedAt";
