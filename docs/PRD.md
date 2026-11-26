# Product Requirements Document

Status: Approved | Owner: @Bankole2000 | Version: 1.4 | Last updated: 2026-11-26
References: FEATURES.md (users, resources, surfaces, journeys and features FT-), platform-core.md (project overview, guiding principles and SDK specification)

FEATURES.md feeds this document. When features are approved or changed there, the requirements below are updated to match, and each requirement lists the features it covers.

## Vision and problem
Platform Core (code name kratos) is the one service every app in the portfolio talks to. It replaces two planned projects, Portfolio Manager and Common Resource Server, with one Rust server, one API and one SDK per language.

Today each app would need its own copy of reference data (countries, currencies, phone codes, timezones, languages), and there is no single place to see the status, costs, links and live health of every project. Because one person owns every consumer app, splitting portfolio tracking from reference data would mean two servers, two SDKs and two deployments for the same consumers.

Platform Core does four jobs:
1. Tracks projects and their components (web, mobile, desktop, server and other parts): status, costs, links and live metrics, in one dashboard.
2. Serves reference data, so no app embeds its own copy.
3. Collects metrics that apps report through an SDK: events, revenue, errors, sessions, builds and feedback.
4. Issues API keys and tokens: apps identify themselves with project API keys; people and AI agents use personal access tokens.

It is not an identity provider (apps handle their own end users), not a project-management tool (no sprints, Gantt charts or time tracking) and not a billing system (costs are recorded, not paid).

## Users
- **Owner/admin** (one person in the MVP): registers projects, tracks costs, manages keys and tokens, watches metrics, edits reference data. Uses the dashboard on the web, on the desktop and on a phone.
- **Consumer apps**: the owner's web, Node, Flutter and Tauri apps. They read reference data and report metrics through an SDK, using a project API key.
- **Scripts and AI agents**: act for the owner with a personal access token, or for one project with an agent-scoped project key. The MCP server (v2) is the main agent client.

## Platforms
- **API** (`apps/api`): the product. Every client, including the dashboards, uses the same public HTTP API.
- **Web** (`apps/web`, Nuxt, SSR): dashboard in the browser; may later host public pages (see D4, F17).
- **App** (`apps/app`, Vue inside Tauri 2): the same dashboard as a desktop app (Windows, macOS, Linux) and a mobile app (Android, iOS).
- **SDKs**: TypeScript and Dart in the MVP; Rust is a Could for the MVP; Python is deferred until an app needs it.
- **Deferred**: MCP server (v2 local, v3 remote), public status pages (v2).

## Objectives and success criteria
- OBJ-001: One place to see the portfolio. Success: every active project is registered, with its links and costs, within a dynamically configurable time period of launch, and the portfolio overview shows status, monthly burn and last activity for all of them.
- OBJ-002: No app embeds its own reference data. Success: every new app started after launch reads reference data from Platform Core; existing apps migrate as they are next changed.
- OBJ-003: Apps report metrics without being harmed by it. Success: at least 2 apps report metrics through an SDK, Platform Core reports its own metrics through its own SDK, and no app crash or slowdown is traced to an SDK.

## MVP scope and functional requirements
Priority uses MoSCoW: Must, Should, Could, Won't. IDs are stable: never renumber or reuse them; mark removed requirements as deprecated. The Features column lists the FEATURES.md features (FT-) each requirement covers; every approved feature appears in at least one requirement, and `node scripts/check-features.mjs` checks these links. A requirement that is not a feature (an SDK, or the dashboard on every platform) writes —. The Area column links each requirement to the feature areas (F1, F2, …) in platform-core.md section 5. Platforms: All = web dashboard and Tauri app (desktop and mobile), through the API.

