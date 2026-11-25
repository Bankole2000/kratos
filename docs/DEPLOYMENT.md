# Deployment and Operations

Status: Approved | Owner: @Bankole2000 | Version: 1.0 | Last updated: 2026-11-25
References: TECHNICAL.md, TESTING.md

Most of this document waits on D1 (deployment target). It is drafted far enough to plan M0 to M4; complete it before planning M5.

## Environments and infrastructure
| Environment | Purpose | Data stores | Notes |
|---|---|---|---|
| Local | Development | Postgres in docker compose; separate test databases created per test | Desktop and mobile debug builds point at the local api |
| Staging | Validation before release | Isolated Postgres | Internal desktop and mobile builds point here; whether staging is needed for a single-owner MVP is TBD |
| Production | Live apps and SDKs | Production Postgres | |

Infrastructure: TBD (ADR-002, depends on D1). If `infra/` is used, changes are planned in pull requests and applied only as a release step:
- Plan: runs on every PR that touches `infra/`; the output is attached to the PR.
- Apply: TBD, from a CI job with environment approval, never a laptop; staging then production.
- Drift: TBD.

### Where each app runs
| App | Staging | Production | Release trigger |
|---|---|---|---|
| api | TBD (D1) | TBD (D1) | Tag `api-v*` → release workflow → `release-api` approval → deploy, run migrations, smoke test |
| web | TBD (D1) | TBD (D1) | Tag `web-v*` → release workflow → `release-web` approval → deploy |
| app (desktop) | Internal update channel (TBD) | GitHub Releases with the Tauri updater, or stores (TBD) | Tag `app-v*` → signed and notarized builds → publish |
| app (mobile) | TestFlight, Google Play internal testing | App Store, Google Play | Tag `app-v*` → signed builds → manual store submission |
| sdk-ts | — | npm | Tag `sdk-ts-v*` → release workflow → `release-sdk-ts` approval → publish |
| sdk-dart | — | pub.dev | Tag `sdk-dart-v*` → publish |
| sdk-rust | — | crates.io | Tag `sdk-rust-v*` → publish |

## Configuration
Variables per app are listed in `apps/<app>/.env.example` (created in M0). Expected:
- api: `DATABASE_URL`, `BIND_ADDRESS`, `LOG_LEVEL`, admin bootstrap credentials (first run only), exchange-rate source credentials (D5), rate-limit settings. Secrets live in the host's secret store (TBD, D1).
- web and app: only the API base URL and other public values, set at build time. They never receive a secret.
Never commit actual secrets.

## Versioning and releases
- Each app and each SDK is versioned and released separately; tags are `<name>-vX.Y.Z` (for example `api-v1.2.0`, `sdk-ts-v0.3.0`), and each keeps its own `CHANGELOG.md`.
- SDKs follow semantic versioning; a breaking change to an SDK's public API is a major version.
- Release order when a change spans apps: api (with the regenerated contract) → SDKs → web and app. The api must be live before a client or SDK that needs it ships.
- Shared packages (`packages/*`) are not released on their own; they ship inside the apps that use them.

## CI/CD and deployment
- `.github/workflows/ci.yml` runs on every PR: lint, typecheck, unit and integration tests and quick builds for changed apps only, plus the generated-file and contract checks (TESTING.md).
- `.github/workflows/release.yml` runs when a human pushes a `<name>-vX.Y.Z` tag: full builds, signing, notarization and upload or publishing. macOS runners are used only here. Each release job uses a GitHub environment (`release-<name>`) that holds its secrets and requires approval from the release owner.

Build and validation commands are in the README [Commands](../README.md#commands) table. Deployment steps per app:
- api: build the binary or container image → run `sqlx migrate run` against the target database (migrations are backward compatible with the previous release) → start the new version → smoke test `/health` and one authenticated read.
- web: build → deploy → smoke test sign-in.
- app: build and sign per platform → publish to the update channel or submit to stores → install and smoke test.
- SDKs: build → run the conformance suite → publish → install the published version in a sample app.

## Mobile releases
- Signing: Apple certificates and provisioning profiles, and the Android upload keystore, are stored as `release-app` environment secrets, never in git. Access: @Bankole2000 only.
- Store accounts: Apple Developer and Google Play Console, owned by @Bankole2000 (to be created; start in M3).
- Review lead time: allow TBD days for store review; plan it in ROADMAP.md.
- Rollout: staged rollout percentage TBD; halt from the store console.
- Over-the-air updates: not used in the MVP.
- Minimum supported version and forced upgrade: see TECHNICAL.md, API compatibility.

## Desktop releases
- Platforms and minimum OS versions: Windows, macOS, Linux; versions TBD.
- Code signing: Windows code-signing certificate or cloud signing service (TBD); macOS Developer ID certificate. Held by @Bankole2000 as `release-app` environment secrets, never in git.
- macOS notarization: runs in the release workflow with the Apple Developer account; builds that fail it are not published.
- Distribution: TBD (GitHub Releases, Microsoft Store, Mac App Store, Linux packages such as AppImage and .deb).
- Auto-update: Tauri updater (TBD), with update artifacts signed by the Tauri updater key held as a release secret.
- Rollout: TBD.
- Lead time: obtaining signing certificates and store accounts can take days to weeks; start in M3.
- Minimum supported version and forced upgrade: see TECHNICAL.md, API compatibility.

## Release checklist (per app)
- [ ] Required checks and human approval complete
- [ ] Configuration and secrets verified for this app and environment
- [ ] Infrastructure changes applied and verified (if any)
- [ ] Backup taken and migration safety verified (api)
- [ ] Dependent api changes already live (web, app, SDKs)
- [ ] Rollback procedure available
- [ ] Move the CHANGELOG.md Unreleased entries under the new version and push tag `<name>-vX.Y.Z`
- [ ] Release workflow passed; signed (and for macOS, notarized) builds produced (app)
- [ ] Deploy, publish or submit to store, then smoke test

## Rollback and recovery
- api: redeploy the previous version. Migrations are backward compatible with the previous release, so they are not rolled back; a bad migration is fixed with a new forward migration.
- web: redeploy the previous version.
- app (installed): a release can't be recalled from devices. Halt the staged rollout or update channel and ship a fix.
- SDKs: published versions can't be changed. Publish a fixed patch version and deprecate (npm, pub.dev) or yank (crates.io) the broken one.
- Database restore: from the host's backups; recovery objectives TBD (NFR-009); restore tested before launch and TBD times a year.

## Monitoring and maintenance
- Health: `/health` checked by the host or an uptime monitor (TBD); Platform Core's own `ping` events (FR-034).
- Logs: structured JSON from api, retained TBD days.
- Alerts: TBD (at least: api down, error rate spike, database storage near its limit).
- Backups: daily (TBD) with retention TBD.
- Dependency updates: Dependabot (`.github/dependabot.yml`) for Cargo, npm, pub and GitHub Actions.
- Expiry dates to track: TLS certificates, Apple Developer membership, Windows signing certificate, Tauri updater key.
- Responsible person: @Bankole2000.

## Incident response
Contact: @Bankole2000. Severity: TBD. Steps: contain (revoke an exposed key, roll back a release), recover, then write a short note in the repository with cause and follow-up. Because every consumer app depends on Platform Core, an outage note lists the affected apps.

## Approval
Approved by @Bankole2000 on 2026-11-25, revision 1.0, to start building. Approved as drafted without an item-by-item review; sections are revisited when the milestone that needs them is planned, and open TBDs stay open decisions.

Release owner for every app and SDK: @Bankole2000. No autonomous production deployment, infrastructure apply, store submission, desktop publish or package publish.
