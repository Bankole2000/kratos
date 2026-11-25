# Review: project setup

- Reviewer: Unnamed reviewer
- Date: 2026-11-25
- Completeness: 9 of 9 required facts
- Review status: Superseded by 2026-11-25-project-setup-4.md (not applied)

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

Resolution: pending

### AGENTS.md

Project name in Purpose; branch naming and commit convention under "Branches and pull requests".

Resolution: pending

### Document headers in docs/*.md

Set Owner to the document owner and Last updated to the date you apply this review.

Resolution: pending

### docs/GITHUB.md

Repository, Project and Default branch under Configuration; the App labels list (one `app:<name>` per app, plus `app:packages` and `app:repo`).

Resolution: pending

### docs/TECHNICAL.md

Components table: one row per app and package (and infra if used) with name, path, kind and owner. API contracts table: one row per server app and its consumers. Leave stack and hosting placeholders for the team to decide.

Resolution: pending

### docs/DEPLOYMENT.md

"Where each app runs": one row per app. Approval: release owner. Remove the "Desktop releases" section and matching checklist wording, since no listed app needs it.

Resolution: pending

### docs/TESTING.md

Strategy table: one row per app (and infra if used).

Resolution: pending

### .github/CODEOWNERS

Default owner on the `*` line; one line per app and package with its code owner; owners for /infra/, docs/, AGENTS.md and .github/ (default code owner unless told otherwise); the release owner on .github/workflows/release.yml.

Resolution: pending

### .github/workflows/ci.yml.example

One path filter and one job per app, named after the app; remove example jobs for apps not listed (keep the infra job only if infra/ is used); add every job to `ci-ok` needs; set the push branch to the default branch.

Resolution: pending

### .github/workflows/release.yml.example

One release job per app (one per platform for mobile, one per operating system for desktop), named after the app, each with environment `release-<app>`; remove example jobs for apps not listed. Creating the environments, their secrets and required reviewers (the release owner) is a human step in GitHub settings.

Resolution: pending

### .github/dependabot.yml.example

Keep only the ecosystems the listed apps use and point directories at their apps.

Resolution: pending

### GitHub labels and milestones (not a file)

A human (or an agent explicitly authorized to change GitHub settings) runs: `bash scripts/setup-github.sh --repo Bankole2000/kratos --apps api,web,app`. Record here who ran it.

Resolution: pending
