# Features

Status: Approved | Owner: @Bankole2000 | Version: 0.4 | Last updated: 2026-11-26
References: PRD.md (requirements FR-, business rules BR-), platform-core.md section 5 (feature areas F1 to F22), ROADMAP.md (milestones)

## How this file works
This file is the list of everything the product lets someone do. It feeds the PRD and the other documents: when it changes, the PRD requirements, TECHNICAL, TESTING and ROADMAP are updated to match, and they refer back to these IDs.

1. **Lists first.** Users, actions, resources and surfaces are short lists with stable IDs. Every feature is built from them, so the same thing always has the same name.
2. **A feature is one sentence:** *user* + *action* + *resource*, with a *scope* where it matters ("own project only"), on one or more *surfaces*. Its *outcome* is what the user sees when it worked; it becomes the acceptance criterion.
3. **Journeys** group features in the order a user meets them. Milestones are cut from journeys, so each milestone delivers whole journeys end to end.
4. **Status** records the decision only: `proposed`, `approved`, `deferred` or `out-of-scope`. Whether a feature is built is tracked in GitHub through its tasks, not here.
5. **Effective priority** is the lower of the feature's priority and its surface's priority (a Must feature on a Should surface is a Should there).
6. **IDs are stable:** never renumber or reuse them. Mark removed items `out-of-scope` instead of deleting them. `FT-` is used for features because `F1` to `F22` are already the feature areas in platform-core.md.
7. Only humans approve. Agents add new ideas as `proposed` and never change a status.
8. **Adding features:** open this file in `tools/doc-reviewer.html` and use "+ Add". "Build from lists" picks the user, action, resource, surfaces and journey from dropdowns ("+ New" adds a list item on the spot); "Describe in words" takes a sentence that an agent turns into a row.
9. **Generated columns:** the Requirements column (from the PRD), the journeys' Milestone column (from ROADMAP.md) and the coverage matrix are written by `node scripts/check-features.mjs --write`. Don't edit them by hand; CI fails when they are out of date.

## Users
| ID | Name | Kind | Description | Priority |
|---|---|---|---|---|
| U-01 | Admin | person | The owner, the only user in the MVP. Uses the dashboard with an admin session. | Must |
| U-02 | Consumer app | app | One of the owner's apps, calling the api or an SDK with a project key (publishable or secret). | Must |
| U-03 | Script or agent | agent | Acts for the owner with a personal access token, or for one project with an agent-preset key. | Must |
| U-04 | System | system | Platform Core itself: checks on every request, calculations and scheduled jobs. | Must |
| U-05 | Visitor | person | Anyone viewing a public status page (F17). | Deferred |

## Actions
| ID | Verb | Meaning | Writes data |
|---|---|---|---|
| A-01 | creates | Adds a new record. | yes |
| A-02 | views | Lists records or opens one. | no |
| A-03 | edits | Changes fields of an existing record, including its status. | yes |
| A-04 | archives | Hides a record without deleting it; can be undone. | yes |
| A-05 | removes | Deletes a record permanently, only where BR-007 allows it. | yes |
| A-06 | reorders | Changes the order records are shown in. | yes |
| A-07 | tags | Links a record to one component of the same project. | yes |
| A-08 | filters | Narrows a list or figures to records matching a field. | no |
| A-09 | searches | Finds entries by text. | no |
| A-10 | revokes | Makes a credential unusable at once. | yes |
| A-11 | signs in | Starts a session. | yes |
| A-12 | signs out | Ends a session. | yes |
| A-13 | sends | Submits records to be stored. | yes |
| A-14 | rejects | Refuses a request that breaks a rule, with a stable error code. | no |
| A-15 | limits | Refuses requests past a rate, with `Retry-After`. | no |
| A-16 | records | Stores a record as a side effect of another action. | yes |
| A-17 | seeds | Loads data from a standard source. | yes |
| A-18 | calculates | Derives a figure from stored data. | no |
| A-19 | converts | Expresses an amount in another currency. | no |
| A-20 | prunes | Removes or rolls up old data on a schedule. | yes |
| A-21 | alerts | Notifies the admin about a condition. | no |

