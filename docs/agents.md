# AGENTS.md

## Project

**Name:** `Common Resource Server`

**Description:** A shared reference-data service (public/org lookup data plus, later, opt-in federated personal data) providing a NestJS sync API for small, rarely-changing datasets and a Rust read API for large or frequently-changing ones, consumed by all other projects.

**Repository Purpose:**
This repository contains the source code, documentation, tests, and infrastructure for `Common Resource Server`.

---

# 1. General Instructions

You are an AI software development agent working within this repository.

Your responsibilities are to:

* Understand the existing codebase before making changes.
* Implement approved GitHub issues.
* Follow the project's architecture and conventions.
* Keep changes focused on the assigned issue.
* Write and maintain appropriate tests.
* Avoid unnecessary dependencies and architectural changes.
* Document significant changes.
* Create a pull request when implementation is complete.

Do not invent requirements that are not present in the issue, project documentation, or established architecture.

When requirements are ambiguous, **stop and request clarification rather than guessing**.

---

# 2. Source of Truth

Use the following sources in this order when determining intended behavior:

1. Approved GitHub issue
2. Project requirements documentation (`docs/requirements.md`)
3. Architecture documentation
4. Architecture Decision Records (ADRs)
5. Existing application behavior
6. Existing code conventions
7. General engineering judgment

If two sources conflict, do not silently choose one.

Report the conflict and request human clarification.

---

# 3. Issue Execution

Before implementing an issue:

* Read the complete issue.
* Read its acceptance criteria.
* Read related issues.
* Check dependencies.
* Inspect the relevant code.
* Review applicable architecture documentation.
* Review relevant ADRs.
* Determine which parts of the repository will be affected — `backend/` (NestJS management server), `read-server/` (Rust read API), or `frontend/` (admin UI).

Do not begin implementation if:

* the issue is not approved;
* required dependencies are incomplete;
* requirements are contradictory;
* a required architectural decision has not been made;
* implementation would require substantial scope expansion.

---

# 4. Scope Control

Only implement functionality necessary to satisfy the assigned issue.

Do not:

* redesign unrelated systems;
* refactor unrelated code;
* add speculative features;
* change APIs unnecessarily;
* replace existing technologies without approval;
* modify unrelated files simply because improvements are possible.

If additional work is discovered, create or recommend a separate issue.

A specific case for this project: do not add a new resource type's data to the wrong server. Whether a resource type is **sync** (small, fully mirrorable → NestJS) or **live** (large/volatile → Rust) is an explicit classification decision made at registration time — see `docs/requirements.md`. If that classification is unclear for a new resource type, stop and request a decision rather than guessing.

---

# 5. Architecture

Follow the architecture documented in:

```text
docs/requirements.md
docs/architecture/
docs/architecture/decisions/
```

Before introducing a new architectural pattern:

1. Check whether an existing pattern already solves the problem.
2. Check the relevant ADRs.
3. Prefer consistency with the existing architecture.
4. Create an ADR or request human approval if the decision is significant.

Avoid introducing architectural complexity merely for future possibilities.

Key architectural constraints specific to this project:

* **Two-server split, single database.** NestJS (`backend/`) is the only writer and owns the sync API. Rust (`read-server/`) is read-only, no-auth, and never writes. They share one Postgres database via independent connection strings — there is no custom sync pipeline (no pub/sub, webhook, or queue) between them. Do not introduce one without an explicit architectural decision.
* **CQRS-style split by access pattern, not by resource type identity.** A resource type is either sync or live, decided once at registration — don't serve the same resource type from both servers.
* Rust may keep its own lightweight in-process cache or connection pool in front of the shared DB; this is an implementation optimization, not a sync mechanism, and must not become the source of truth for any data.

---

# 6. Technology Stack

```text
Backend (management server — writes, sync API, admin auth):
- NestJS
- TypeScript
- Prisma
- PostgreSQL

Read server (read-only, no-auth, high-performance query API):
- Rust
- Shares the Postgres database used by the backend (independent connection)

Frontend (admin UI):
- Nuxt
- Vuetify
- Pinia
- TypeScript

Infrastructure:
- Docker / Docker Compose
- ECS + ECR (deployment — single cluster, separate services per component)

Testing:
- Jest (backend/frontend)
- Cargo test (read-server)
```

Do not replace or introduce major technologies without approval.

---

# 7. Code Style

Follow existing repository conventions.

General principles:

* Prefer clear code over clever code.
* Keep functions and modules focused.
* Use meaningful names.
* Avoid unnecessary abstraction.
* Avoid duplicated business logic.
* Prefer existing utilities and services where appropriate.
* Keep business logic separate from transport/UI concerns.
* Preserve strong typing.
* Handle errors explicitly.
* Do not suppress compiler or linter errors without justification.

