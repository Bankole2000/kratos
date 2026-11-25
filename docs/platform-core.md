# Platform Core

> The shared foundation for every app in the portfolio: one Rust server, one API, SDKs for each language.
> Formerly **Portfolio Manager** + **Common Resource Server**, merged into one project. Code named kratos.

Status: Planning · Last updated: 25 November 2026

---

## 1. What it is

Platform Core is the one service every app I build talks to. It does four jobs:

1. **Tracks my projects:** status, costs, links, and live metrics, in one dashboard.
2. **Serves reference data:** countries, currencies, phone codes, timezones, languages, so no app embeds its own copy.
3. **Collects metrics:** apps report events, revenue, errors, sessions, builds and feedback through an SDK.
4. **Issues API keys and tokens:** each app identifies itself with a project API key; people and AI agents use personal access tokens.

Later, an **MCP server** lets AI agents work with Platform Core on behalf of a user (all projects) or a single project.

**Why one project:** I'm the only owner of every consumer app. Splitting "portfolio tracking" from "reference data" created two servers, two SDKs and two deployments for the same consumers. One server, one API, one set of keys.

**What it is not:**
- Not an identity provider. Apps handle their own end users; Platform Core never logs in an app's users.
- Not a project-management tool: no sprints, Gantt charts or time tracking.
- Not a billing system: costs are recorded, not paid.

---

## 2. Stack decisions

| Area | Decision | Notes |
|---|---|---|
| Backend | **Rust**: Axum + SQLx + Tokio | One service handles all reads and writes. The old NestJS-write / Rust-read split is dropped. |
| Database | **Postgres** | Single source of truth. Migrations with `sqlx migrate`. |
| Database access | **SQLx only** for the MVP | Compile-time checked queries (`query_as!`), `cargo sqlx prepare` for CI. SeaORM may be added later for CRUD only (see D2). |
| API contract | **OpenAPI**, generated from Rust code with `utoipa` | The spec is the contract every client and SDK is built from. |
| Shared UI | **Vue 3 + Vuetify 3** in a shared package | Components, composables, API client and types written once. |
| Desktop + mobile | **Plain Vue + Vite inside Tauri 2** | One app for Windows/macOS/Linux, Android and iOS. |
| Public web | **Nuxt 3** (SSR) | For SEO, as the web side may become public-facing. |
| Frontend layout | **Option A: shared package, two apps** | `packages/ui` used by both `apps/web` (Nuxt) and `apps/app` (Vue + Tauri). |
| Auth | **Scoped project API keys** for apps, **personal access tokens** for people and agents, single admin login for the dashboard | Multi-user workspaces come in v3. |
| SDKs | **TypeScript → Dart → Rust → Python**, built in order of need | Generated client + hand-written wrapper per language. |
| AI agents | **MCP server** in Rust (`rmcp`), calling Platform Core through the Rust SDK | v2: local (stdio). v3: remote (HTTP + OAuth). |

---

## 3. Implementation guiding principles

These apply to every decision during the build. When in doubt, come back here.

### Architecture
1. **The HTTP API is the product.** Dashboards, apps and SDKs are all clients of the same public API. There are no private shortcuts into the database.
2. **The OpenAPI spec is the contract.** It's generated from the Rust code, committed to the repo, and every TS/Dart/Rust/Python client is generated from it. Nobody hand-writes request shapes.
3. **One service until there's a reason for two.** Reads and writes live in one Rust binary. Hot reads (reference data) are fast through caching and HTTP cache headers, not through a separate server. Split only when measurements say so.
4. **Postgres is the only state.** No second store in the MVP. Add Redis or similar only when a measured problem needs it.
5. **Keep the read path and the write path apart in code.** Reference-data reads and metric ingestion live in separate modules, so heavy metric writes never slow down reference reads, and they can be split later if needed.

### API design
6. **Version from day one.** Everything lives under `/v1`. Within a version, changes are additive only. A breaking change means `/v2`.
7. **Installed clients can't be forced to update.** Tauri apps and app-embedded SDKs stay in use for months, so old versions must keep working until a published support window ends.
8. **Consistent errors.** Every error has a stable code, a human message and a request ID. Clients can act on the code, and I can trace the request ID.
9. **Ingestion is idempotent.** Each SDK event carries a client-generated ID, so retries never double-count.