## Resources
| ID | Name | Kind | Belongs to | Description |
|---|---|---|---|---|
| R-01 | Project | stored | — | A tracked project: name, slug, description, status, stack tags, live URL, notes. |
| R-02 | Component | stored | R-01 | A separately built part of one project (web, mobile, server …); one level only. |
| R-03 | Link | stored | R-01 | A typed link (repo, docs, CI …) with a label and URL, ordered. |
| R-04 | Cost | stored | R-01 | A cost with vendor, amount, currency, billing cycle and dates. |
| R-05 | API key | stored | R-01 | A project key: environment, scopes, optional component, expiry. |
| R-06 | Personal access token | stored | U-01 | A token that acts for its user across projects, within its scopes. |
| R-07 | Admin session | stored | U-01 | The dashboard sign-in, separate from keys and tokens. |
| R-08 | Audit entry | stored | R-01 | Who (actor and kind) did what to which target, and when. |
| R-09 | Reference dataset | stored | — | Countries, currencies, phone codes, timezones or languages, with a version. |
| R-10 | Event | stored | R-01 | One metric record (`track`, `revenue`, `error`, `session`, `build`, `feedback`, `ping`). |
| R-11 | Event feed | derived | R-10 | A project's live list of events. |
| R-12 | Project metrics | derived | R-10 | Volume charts, monthly revenue, latest errors and last ping of a project. |
| R-13 | Monthly burn | derived | R-04 | A project's recurring cost per month (BR-001), plus one-off totals. |
| R-14 | Portfolio overview | derived | R-01 | All projects with status, monthly burn and last activity. |
| R-15 | Status page | derived | R-01 | A public page showing whether a project is up (F17). |
| R-16 | Admin account | stored | U-01 | The admin's sign-in details (Argon2 password hash). |

## Surfaces
Where a feature is offered: an app, an SDK, the api or a server command. Not to be confused with the PRD glossary's "platform", which is where an event's code ran (`web`, `ios` …).

| ID | Name | App or package | Description | Priority |
|---|---|---|---|---|
| S-01 | Web dashboard | apps/web | The dashboard in a browser. | Must |
| S-02 | Desktop app | apps/app | The dashboard on Windows, macOS and Linux. | Must |
| S-03 | Mobile app | apps/app | The dashboard on Android and iOS. | Must |
| S-04 | Public api | apps/api | Direct HTTP use by apps, scripts and agents. | Must |
| S-05 | TypeScript SDK | sdks/typescript | For browser and Node apps (F9). | Must |
| S-06 | Dart SDK | sdks/dart | For Flutter apps (F10). | Should |
| S-07 | Rust SDK | sdks/rust | For Rust apps (F11). | Could |
| S-08 | Python SDK | — | Only when an app needs it (F12). | Deferred |
| S-09 | MCP server | — | For AI agents, local then remote (F20, F22). | Deferred |
| S-10 | Server command line | apps/api | Commands run on the server by the admin, such as a password reset. | Must |

## Journeys
The Milestone column is generated from ROADMAP.md, where each milestone lists the journeys it delivers.

| ID | Name | Main user | Goal | Features, in order | Milestone |
|---|---|---|---|---|---|
| J-01 | Sign in | U-01 | Get into the dashboard safely. | FT-001, FT-002, FT-062, FT-063 | M1 |
| J-02 | Register a project | U-01 | Record a project, its parts and its links in one place. | FT-003, FT-004, FT-005, FT-006, FT-007, FT-008, FT-009, FT-010, FT-011, FT-012, FT-013, FT-014, FT-015, FT-056, FT-057 | M1 |
| J-03 | Give an app or agent access | U-01 | Issue credentials and stay in control of them. | FT-016, FT-017, FT-054, FT-018, FT-019, FT-020, FT-055, FT-021, FT-022, FT-023, FT-024 | M1 |
| J-04 | Trace changes | U-01 | See who changed what, and when. | FT-025, FT-026, FT-027 | M1 |
| J-05 | Use reference data | U-02 | Read shared data instead of embedding a copy. | FT-028, FT-029, FT-030, FT-031, FT-060, FT-061 | M2 |
| J-06 | Report metrics | U-02 | Send events without harming the app. | FT-032, FT-035 | M3 |
| J-07 | Watch project health | U-01 | See whether each project is up and used. | FT-036, FT-037, FT-038, FT-039, FT-040, FT-041, FT-058 | M3 |
| J-08 | Track costs | U-01 | Know what each project costs per month. | FT-042, FT-043, FT-052, FT-053, FT-044, FT-045, FT-046, FT-047, FT-048, FT-059 | M4 |
| J-10 | Keep the service healthy | U-04 | Protect the service from overload and keep stored events within their retention period. | FT-033, FT-034 | M5 |
| J-09 | Later | — | Features of later phases. | FT-049, FT-050, FT-051 | — |

