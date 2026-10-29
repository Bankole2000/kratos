# AI-Friendly GitHub Project Management Specification

## 1. Project Fields

Every GitHub Project should have these fields:

| Field        | Values                                                |
| ------------ | ----------------------------------------------------- |
| Status       | `Todo`, `In Progress`, `In Review`, `Done`, `Blocked` |
| Priority     | `Critical`, `High`, `Medium`, `Low`                   |
| Complexity   | `Trivial`, `Small`, `Medium`, `Large`, `Epic`         |
| Project      | Project name                                          |
| Area         | Backend, Frontend, Database, API, etc.                |
| Scope        | MVP, Core, Extended, Experimental                     |
| Target       | Milestone/release                                     |
| AI Ready     | `Yes`, `No`                                           |
| Human Review | `Required`, `Approved`                                |

### Default behavior

When an AI creates an implementation issue:

```text
Status       → Todo
AI Ready     → Yes
Human Review → Required
```

A human reviews the issue before implementation begins.

---

# 2. Milestones

Milestones should represent **meaningful product stages**, not individual tasks.

## Standard Milestones

### `M0 — Foundation`

Project initialization, architecture, development environment, CI/CD, and basic infrastructure.

### `M1 — Core MVP`

Minimum functionality required for the first usable version.

### `M2 — MVP Hardening`

Testing, validation, security, error handling, performance, and usability improvements.

### `M3 — Public Beta`

Features required to expose the application to real users.

### `M4 — Production`

Production deployment, monitoring, backups, documentation, and operational readiness.

### `M5 — Post-Launch`

Improvements, analytics, optimization, integrations, and additional functionality.

---

# 3. Issue Types

Every issue should have exactly one primary type:

* `type:feature`
* `type:bug`
* `type:enhancement`
* `type:refactor`
* `type:test`
* `type:documentation`
* `type:security`
* `type:performance`
* `type:research`
* `type:design`
* `type:chore`

---

# 4. Issue Hierarchy

AI agents should distinguish between:

### Epic

Large body of work that should be decomposed.

### Feature

A meaningful user or system capability.

### Task

A specific implementation step.

### Bug

A specific incorrect behavior.

### Research

Investigation required before implementation.

Recommended hierarchy:

```text
Epic
 ├── Feature
 │    ├── Task
 │    ├── Task
 │    └── Task
 └── Feature
      ├── Task
      └── Task
```

An AI should **not implement an Epic directly**.

---

# 5. Issue Dependencies

Issues should explicitly identify dependencies.

```md
## Dependencies

- #123 Authentication
- #127 Database schema
```

Types of dependency:

* `blocks`
* `blocked-by`
* `depends-on`
* `related-to`

An implementation agent should not begin a task whose required dependencies are incomplete.

---

# 6. AI Execution State

Use labels/fields to distinguish planning from execution.

### `ai:planned`

Issue was created by an AI planning agent.

### `ai:reviewed`

Human has reviewed and approved the issue.

### `ai:implementable`

Requirements are sufficiently clear for an implementation agent.

### `ai:in-progress`

AI implementation agent is currently working on it.

### `ai:needs-human`

AI cannot safely continue without human input.

### `ai:completed`

Implementation agent believes the issue is complete.

### `ai:verified`

Implementation and automated verification have passed.

---

# 7. Standard Issue Structure

Every implementation issue should contain:

```md
# Objective

What needs to be accomplished.

## Context

Why this work is required.

## Requirements

- Requirement 1
- Requirement 2
- Requirement 3

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Constraints

- Constraint 1
- Constraint 2

## Dependencies

- #123
- #456

## Files / Areas

Expected areas of the codebase affected.

## Testing Requirements

- Unit tests
- Integration tests
- E2E tests

## Definition of Done

- [ ] Implementation complete
- [ ] Tests passing
- [ ] Type checking passing
- [ ] Linting passing
- [ ] Documentation updated where necessary
- [ ] PR created
```

---

# 8. AI Planning Rules

A planning agent should:

1. Read the project's requirements.
2. Identify the required capabilities.
3. Group related capabilities into features.
4. Break features into implementable tasks.
5. Identify dependencies.
6. Assign milestone.
7. Assign priority.
8. Assign complexity.
9. Assign relevant labels.
10. Create the issue.
11. Add it to the GitHub Project.
12. Set status to `Todo`.
13. Mark `AI Ready` appropriately.
14. Stop for human review.

The planning agent should **not automatically implement newly created issues**.

---

# 9. Human Review Gate

Before an implementation agent receives an issue, a human should verify:

* [ ] Objective is correct.
* [ ] Requirements are complete.
* [ ] Acceptance criteria are testable.
* [ ] Scope is appropriate.
* [ ] Dependencies are correct.
* [ ] Complexity is reasonable.
* [ ] Technical constraints are acceptable.
* [ ] Issue is safe to implement.

Once approved:

```text
Human Review → Approved
AI Ready     → Yes
Status       → Todo
```

The implementation agent can then consume it.

---

# 10. Implementation Agent Workflow

An implementation agent should:

```text
Read Issue
    ↓
Read Repository Instructions
    ↓
Read Related Issues
    ↓
Check Dependencies
    ↓
Inspect Existing Code
    ↓
Create Implementation Plan
    ↓
Implement
    ↓
Run Tests
    ↓
Run Linter
    ↓
Run Type Checker
    ↓
Review Changes
    ↓
Create Pull Request
```

The agent should **not assume that passing tests means the issue is correct**.

It should compare the implementation against the issue's acceptance criteria.

---

# 11. Pull Request Requirements

Every AI-generated PR should contain:

```md
## Summary

What was implemented.

## Related Issue

Closes #123

## Changes

- Change 1
- Change 2
- Change 3

## Acceptance Criteria

- [x] Criterion 1
- [x] Criterion 2
- [x] Criterion 3

## Testing

- [x] Unit tests
- [x] Integration tests
- [x] Type checking
- [x] Linting

## AI Notes

Anything the implementation agent was uncertain about.

## Human Review Required

- [ ] Architecture
- [ ] Security
- [ ] Product behavior
- [ ] Database migration
- [ ] Breaking change
```

---

# 12. AI Safety Rules

Implementation agents should stop and request human review when:

* requirements conflict;
* acceptance criteria cannot be satisfied;
* a database migration could cause data loss;
* authentication or authorization behavior is unclear;
* a security-sensitive change is required;
* a breaking API change is discovered;
* the implementation requires a significant architectural change;
* tests contradict the requirements;
* the agent would need to invent product behavior.

The principle is:

> **An AI may make implementation decisions inside an approved boundary, but it should not silently redefine the boundary.**

---

# 13. Recommended Repository-Level AI Files

Each repository should contain:

```text
/
├── AGENTS.md
├── CONTRIBUTING.md
├── README.md
├── docs/
│   ├── requirements/
│   ├── architecture/
│   └── decisions/
└── .github/
    ├── ISSUE_TEMPLATE/
    ├── pull_request_template.md
    └── workflows/
```

### `AGENTS.md`

Contains instructions for AI agents including:

* project purpose
* architecture
* technology stack
* coding conventions
* testing requirements
* prohibited actions
* deployment rules
* database rules
* security requirements
* PR requirements
* issue interpretation rules

This becomes the primary instruction manual for coding agents.

---

# 14. Architecture Decision Records

Significant architectural decisions should become ADRs.

```text
docs/architecture/decisions/

ADR-001-database.md
ADR-002-authentication.md
ADR-003-event-system.md
ADR-004-file-storage.md
```

An AI should consult relevant ADRs before making architectural changes.

---

# 15. Definition of Ready

An issue is `AI Ready` only when:

* objective is clear;
* requirements are explicit;
* acceptance criteria are testable;
* dependencies are identified;
* scope is defined;
* relevant architecture is documented;
* required human decisions have been made.

---

# 16. Definition of Done

An issue is complete when:

* implementation satisfies acceptance criteria;
* automated tests pass;
* type checking passes;
* linting passes;
* no unintended changes remain;
* documentation is updated where necessary;
* PR has been created;
* required human review is complete.

---

# 17. Recommended AI Roles

Rather than having one AI do everything, use specialized roles.

### Product / Planning Agent

Requirements → Issues

### Architecture Agent

Issues → Technical implementation plans

### Implementation Agent

Approved issues → Code + PR

### Review Agent

PR → Automated code/repository review

### Test Agent

Implementation → Tests and verification

### Documentation Agent

Code/features → Updated documentation

Human remains the final authority for:

```text
Requirements
Architecture
Security
Legal/medical decisions
Production deployment
```

---

# 18. Overall Workflow

```text
Requirements Document
        ↓
Planning AI
        ↓
GitHub Issues
        ↓
GitHub Project
        ↓
Todo
        ↓
Human Review
        ↓
AI Ready
        ↓
Implementation AI
        ↓
Pull Request
        ↓
Review AI
        ↓
Human Review
        ↓
Merge
        ↓
Done
```

The important principle is:

> **AI creates the work, humans approve the work, AI executes the approved work, and humans approve the result.**
