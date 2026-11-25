# AGENTS.md — infra

These instructions add to the repository root `AGENTS.md`; they never relax it. Read the root file first.

## What this folder is
- Tool: {{infrastructure-as-code tool and version}} (see docs/TECHNICAL.md, ADR-002)
- Layout: {{e.g. modules/ for reusable pieces, environments/<env>/ per environment}}
- Environments: {{local/staging/production, matching docs/DEPLOYMENT.md}}
- State: {{where state is stored and locked, e.g. a remote backend; never in git}}

## Rules
- Agents may write and change infrastructure code, and run validate, lint and plan. Agents never apply, import, destroy or change state, in any shared environment, unless a human explicitly authorizes that specific action.
- Every infrastructure PR includes the plan output (or a summary of it) for each affected environment, and calls out anything that is destroyed or replaced.
- Changes that destroy or replace data stores, networks or DNS need `impact:breaking` and the release owner's approval.
- Secrets are referenced from the secret store, never written into code, variables files or plan output committed to git.
- Keep environments structurally identical; differences (size, count) come from variables.
- Commands: README [Commands](../README.md#commands), "Infrastructure" line. Applying is a release step in docs/DEPLOYMENT.md.