### Security
10. **Clients hold no secrets.** Anything shipped in a browser, Tauri or mobile app can be extracted. Those apps only ever get a **publishable key**.
11. **Keys carry a list of scopes, not a fixed type.** Scopes such as `events:write`, `reference:read`, `projects:read`, `projects:write`, `costs:read`, `costs:write`. Common sets get presets:
    - **Secret** (`pc_sk_…`): server-side only, all scopes for its project.
    - **Publishable** (`pc_pk_…`): safe in client apps; `events:write` + `reference:read` only.
    - **Agent**: chosen scopes for an AI agent, read-only by default.
12. **Two kinds of credential.** *Project keys* belong to one project and environment. *Personal access tokens* (`pc_pat_…`) belong to a user and can reach all of that user's projects, within their scopes. Both are stored hashed (SHA-256), shown once at creation, revocable, and optionally expire.
13. **Rate limits per key**, so one misbehaving app can't take Platform Core down for the others.
14. **Never log secrets or personal data, but always record who made a change.** Keys are logged by prefix only. Each write stores the key, token or admin session behind it, so any change can be traced, including changes made by AI agents.

### SDKs
15. **An SDK must never hurt the app it runs in.** It never throws into app code, never blocks the main thread, and quietly drops data rather than crashing if Platform Core is down.
16. **Same behaviour in every language**, defined once in the SDK spec (section 6).
17. **Thin over generated.** Generated client for transport and types, small hand-written layer for the friendly API and batching.

### Frontend
18. **Write UI once.** Screens, components and the API client live in `packages/ui`. `apps/web` and `apps/app` only hold routing, layouts and platform-specific code.
19. **The Tauri app is client-side only.** No SSR assumptions in shared code; anything Nuxt-specific stays in `apps/web`.
20. **Usable on a phone.** Every dashboard screen must work at mobile widths, because the same UI runs in Tauri on Android and iOS.

### Process
21. **Dogfood it.** Platform Core reports its own metrics through its own SDK.
22. **Small vertical slices.** Each milestone ships something that works end to end, from database to screen. No building all of the backend before any UI.
23. **Learn Rust on the easy parts first.** Start with CRUD and reference data. Leave ingestion, batching and rate limiting until the basics feel natural.
24. **Requirement IDs are stable.** Feature IDs below are never renumbered or reused. Removed features are marked deprecated.

### AI agent access
25. **The MCP server is just another client.** It calls the public API through the Rust SDK, with no direct database access and no endpoints of its own.
26. **Design the API with agents in mind.** Filters, pagination and short summary endpoints help both the dashboard and agents. OpenAPI descriptions should be clear enough to become MCP tool descriptions.
27. **Agents are read-only unless given more.** Write scopes are granted on purpose, per token.
28. **Some actions never go through MCP:** creating or revealing API keys or tokens, deleting data, changing admin credentials. Risky actions (archiving a project, revoking a key) are left out or need explicit confirmation.
29. **Agent tokens are visible.** They have their own rate limits and are labelled as agents in the audit trail.

---

## 4. Repository layout

Monorepo, following the existing `platform_core` starter-kit layout.

```
apps/
  api/            Rust (Axum) server: all reads and writes
  web/            Nuxt 3: public web + dashboard on the web (SSR)
  app/            Vue 3 + Vite inside Tauri 2: desktop (Win/macOS/Linux) + mobile (Android/iOS)
  mcp/            Rust MCP server (rmcp) for AI agents, added in v2
packages/
  ui/             Vue + Vuetify components, composables, screens shared by web and app
  api-client-ts/  TypeScript client generated from the OpenAPI spec
  types/          Rust crate of shared domain types (used by api and the Tauri side of app)
sdks/
  ts/             @owner/platform-core (npm)
  dart/           platform_core (pub.dev)
  rust/           platform-core (crates.io)
  python/         platform-core (PyPI), later
openapi/          Generated openapi.json, committed; the contract
docs/             PRD, TECHNICAL, ROADMAP, this file
```

