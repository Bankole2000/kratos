# GitHub Repository Labels

## 1. Type

- `type:feature` — Adds new user-facing or system functionality.
- `type:bug` — Fixes behavior that does not work as intended.
- `type:enhancement` — Improves an existing feature without introducing a fundamentally new capability.
- `type:refactor` — Improves internal code structure without changing intended behavior.
- `type:performance` — Improves speed, resource usage, or scalability.
- `type:security` — Addresses a security vulnerability, weakness, or hardening requirement.
- `type:documentation` — Adds or updates documentation.
- `type:test` — Adds, improves, or repairs automated tests.
- `type:chore` — Maintenance or repository work that does not directly affect product functionality.
- `type:research` — Investigation or technical/product research required before implementation.
- `type:design` — UI, UX, interaction, or visual design work.
- `type:breaking-change` — Introduces a change that can break existing users, APIs, integrations, or data.

## 2. Area

- `area:frontend` — Frontend application work.
- `area:backend` — Backend/API work.
- `area:database` — Database schema, queries, migrations, or data modeling.
- `area:api` — Public or internal API design and implementation.
- `area:auth` — Authentication, authorization, identity, or permissions.
- `area:security` — Application security and protection.
- `area:storage` — Files, object storage, uploads, downloads, and storage providers.
- `area:sync` — Synchronization and conflict resolution.
- `area:notifications` — Email, push, SMS, and application notifications.
- `area:search` — Search, indexing, filtering, and discovery.
- `area:workflow` — Workflow execution, orchestration, triggers, and steps.
- `area:events` — Events, event streams, subscribers, and event processing.
- `area:ai` — AI, agents, natural-language processing, and intelligent automation.
- `area:voice` — Speech recognition, voice commands, and audio interaction.
- `area:documents` — Document creation, processing, conversion, and rendering.
- `area:finance` — Financial calculations, accounting, expenses, income, and projections.
- `area:contracts` — Contracts, signatures, agreements, verification, and legal records.
- `area:health` — Medical and health-related functionality.
- `area:integrations` — Third-party services and application integrations.
- `area:sdk` — SDK generation, client libraries, and developer tooling.
- `area:admin` — Administration interfaces and administrative functionality.
- `area:desktop` — Desktop-specific functionality.
- `area:mobile` — Mobile-specific functionality.
- `area:web` — Web-specific functionality.
- `area:infrastructure` — Deployment, infrastructure, containers, networking, and cloud resources.
- `area:devops` — CI/CD, release automation, build systems, and development infrastructure.

## 3. Priority

- `priority:critical` — Must be addressed immediately; blocks the system or creates severe risk.
- `priority:high` — Important work that should be addressed soon.
- `priority:medium` — Normal priority work.
- `priority:low` — Useful but not currently important.
- `priority:backlog` — Valid idea or future work with no immediate commitment.

## 4. Scope

- `scope:mvp` — Required for the minimum viable product.
- `scope:core` — Core functionality beyond the initial MVP.
- `scope:extended` — Later-stage functionality.
- `scope:experimental` — Experimental or exploratory functionality.
- `scope:technical-debt` — Work required to improve an existing implementation.

## 5. Status

- `status:triage` — Newly created issue awaiting investigation or classification.
- `status:ready` — Requirements are sufficiently clear for implementation.
- `status:in-progress` — Currently being implemented.
- `status:blocked` — Cannot proceed because of an external dependency or unresolved issue.
- `status:needs-review` — Requires review or clarification before proceeding.
- `status:duplicate` — Duplicate of another issue.
- `status:wont-fix` — Intentionally will not be implemented.
- `status:stale` — Has not received activity and may no longer be relevant.

## 6. Complexity

- `complexity:trivial` — Very small change with minimal risk.
- `complexity:small` — Small, isolated implementation.
- `complexity:medium` — Requires multiple components or moderate investigation.
- `complexity:large` — Significant implementation involving multiple systems.
- `complexity:epic` — Large architectural or product-level undertaking.

## 7. Special Characteristics

- `needs:decision` — Implementation requires a product or architectural decision.
- `needs:design` — Requires UX/UI design before implementation.
- `needs:research` — Requires investigation or proof-of-concept work.
- `needs:specification` — Requirements are insufficiently defined.
- `needs:dependency` — Depends on another project, service, library, or issue.
- `good-first-issue` — Appropriate for someone unfamiliar with the codebase.
- `ai-agent` — Suitable for autonomous or semi-autonomous AI implementation.
- `human-review-required` — Requires explicit human review before merging.
- `security-review` — Requires security review.
- `legal-review` — Requires legal review.
- `medical-review` — Requires qualified medical review.
- `breaking-change` — Requires migration or compatibility consideration.

## 8. Platform

- `platform:web` — Web application.
- `platform:desktop` — Desktop application.
- `platform:mobile` — Mobile application.
- `platform:api` — API/backend.
- `platform:shared` — Shared functionality used by multiple platforms.

## 9. Project / Product

This repository is `Common Resource Server` — issues here should carry this repo's own project label:

- `project:common-resource-server`

The full `project:*` label set (for cross-repo reference) lives in the workspace-level `docs/labels.md`.