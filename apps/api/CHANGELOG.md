# Changelog — api

All notable changes to this app are recorded here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/) and are tagged `api-vX.Y.Z`.

## [Unreleased]
### Added
- `GET /health` returns `{ "status": "ok", "version": "…" }` (API-001).
- Every response carries `X-Request-Id`, taken from the request or generated.
- Errors use the standard body `{ "error": { "code", "message", "request_id" } }`; unknown routes return 404 `not_found`, wrong methods 405 `method_not_allowed`, panics 500 `internal_error`.
- Structured JSON logs with one line per request, including the request ID.
- Configuration from `API_HOST`, `API_PORT` and `RUST_LOG` (see `.env.example`).
- OpenAPI 3.1 spec generated with utoipa (`cargo run -p api -- openapi`) and committed as `openapi/openapi.json`, with `/health` and the `ErrorBody` schema; `cargo test -p api` fails when it is out of date.
### Changed
### Fixed
### Removed