| ID | Features | Area | Requirement | Platforms | Acceptance criterion | Priority |
|---|---|---|---|---|---|---|
| FR-001 | FT-003, FT-004 | F1 | The admin can create a project with name, slug, description, status, stack tags, live URL and notes. | All | A created project appears in the project list with every field as entered; a duplicate slug is rejected with a clear error. | Must |
| FR-002 | FT-005 | F1 | The admin can edit every field of a project. | All | Edited values are shown after reload; the change appears in the audit trail (FR-017). | Must |
| FR-003 | FT-003, FT-005 | F1 | A project's status is one of `idea`, `active`, `paused`, `shipped`, `abandoned`. | All | Only these five values are accepted; any other value is rejected. Whether some transitions are disallowed is open (OD-001). | Must |
| FR-004 | FT-004, FT-006 | F1 | The admin can archive and unarchive a project. Archived projects are hidden by default and never deleted. | All | An archived project disappears from the default list, appears when "show archived" is on, and keeps all its links, costs, keys and metrics. No delete action exists. | Must |
| FR-005 | FT-010, FT-011, FT-012 | F2 | The admin can add, edit and remove links on a project. Each link has a type (repo, docs, design, CI, deployment, staging, production, other), a label and a URL. | All | Links appear on the project grouped or tagged by type; an invalid URL is rejected. | Must |
| FR-006 | FT-013 | F2 | The admin can change the order of a project's links. | All | The new order is kept after reload and on every client. | Must |
| FR-007 | FT-042, FT-043 | F3 | The admin can log a cost on a project: name, vendor, amount, currency, billing cycle (monthly, annual, one-off), start date and optional end date. | All | A logged cost appears in the project's cost list with every field as entered. | Must |
| FR-008 | FT-043, FT-044 | F3 | The system calculates each project's monthly burn (BR-001). One-off costs are excluded from burn and shown separately. | All | For a project with a 10/month cost, a 120/year cost and a 50 one-off cost, burn shows 20 and one-off costs show 50. | Must |
| FR-009 | FT-044, FT-046 | F3 | The dashboard shows total monthly burn across all projects. | All | The total equals the sum of each project's burn, converted to the display currency. | Must |
| FR-010 | FT-045, FT-046 | F3, F6 | Costs in different currencies are converted to one display currency (D5). | All | A cost in a non-display currency shows the converted amount and the rate date used. | Must |
| FR-011 | FT-016 | F4 | The admin can create multiple named API keys per project, each with an environment (production, staging, development) and a list of scopes, picked individually or from a preset (secret, publishable, agent). | All | A created key has the chosen name, environment and scopes; presets give exactly the scopes in BR-002 to BR-004. | Must |
| FR-012 | FT-016, FT-017, FT-019, FT-020 | F4, F5 | A new key or token is shown once, at creation. Only a SHA-256 hash and a visible prefix are stored. | All | The full secret is never returned again by any endpoint; the list shows only prefix, name and metadata. | Must |
| FR-013 | FT-016, FT-019, FT-022, FT-023 | F4, F5 | A key or token can have an expiry date; expired credentials are rejected. | API | A request with an expired credential gets 401 with a stable error code. | Must |
| FR-014 | FT-017, FT-018, FT-020, FT-021, FT-022, FT-023 | F4, F5 | The admin can revoke a key or token at any time; each one shows when it was last used. | All | A revoked credential is rejected on its next request; "last used" updates when a credential is used. | Must |
| FR-015 | FT-001, FT-002 | F5 | The admin signs in to the dashboard with a single admin account. The dashboard session is separate from API keys. | All | Correct credentials open the dashboard; wrong ones are rejected without saying which part was wrong; signing out ends the session. | Must |
| FR-016 | FT-019, FT-023, FT-024 | F5 | The admin can create named personal access tokens with chosen scopes, reaching all projects within those scopes. Storage, expiry and revoke rules match API keys (FR-012 to FR-014). | All | A token with `projects:read` can list every project but cannot change one. | Must |
| FR-017 | FT-025 | F21 | Every write records the actor (API key, personal access token or admin session), the actor kind (app, person, agent), the action, the target and the time. | API | After any create, update, archive or revoke, an audit entry with these fields exists. | Must |
| FR-018 | FT-026, FT-027 | F21 | The admin can view the audit trail per project and filter it by actor. | All | The project's audit view lists its entries newest first; filtering by an actor shows only that actor's entries. | Must |
| FR-019 | FT-028 | F6 | Reference datasets exist for countries, currencies, phone codes, timezones and languages, seeded from standard sources (ISO 3166, ISO 4217, IANA tz, ISO 639; phone code source in OD-003). | API | After seeding, each dataset contains the full standard list. | Must |
| FR-020 | FT-029, FT-030 | F6 | Each dataset can be listed, fetched by code and searched, with any valid key (publishable or secret) or token. | API, SDKs | `GET` by a known code returns the entry; an unknown code returns 404 with a stable error code; a request without a valid credential is rejected. | Must |
| FR-021 | FT-029 | F6 | Reference data responses send `ETag` and `Cache-Control` headers and answer conditional requests. | API, SDKs | A repeat request with `If-None-Match` and an unchanged dataset returns 304 with no body. | Must |
| FR-022 | FT-029, FT-031 | F6 | The admin can edit reference data from the dashboard. Every change bumps that dataset's version, which clients can read. | All | After an edit, the dataset version is higher and the entry's new value is served. | Must |
| FR-023 | FT-032 | F7 | Apps send events of type `track`, `revenue`, `error`, `session`, `build`, `feedback` and `ping` to a batch endpoint, up to a maximum batch size (OD-002). | API, SDKs | A valid batch is accepted and every event is stored against the key's project; a batch over the maximum is rejected with a stable error code. | Must |
| FR-024 | FT-032 | F7 | Each event carries a client-generated ID; the server stores an event only once per project and ID. | API | Sending the same batch twice stores each event once. | Must |
| FR-025 | FT-033 | F7 | Requests are rate limited per key and per token. | API | Past the limit, requests get 429 with a `Retry-After` header; other keys are not affected. | Must |
| FR-026 | FT-034 | F7 | The raw event retention period is configurable (D3). | API | Events older than the retention period are removed or rolled up by a scheduled job. | Should |
| FR-027 | FT-036, FT-037 | F8 | Each project has a live event feed, filterable by event type. | All | New events appear without a manual reload, within the configurable feed refresh interval (`EVENT_FEED_REFRESH_SECONDS`, default 5); filtering by type shows only that type. | Must |
| FR-028 | FT-038 | F8 | Each project shows event volume charts for the last 7 and 30 days. | All | The chart totals match the stored event counts for those days. | Must |
| FR-029 | FT-039 | F8 | Each project shows its monthly revenue total, latest errors and last ping. | All | The values match the stored events; a project with no ping within its configurable "not reporting" period (per project; default 15 minutes) is marked as not reporting. | Must |
| FR-030 | FT-040 | F8 | The portfolio overview lists all projects with status, monthly burn and last activity. | All | Every unarchived project appears with these three values. | Must |
| FR-031 | — | F9 | A TypeScript SDK, published to npm, implements the SDK specification (platform-core.md section 6) for browser and Node apps. | SDK | The SDK conformance tests (TESTING.md) pass in a browser and in Node. | Must |
| FR-032 | — | F10 | A Dart SDK, published to pub.dev, implements the same SDK specification for Flutter apps. | SDK | The SDK conformance tests pass in a Flutter test app. | Should |
| FR-033 | — | F11 | A Rust SDK, published to crates.io, implements the same SDK specification. | SDK | The SDK conformance tests pass. | Could |
| FR-034 | FT-035 | — | Platform Core reports its own metrics through its own SDK (principle 21). | All | Platform Core appears as a project in its own dashboard with live events. | Should |
| FR-035 | — | — | The dashboard works in the browser, in the desktop app (Windows, macOS, Linux) and in the mobile app (Android, iOS). | All | Every MVP screen passes the release acceptance checks on each platform (TESTING.md). | Must |
| FR-036 | FT-007 | F1 | The admin can add components to a project: name, slug (unique within the project), kind (`web`, `mobile`, `desktop`, `server`, `worker`, `library`, `cli`, `infra`, `other`), optional description and optional live URL. Components are optional; a project without any works as before. | All | A created component appears in the project's component list with every field as entered; a duplicate slug in the same project is rejected with `component_slug_taken`; the same slug in another project is accepted. | Must |
| FR-037 | FT-008, FT-009 | F1 | The admin can edit a component and set its status to `active` or `retired`. Components are never deleted; retired components are hidden by default and keep their links, costs, keys and events. | All | Edited values are shown after reload and recorded in the audit trail; a retired component disappears from the default list, appears with "show retired" on, and keeps all related data. No delete action exists. | Must |
| FR-038 | FT-014, FT-015 | F2 | A link can optionally be tagged with one of its project's components. | All | The tag is shown on the link; filtering links by component shows only that component's links and untagged links stay visible under the project; a component from another project is rejected. | Must |
| FR-039 | FT-047, FT-048 | F3 | A cost can optionally be tagged with one of its project's components. Project burn and one-off totals include every cost, tagged or not. | All | Burn and one-off totals are the same before and after tagging; the cost list can be filtered by component and shows a per-component subtotal; a component from another project is rejected. | Must |
| FR-040 | FT-016, FT-032 | F4, F7 | A project key can optionally be tied to one of its project's components. Events sent with that key are stored against that component; events sent with a key that has no component have none. | All | Events sent with a component's key appear under that component; events from a project-wide key appear under the project only; a component from another project is rejected; the component of an existing key cannot be changed. | Must |
| FR-041 | FT-037, FT-039, FT-041 | F8 | The event feed, volume charts, revenue, latest errors and last ping can be filtered by component, and the project overview shows the last ping of each active component. | All | With the filter set, every figure counts only that component's events; a component with no ping within its project's "not reporting" period is marked as not reporting while the others are not. | Must |
| FR-042 | FT-032, FT-037 | F7, F9 | SDKs attach the platform they run on (`web`, `ios`, `android`, `windows`, `macos`, `linux`, `server`) to every event, and the event feed can be filtered by platform. | API, SDKs | An event sent from each platform is stored with the matching value; an event without one is stored with none; the feed filter shows only the chosen platform. | Should |
| FR-043 | FT-052 | F3 | The admin can edit every field of a cost, including setting or clearing its end date. | All | Edited values show after reload; monthly burn is recalculated; the change appears in the audit trail. | Must |
| FR-044 | FT-053 | F3 | The admin can remove a cost entered by mistake. | All | The cost leaves the list and the burn; the audit trail keeps a record of it. | Should |
| FR-045 | FT-054, FT-055 | F4, F5 | The admin can rename an API key or personal access token and change its expiry. Environment, scopes and component stay fixed. | All | The new name and expiry show in the list; past the new expiry the credential is rejected; changing scopes, environment or component is not possible. | Should |
| FR-046 | FT-056, FT-057, FT-058, FT-059 | F5 | Scripts and agents can edit projects, create links, read project metrics and read costs through the API, each only within the scopes of their token or key (D8). Creating or revoking keys and tokens and changing admin credentials stay with the admin session. | API | With the matching scope each request succeeds and writes are audited with the agent as actor; without it the request gets 403 `missing_scope`. | Should |
| FR-047 | FT-060, FT-061 | F6 | The admin can add an entry to a reference dataset and archive one. Archived entries are never deleted. | All | An added entry is served; an archived entry leaves lists and search but is still returned by code, marked deprecated; each change raises the dataset version. | Should |
| FR-048 | FT-062 | F5 | The admin can change their password, giving the current one. | All | The new password works, the old one is rejected and every other session ends. | Should |
| FR-049 | FT-063 | F5 | The admin password can be reset with a command run on the server, without the old password. | Server command line | The command sets a new password and ends every session. | Must |

