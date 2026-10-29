/*
  Warnings:

  - Added the required column `flagEmoji` to the `countries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "countries" ADD COLUMN     "flagEmoji" TEXT NOT NULL,
ADD COLUMN     "flagSvg" BYTEA;
