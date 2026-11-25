# Deployment and Operations

Status: Draft | Owner: {{owner}} | Version: 0.1 | Last updated: {{YYYY-MM-DD}}
References: TECHNICAL.md, TESTING.md

## Environments and infrastructure
| Environment | Purpose | Data stores | Notes |
|---|---|---|---|
| Local | Development | {{test DBs}} | {{e.g. docker compose for services}} |
| Staging (if needed) | Validation | {{isolated DBs}} | {{e.g. internal mobile and desktop builds point here}} |
| Production | Live users | {{production DBs, one per server app that owns data}} | |

Infrastructure is defined in `infra/` (see TECHNICAL.md, Infrastructure). Changes are planned in pull requests and applied only as a release step:
- Plan: runs on every PR that touches `infra/`; the output is attached to the PR.
- Apply: {{who applies, from where (CI job with environment approval, never a laptop), in which order: staging then production}}.
- Drift: {{how often the plan is checked against reality, and who fixes drift}}.

### Where each app runs
| App | Staging | Production | Release trigger |
|---|---|---|---|
| {{web}} | {{host/URL}} | {{host/URL}} | {{e.g. tag web-v* → release workflow → environment approval}} |
| {{api}} | {{host/URL}} | {{host/URL}} | {{trigger}} |
| {{mobile}} | {{TestFlight / internal testing track}} | {{App Store / Google Play}} | {{tag → signed build → manual store submission}} |
| {{desktop}} | {{internal update channel}} | {{download site / Microsoft Store / Mac App Store}} | {{tag → signed build → publish to update channel}} |

## Configuration
{{Required variable names per app (see apps/<app>/.env.example), secret store, access controls; never actual secrets. Client apps receive only public values at build time.}}

## Versioning and releases
- Each app is versioned and released separately; tags are `<app>-vX.Y.Z` (e.g. `web-v1.2.0`), and each app keeps its own `apps/<app>/CHANGELOG.md`.
- Release order when a change spans apps: infrastructure → shared contract → servers → clients. A server must be live before a client that needs it ships.
- Shared packages are not released on their own; they ship inside the apps that use them.

## CI/CD and deployment
- `.github/workflows/ci.yml` runs on every PR: lint, typecheck, unit tests and quick builds for changed apps only. Native mobile and desktop jobs stay on Linux runners where possible.
- `.github/workflows/release.yml` runs when a human pushes a `<app>-vX.Y.Z` tag: full builds, signing, notarization and upload. Expensive macOS runners are used only here. Each app's release job uses a GitHub deployment environment (`release-<app>`) that holds its signing secrets and requires approval from the release owner.

Build and validation commands are in the README [Commands](../README.md#commands) table. Record here the deployment-specific steps per app:

{{Artifact, migration, deploy and smoke-test steps per app; approval gates}}

## Mobile releases
Remove this section if there are no mobile apps.
- Signing: {{where certificates, provisioning profiles and keystores are stored (release environment secrets, never git); who has access}}
- Store accounts: {{Apple Developer / Google Play Console owners}}
- Review lead time: allow {{N days}} for store review; plan it in ROADMAP.md.
- Rollout: {{staged rollout percentage and how to halt it}}
- Over-the-air updates: {{allowed or not, tool, and which changes qualify (never native code or anything that needs new store review)}}
- Minimum supported version and forced upgrade: see TECHNICAL.md, API compatibility.

## Desktop releases
Remove this section if there is no desktop app.
- Platforms and minimum OS versions: {{Windows / macOS / Linux and versions}}
- Code signing: {{Windows: code-signing certificate (often a cloud signing service or hardware token); macOS: Developer ID certificate; who holds them and where (release environment secrets, never git)}}
- macOS notarization: {{Apple account used; notarization runs in the release workflow; builds that fail it are not published}}
- Distribution: {{direct download, Microsoft Store, Mac App Store, Linux packages; which channels per platform}}
- Auto-update: {{update mechanism, where the update feed is hosted, how updates are signed and verified}}
- Rollout: {{update channels (beta/stable), staged rollout, how to halt an update}}
- Lead time: obtaining signing certificates and store accounts can take days to weeks; plan it in ROADMAP.md (M2).
- Minimum supported version and forced upgrade: see TECHNICAL.md, API compatibility.

## Release checklist (per app)
- [ ] Required checks and human approval complete
- [ ] Configuration and secrets verified for this app and environment
- [ ] Infrastructure changes applied and verified (if any)
- [ ] Backup and migration safety verified (server apps)
- [ ] Dependent server changes already live (client apps)
- [ ] Rollback procedure available
- [ ] Move the app's CHANGELOG.md Unreleased entries under the new version and push tag `<app>-vX.Y.Z`
- [ ] Release workflow passed; signed (and for macOS, notarized) builds produced (mobile and desktop)
- [ ] Deploy, publish or submit to store, then smoke test

## Rollback and recovery
{{Per app: rollback commands, migration compatibility, restore procedure, recovery objectives and restore test. Installed apps (mobile, desktop): a release can't be recalled from devices — halt the staged rollout or update channel and ship a fix; use server-side feature flags to disable broken features. Infrastructure: roll back by applying the previous version of infra/ code, never by manual changes.}}

## Monitoring and maintenance
{{Health checks, logs, metrics, alerts and crash reporting per app; responsible person; backup schedule; dependency updates (see .github/dependabot.yml); certificate expiry dates (signing certificates, TLS)}}

## Incident response
{{Contact, severity, containment, recovery, communication and follow-up}}

## Approval
{{Authorized release owner per app; no autonomous production deployment, infrastructure apply, store submission or desktop publish}}