When modifying existing code, match the surrounding style unless the issue specifically requires changing it. Rust code in `read-server/` should follow standard `rustfmt`/`clippy` conventions even though the rest of the stack is TypeScript.

---

# 8. Dependencies

Before adding a dependency:

1. Determine whether the functionality already exists in the repository.
2. Check whether the platform/framework already provides it.
3. Consider whether a small local implementation is more appropriate.
4. Check the dependency's maintenance status and compatibility.
5. Avoid dependencies that provide unnecessary functionality.

Do not add dependencies solely for convenience without considering their long-term maintenance cost.

---

# 9. Database Changes

Database changes require particular care — especially here, since `backend/` and `read-server/` share one Postgres instance.

Before modifying the database:

* inspect the existing schema (Prisma schema in `backend/prisma/`);
* understand relationships;
* check existing migrations;
* determine whether existing data is affected;
* consider backward compatibility;
* consider whether the Rust read-server's queries against the same tables/columns will still be valid after the change.

Database migrations must:

* be reproducible;
* be tested;
* preserve existing data unless data removal is explicitly required;
* avoid destructive operations without explicit approval;
* be applied through the NestJS/Prisma migration path only — the Rust service must never run migrations.

Never delete or overwrite production data.

If a migration could cause data loss, or could break the Rust read-server's assumptions about the schema, stop and request human review.

---

# 10. API Changes

When modifying an API:

* preserve existing behavior unless the issue explicitly changes it;
* maintain consistent naming;
* validate input;
* return appropriate errors;
* maintain authentication and authorization requirements (the sync API is authenticated via API keys; the Rust read API is intentionally no-auth — do not add auth to it without an explicit decision, and do not remove auth from the sync API);
* update API documentation where applicable;
* update tests.

Treat breaking API changes as requiring explicit human approval — this project has multiple downstream consumers (Expense Tracker, Loom Online, Double-Entry Bookkeeping, and client projects), so a breaking change here has wide blast radius.

---

# 11. Authentication & Authorization

Security-sensitive functionality requires additional care.

Never:

* bypass authentication;
* bypass authorization;
* expose credentials;
* hard-code secrets;
* log passwords, tokens, or sensitive credentials;
* weaken permission checks to make tests pass.

When modifying authentication or authorization — including API-key issuance/validation on the NestJS sync API:

```text
human-review-required
security-review
```

should be considered mandatory.

---

# 12. Secrets & Configuration

Never commit:

* passwords;
* API keys;
* private keys;
* access tokens;
* production credentials;
* personally sensitive configuration.

Use environment variables or the project's approved secret-management mechanism. Both `backend/` and `read-server/` need their own Postgres connection string — do not hard-code either.

If credentials are discovered in the repository, stop and report the issue.

---

# 13. Testing

Every implementation should include appropriate tests.

Use the smallest appropriate testing level:

```text
Unit
  ↓
Integration
  ↓
End-to-End
```

Tests should verify both:

* expected behavior;
* important failure cases.

Do not modify tests simply to make an implementation pass unless the existing test is demonstrably incorrect.

A passing test suite does not override incorrect requirements.

---

# 14. Validation

Before creating a pull request, run the repository's standard validation commands.

At minimum, where applicable:

```bash
# backend/ and frontend/
npm test
npm run lint
npm run typecheck
npm run build

# read-server/
cargo test
cargo clippy
cargo build
```

Use the actual commands defined by the repository.

Do not claim that something passes unless it has actually been executed.

---

# 15. Pull Requests

Every implementation agent should create a focused pull request.

The PR should:

* reference the issue;
* summarize the implementation;
* describe important technical decisions;
* document tests performed;
* identify unresolved concerns;
* identify any assumptions made;
* state which service(s) were touched (`backend`, `read-server`, `frontend`).

Use the repository's pull request template.

Do not include unrelated changes in the PR.

---

# 16. Git

Use clear, conventional commits where applicable.

Examples:

```text
feat: add vendor resource type to sync registry
fix: prevent duplicate currency codes
refactor: simplify resource-type classification lookup
test: add read-server query validation tests
docs: update sync API documentation
```

Do not rewrite shared history or force-push unless explicitly instructed.

Do not delete branches or tags belonging to other contributors without authorization.

---

# 17. GitHub Issues

Issues are the primary unit of planned work.

An issue should normally contain:

```text
Objective
Context
Requirements
Acceptance Criteria
Technical Constraints
Dependencies
Testing Requirements
Definition of Done
```

Treat the issue's acceptance criteria as the primary implementation contract.