## Out of scope / stretch
Later phases from platform-core.md section 5. Their IDs are reserved there.
- F12 Python SDK (v2, only when an app needs it)
- F13 Multi-user workspaces with roles (v3)
- F14 GitHub integration (v2)
- F15 AI project summary (v2)
- F16 Daily snapshots for trend charts (v2)
- F17 Public status page per project (v2)
- F18 Vendor and service directory (v2)
- F19 Alerts when a project stops pinging or errors spike (v2)
- F20 MCP server, local over stdio (v2, after F11)
- F22 MCP server, remote over HTTP with OAuth (v3)
- Won't: signing in an app's end users, project management features, paying costs.

## Business rules and glossary
- BR-001: Monthly burn = sum of monthly costs + (sum of annual costs ÷ 12), counting only costs whose start date is on or before the month and whose end date, if any, is on or after it. One-off costs are excluded from burn and totalled separately.
- BR-002: The publishable preset grants `events:write` and `reference:read` only. Publishable keys are the only keys allowed in browser, Tauri and mobile apps.
- BR-003: The secret preset grants all scopes for its project and is for server-side use only.
- BR-004: The agent preset is read-only by default; write scopes are added on purpose, per key or token.
- BR-005: A project key belongs to one project and one environment, and optionally to one component of that project, fixed when the key is created. A personal access token belongs to a user and reaches all of that user's projects, within its scopes.
- BR-006: Key and token prefixes: `pc_sk_` (secret), `pc_pk_` (publishable), `pc_pat_` (personal access token). Agent-preset keys use the prefix of their scope set (OD-004).
- BR-007: Projects, components and audit entries are never deleted.
- BR-009: A component belongs to exactly one project and never moves to another. Anything tagged with a component (link, cost, key, event) belongs to the same project.
- BR-010: A part that is started, paused or abandoned on its own, has its own users or costs, or is shared by several projects is a separate project. A part that ships as piece of one product is a component of that project.
- BR-008: Within `/v1`, API changes are additive only; a breaking change needs `/v2`.
- **Project key**: an API key that belongs to one project and environment, and optionally one component.
- **Component**: a separately built and deployed part of a project, such as its web app, mobile app, desktop app or server (BR-010). Projects have one level of components; components have no sub-components.
- **Platform**: where an event's code ran (`web`, `ios`, `android`, `windows`, `macos`, `linux`, `server`). One component can run on several platforms; for example, a Tauri app is one component on five platforms. Reported by the SDK, not configured.
- **Personal access token (PAT)**: a token that belongs to a user and acts for them across projects.
- **Scope**: one permission, such as `events:write` or `projects:read`. The final list is open (D8).
- **Preset**: a named set of scopes (secret, publishable, agent).
- **Dataset version**: a number that increases whenever a reference dataset changes, so clients know when to refresh.
- **Event**: one metric record sent by an app (`track`, `revenue`, `error`, `session`, `build`, `feedback`, `ping`).
- **Monthly burn**: a project's recurring cost per month (BR-001).
- **Display currency**: the single currency that cost totals are shown in (D5).

