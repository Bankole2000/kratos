-- AlterTable
ALTER TABLE "category_groups" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "countries" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "currencies" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "languages" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "timezones" ADD COLUMN     "metadata" JSONB;