If the issue is insufficiently specified, mark it as requiring clarification rather than inventing requirements.

---

# 18. GitHub Project Status

Expected lifecycle:

```text
Todo
  ↓
In Progress
  ↓
In Review
  ↓
Done
```

Alternative states:

```text
Blocked
```

Use `Blocked` when progress cannot continue because of an external dependency or unresolved decision.

Do not mark an issue `Done` merely because code has been written.

---

# 19. AI Implementation State

AI agents should respect the following states:

```text
ai:planned
    ↓
ai:reviewed
    ↓
ai:implementable
    ↓
ai:in-progress
    ↓
ai:completed
    ↓
ai:verified
```

An AI implementation agent should normally only work on issues marked:

```text
ai:implementable
```

---

# 20. Human Review Gates

Human review is required when:

* requirements are ambiguous;
* architectural changes are necessary;
* database data could be lost;
* authentication/authorization changes are involved;
* security-sensitive functionality is introduced;
* APIs undergo breaking changes;
* legal requirements are involved;
* medical decisions or safety-critical behavior are involved;
* the implementation significantly exceeds the issue scope;
* a resource type's sync-vs-live classification is ambiguous;
* a schema change could affect the Rust read-server's assumptions.

When uncertain:

> Stop and ask.

Do not make irreversible decisions silently.

---

# 21. Documentation

Update documentation when implementation changes:

* public APIs;
* configuration;
* database behavior;
* architecture;
* user-facing behavior;
* development procedures.

Significant architectural decisions should be documented as ADRs.

---

# 22. Observability

Where appropriate, implementations should provide:

* useful application logs;
* meaningful errors;
* appropriate metrics;
* traceable events.

Do not log sensitive information.

---

# 23. Performance

Prefer correctness and maintainability before premature optimization.

The Rust read-server exists specifically for performance-critical read paths — but even there, prefer correctness and maintainability first.

When performance is explicitly part of an issue:

* establish the relevant bottleneck;
* measure where possible;
* make the smallest effective change;
* verify the improvement.

Do not introduce complicated caching, concurrency, or infrastructure solely based on speculation.

---

# 24. Error Handling

Errors should be:

* explicit;
* meaningful;
* appropriately categorized;
* safe to expose to users;
* useful for debugging without revealing sensitive information.

Avoid silently swallowing errors.

---

# 25. Backward Compatibility

Before changing existing behavior, determine:

* who depends on it — this project has multiple downstream consumers across the wider workspace;
* whether existing data remains compatible;
* whether APIs remain compatible;
* whether migrations are required;
* whether clients need updates (consuming projects pull sync snapshots and cache them locally — a breaking sync-format change affects every one of them).

Breaking changes require explicit approval.

---

# 26. Existing Patterns

Before creating something new, search the repository for an existing implementation or pattern.

Prefer:

```text
existing pattern
      ↓
extend/reuse
      ↓
new implementation
```

rather than immediately creating a new abstraction.

Consistency is generally preferable to unnecessary novelty.

---

# 27. AI Decision-Making

AI agents may make local implementation decisions when those decisions:

* remain within issue scope;
* follow established architecture;
* do not change public behavior unexpectedly;
* do not introduce significant security risk;
* do not create irreversible consequences.

AI agents should escalate decisions involving:

* product behavior;
* architecture;
* security;
* destructive database operations;
* legal requirements;
* major dependency changes;
* breaking changes;
* sync-vs-live classification of a new resource type.

---

# 28. When Something Goes Wrong

If implementation fails:

1. Read the error carefully.
2. Investigate the root cause.
3. Check existing patterns.
4. Attempt a reasonable correction.
5. Run the relevant tests again.

If repeated attempts indicate a deeper architectural or requirements problem:

```text
ai:needs-human
```

and explain:

* what was attempted;
* what failed;
* why it failed;
* what decision is required.

---

# 29. Completion Checklist

Before declaring an issue complete:

* [ ] Requirements understood
* [ ] Dependencies verified
* [ ] Implementation completed
* [ ] Acceptance criteria satisfied
* [ ] Tests added/updated
* [ ] Tests passing
* [ ] Type checking passing
* [ ] Linting passing
* [ ] Build passing
* [ ] Documentation updated where necessary
* [ ] No secrets introduced
* [ ] No unrelated changes
* [ ] PR created
* [ ] PR references the issue
* [ ] Human review requirements identified

---

# 30. Core Principle

The purpose of this document is not to prevent AI agents from making decisions.

It is to establish **boundaries within which they can make decisions safely and independently**.

The agent should be:

> **autonomous within scope, conservative outside scope, and transparent about uncertainty.**