## Non-functional requirements
- NFR-001: Errors. Every error response has a stable code, a human-readable message and a request ID, and the request ID appears in the server logs.
- NFR-002: Reference data performance. Cached reference reads are answered within TBD ms at p95 on the production host.
- NFR-003: Ingestion performance. A batch of the maximum size is accepted within TBD ms at p95; heavy ingestion does not slow reference reads (principle 5).
- NFR-004: Credential security. Keys and tokens are stored only as SHA-256 hashes; the admin password is stored as an Argon2 hash; secrets and personal data never appear in logs (keys are logged by prefix only).
- NFR-005: Compatibility. Released SDK and app versions keep working until the end of a published support window (3 months; see TECHNICAL.md, API compatibility).
- NFR-006: SDK safety. SDKs never throw into app code, never block the main thread, cap their offline queue, and drop data rather than crash when Platform Core is unreachable.
- NFR-007: Mobile widths. Every dashboard screen is usable at a viewport width of 360 px.
- NFR-008: Accessibility. Target TBD (proposed: WCAG 2.2 AA for the dashboard).
- NFR-009: Data protection. Postgres is backed up on a schedule with a tested restore (DEPLOYMENT.md); recovery objectives TBD.

## Constraints and risks
- One developer, learning Rust while building. Milestones start with CRUD and reference data and leave ingestion, batching and rate limiting until later (principle 23).
- Signed desktop and mobile builds need an Apple Developer account, a Google Play account and a Windows code-signing certificate, which can take days to weeks to obtain.
- Package names on npm, pub.dev, crates.io and PyPI may be taken (D6).
- Nuxt 3 reached end of maintenance in July 2026, so apps/web uses Nuxt 4 (OD-005).
- Vuetify 3.x has stopped at 3.9.7, so the shared UI uses Vuetify 4 (OD-008).
- Every consumer app depends on Platform Core; if it is down, SDKs must degrade quietly (NFR-006) and apps must keep working.

