# Platform Core

Pilot Cockpit for managing multiple software development projects.

The shared foundation for every app in the portfolio: one Rust server and one API that track projects, serve reference data, collect metrics and issue API keys, with an SDK for each language. Code name kratos. See [docs/platform-core.md](docs/platform-core.md) for the overview and guiding principles.

## Using this template (delete this section after setup)
This repository was created from an idea-to-MVP starter kit for solo developers and teams of 2–5. It assumes a monorepo with one or more apps (e.g. web, API, mobile); a single-app project simply has one app. The kit does not provision GitHub configuration or deployment; the CI and Dependabot files are intentionally disabled (`.example`) until real commands are configured.

1. Complete `docs/PRD.md`, then `docs/DESIGN.md` and `docs/TECHNICAL.md`. TECHNICAL.md decides which apps exist and the monorepo tooling (ADR-001).
2. Complete `docs/TESTING.md` and draft `docs/DEPLOYMENT.md` before planning work.
3. Complete `docs/ROADMAP.md`; customize `AGENTS.md`, `docs/GITHUB.md` and `.github/CODEOWNERS`.
4. Have a human review every document (see [Reviewing documents](#reviewing-documents)) until each one is Approved.
5. Create the repository and GitHub Project. Optionally run `bash scripts/setup-github.sh --apps <app1,app2,…>` to create labels, milestones and Project fields (the project setup review prints the exact command), then finish the manual steps it prints.
6. In milestone M0, create each app from `templates/app/` and each shared package from `templates/package/` (see [Repository layout](#repository-layout)), set up `infra/` if the project uses infrastructure-as-code, and fill in the [Commands](#commands) table. Then rename `.github/workflows/ci.yml.example` to `ci.yml`, `.github/workflows/release.yml.example` to `release.yml` and `.github/dependabot.yml.example` to `dependabot.yml`, adjusting each to your apps.
7. Ask a planning agent to generate issues for the first milestone. Review and approve each issue before execution.
8. Implement, test, review, merge and deploy incrementally.

Tip: keep a pristine copy of the kit as a GitHub template repository (Settings → Template repository) so new projects start from "Use this template".

## Repository layout
Platform Core's layout (created in M0; `apps/mcp` and `sdks/python` come later):

```
apps/
  api/            Rust (Axum) server: all reads and writes
  web/            Nuxt: dashboard on the web (SSR)
  app/            Vue 3 + Vite inside Tauri 2: desktop (Windows/macOS/Linux) and mobile (Android/iOS)
  mcp/            Rust MCP server for AI agents (v2)
packages/
  ui/             Vue + Vuetify screens, components and composables shared by web and app
  api-client-ts/  TypeScript client generated from the OpenAPI spec
  types/          Rust crate of shared domain types
sdks/
  ts/  dart/  rust/  python/   Published SDKs (npm, pub.dev, crates.io, PyPI)
openapi/          Generated openapi.json, committed: the API contract
```

Cargo workspace: `apps/api`, `apps/mcp`, `packages/types`, `sdks/rust`, `apps/app/src-tauri`. pnpm workspace: `apps/web`, `apps/app`, `packages/ui`, `packages/api-client-ts`, `sdks/ts`.

General layout of the starter template:

```
apps/<app>/          Deployable apps, e.g. apps/web, apps/api, apps/android, apps/desktop
  AGENTS.md          App-specific agent instructions (stack, commands, boundaries)
  CLAUDE.md          Imports AGENTS.md for Claude Code
  CHANGELOG.md       The app's release history; each app is versioned separately
  .env.example       The app's configuration variables
packages/<name>/     Shared code, e.g. packages/api-contract, packages/design-tokens
  AGENTS.md          Purpose, consumers and change rules
  CLAUDE.md          Imports AGENTS.md for Claude Code
infra/               Infrastructure-as-code for all environments (optional)
  AGENTS.md          Infrastructure rules: plan, never apply without approval
docs/                Project-wide documents; one set for all apps
templates/app/       Starting files for a new app; copy to apps/<app>/
templates/package/   Starting files for a new package; copy to packages/<name>/
templates/infra/     Starting files for infra/
.github/workflows/   ci.yml (every PR) and release.yml (tagged releases, signed native builds)
tools/, scripts/     Repository tooling
```

App, package and infra folders are created by M0 tasks, not shipped empty. The workspace tool (pnpm/npm workspaces, Turborepo, Nx, uv, Gradle, …) is chosen in `docs/TECHNICAL.md` (ADR-001), and the infrastructure tool in ADR-002.

## Conventions
- **Placeholders:** text wrapped in double curly braces marks something to fill in. Run `bash scripts/check-placeholders.sh` to list any that remain (`templates/` and `docs/reviews/` are skipped). Write `TBD` for genuine unknowns; TBD is never an approved decision.
- **Document status:** every document in `docs/` has a header with Status, Owner, Version and Last updated. Status moves Draft → In review → Approved → Superseded. Material changes to an Approved document return it to In review and bump the version.
- **IDs:** requirement and artifact IDs (`OBJ-`, `FR-`, `NFR-`, `BR-`, `FLOW-`, `UI-`, `API-`, `ADR-`, `TC-`, `TASK-`) are stable. Never renumber or reuse an ID; mark removed items as deprecated instead.
- **Apps:** app names (`web`, `api`, `android`, `desktop`, …) are used consistently in folder names, `app:` labels, commit scopes (`feat(web): …`), CI job names and release tags (`web-v1.2.0`). Packages and `infra` use the same names as commit scopes.
- **Configuration:** anything in a web, mobile or desktop app's configuration ships to users and is public. Only server-side apps may hold secrets.
- **Scripts:** run scripts as `bash scripts/<name>.sh`. This works on Windows (Git Bash), macOS and Linux without needing the executable bit, which Git on Windows does not set.
- **Single sources of truth:** commands live in the [Commands](#commands) table below; milestones in `docs/ROADMAP.md`; task status in the GitHub Project.

## Reviewing documents
Documents drafted or changed by an agent are reviewed by a human with `tools/doc-reviewer.html`:

1. Open `tools/doc-reviewer.html` in a browser (Chrome or Edge can save files directly; other browsers download them), choose **Open project folder** and select the repository root.
2. Fill in **Project setup** first: project name, repository, owners, apps and conventions. These facts are used across many files, including CODEOWNERS, CI and the GitHub setup script; the repository and default branch are detected from `.git` where possible.
3. Go through each document: flag or modify what needs to change, fill in short placeholders (commands, names, URLs), add missing items, and give the document a verdict. You don't have to open every item: **✓ Accept rest** (or **✓ All** next to a section heading, or **✓ Accept all** on a document's card) accepts everything you haven't decided on, and the review file notes how many items were accepted that way. Open placeholders are highlighted red; those answered by setup or filled in turn green. Progress is saved in the browser, so you can stop and come back.
4. Choose **Export reviews**. The setup and each reviewed document get one file in `docs/reviews/` (e.g. `2026-11-25-project-setup.md`, `2026-11-25-PRD.md`); a document whose review hasn't changed since its last file is not saved again. Commit them.
5. Ask the agent to apply open reviews. It edits the documents and records a resolution for each entry (see AGENTS.md, "Applying doc reviews").
6. Repeat until the verdict is Approved, then set the document's Status to Approved.

To avoid holding up building, the owner may approve a document as drafted and review its sections when the milestone that needs them is planned; the Approval section records which was done.

## Local development
- Prerequisites: [rustup](https://rustup.rs/) (the toolchain, Rust 1.100.0 with rustfmt and clippy, is pinned in `rust-toolchain.toml` and installed automatically), plus `sqlx-cli` (`cargo install sqlx-cli --no-default-features --features rustls,postgres`); Node.js 26 (`.nvmrc`) with pnpm 12.23.0 (`packageManager` in `package.json`; install with `npm install -g pnpm@12.23.0`, since Node 25 and later no longer bundle Corepack); Docker for local Postgres; the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS; Android Studio with the NDK for Android builds; Xcode on macOS for iOS builds; the Dart SDK for `sdks/dart`.
- Configure: for each app, copy `apps/<app>/.env.example` to `apps/<app>/.env` and supply local values. The root `.env.example` covers repository-wide tooling (docker compose, the `sqlx` CLI and macros): `cp .env.example .env`.
- Database: `docker compose up -d` starts Postgres 17 on `127.0.0.1:5432` (data in a named volume; trust auth with no password, for local development only). Then apply migrations with `sqlx migrate run --source apps/api/migrations`. `DATABASE_URL` in `.env` is also used at compile time to check SQLx queries; without a database, build with `SQLX_OFFLINE=true` to use the committed `.sqlx/` data. Stop Postgres with `docker compose stop`.

## Commands
This table is the single source of truth for project commands. Other documents and agents refer here. Use the "All apps" row to check everything before a PR; use an app's row when working inside that app. There is one row per app, package with its own checks, and `infra`; add or delete rows to match. Write N/A where a command doesn't apply.

The commands below are the intended ones. The root scripts and the api row work since TASK-002; rows for apps not created yet do not. TASK-010 verifies and corrects this table. Start Postgres first with `docker compose up -d` and run the api migrations (see Local development); `cargo test -p api` needs it running.

Install everything (repo root): `pnpm install` (Cargo fetches Rust dependencies on first build). Format everything: `pnpm format`.

| App | Run locally | Test | E2E | Lint | Typecheck | Build | Migrations |
|---|---|---|---|---|---|---|---|
| All apps (repo root) | — | `pnpm test` | `pnpm e2e` | `pnpm lint` (rustfmt, clippy, each package's lint, Prettier) | `pnpm typecheck` | `pnpm build` | — |
| api | `cargo run -p api` | `cargo test -p api` | N/A | `cargo clippy -p api -- -D warnings` | N/A (compiler) | `cargo build -p api --release` | `sqlx migrate run --source apps/api/migrations` |
| web | `pnpm --filter web dev` | `pnpm --filter web test` | `pnpm --filter web e2e` | `pnpm --filter web lint` | `pnpm --filter web typecheck` | `pnpm --filter web build` | N/A |
| app | `pnpm --filter app tauri dev` (Android: `tauri android dev`; iOS: `tauri ios dev`) | `pnpm --filter app test` | TBD (ADR in M0) | `pnpm --filter app lint` | `pnpm --filter app typecheck` | `pnpm --filter app tauri build` | N/A |
| ui | N/A | `pnpm --filter ui test` | N/A | `pnpm --filter ui lint` | `pnpm --filter ui typecheck` | N/A | N/A |
| types | N/A | `cargo test -p types` | N/A | `cargo clippy -p types --all-targets -- -D warnings` | N/A (compiler) | N/A | N/A |
| api-client-ts | N/A | N/A | N/A | N/A | `pnpm --filter api-client-ts typecheck` | `pnpm --filter api-client-ts generate` | N/A |
| sdk-ts (M3) | N/A | `pnpm --filter sdk-ts test` | N/A | `pnpm --filter sdk-ts lint` | `pnpm --filter sdk-ts typecheck` | `pnpm --filter sdk-ts build` | N/A |
| sdk-dart (M4) | N/A | `dart test` (in sdks/dart) | N/A | `dart analyze` | N/A | N/A | N/A |

Generated files: `cargo run -p api -- openapi > openapi/openapi.json` (spec), `pnpm --filter api-client-ts generate` (TypeScript client), `cargo sqlx prepare --workspace -- --all-targets` (SQLx query data, including queries in tests; needs Postgres running). `cargo test -p api` fails when the committed spec is out of date (`apps/api/tests/openapi.rs`); run the spec command from the repo root in a POSIX shell such as Git Bash (Windows PowerShell 5.1 `>` writes UTF-16).

Bruno (api): `pnpm bruno:run` runs the collection in `apps/api/bruno/` against a running api (`local` environment, `http://127.0.0.1:18080`); `pnpm bruno:check` fails when an endpoint in `openapi/openapi.json` has no request in the collection. See [Trying the api with Bruno](#trying-the-api-with-bruno).

Infrastructure: none yet (ADR-002, depends on D1).

## Trying the api with Bruno
`apps/api/bruno/` is a [Bruno](https://www.usebruno.com/) collection for the api, in the OpenCollection YAML format that Bruno 4.x uses (one `.yml` file per request). Its requests carry assertions, so they double as smoke tests.

- In the app: Bruno 4.x, **Open Collection**, choose `apps/api/bruno`, select the `local` environment (`baseUrl` = `http://127.0.0.1:18080`) and send a request.
- From the terminal: start the api (`cargo run -p api`), then `pnpm bruno:run`. It runs `bru run --env local` through `pnpm dlx @usebruno/cli@4.1.0`, so nothing is installed. Point it at another port with `pnpm bruno:run --env-var baseUrl=http://127.0.0.1:18081`.
- Keeping it in step with the spec: the collection was generated from `openapi/openapi.json` with `bru import openapi` and then curated. Every new or changed endpoint adds its request (with assertions) in the same PR; `pnpm bruno:check` fails when one is missing. To start a request for a new endpoint, import the spec into a scratch folder (`pnpm dlx @usebruno/cli@4.1.0 import openapi --source openapi/openapi.json --output <scratch dir>`) and copy the generated `.yml` file across.
- Secrets (keys, tokens, the admin password; none yet) never go in committed files: mark the variable **Secret** in the Bruno environment (its value stays on your machine), or put it in an untracked `apps/api/bruno/.env` (gitignored) and refer to it as `{{process.env.NAME}}`.

## Documentation
- [Project overview and guiding principles](docs/platform-core.md)
- [Product requirements](docs/PRD.md)
- [Design](docs/DESIGN.md)
- [Technical specification](docs/TECHNICAL.md)
- [Roadmap](docs/ROADMAP.md)
- [Testing](docs/TESTING.md)
- [Deployment and operations](docs/DEPLOYMENT.md)
- [GitHub protocol](docs/GITHUB.md)
- [Agent instructions](AGENTS.md) (each app, package and `infra/` also has its own AGENTS.md)
- Changelogs: `apps/<app>/CHANGELOG.md`
- [Document reviews](docs/reviews/)

## License
MIT. See [LICENSE](LICENSE). The SDKs are published under the same license.