Workspaces: **Cargo workspace** for Rust (`apps/api`, `apps/mcp`, `packages/types`, `sdks/rust`, Tauri's `src-tauri`) and **pnpm workspace** for JS/TS (`apps/web`, `apps/app`, `packages/ui`, `packages/api-client-ts`, `sdks/ts`).

---

## 5. Features

Priorities use MoSCoW for the MVP (Must / Should / Could). Later phases are marked v2 / v3.

### F1. Project registry · MVP · Must
- Create, edit and archive projects.
- Fields: name, slug, description, status, stack tags, live URL, notes.
- Status lifecycle: `idea → active → paused → shipped → abandoned`.
- Archived projects are hidden by default but never deleted.

### F2. Quick links · MVP · Must
- A shelf of typed links per project: repo, docs, design, CI, deployment, staging, production, other.
- Each link has a type, label and URL. Order can be changed.

### F3. Cost tracker · MVP · Must
- Log costs per project: name, vendor, amount, currency, billing cycle (monthly / annual / one-off), start date, optional end date.
- Calculates monthly burn per project (annual costs ÷ 12; one-off costs excluded from burn, shown separately).
- Dashboard shows total monthly burn across all projects.
- Costs in different currencies are converted to one display currency using the reference data (F6).

### F4. API keys · MVP · Must
- Multiple named keys per project (e.g. "Production", "Staging").
- Each key has a **list of scopes** (principle 11). Presets: **secret**, **publishable**, **agent**; scopes can also be picked individually.
- Environment tag: production / staging / development.
- Shown once on creation; stored as a SHA-256 hash with a visible prefix for identification.
- Optional expiry date. Revoke at any time; shows "last used" timestamp.

### F5. Admin login and personal access tokens · MVP · Must
- Single admin account for the dashboard (Argon2 password hash).
- Session or JWT for the dashboard; separate from app API keys.
- **Personal access tokens:** named tokens belonging to the admin user, reaching all projects within their scopes. Used by scripts and AI agents (F20). Same storage, expiry and revoke rules as API keys.
- Replaced by multi-user workspaces in v3 (F13); tokens then belong to each user.

### F21. Audit trail · MVP · Must
- Every write records the actor (API key, personal access token or admin session), the action, the target and the time.
- Actors are labelled by kind (app, person, agent).
- Viewable per project in the dashboard; filterable by actor.

### F6. Reference data · MVP · Must
- Datasets: countries, currencies, phone codes, timezones, languages.
- Read endpoints: list, get by code, search. Responses send cache headers (`ETag`, `Cache-Control`) so apps and SDKs cache them.
- Editable from the dashboard; every change bumps a dataset version so clients know when to refresh.
- Seeded from standard sources (ISO 3166, ISO 4217, IANA tz, ISO 639).
- Access with any valid key, publishable or secret.

### F7. Metrics ingestion · MVP · Must
- Event types: `track`, `revenue`, `error`, `session`, `build`, `feedback`, `ping`.
- Batch endpoint: accepts up to N events per request; each event has a client ID for deduplication (principle 9).
- Per-key rate limits.
- Retention period configurable; raw events can later be rolled up into daily totals.

### F8. Metrics dashboard · MVP · Must
- Per project: live event feed filterable by type, volume charts (7 / 30 days), monthly revenue total, latest errors, last ping ("is it up?").
- Portfolio overview: all projects with status, monthly burn, last activity.

### F9. TypeScript SDK · MVP · Must
- First SDK, used by web and Node apps. Follows the SDK spec (section 6).

### F10. Dart SDK · MVP · Should
- For the client Flutter apps (ride-hailing, labour hiring). Same spec.

### F11. Rust SDK · Could (MVP) / v2
- For Tauri apps and Rust services. Can reuse `packages/types`.

### F12. Python SDK · v2
- Built only when a real app needs it.

### Later phases
| ID | Feature | Phase |
|---|---|---|
| F13 | Multi-user workspaces with roles (owner, admin, viewer) | v3 |
| F14 | GitHub integration: link a repo, sync open issues into an Issues tab | v2 |
| F15 | AI project summary: on-demand digest of status, costs, issues and recent events | v2 |
| F16 | Daily snapshots for trend charts (cost, events, issues over time) | v2 |
| F17 | Public status page per project at `/p/:slug` (Nuxt, SSR for SEO) | v2 |
| F18 | Vendor / service directory to pick vendors from when logging costs | v2 |
| F19 | Alerts: notify when a project stops pinging or errors spike | v2 |
| F20 | MCP server, local (stdio): AI agents work with Platform Core for a user (personal access token) or a single project (project key with agent scopes) | v2, after F11 |
| F22 | MCP server, remote (HTTP + OAuth), so cloud-hosted agents can connect | v3, with F13 |

### F20. MCP server · v2
- New app `apps/mcp`: Rust binary using `rmcp`, calling Platform Core through the Rust SDK (F11).
- Runs locally over stdio; token passed in an environment variable.
- **Two scopes:**
  - *User scope*: personal access token, sees all the user's projects.
  - *Project scope*: project key with agent scopes, sees one project only. Suits an agent working inside that project's repo.
- **Tools:** list / get projects, project overview (status, burn, recent errors, last ping), update status, add a link, log a cost, get monthly burn, query metrics, list recent errors, look up reference data. Which tools appear depends on the token's scopes.
- **Resources:** project overviews, reference datasets.
- **Prompts:** e.g. "weekly portfolio report", "what broke this week?".
- Follows principles 25–29: read-only by default, no key management or deletion, all actions in the audit trail (F21).

---

## 6. SDK specification

Every SDK, in every language, behaves like this.

**Setup**
```
init({ apiKey, environment, endpoint?, enabled?, sampleRate?, flushInterval?, maxBatchSize? })
```

**Methods**
| Method | Purpose |
|---|---|
| `track(name, properties?)` | Generic product event |
| `revenue(amount, currency, properties?)` | Money received |
| `error(error, context?)` | Handled or unhandled error |
| `session(start \| end, properties?)` | User session boundaries |
| `build(version, status, properties?)` | Build or deploy result |
| `feedback(message, rating?, properties?)` | User feedback |
| `ping()` | Liveness signal |
| `flush()` | Send queued events now |
| `referenceData.countries()` etc. | Reference data, cached by the SDK |

**Required behaviour**
- Sends the key in the `Authorization: Bearer <key>` header.
- Queues events and sends them in batches, in the background.
- Retries failed sends with exponential backoff and jitter; gives up after a limit.
- Keeps an offline queue (persistent on mobile and desktop), capped in size.
- Gives every event a client-generated ID and timestamp.
- Never throws into app code; failures go to an optional debug logger.
- Can be turned off or sampled per environment.
- Caches reference data and refreshes it when the dataset version changes.
- Identifies itself (`sdk: ts/1.2.0`) so the server can track SDK versions in use.

---

## 7. Milestones

| Milestone | Outcome |
|---|---|
| **M0: Foundation** | Monorepo set up (Cargo + pnpm workspaces), Axum server with health check and Postgres, migrations, OpenAPI generation, Nuxt and Tauri shells rendering a shared `packages/ui` screen, CI building everything |
| **M1: Core registry** | F1, F2, F4, F5, F21: projects, links, scoped API keys, admin login, personal access tokens and audit trail, end to end in web and Tauri |
| **M2: Reference data** | F6: datasets seeded, read endpoints with caching, admin editing |
| **M3: Metrics** | F7, F8, F9: ingestion, dashboard, TypeScript SDK; Platform Core reports its own metrics |
| **M4: Costs + Dart SDK** | F3, F10: cost tracker with currency conversion; Flutter apps can report metrics |
| **M5: Hardening + launch** | Rate limits, security checks, backups, deployment, Tauri builds signed for desktop and mobile |

After launch, v2 begins with the Rust SDK (F11) and then the local MCP server (F20).

---

## 8. Open decisions

| # | Question | Notes |
|---|---|---|
| D1 | Deployment target: keep **ECS**, or something simpler for a single Rust binary + Postgres (Fly.io, Railway, a VPS)? | One service makes ECS less necessary. |
| D2 | ~~SQLx or SeaORM?~~ **Decided:** SQLx only for the MVP. | SeaORM can be added later for CRUD only, on the same SQLx pool. If so: one migration tool (`sqlx migrate`), match SeaORM's SQLx version, and keep ingestion and reporting queries in SQLx. |
| D3 | Metric event retention period, and when to roll raw events into daily totals. | Affects database size and cost. |
| D4 | How much of `apps/web` is public (SEO) vs dashboard behind login? | Decides how many pages need SSR. |
| D5 | Display currency for cost totals, and source for exchange rates. | NGN, USD, or a setting. |
| D6 | Package names on npm, pub.dev, crates.io and PyPI. | Check availability early. |
| D7 | Default expiry for personal access tokens and agent keys (e.g. 90 days, or none). | Shorter is safer for agents. |
| D8 | Final scope list and naming (e.g. `projects:write` vs finer scopes like `links:write`). | Settle before M1; changing scopes later affects issued keys. |