## Open decisions
Decisions D1 to D8 are tracked in platform-core.md section 8 (D2 is decided: SQLx only). Additional decisions raised while drafting:
- OD-001: Are status transitions restricted (for example, `abandoned` → `active`), or can any status follow any other? Owner: @Bankole2000. Needed by: M1.
- OD-002: Maximum events per batch (N) and maximum request size. **Decided 2026-11-26: both are configurable** (`INGEST_MAX_BATCH_EVENTS`, default 500; `INGEST_MAX_REQUEST_BYTES`, default 1 MB), following the owner's rule that a TBD which can be a setting is configurable.
- OD-003: Source for phone codes (ITU-T E.164 assignments or a maintained dataset such as libphonenumber metadata). Owner: @Bankole2000. Needed by: M2.
- OD-004: Do agent keys get their own prefix (for example, `pc_ak_`) so they are recognizable in logs? Owner: @Bankole2000. Needed by: M1, together with D8.
- OD-005: Nuxt version for `apps/web`. **Decided 2026-11-25: Nuxt 4**, since Nuxt 3 no longer gets security fixes. This replaces "Nuxt 3" in platform-core.md section 2.
- OD-006: License. **Decided (2026-11-25 project setup review): MIT** for the whole repository, SDKs included. See LICENSE.
- OD-007: How are the parts of a product (web app, mobile app, server, and so on) tracked? **Decided 2026-11-25: as components**, one level under a project (FR-036 to FR-042), rather than as separate projects (which would split burn, status and the portfolio overview) or nested subprojects (more complexity than one owner needs). A key's component is optional and comes from the key, so apps cannot mislabel their events; the platform is reported by the SDK. Components have only `active` and `retired` status; the lifecycle stays on the project.
- OD-008: Vuetify version for `packages/ui` (and so for `apps/web` and `apps/app`). **Decided 2026-11-25: Vuetify 4** (4.3.x), since 3.x has stopped at 3.9.7. This replaces "Vuetify 3" in platform-core.md section 2, DESIGN.md and TECHNICAL.md.

## Approval
Approved by @Bankole2000 on 2026-11-25, revision 1.0, to start building. Approved as drafted without an item-by-item review; sections are revisited when the milestone that needs them is planned, and open TBDs stay open decisions. Revision 1.1 adds project components (PRD OD-007), approved as drafted by @Bankole2000 on 2026-11-25. Revision 1.2 records the Vuetify 4 decision (OD-008); its review is pending. Revision 1.3 links every requirement to the approved features in FEATURES.md (reviewed 2026-11-26) and adds FR-043 to FR-049 for the gap features FT-052 to FT-063; it is in review. Revision 1.4 applies the owner's review of 2026-11-26 (docs/reviews/2026-11-26-PRD.md, verdict Approved with changes): OBJ-001's period is configurable and OBJ-003 needs 2 apps; the feed refresh interval, the "not reporting" period and the batch limits (OD-002) are settings with defaults; the support window is 3 months. Revision 1.4 approved by @Bankole2000 on 2026-11-26 (docs/reviews/2026-11-26-PRD-2.md, verdict Approved with changes, with every requested change already applied).