## Features
Surfaces "S-01, S-02, S-03" is the dashboard everywhere.

| ID | User | Action | Resource | Scope | Surfaces | Outcome | Priority | Depends on | Journey | Requirements | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FT-001 | U-01 Admin | A-11 signs in | R-07 Admin session | — | S-01, S-02, S-03 | Correct credentials open the dashboard; wrong ones are rejected without saying which part was wrong. | Must | — | J-01 | FR-015 | approved |
| FT-002 | U-01 Admin | A-12 signs out | R-07 Admin session | own session | S-01, S-02, S-03 | The session ends and the dashboard asks for sign-in again. | Must | FT-001 | J-01 | FR-015 | approved |
| FT-003 | U-01 Admin | A-01 creates | R-01 Project | — | S-01, S-02, S-03 | The project appears in the list with every field as entered; a duplicate slug is rejected; status is one of the five allowed values. | Must | FT-001 | J-02 | FR-001, FR-003 | approved |
| FT-004 | U-01 Admin | A-02 views | R-01 Project | list and detail; archived hidden unless "show archived" is on | S-01, S-02, S-03 | Unarchived projects are listed; turning on "show archived" shows the rest. | Must | FT-003 | J-02 | FR-001, FR-004 | approved |
| FT-005 | U-01 Admin | A-03 edits | R-01 Project | every field, status limited to the allowed values | S-01, S-02, S-03 | Edited values show after reload and appear in the audit trail. | Must | FT-003 | J-02 | FR-002, FR-003 | approved |
| FT-006 | U-01 Admin | A-04 archives | R-01 Project | archive and unarchive; never delete | S-01, S-02, S-03 | The project leaves the default list and keeps its links, costs, keys and metrics. | Must | FT-003 | J-02 | FR-004 | approved |
| FT-007 | U-01 Admin | A-01 creates | R-02 Component | within one project; slug unique in that project | S-01, S-02, S-03 | The component appears in the project's list; a duplicate slug in the same project is rejected with `component_slug_taken`. | Must | FT-003 | J-02 | FR-036 | approved |
| FT-008 | U-01 Admin | A-03 edits | R-02 Component | every field, status `active` or `retired`; never delete | S-01, S-02, S-03 | Edits show after reload and are audited; a retired component keeps all its data. | Must | FT-007 | J-02 | FR-037 | approved |
| FT-009 | U-01 Admin | A-02 views | R-02 Component | retired hidden unless "show retired" is on | S-01, S-02, S-03 | Active components are listed; "show retired" shows the rest. | Must | FT-007 | J-02 | FR-037 | approved |
| FT-010 | U-01 Admin | A-01 creates | R-03 Link | type, label and URL | S-01, S-02, S-03 | The link appears on the project, grouped or tagged by type; an invalid URL is rejected. | Must | FT-003 | J-02 | FR-005 | approved |
| FT-011 | U-01 Admin | A-03 edits | R-03 Link | — | S-01, S-02, S-03 | The edited link shows after reload. | Must | FT-010 | J-02 | FR-005 | approved |
| FT-012 | U-01 Admin | A-05 removes | R-03 Link | — | S-01, S-02, S-03 | The link is gone from every client. | Must | FT-010 | J-02 | FR-005 | approved |
| FT-013 | U-01 Admin | A-06 reorders | R-03 Link | within one project | S-01, S-02, S-03 | The new order is kept after reload and on every client. | Must | FT-010 | J-02 | FR-006 | approved |
| FT-014 | U-01 Admin | A-07 tags | R-03 Link | with a component of the same project | S-01, S-02, S-03 | The tag shows on the link; a component from another project is rejected. | Must | FT-007, FT-010 | J-02 | FR-038 | approved |
| FT-015 | U-01 Admin | A-08 filters | R-03 Link | by component | S-01, S-02, S-03 | Only that component's links show; untagged links stay visible under the project. | Must | FT-014 | J-02 | FR-038 | approved |
| FT-016 | U-01 Admin | A-01 creates | R-05 API key | name, environment, scopes or preset, optional component of the same project, optional expiry | S-01, S-02, S-03 | The full key is shown once; presets give exactly the scopes in BR-002 to BR-004; the component can't be changed later. | Must | FT-003 | J-03 | FR-011, FR-012, FR-013, FR-040 | approved |
| FT-017 | U-01 Admin | A-02 views | R-05 API key | per project | S-01, S-02, S-03 | The list shows prefix, name, environment, scopes and last used, never the full key. | Must | FT-016 | J-03 | FR-012, FR-014 | approved |
| FT-018 | U-01 Admin | A-10 revokes | R-05 API key | — | S-01, S-02, S-03 | The key is rejected on its next request. | Must | FT-016 | J-03 | FR-014 | approved |
| FT-019 | U-01 Admin | A-01 creates | R-06 Personal access token | name, scopes, optional expiry | S-01, S-02, S-03 | The full token is shown once and stored only as a hash. | Must | FT-001 | J-03 | FR-012, FR-013, FR-016 | approved |
| FT-020 | U-01 Admin | A-02 views | R-06 Personal access token | own tokens | S-01, S-02, S-03 | The list shows prefix, name, scopes and last used, never the full token. | Must | FT-019 | J-03 | FR-012, FR-014 | approved |
| FT-021 | U-01 Admin | A-10 revokes | R-06 Personal access token | own tokens | S-01, S-02, S-03 | The token is rejected on its next request. | Must | FT-019 | J-03 | FR-014 | approved |
| FT-022 | U-04 System | A-14 rejects | R-05 API key | expired, revoked or missing a required scope | S-04 | The request gets 401 or 403 with a stable error code; "last used" updates only on accepted requests. | Must | FT-016 | J-03 | FR-013, FR-014 | approved |
| FT-023 | U-04 System | A-14 rejects | R-06 Personal access token | expired, revoked or missing a required scope | S-04 | The request gets 401 or 403 with a stable error code. | Must | FT-019 | J-03 | FR-013, FR-014, FR-016 | approved |
| FT-024 | U-03 Script or agent | A-02 views | R-01 Project | all projects, within the token's scopes | S-04 | A token with `projects:read` lists every project but can't change one. | Must | FT-019 | J-03 | FR-016 | approved |
| FT-025 | U-04 System | A-16 records | R-08 Audit entry | on every write | S-04 | After any create, update, archive or revoke, an entry with actor, actor kind, action, target and time exists. | Must | FT-001 | J-04 | FR-017 | approved |
| FT-026 | U-01 Admin | A-02 views | R-08 Audit entry | per project, newest first | S-01, S-02, S-03 | The project's audit view lists its entries newest first. | Must | FT-025 | J-04 | FR-018 | approved |
| FT-027 | U-01 Admin | A-08 filters | R-08 Audit entry | by actor | S-01, S-02, S-03 | Only that actor's entries show. | Must | FT-026 | J-04 | FR-018 | approved |
| FT-028 | U-04 System | A-17 seeds | R-09 Reference dataset | from ISO 3166, ISO 4217, IANA tz, ISO 639 and the phone code source (OD-003) | S-04 | Each dataset contains the full standard list. | Must | — | J-05 | FR-019 | approved |
| FT-029 | U-02 Consumer app | A-02 views | R-09 Reference dataset | list, get by code and dataset version; any valid key or token | S-04, S-05, S-06, S-07 | A known code returns the entry, an unknown one 404; a repeat request with `If-None-Match` returns 304. | Must | FT-028 | J-05 | FR-020, FR-021, FR-022 | approved |
| FT-030 | U-02 Consumer app | A-09 searches | R-09 Reference dataset | any valid key or token | S-04, S-05, S-06, S-07 | Matching entries are returned. | Must | FT-028 | J-05 | FR-020 | approved |
| FT-031 | U-01 Admin | A-03 edits | R-09 Reference dataset | entries of one dataset | S-01, S-02, S-03 | The new value is served and the dataset version is higher. | Must | FT-028 | J-05 | FR-022 | approved |
| FT-032 | U-02 Consumer app | A-13 sends | R-10 Event | batches up to the maximum size (OD-002), each event with a client ID and the platform it ran on | S-04, S-05, S-06, S-07 | Events are stored once per project and ID, against the key's project and component; an oversized batch is rejected. | Must | FT-016 | J-06 | FR-023, FR-024, FR-040, FR-042 | approved |
| FT-033 | U-04 System | A-15 limits | R-05 API key | per key and per token | S-04 | Past the limit, requests get 429 with `Retry-After`; other keys are not affected. | Must | FT-016 | J-10 | FR-025 | approved |
| FT-034 | U-04 System | A-20 prunes | R-10 Event | older than the retention period (D3) | S-04 | Old events are removed or rolled up by a scheduled job. | Should | FT-032 | J-10 | FR-026 | approved |
| FT-035 | U-02 Consumer app | A-13 sends | R-10 Event | Platform Core about itself, one component per app | S-04, S-05 | Platform Core appears in its own dashboard with live events. | Should | FT-032 | J-06 | FR-034 | approved |
| FT-036 | U-01 Admin | A-02 views | R-11 Event feed | per project, live | S-01, S-02, S-03 | New events appear without a manual reload. | Must | FT-032 | J-07 | FR-027 | approved |
| FT-037 | U-01 Admin | A-08 filters | R-11 Event feed | by event type, component and platform | S-01, S-02, S-03 | Only matching events show. | Must | FT-036 | J-07 | FR-027, FR-041, FR-042 | approved |
| FT-038 | U-01 Admin | A-02 views | R-12 Project metrics | volume charts for 7 and 30 days | S-01, S-02, S-03 | Chart totals match the stored event counts. | Must | FT-032 | J-07 | FR-028 | approved |
| FT-039 | U-01 Admin | A-02 views | R-12 Project metrics | monthly revenue, latest errors, last ping overall and per active component | S-01, S-02, S-03 | Values match the stored events; a project or component with no recent ping is marked as not reporting. | Must | FT-032 | J-07 | FR-029, FR-041 | approved |
| FT-040 | U-01 Admin | A-02 views | R-14 Portfolio overview | unarchived projects | S-01, S-02, S-03 | Every unarchived project shows its status, monthly burn and last activity. | Must | FT-003 | J-07 | FR-030 | approved |
| FT-041 | U-01 Admin | A-08 filters | R-12 Project metrics | by component | S-01, S-02, S-03 | Every figure counts only that component's events. | Must | FT-038, FT-039 | J-07 | FR-041 | approved |
| FT-042 | U-01 Admin | A-01 creates | R-04 Cost | name, vendor, amount, currency, billing cycle, start date, optional end date | S-01, S-02, S-03 | The cost appears in the project's cost list with every field as entered. | Must | FT-003 | J-08 | FR-007 | approved |
| FT-043 | U-01 Admin | A-02 views | R-04 Cost | per project | S-01, S-02, S-03 | The project's costs are listed with monthly burn and one-off totals shown separately. | Must | FT-042 | J-08 | FR-007, FR-008 | approved |
| FT-044 | U-04 System | A-18 calculates | R-13 Monthly burn | per project and in total, by BR-001 | S-04 | A 10/month cost, a 120/year cost and a 50 one-off cost give burn 20 and one-off 50. | Must | FT-042 | J-08 | FR-008, FR-009 | approved |
| FT-045 | U-04 System | A-19 converts | R-04 Cost | to the display currency (D5) | S-04 | A converted amount shows the rate date used. | Must | FT-028, FT-042 | J-08 | FR-010 | approved |
| FT-046 | U-01 Admin | A-02 views | R-13 Monthly burn | total across all projects | S-01, S-02, S-03 | The total equals the sum of each project's burn in the display currency. | Must | FT-044, FT-045 | J-08 | FR-009, FR-010 | approved |
| FT-047 | U-01 Admin | A-07 tags | R-04 Cost | with a component of the same project | S-01, S-02, S-03 | Burn and one-off totals are unchanged by tagging; a component from another project is rejected. | Must | FT-007, FT-042 | J-08 | FR-039 | approved |
| FT-048 | U-01 Admin | A-08 filters | R-04 Cost | by component, with a subtotal | S-01, S-02, S-03 | Only that component's costs show, with their subtotal. | Must | FT-047 | J-08 | FR-039 | approved |
| FT-049 | U-04 System | A-21 alerts | R-12 Project metrics | when a project stops pinging or errors spike (F19) | S-01, S-02, S-03 | The admin is notified. | Could | FT-039 | J-09 | — | deferred |
| FT-050 | U-05 Visitor | A-02 views | R-15 Status page | public projects only (F17) | S-01 | The page shows whether the project is up. | Could | FT-039 | J-09 | — | deferred |
| FT-051 | U-03 Script or agent | A-02 views | R-01 Project | through the MCP server (F20) | S-09 | The agent can list and read projects. | Could | FT-024 | J-09 | — | deferred |
| FT-052 | U-01 Admin | A-03 edits | R-04 Cost | every field, including setting or clearing the end date | S-01, S-02, S-03 | Edited values show after reload, burn is recalculated and the change is audited. | Must | FT-042 | J-08 | FR-043 | approved |
| FT-053 | U-01 Admin | A-05 removes | R-04 Cost | a cost entered by mistake | S-01, S-02, S-03 | The cost leaves the list and the burn; the audit trail keeps a record of it. | Should | FT-042 | J-08 | FR-044 | approved |
| FT-054 | U-01 Admin | A-03 edits | R-05 API key | name and expiry only; environment, scopes and component stay fixed | S-01, S-02, S-03 | The new name and expiry show in the list; past the new expiry the key is rejected. | Should | FT-016 | J-03 | FR-045 | approved |
| FT-055 | U-01 Admin | A-03 edits | R-06 Personal access token | name and expiry only; scopes stay fixed | S-01, S-02, S-03 | The new name and expiry show in the list; past the new expiry the token is rejected. | Should | FT-019 | J-03 | FR-045 | approved |
| FT-056 | U-03 Script or agent | A-03 edits | R-01 Project | within the token's or key's write scopes (D8) | S-04 | With a project write scope the edit is saved and audited with the agent as actor; without it the request gets 403. | Should | FT-024 | J-02 | FR-046 | approved |
| FT-057 | U-03 Script or agent | A-01 creates | R-03 Link | within the token's or key's write scopes (D8) | S-04 | With a link write scope the link is created and audited with the agent as actor; without it the request gets 403. | Should | FT-010, FT-024 | J-02 | FR-046 | approved |
| FT-058 | U-03 Script or agent | A-02 views | R-12 Project metrics | within the token's or key's read scopes (D8) | S-04 | The agent gets the same figures the dashboard shows. | Should | FT-024, FT-038 | J-07 | FR-046 | approved |
| FT-059 | U-03 Script or agent | A-02 views | R-04 Cost | costs and burn, within the token's or key's read scopes (D8) | S-04 | The agent gets the same costs and burn the dashboard shows. | Should | FT-024, FT-043 | J-08 | FR-046 | approved |
| FT-060 | U-01 Admin | A-01 creates | R-09 Reference dataset | a new entry in one dataset | S-01, S-02, S-03 | The entry is served and the dataset version is higher. | Should | FT-031 | J-05 | FR-047 | approved |
| FT-061 | U-01 Admin | A-04 archives | R-09 Reference dataset | one entry; never deleted, because apps may have stored its code | S-01, S-02, S-03 | The entry leaves lists and search; a request by its code still answers and marks it deprecated; the dataset version is higher. | Should | FT-031 | J-05 | FR-047 | approved |
| FT-062 | U-01 Admin | A-03 edits | R-16 Admin account | password, with the current password | S-01, S-02, S-03 | The new password works, the old one doesn't, and every other session ends. | Should | FT-001 | J-01 | FR-048 | approved |
| FT-063 | U-01 Admin | A-03 edits | R-16 Admin account | password reset without the old password, run on the server | S-10 | The command sets a new password and ends every session. | Must | — | J-01 | FR-049 | approved |

