# Review: project setup

- Reviewer: Unnamed reviewer
- Date: 2026-11-25
- Completeness: 9 of 9 required facts
- Review status: Applied

> For agents: apply these facts to every file under "Where to apply", replacing the matching placeholders. Expand per-app tables, columns, jobs and lines to exactly the apps listed (remove the template's example apps that are not listed). Replace each "Resolution: pending" with what you changed. Set "Review status" to Applied when all entries are resolved, or Partially applied otherwise. Follow AGENTS.md "Applying doc reviews". Facts marked _Not set_ stay as placeholders.

## Facts

| Fact | Value |
|---|---|
| Project name | Platform Core |
| License | MIT |
| One-line description | Pilot Cockpit for managing multiple software development projects |
| Repository | Bankole2000/kratos |
| Default branch | docs/initial-draft |
| GitHub Project number | _Not set_ |
| Document owner | @bankole2000 |
| Release owner | @bankole2000 |
| Default code owner | @bankole2000 |
| Branch naming | 123-short-title |
| Commit convention | Conventional Commits, scoped by app |

## Apps (3)

| App | Path | Kind | Code owner |
|---|---|---|---|
| api | apps/api | Server/API | @bankole2000 |
| web | apps/web | Web client | @bankole2000 |
| app | apps/app | Mobile client | @bankole2000 |

## Shared packages (0)

None listed yet.

## Where to apply (12)

### README.md

Title (project name), one-line description and License. Commands table: one row per app (plus rows for packages with their own checks), named after the app; delete the unused example rows.

Resolution: Applied 2026-11-25. Title already "Platform Core"; one-line description set to "Pilot Cockpit for managing multiple software development projects." with the existing summary kept below it; License set to MIT and a LICENSE file added. Commands table already has one row per app (api, web, app) plus ui, api-client-ts and the SDKs; kept.

### AGENTS.md

Project name in Purpose; branch naming and commit convention under "Branches and pull requests".

Resolution: No change needed: Purpose already names Platform Core; branch naming (`<issue number>-<short-title>`, the 123-short-title pattern) and Conventional Commits scoped by app were already set.

### Document headers in docs/*.md

Set Owner to the document owner and Last updated to the date you apply this review.

Resolution: Owner was already @Bankole2000 (same account as @bankole2000; GitHub usernames are case-insensitive) and Last updated already 2026-11-25. PRD bumped to 0.2 for the license decision; other documents unchanged.

### docs/GITHUB.md

Repository, Project and Default branch under Configuration; the App labels list (one `app:<name>` per app, plus `app:packages` and `app:repo`).

Resolution: Repository already Bankole2000/kratos; Project stays TBD (not set). Default branch NOT changed to docs/initial-draft: that value was detected from the branch checked out when the review ran, not the repository's default branch, which is main. Labels already app:api, app:web, app:app plus app:packages, app:repo, and app:sdks and app:infra, which this project also needs.

### docs/TECHNICAL.md

Components table: one row per app and package (and infra if used) with name, path, kind and owner. API contracts table: one row per server app and its consumers. Leave stack and hosting placeholders for the team to decide.

Resolution: No change needed: the Components table already has api, web and app with owner @Bankole2000, plus the packages, SDKs and openapi/ contract the setup form has no field for; the API contracts table already lists api and its consumers.

### docs/DEPLOYMENT.md

"Where each app runs": one row per app. Approval: release owner. Remove the "Desktop releases" section and matching checklist wording, since no listed app needs it.

Resolution: Where each app runs already has api, web, app (desktop and mobile) and the SDKs; release owner already @Bankole2000. The Desktop releases section was NOT removed: apps/app is a Tauri app that ships to desktop and mobile, and the setup form allows only one kind per app.

### docs/TESTING.md

Strategy table: one row per app (and infra if used).

Resolution: No change needed: the Strategy table already has one row per app, plus packages and SDKs.

### .github/CODEOWNERS

Default owner on the `*` line; one line per app and package with its code owner; owners for /infra/, docs/, AGENTS.md and .github/ (default code owner unless told otherwise); the release owner on .github/workflows/release.yml.

Resolution: No change needed: all owners were already @Bankole2000, with lines for apps/api, apps/web, apps/app, packages/, openapi/, sdks/, infra/, docs/, AGENTS.md, .github/ and release.yml.

### .github/workflows/ci.yml.example

One path filter and one job per app, named after the app; remove example jobs for apps not listed (keep the infra job only if infra/ is used); add every job to `ci-ok` needs; set the push branch to the default branch.

Resolution: Applied: rewritten with jobs api (Rust, with a Postgres service and generated-file checks), web (with packages/ui and the TS client) and app (Tauri, Linux only); mobile and infra example jobs removed; ci-ok needs all jobs. Push branch kept as main (see the docs/GITHUB.md resolution). Commands stay commented out until M0 (TASK-010).

### .github/workflows/release.yml.example

One release job per app (one per platform for mobile, one per operating system for desktop), named after the app, each with environment `release-<app>`; remove example jobs for apps not listed. Creating the environments, their secrets and required reviewers (the release owner) is a human step in GitHub settings.

Resolution: Applied: jobs api, web, app-desktop (Windows, macOS, Linux), app-android and app-ios (environment release-app), plus sdk-ts and sdk-dart; the resolve step now also maps sdk-<language> tags to sdks/<language>. Creating the environments, secrets and required reviewers remains a human step.

### .github/dependabot.yml.example

Keep only the ecosystems the listed apps use and point directories at their apps.

Resolution: Applied: github-actions, cargo (root workspace) and npm (root workspace) kept; pub for sdks/dart added commented out until M4; pip, terraform, gradle and swift removed.

### GitHub labels and milestones (not a file)

A human (or an agent explicitly authorized to change GitHub settings) runs: `bash scripts/setup-github.sh --repo Bankole2000/kratos --apps api,web,app`. Record here who ran it.

Resolution: Run 2026-11-25 by Claude Code at the request of @Bankole2000: `bash scripts/setup-github.sh --repo Bankole2000/kratos --apps api,web,app`. Created 38 labels and 7 milestones. Project fields skipped: no GitHub Project exists yet (Project number not set).
