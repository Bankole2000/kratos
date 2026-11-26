# Review: docs/TECHNICAL.md

- Document: `docs/TECHNICAL.md` (status Approved, version 1.2 at time of review)
- Reviewer: Bankole
- Date: 2026-11-26
- Verdict: Approved (approved as drafted by the reviewer: every item not flagged or changed was accepted in bulk)
- Coverage: 123 of 123 items decided; 4 need action; 0 added; 0 with placeholder values
- Review status: Partially applied (3 of 4; the "State" entry needs the owner's answer). Approved as drafted, so Status set to Approved (TECHNICAL 1.3)

> For agents: apply every entry under "Action required", "Added items" and "Placeholder values" to `docs/TECHNICAL.md`, then replace each "Resolution: pending" with what you did (or why not). Set "Review status" to Applied when all entries are resolved, or Partially applied otherwise. Leave accepted items unchanged. Line numbers refer to the document as reviewed; find items by ID or text if it has changed. Follow AGENTS.md "Applying doc reviews".

## Action required (4)

### "api" · Modify

Section: Components · Line 28

Original:

```
| api | apps/api | Server/API | Rust (stable), Axum, Tokio, SQLx, utoipa; Postgres | TBD (D1) | @Bankole2000 | FR-001 to FR-030, FR-034 |
```

**Suggested change:** Deploys to Railway, but we may consider VPS hosting later.

Resolution: Applied: Railway (D1), with a VPS possible later (TECHNICAL 1.3; D1 recorded as decided in platform-core.md).

### "web" · Modify

Section: Components · Line 29

Original:

```
| web | apps/web | Web client | Nuxt 4 (SSR; OD-005), Vue 3, Vuetify 4 (OD-008) | TBD (D1; needs a Node runtime for SSR) | @Bankole2000 | FR-001 to FR-030, FR-035 |
```

**Suggested change:** Deploys to Railway but options like vercel and netlify may be considered. Also VPS hosting when feasible

Resolution: Applied: Railway (D1), with Vercel, Netlify or a VPS possible later.

### "Installed clients (the Tauri app, and every app that embeds an SDK) cannot be force-updat…" · Modify

Section: API and integrations › API compatibility · Line 125

Original:

```
- Installed clients (the Tauri app, and every app that embeds an SDK) cannot be force-updated. The API supports every app and SDK version released in the last TBD months.
```

**Suggested change:** Installed clients (the Tauri app, and every app that embeds an SDK) cannot be force-updated. The API supports every app and SDK version released in the last 3 months.

Resolution: Applied: 3 months (also PRD NFR-005).

### "State: TBD. Applying changes is a release step (DEPLOYMENT.md)." · Modify

Section: Infrastructure · Line 133

Original:

```
- State: TBD. Applying changes is a release step (DEPLOYMENT.md).
```

**Suggested change:** Depends on the kind of change, minor, major, or breaking

Resolution: Not applied: "State" here means where the infrastructure tool keeps its state file (e.g. a remote backend), not the kind of change, so the suggestion does not answer it. Left TBD; asked the owner.

## Added items (0)

None.

## Placeholder values (0)

None.

## Unfilled placeholders (0)

None.

## Open TBDs (19)

- "api" (line 28)
- "web" (line 29)
- "app" (line 30)
- "infra" (line 40)
- "events" (line 85)
- "Installed clients (the Tauri app, and every app that embeds an SDK) cannot be force-updat…" (line 125)
- "Tool and layout: TBD (ADR-002). It depends on D1: ECS likely justifies infrastructure-as-…" (line 130)
- "What it manages: TBD (the api service, Postgres, the web host, DNS, secrets)." (line 131)
- "State: TBD. Applying changes is a release step (DEPLOYMENT.md)." (line 133)
- "Hosting for api and web" (line 138)
- "Managed Postgres" (line 139)
- "Exchange-rate source" (line 140)
- "Apple Developer Program" (line 142)
- "Google Play Console" (line 143)
- "Windows code signing" (line 144)
- "GitHub" (line 145)
- "Metrics, tracing and alerting: TBD with D1. Alerts on its own health are in DEPLOYMENT.md…" (line 158)
- ADR-002 (line 175)
- ADR-008 (line 181)

## Accepted (119)

98 of these were accepted in bulk ("Accept all"), without being opened one by one.

- "Status: Approved | Owner: @Bankole2000 | Version: 1.2 | Last updated: 2026-11-25" (line 3)
- "References: PRD.md, DESIGN.md, platform-core.md (guiding principles, SDK specification)" (line 4)
- "One Rust service (`apps/api`) owns all reads and writes and the only database, Postgres. …" (line 7)
- "web (Nuxt, SSR) ─┐" (line 9)
- "The OpenAPI spec is generated from the Rust code with `utoipa` and committed as `openapi/…" (line 18)
- "`web` and `app` share screens, components, composables and the API client through `packag…" (line 19)
- "Inside `api`, the reference-data read path and the metric ingestion write path are separa…" (line 20)
- "No second data store in the MVP. Reference reads are made fast with in-process caching an…" (line 21)
- "One row per deployable app in `apps/`, per shared package in `packages/`, per published S…" (line 24)
- "app" (line 30)
- "mcp (v2)" (line 31)
- "ui" (line 32)
- "api-client-ts" (line 33)
- "types" (line 34)
- "openapi" (line 35)
- "sdk-ts" (line 36)
- "sdk-dart" (line 37)
- "sdk-rust" (line 38)
- "sdk-python (later)" (line 39)
- "infra" (line 40)
- "Monorepo tooling: see ADR-001. A **Cargo workspace** holds `apps/api`, `apps/mcp`, `packa…" (line 43)
- "Dependency rules: apps may depend on packages; packages never depend on apps; apps never …" (line 44)
- "Generated code: `openapi/openapi.json`, the generated part of `packages/api-client-ts` an…" (line 45)
- "Code style: `rustfmt` and `clippy` (warnings as errors in CI) for Rust; ESLint and Pretti…" (line 46)
- "Commands are listed in the README [Commands](../README.md#commands) table, not here." (line 48)
- "Significant modules within each component." (line 51)
- "api" (line 55)
- "api" (line 56)
- "api" (line 57)
- "api" (line 58)
- "api" (line 59)
- "api" (line 60)
- "api" (line 61)
- "api" (line 62)
- "api" (line 63)
- "api" (line 64)
- "ui" (line 65)
- "ui" (line 66)
- "sdk-ts, sdk-dart, sdk-rust" (line 67)
- "`api` owns the only database. Migrations are SQL files run with `sqlx migrate`; every mig…" (line 70)
- "admin_users" (line 74)
- "admin_sessions" (line 75)
- "projects" (line 76)
- "components" (line 77)
- "project_links" (line 78)
- "costs" (line 79)
- "credentials" (line 80)
- "audit_log" (line 81)
- "datasets" (line 82)
- "countries, currencies, phone_codes, timezones, languages" (line 83)
- "exchange_rates" (line 84)
- "events" (line 85)
- "Every `component_id` column is nullable and uses a composite foreign key `(project_id, co…" (line 87)
- "event_daily_totals" (line 88)
- "All endpoints are under `/v1` and take `Authorization: Bearer <key or token>`, except the…" (line 91)
- API-001 — `GET /health` (line 95)
- API-002 — `POST /v1/auth/login`, `POST /v1/auth/logout` (line 96)
- API-003 — `GET/POST /v1/projects`, `GET/PATCH /v1/projects/{slug}` (line 97)
- API-004 — `POST /v1/projects/{slug}/archive`, `/unarchive` (line 98)
- API-005 — `GET/POST /v1/projects/{slug}/links`, `PATCH/DELETE /v1/projects/{slug}/links/{id}`, `PUT… (line 99)
- API-006 — `GET/POST /v1/projects/{slug}/costs`, `PATCH /v1/projects/{slug}/costs/{id}`, `GET /v1/co… (line 100)
- API-007 — `GET/POST /v1/projects/{slug}/keys`, `POST /v1/projects/{slug}/keys/{id}/revoke` (line 101)
- API-008 — `GET/POST /v1/tokens`, `POST /v1/tokens/{id}/revoke` (line 102)
- API-009 — `GET /v1/projects/{slug}/audit` (line 103)
- API-010 — `GET /v1/reference/{dataset}`, `GET /v1/reference/{dataset}/{code}`, `GET /v1/reference/{… (line 104)
- API-011 — `PUT/PATCH /v1/reference/{dataset}/{code}` (line 105)
- API-012 — `POST /v1/events/batch` (line 106)
- API-013 — `GET /v1/projects/{slug}/events`, `/metrics/volume`, `/metrics/summary` (line 107)
- API-014 — `GET /v1/meta/clients` (line 108)
- API-015 — `GET/POST /v1/projects/{slug}/components`, `GET/PATCH /v1/projects/{slug}/components/{com… (line 109)
- "Integrations: exchange rates from a source chosen in D5, fetched on a schedule with timeo…" (line 111)
- "The contract is `openapi/openapi.json`, generated by `api`. There is one server, so there…" (line 114)
- "api" (line 118)
- "api" (line 119)
- "api" (line 120)
- "Clients and SDKs use code generated from `openapi/openapi.json`; nobody hand-writes reque…" (line 123)
- "Versioning: additive changes only within `/v1`; a breaking change needs `/v2` (BR-008). C…" (line 124)
- "Breaking a field or endpoint: add the replacement → release clients and SDKs that use it …" (line 126)
- "Forced upgrade: the app checks API-014 at startup and shows an "update required" screen b…" (line 127)
- "Tool and layout: TBD (ADR-002). It depends on D1: ECS likely justifies infrastructure-as-…" (line 130)
- "What it manages: TBD (the api service, Postgres, the web host, DNS, secrets)." (line 131)
- "What it does not manage: package registries, app stores, Apple and Google developer accou…" (line 132)
- "Hosting for api and web" (line 138)
- "Managed Postgres" (line 139)
- "Exchange-rate source" (line 140)
- "npm, pub.dev, crates.io" (line 141)
- "Apple Developer Program" (line 142)
- "Google Play Console" (line 143)
- "Windows code signing" (line 144)
- "GitHub" (line 145)
- "Every error response has the body `{ "error": { "code": "project_not_found", "message": "…" (line 148)
- "Status codes: 400 validation (with per-field details), 401 missing, invalid, expired or r…" (line 149)
- "Dashboards show the message and, for unexpected errors, the request ID so a problem can b…" (line 150)
- "SDKs never throw into app code; failures go to an optional debug logger (NFR-006). Sends …" (line 151)
- "The Tauri app shows cached data with an "offline" banner when the API is unreachable; wri…" (line 152)
- "`api` logs structured JSON with the `tracing` crate. Every request gets a request ID (tak…" (line 155)
- "Never logged: full keys or tokens (prefix only), passwords, session tokens, event `proper…" (line 156)
- "Platform Core reports its own metrics through its SDK (FR-034); errors in web and app are…" (line 157)
- "Metrics, tracing and alerting: TBD with D1. Alerts on its own health are in DEPLOYMENT.md…" (line 158)
- "Client apps (web, app, and every consumer app) are public: their code and configuration s…" (line 161)
- "Credentials: keys and tokens are random, at least 32 bytes of entropy, prefixed (BR-006),…" (line 162)
- "Scopes are checked on every endpoint; project keys only reach their own project." (line 163)
- "Rate limits per key, per token and on login (FR-025)." (line 164)
- "Transport: HTTPS only in staging and production; HSTS on web." (line 165)
- "Personal data: the MVP stores the admin's email. Event properties come from consumer apps…" (line 166)
- "The dashboard session design (cookie or token, CSRF protection, Tauri storage) is ADR-008." (line 167)
- "Decisions marked Accepted were made in platform-core.md and need only confirmation in rev…" (line 170)
- ADR-001 — Monorepo tooling: Cargo workspace for Rust, pnpm workspace for JS/TS, standalone Dart pac… (line 174)
- ADR-002 — Infrastructure-as-code tool: TBD (line 175)
- ADR-003 — One Rust service (Axum, Tokio) for all reads and writes (line 176)
- ADR-004 — SQLx only for the MVP, with compile-time checked queries and `cargo sqlx prepare` for CI (line 177)
- ADR-005 — OpenAPI generated from Rust with `utoipa`, committed as `openapi/openapi.json` (line 178)
- ADR-006 — Frontend option A: `packages/ui` shared by `apps/web` (Nuxt) and `apps/app` (Vue + Vite i… (line 179)
- ADR-007 — Scoped project keys and personal access tokens, stored as SHA-256 hashes (line 180)
- ADR-008 — Dashboard session: TBD (HTTP-only cookie session, or short-lived token with refresh) (line 181)
- ADR-009 — SDKs built in order TypeScript → Dart → Rust → Python; generated client plus a thin hand-… (line 182)
- ADR-010 — TypeScript client: types generated by `openapi-typescript` from `openapi/openapi.json` (c… (line 183)
- ADR-011 — Projects have one level of optional components (PRD OD-007). An event's component comes f… (line 184)
- "Open: D1, D3 to D8 (platform-core.md section 8), OD-001 to OD-004 (PRD.md), ADR-002, ADR-…" (line 187)

## Not reviewed (0)

None.
