# Platform Core

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
3. Go through each document item by item: accept, flag or modify it, fill in short placeholders (commands, names, URLs), add missing items, and give the document a verdict. Open placeholders are highlighted red; those answered by setup or filled in turn green. Progress is saved in the browser, so you can stop and come back.
4. Choose **Export reviews**. The setup and each reviewed document get one file in `docs/reviews/` (e.g. `2026-11-25-project-setup.md`, `2026-11-25-PRD.md`). Commit them.
5. Ask the agent to apply open reviews. It edits the documents and records a resolution for each entry (see AGENTS.md, "Applying doc reviews").
6. Repeat until the verdict is Approved, then set the document's Status to Approved.

## Local development
- Prerequisites (exact versions are pinned in M0, TASK-001): Rust stable via rustup, with `sqlx-cli`; Node.js LTS with pnpm (via Corepack); Docker for local Postgres; the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS; Android Studio with the NDK for Android builds; Xcode on macOS for iOS builds; the Dart SDK for `sdks/dart`.
- Configure: for each app, copy `apps/<app>/.env.example` to `apps/<app>/.env` and supply local values. The root `.env.example` covers repository-wide tooling only.

## Commands
This table is the single source of truth for project commands. Other documents and agents refer here. Use the "All apps" row to check everything before a PR; use an app's row when working inside that app. There is one row per app, package with its own checks, and `infra`; add or delete rows to match. Write N/A where a command doesn't apply.

The commands below are the intended ones; none work until M0 creates the workspaces (TASK-010 verifies and corrects this table). Start Postgres first with `docker compose up -d`.

Install everything (repo root): `pnpm install` (Cargo fetches Rust dependencies on first build)

| App | Run locally | Test | E2E | Lint | Typecheck | Build | Migrations |
|---|---|---|---|---|---|---|---|
| All apps (repo root) | — | `cargo test --workspace && pnpm -r test` | `pnpm --filter web e2e` | `cargo fmt --check && cargo clippy --workspace -- -D warnings && pnpm -r lint` | `pnpm -r typecheck` | `cargo build --workspace && pnpm -r build` | — |
| api | `cargo run -p api` | `cargo test -p api` | N/A | `cargo clippy -p api -- -D warnings` | N/A (compiler) | `cargo build -p api --release` | `sqlx migrate run --source apps/api/migrations` |
| web | `pnpm --filter web dev` | `pnpm --filter web test` | `pnpm --filter web e2e` | `pnpm --filter web lint` | `pnpm --filter web typecheck` | `pnpm --filter web build` | N/A |
| app | `pnpm --filter app tauri dev` (Android: `tauri android dev`; iOS: `tauri ios dev`) | `pnpm --filter app test` | TBD (ADR in M0) | `pnpm --filter app lint` | `pnpm --filter app typecheck` | `pnpm --filter app tauri build` | N/A |
| ui | N/A | `pnpm --filter ui test` | N/A | `pnpm --filter ui lint` | `pnpm --filter ui typecheck` | N/A | N/A |
| api-client-ts | N/A | N/A | N/A | N/A | `pnpm --filter api-client-ts typecheck` | `pnpm --filter api-client-ts generate` | N/A |
| sdk-ts (M3) | N/A | `pnpm --filter sdk-ts test` | N/A | `pnpm --filter sdk-ts lint` | `pnpm --filter sdk-ts typecheck` | `pnpm --filter sdk-ts build` | N/A |
| sdk-dart (M4) | N/A | `dart test` (in sdks/dart) | N/A | `dart analyze` | N/A | N/A | N/A |

Generated files: `cargo run -p api -- openapi > openapi/openapi.json` (spec), `pnpm --filter api-client-ts generate` (TypeScript client), `cargo sqlx prepare --workspace` (SQLx query data).

Infrastructure: none yet (ADR-002, depends on D1).

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
TBD (PRD.md, OD-006). The repository is public, so until a license is chosen the code is all rights reserved by default.
