# Changelog — api

All notable changes to this app are recorded here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/) and are tagged `api-vX.Y.Z`.

## [Unreleased]
### Added
- `GET /health` returns `{ "status": "ok", "version": "…" }` (API-001).
- Every response carries `X-Request-Id`, taken from the request or generated.
- Errors use the standard body `{ "error": { "code", "message", "request_id" } }`; unknown routes return 404 `not_found`, wrong methods 405 `method_not_allowed`, panics 500 `internal_error`.
- Structured JSON logs with one line per request, including the request ID.
- Configuration from `API_HOST`, `API_PORT` and `RUST_LOG` (see `.env.example`).
- Postgres via SQLx: the api needs `DATABASE_URL` and connects lazily, so it starts even when the database is down. Local Postgres 17 runs with `docker compose up -d`.
- First migration (`apps/api/migrations`): the `datasets` table (`name`, `version`, `updated_at`). Migrations are run with `sqlx migrate run`, not at api startup.
- OpenAPI 3.1 spec generated with utoipa (`cargo run -p api -- openapi`) and committed as `openapi/openapi.json`, with `/health` and the `ErrorBody` schema; `cargo test -p api` fails when it is out of date.
- Bruno collection in `apps/api/bruno/` (OpenCollection YAML) with a `local` environment and requests for `GET /health` and an unknown route, with assertions. `pnpm bruno:run` runs it against a running api; `pnpm bruno:check` fails when an endpoint in the spec has no request.
- CORS for the web dashboard and the Tauri app (FR-035): only the origins in `API_CORS_ORIGINS` are allowed (default: `http://localhost:13000`, `http://127.0.0.1:13000`, `http://localhost:1420`, `tauri://localhost`, `http://tauri.localhost`, `https://tauri.localhost`). Methods GET, POST, PUT, PATCH and DELETE; request headers `Authorization`, `Content-Type` and `X-Request-Id`; `X-Request-Id` is exposed to scripts; no credentials; preflights are cached for 10 minutes and also carry `X-Request-Id`. An invalid origin stops the api at startup.
### Changed
- Default port is now 18080 (was 8080, which other local tools often take). Set `API_PORT` to change it.
- `GET /health` also reports the database: `{ "status": "ok" | "degraded", "version": "…", "database": "up" | "down" }`. It always answers 200; `status` is `degraded` when the database is down.
### Fixed
### Removed
