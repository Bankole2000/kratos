-- CreateEnum
CREATE TYPE "CurrencyKind" AS ENUM ('FIAT', 'CRYPTO', 'IN_GAME');

-- AlterTable
ALTER TABLE "currencies" ADD COLUMN     "kind" "CurrencyKind" NOT NULL DEFAULT 'FIAT';

-- CreateIndex
CREATE INDEX "currencies_kind_idx" ON "currencies"("kind");

