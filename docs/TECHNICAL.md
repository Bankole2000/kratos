# Technical Specification

Status: Draft | Owner: {{owner}} | Version: 0.1 | Last updated: {{YYYY-MM-DD}}
References: PRD.md, DESIGN.md

## Architecture overview
{{How the apps fit together: which clients call which services, data stores, external services. A component diagram helps.}}

## Components
One row per deployable app in `apps/`, per shared package in `packages/`, and for `infra/` if used. App names match folder names, `app:` labels and release tags. Kinds: web client, mobile client, desktop client, server/API, worker, shared package, infrastructure.

| Component | Path | Kind | Stack and version | Deploys to | Owner | Requirements |
|---|---|---|---|---|---|---|
| {{web}} | apps/{{web}} | {{Web client}} | {{e.g. framework, language and version}} | {{hosting}} | {{owner}} | {{FR IDs}} |
| {{api}} | apps/{{api}} | {{Server/API}} | {{stack}} | {{hosting}} | {{owner}} | {{FR IDs}} |
| {{mobile}} | apps/{{mobile}} | {{Mobile client}} | {{stack; minimum OS versions}} | {{App Store / Google Play}} | {{owner}} | {{FR IDs}} |
| {{api-contract}} | packages/{{api-contract}} | Shared package | {{types / OpenAPI / schema tooling}} | Not deployed | {{owner}} | — |
| infra | infra/ | Infrastructure | {{IaC tool, see ADR-002}} | {{cloud accounts / environments}} | {{owner}} | — |

## Repository and workspace
- Monorepo tooling: see ADR-001. {{e.g. pnpm workspaces + Turborepo; uv workspace; Gradle multi-project}}
- Dependency rules: apps may depend on packages; packages never depend on apps; apps never import from another app's folder.
- {{Naming, code style, generated-code locations}}

Commands are listed in the README [Commands](../README.md#commands) table, not here.

## Modules
Significant modules within each component.

| Component | Module | Responsibility | Dependencies | Requirements |
|---|---|---|---|---|
| {{Component}} | {{Module}} | {{Purpose}} | {{Dependencies}} | FR-001 |

## Domain and data model
{{Entities, fields, relationships, constraints, indexes, migrations. Which component owns each data store.}}

## API and integrations
| ID | Operation | Input/output | Auth and errors | Requirement |
|---|---|---|---|---|
| API-001 | {{Method/path or operation}} | {{Contract}} | {{Policy/errors}} | FR-001 |

{{External integrations, timeouts, retries, idempotency, events/workflows where needed}}

### API contracts
Every server app has a contract package. List every consumer, including other servers.

| Provider | Contract | Consumers | Consumer auth | Compatibility rule |
|---|---|---|---|---|
| {{api}} | packages/{{api-contract}} | {{e.g. web, admin, android, ios, desktop}} | {{user sessions/tokens}} | {{Installed-client window (below)}} |
| {{ops-api}} | packages/{{ops-api-contract}} | {{e.g. ops}} | {{staff sessions/tokens}} | {{Deploy-together or rolling window}} |
| {{api}} | packages/{{api-contract}} | {{e.g. ops-api (server-to-server)}} | {{service credentials, never a user's token}} | {{Rolling-deploy window}} |

### API compatibility
- Clients and servers use generated or shared types from the contract package; they don't hand-write request shapes.
- Versioning: {{e.g. additive changes only within /v1; breaking changes need /v2}}.
- Installed clients (mobile, desktop) cannot be force-updated instantly. A provider with installed-client consumers supports every client version released in the last {{N months / N versions}}.
- Server-to-server: services deploy independently, so for the duration of a rollout both the old and new version of each service are live. Every change must work with the previous version of each consumer and provider.
- Breaking a field or endpoint: add the replacement → release consumers that use it → wait out the compatibility window → remove the old one. Record each step in an ADR.
- Forced upgrade: {{how an installed client learns its version is unsupported, e.g. a minimum-version endpoint checked at startup}}.

## Infrastructure
- Tool and layout: see ADR-002 and `infra/AGENTS.md`. {{e.g. modules/ plus environments/<env>/}}
- What it manages: {{networks, databases, hosting, DNS, queues, secret store entries; per environment}}
- What it does not manage: {{e.g. app stores, third-party SaaS configured by hand; list them so nothing is forgotten}}
- State: {{remote backend and locking}}. Applying changes is a release step (DEPLOYMENT.md).

## Third-party services and costs
| Service | Used by | Purpose | Plan / tier | Expected monthly cost | Limits and lock-in notes |
|---|---|---|---|---|---|
| {{Service}} | {{component}} | {{Purpose}} | {{Free / paid tier}} | {{Estimate}} | {{Quotas, exit path}} |

## Error handling
{{How errors are classified, surfaced to users (messages, codes) and to developers; retry and fallback rules; offline behavior for mobile and desktop; what must never be shown to users}}

## Logging and observability
{{What each component logs and at which level, structured format, request/correlation IDs passed from client to server and between services, crash reporting for mobile and desktop, what must never be logged (secrets, personal data), metrics and tracing. Alerting and dashboards are in DEPLOYMENT.md.}}

## Security and privacy
- Client apps (web, mobile, desktop) are public: their code and configuration ship to users. They hold no secrets; anything they can access, an attacker can too. All authorization is enforced server-side.
- Internal apps (e.g. admin, ops) are still public on the internet unless the network says otherwise; they rely on server-side authorization like any other client.
- Server-to-server calls use service credentials scoped to what the caller needs, never a forwarded user token.
- {{Identity, permissions, input validation, secrets storage, sensitive data, threat mitigations, retention}}

## Technical decisions
| ID | Decision | Rationale | Status |
|---|---|---|---|
| ADR-001 | Monorepo tooling: {{workspace tool and task runner}} | {{Alternatives and tradeoffs; mobile toolchain compatibility}} | Proposed |
| ADR-002 | Infrastructure-as-code tool: {{tool, or "none: managed hosting configured by hand"}} | {{Alternatives and tradeoffs; state storage}} | Proposed |
| ADR-003 | {{Decision}} | {{Alternatives and tradeoffs}} | Proposed |

## Open decisions and approval
{{Human approver, revision, unresolved risks}}