## Coverage matrix
Generated from the Features table (approved and proposed features only); don't edit it by hand. Each cell lists the actions a user can take on a resource. An empty cell is not an error, but it is worth a look.

<!-- matrix:start -->
| User \ Resource | Project | Component | Link | Cost | API key | Personal access token | Admin session | Audit entry | Reference dataset | Event | Event feed | Project metrics | Monthly burn | Portfolio overview | Admin account |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| U-01 Admin | creates, views, edits, archives | creates, edits, views | creates, edits, removes, reorders, tags, filters | creates, views, tags, filters, edits, removes | creates, views, revokes, edits | creates, views, revokes, edits | signs in, signs out | views, filters | edits, creates, archives |  | views, filters | views, filters | views | views | edits |
| U-02 Consumer app |  |  |  |  |  |  |  |  | views, searches | sends |  |  |  |  |  |
| U-03 Script or agent | views, edits |  | creates | views |  |  |  |  |  |  |  | views |  |  |  |
| U-04 System |  |  |  | converts | rejects, limits | rejects |  | records | seeds | prunes |  |  | calculates |  |  |
<!-- matrix:end -->

## Gaps found while building this list
Things the PRD doesn't say. Each needs a decision: add a feature (as `proposed`), or note that it is intentionally missing. Features added for a gap show "— (new)" under Requirements until the PRD gains a requirement for them.

