# AGENTS.md — api

These instructions add to the repository root `AGENTS.md`; they never relax it. Read the root file first.

## What this app is
- Purpose: the HTTP API every other part of Platform Core talks to (dashboards, SDKs, MCP server). It owns the only database.
- Kind: server/API
- Stack: Rust (edition 2024, toolchain in `rust-toolchain.toml`), Axum, Tokio, `tracing`; SQLx and utoipa arrive with TASK-003 and TASK-004. Details in docs/TECHNICAL.md, Components.
- Depends on: `packages/types` (from TASK-005). Consumed by `packages/api-client-ts`, `packages/ui`, web, app and the SDKs, through `openapi/openapi.json`.

## Commands
Use this app's row in the README [Commands](../../README.md#commands) table. Run them from the repo root (`cargo run -p api`, `cargo test -p api`, `cargo clippy -p api --all-targets -- -D warnings`).

## Layout
- `src/main.rs` starts the server: loads `.env`, reads `Config`, sets up logging, serves with graceful shutdown.
- `src/lib.rs` builds the router: `routes()` (`/health` and everything under `/v1`) and `with_layers()` (404/405 fallbacks, panic → 500, request ID middleware).
- `src/error.rs` is `ApiError`, the only way handlers return errors; `src/request_id.rs` adds the request ID header, the log line and the error body.
- `tests/` holds integration tests that call the router directly with `tower::ServiceExt::oneshot`. A test that installs a `tracing` subscriber goes in its own file (see `tests/logging.rs`).

## Rules for this app
- Configuration: every variable is listed in `.env.example` with its default. Secrets come from the secret store named in docs/DEPLOYMENT.md and are never logged.
- New endpoints go under `/v1` (in `v1_routes()`); only `/health` is unversioned. Changes within `/v1` are additive only.
- Handlers return `Result<_, ApiError>`. Error codes are stable `snake_case` strings; a 500 never includes internal details.
- Never log full keys or tokens (prefix only), passwords, session tokens or event properties.
- Directories not to edit by hand: `.sqlx/` (from TASK-003); `openapi/openapi.json` at the repo root is generated from this app.
- Keep the code plain (root AGENTS.md, Rust): no custom macros or generic layers.

## Release
Versioned separately; tags are `api-vX.Y.Z`. Record user-visible changes in this folder's CHANGELOG.md. Release steps are in docs/DEPLOYMENT.md, run from `.github/workflows/release.yml`, never on a developer machine or in an agent session.
