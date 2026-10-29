-- Projects: first-class registry of platforms integrating with Core Platform.
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- Backfill: one Project row per distinct existing ApiKey.projectName.
INSERT INTO "projects" ("id", "name", "slug", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    "projectName",
    lower(regexp_replace(regexp_replace("projectName", '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "projectName" FROM "api_keys") AS distinct_names;

-- Seed the well-known "core-platform" project used by Core Platform's own
-- identity flows (signup/password-reset email verification) — needed even
-- if no ApiKey rows exist yet, since auth.service.ts depends on it.
INSERT INTO "projects" ("id", "name", "slug", "description", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'Core Platform',
    'core-platform',
    'Core Platform''s own identity flows (email verification, password reset).',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO NOTHING;

-- ApiKey: migrate projectName (free text) to projectId (FK).
ALTER TABLE "api_keys" ADD COLUMN "projectId" TEXT;

UPDATE "api_keys"
SET "projectId" = "projects"."id"
FROM "projects"
WHERE "projects"."name" = "api_keys"."projectName";

ALTER TABLE "api_keys" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "api_keys" DROP COLUMN "projectName";

DROP INDEX IF EXISTS "api_keys_projectName_idx";
CREATE INDEX "api_keys_projectId_idx" ON "api_keys"("projectId");

ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NotificationTemplate: add nullable projectId (null = global default),
-- widen the unique constraint to include it.
ALTER TABLE "notification_templates" ADD COLUMN "projectId" TEXT;

DROP INDEX IF EXISTS "notification_templates_key_channel_key";
CREATE UNIQUE INDEX "notification_templates_projectId_key_channel_key"
    ON "notification_templates"("projectId", "key", "channel");

ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
