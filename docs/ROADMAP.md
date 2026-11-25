# Development Roadmap

Status: Approved | Owner: @Bankole2000 | Version: 1.3 | Last updated: 2026-11-25
References: PRD.md, DESIGN.md, TECHNICAL.md, TESTING.md, platform-core.md section 7

## Milestones
This table is the source of truth for milestone names; GitHub milestones must match exactly. If you change it, update `scripts/setup-github.sh` too. Each milestone is a vertical slice that works end to end, from database to screen (principle 22).

| Milestone | Outcome | Exit criteria |
|---|---|---|
| M0 - Foundation | Runnable skeleton of every MVP app | Cargo and pnpm workspaces set up; api serves `/health` with Postgres and migrations; OpenAPI is generated and committed; web and app (desktop) render a shared `packages/ui` screen that calls the API; CI builds and checks everything |
| M1 - Core registry | Projects and their components, links, keys, tokens, admin login and audit trail | FR-001 to FR-006, FR-011 to FR-018 and FR-036 to FR-038 pass their acceptance tests in web and app; keys can be tied to a component (the key part of FR-040) |
| M2 - Reference data | Reference datasets served and editable | FR-019 to FR-022 pass their acceptance tests |
| M3 - Metrics | Ingestion, metrics dashboard and the TypeScript SDK | FR-023, FR-024, FR-027 to FR-031, FR-034 and FR-040 to FR-042 pass; Platform Core reports its own metrics, with one component per app |
| M4 - Costs and Dart SDK | Cost tracking with currency conversion; Flutter apps can report metrics | FR-007 to FR-010, FR-032 and FR-039 pass |
| M5 - Hardening and launch | Production deployment and signed builds | FR-025, FR-026 and FR-035 pass; security checks, backups with a tested restore, production deployment, and signed desktop and mobile builds; release checklist approved |
| v2 - Post-launch | Rust SDK, then the local MCP server and other v2 features | Defined per release |

## Work breakdown
Only M0 is planned in detail. Later milestones are broken down once the previous one is close to done.

| Task key | Outcome | App | Requirement IDs | Tests | Milestone | Depends on | Priority | Issue |
|---|---|---|---|---|---|---|---|---|
| TASK-001 | Root workspaces: Cargo workspace, pnpm workspace, toolchain versions pinned (`rust-toolchain.toml`, `packageManager`, `.nvmrc`), root scripts, `.gitignore` additions | repo | — | TC-000 | M0 | None | High | #2 |
| TASK-002 | api skeleton: Axum server with `GET /health`, configuration from environment, structured logging, request IDs and the standard error body | api | NFR-001 | TC-000, TC-036 | M0 | TASK-001 | High | #3 |
| TASK-003 | Local Postgres (docker compose), `sqlx migrate` with a first migration, `cargo sqlx prepare` data committed | api | — | TC-000 | M0 | TASK-002 | High | #4 |
| TASK-004 | OpenAPI generated with `utoipa` and written to `openapi/openapi.json`; a check that fails when the committed file is out of date | api | — | TC-000 | M0 | TASK-002 | High | #5 |
| TASK-005 | `packages/types` Rust crate with the first shared types, used by api | packages | — | TC-000 | M0 | TASK-001 | Medium | #6 |
| TASK-006 | `packages/api-client-ts` generated from the spec (ADR-010 decided in this task) | packages | — | TC-000 | M0 | TASK-004 | High | #7 |
| TASK-007 | `packages/ui` with Vuetify theme, layout shell (side rail and bottom bar) and a status screen that calls `/health` through the client | packages | FR-035 | TC-000 | M0 | TASK-006 | High | #8 |
| TASK-008 | `apps/web` Nuxt 4 shell rendering the shared status screen | web | FR-035 | TC-000 | M0 | TASK-007, TASK-015 | High | #9 |
| TASK-009 | `apps/app` Tauri 2 + Vue + Vite shell rendering the shared status screen on desktop; Android and iOS projects initialized and building in debug | app | FR-035 | TC-000 | M0 | TASK-007, TASK-015 | High | #10 |
| TASK-010 | CI: rename and adapt `ci.yml.example` and `dependabot.yml.example` for api, web, app, packages and the generated-file checks; fill in the README Commands table | repo | — | TC-000 | M0 | TASK-003, TASK-004, TASK-008, TASK-009 | High | #11 |
| TASK-011 | Personal local infrastructure: gitignored `docker-compose.override.yml` on top of `docker-compose.yml`, extra services commented out until needed | repo | — | TC-000 | M0 | TASK-003 | Medium | #17 |
| TASK-012 | Dockerize api and web, with a committed `docker-compose.example.yml` that runs the whole stack | repo | — | TC-000 | M5 | TASK-003, TASK-008, D1 | Medium | #18 |
| TASK-013 | Bruno collection for the api, generated from the OpenAPI spec and curated, with a drift check | api | NFR-001 | TC-036 | M0 | TASK-004 | Medium | #20 |
| TASK-014 | api default port 18080 instead of 8080 | api | — | TC-000 | M0 | None | Medium | #24 |
| TASK-015 | CORS on the api for the web and Tauri dashboard origins (`API_CORS_ORIGINS`) | api | FR-035 | TC-000 | M0 | None | High | #26 |

## Planning rules
- Plan only the next useful milestone in detail; split large tasks.
- Independent tasks run in parallel, one branch and PR each. A task may also start early on the parts that don't need an unmerged dependency (AGENTS.md, Execution rules 2).
- Each task belongs to one app (or `packages`/`sdks`/`infra`/`repo`). A feature spanning apps becomes one task per app, ordered infrastructure → contract → servers → clients (see GITHUB.md, Multi-app work). Here that is usually api (which regenerates the contract) → packages/ui → web and app.
- Learn Rust on the easy parts first: CRUD and reference data come before ingestion, batching and rate limiting (principle 23). Keep early api tasks small.
- Signed builds for M5 need an Apple Developer account, a Google Play account and a Windows code-signing certificate, which can take days to weeks to obtain. Start them during M3 at the latest.
- Set up the release workflow and each app's release environment before its first release, not during it.
- Settle D8 (scope list) and OD-004 before planning M1, and D5 before planning M4; changing scopes later affects issued keys.
- Map every implementation issue to requirement IDs and acceptance tests (TC IDs).
- Create each table with its `component_id` column in its first migration (TECHNICAL.md, data model), even when the component features of that table come in a later milestone.
- Record dependencies and issue URLs; GitHub is the source of truth for task status.
- Reconcile scope changes with the approved PRD before generating new tasks.

## Approval
Approved by @Bankole2000 on 2026-11-25, revision 1.0, to start building. Approved as drafted without an item-by-item review; sections are revisited when the milestone that needs them is planned, and open TBDs stay open decisions. Revision 1.1 adds project components (PRD OD-007), approved as drafted by @Bankole2000 on 2026-11-25.