- **G-01:** Costs could be created but not edited, ended or removed. Added FT-052 and FT-053.
- **G-02:** API keys and personal access tokens couldn't be renamed, and their expiry couldn't be changed. Added FT-054 and FT-055 (name and expiry only; scopes, environment and component stay fixed).
- **G-03:** Scripts and agents (U-03) had one explicit feature (FT-024). Added FT-056 to FT-059, all within scopes that D8 will define. Creating or revoking keys and tokens and changing the admin's credentials stay with the admin session (AGENTS.md).
- **G-04:** Reference data could be edited, but entries couldn't be added or removed. Added FT-060 and FT-061 (entries are archived, never deleted, because apps may have stored their codes).
- **G-05:** The admin couldn't change their password or recover the account. Added FT-062 and FT-063 (a reset command on the server, since there is no email in the MVP).
- **G-06:** Components can be listed per project but don't appear in the portfolio overview or in search. Open.

## Not features
These PRD items are not user + action + resource, so they stay in the PRD and are not listed above:
- FR-031 to FR-033 (the SDKs) are surfaces S-05 to S-07; FR-035 (the dashboard on every platform) is surfaces S-01 to S-03.
- NFR-001 to NFR-009 are quality targets that apply across features.

## Approval
Reviewed by @Bankole2000 on 2026-11-26 (docs/reviews/2026-11-26-FEATURES.md), verdict Approved with changes: every proposed feature approved; FT-049 to FT-051 stay deferred. Version 0.4 adds journey J-10 (FT-033 and FT-034 move there from J-06, so they stay in M5 as ROADMAP plans) and the generated Requirements and Milestone columns; it is in review. Version 0.4 approved by @Bankole2000 on 2026-11-26 (docs/reviews/2026-11-26-FEATURES-2.md, verdict Approved with changes; its only requests were two test features, left out at the owner's request).
