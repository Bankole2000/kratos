-- Reference datasets (TECHNICAL.md, data model; FR-022). One row per dataset; `version`
-- goes up by one on every change so clients can tell when their cached copy is stale.
-- Migrations are forward-only: fix a mistake with a new migration, never by editing this one.
CREATE TABLE datasets (
    name       text        PRIMARY KEY,
    version    bigint      NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
);
