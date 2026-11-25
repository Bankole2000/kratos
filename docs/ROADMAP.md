# Development Roadmap

Status: Approved | Owner: @Bankole2000 | Version: 1.0 | Last updated: 2026-11-25
References: PRD.md, DESIGN.md, TECHNICAL.md, TESTING.md, platform-core.md section 7

## Milestones
This table is the source of truth for milestone names; GitHub milestones must match exactly. If you change it, update `scripts/setup-github.sh` too. Each milestone is a vertical slice that works end to end, from database to screen (principle 22).

| Milestone | Outcome | Exit criteria |
|---|---|---|
| M0 - Foundation | Runnable skeleton of every MVP app | Cargo and pnpm workspaces set up; api serves `/health` with Postgres and migrations; OpenAPI is generated and committed; web and app (desktop) render a shared `packages/ui` screen that calls the API; CI builds and checks everything |
| M1 - Core registry | Projects, links, keys, tokens, admin login and audit trail | FR-001 to FR-006 and FR-011 to FR-018 pass their acceptance tests in web and app |
| M2 - Reference data | Reference datasets served and editable | FR-019 to FR-022 pass their acceptance tests |
| M3 - Metrics | Ingestion, metrics dashboard and the TypeScript SDK | FR-023, FR-024, FR-027 to FR-031 and FR-034 pass; Platform Core reports its own metrics |
| M4 - Costs and Dart SDK | Cost tracking with currency conversion; Flutter apps can report metrics | FR-007 to FR-010 and FR-032 pass |
| M5 - Hardening and launch | Production deployment and signed builds | FR-025, FR-026 and FR-035 pass; security checks, backups with a tested restore, production deployment, and signed desktop and mobile builds; release checklist approved |
| v2 - Post-launch | Rust SDK, then the local MCP server and other v2 features | Defined per release |

## Work breakdown
Only M0 is planned in detail. Later milestones are broken down once the previous one is close to done.

| Task key | Outcome | App | Requirement IDs | Tests | Milestone | Depends on | Priority | Issue |
|---|---|---|---|---|---|---|---|---|
| TASK-001 | Root workspaces: Cargo workspace, pnpm workspace, toolchain versions pinned (`rust-toolchain.toml`, `packageManager`, `.nvmrc`), root scripts, `.gitignore` additions | repo | — | TC-000 | M0 | None | High | TBD |
| TASK-002 | api skeleton: Axum server with `GET /health`, configuration from environment, structured logging, request IDs and the standard error body | api | NFR-001 | TC-000, TC-036 | M0 | TASK-001 | High | TBD |
| TASK-003 | Local Postgres (docker compose), `sqlx migrate` with a first migration, `cargo sqlx prepare` data committed | api | — | TC-000 | M0 | TASK-002 | High | TBD |
| TASK-004 | OpenAPI generated with `utoipa` and written to `openapi/openapi.json`; a check that fails when the committed file is out of date | api | — | TC-000 | M0 | TASK-002 | High | TBD |
| TASK-005 | `packages/types` Rust crate with the first shared types, used by api | packages | — | TC-000 | M0 | TASK-001 | Medium | TBD |
| TASK-006 | `packages/api-client-ts` generated from the spec (ADR-010 decided in this task) | packages | — | TC-000 | M0 | TASK-004 | High | TBD |
| TASK-007 | `packages/ui` with Vuetify theme, layout shell (side rail and bottom bar) and a status screen that calls `/health` through the client | packages | FR-035 | TC-000 | M0 | TASK-006 | High | TBD |
| TASK-008 | `apps/web` Nuxt 4 shell rendering the shared status screen | web | FR-035 | TC-000 | M0 | TASK-007 | High | TBD |
| TASK-009 | `apps/app` Tauri 2 + Vue + Vite shell rendering the shared status screen on desktop; Android and iOS projects initialized and building in debug | app | FR-035 | TC-000 | M0 | TASK-007 | High | TBD |
| TASK-010 | CI: rename and adapt `ci.yml.example` and `dependabot.yml.example` for api, web, app, packages and the generated-file checks; fill in the README Commands table | repo | — | TC-000 | M0 | TASK-003, TASK-004, TASK-008, TASK-009 | High | TBD |

## Planning rules
- Plan only the next useful milestone in detail; split large tasks.
- Each task belongs to one app (or `packages`/`sdks`/`infra`/`repo`). A feature spanning apps becomes one task per app, ordered infrastructure → contract → servers → clients (see GITHUB.md, Multi-app work). Here that is usually api (which regenerates the contract) → packages/ui → web and app.
- Learn Rust on the easy parts first: CRUD and reference data come before ingestion, batching and rate limiting (principle 23). Keep early api tasks small.
- Signed builds for M5 need an Apple Developer account, a Google Play account and a Windows code-signing certificate, which can take days to weeks to obtain. Start them during M3 at the latest.
- Set up the release workflow and each app's release environment before its first release, not during it.
- Settle D8 (scope list) and OD-004 before planning M1, and D5 before planning M4; changing scopes later affects issued keys.
- Map every implementation issue to requirement IDs and acceptance tests (TC IDs).
- Record dependencies and issue URLs; GitHub is the source of truth for task status.
- Reconcile scope changes with the approved PRD before generating new tasks.

## Approval
Approved by @Bankole2000 on 2026-11-25, revision 1.0, to start building. Approved as drafted without an item-by-item review; sections are revisited when the milestone that needs them is planned, and open TBDs stay open decisions.
