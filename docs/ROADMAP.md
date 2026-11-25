# Development Roadmap

Status: Draft | Owner: {{owner}} | Version: 0.1 | Last updated: {{YYYY-MM-DD}}
References: PRD.md, DESIGN.md, TECHNICAL.md, TESTING.md

## Milestones
This table is the source of truth for milestone names; GitHub milestones must match exactly. If you change it, update `scripts/setup-github.sh` too.

| Milestone | Outcome | Exit criteria |
|---|---|---|
| M0 - Foundation | Runnable skeleton of every app | Apps and packages created from templates/, workspace tooling (ADR-001) and infra/ (ADR-002) set up, local setup and per-app CI work |
| M1 - Core MVP | Essential user journeys | Must-have requirements implemented |
| M2 - MVP Hardening | Reliable, tested MVP | Acceptance and security checks pass |
| M3 - MVP Launch | Working deployed product | Release checklist approved |
| M4 - Post-launch (stretch) | Improvements | Defined per release |

## Work breakdown
| Task key | Outcome | App | Requirement IDs | Tests | Milestone | Depends on | Priority | Issue |
|---|---|---|---|---|---|---|---|---|
| TASK-001 | {{Small testable outcome}} | {{app}} | FR-001 | TC-001 | M1 | {{None or task keys}} | High | TBD |

## Planning rules
- Plan only the next useful milestone in detail; split large tasks.
- Each task belongs to one app (or `packages`/`infra`/`repo`). A feature spanning apps becomes one task per app, ordered infrastructure → contract → servers → clients (see GITHUB.md, Multi-app work).
- Mobile releases include store review time, and desktop releases need signing certificates and store accounts that can take days to weeks to obtain (see DEPLOYMENT.md). Start those in M2 at the latest and schedule M3 accordingly.
- Set up the release workflow and each app's release environment before its first release, not during it.
- Map every implementation issue to requirement IDs and acceptance tests (TC IDs).
- Record dependencies and issue URLs; GitHub is the source of truth for task status.
- Reconcile scope changes with the approved PRD before generating new tasks.

## Approval
{{Human approver, revision, date}}
