# Testing and Acceptance

Status: Approved | Owner: @Bankole2000 | Version: 1.1 | Last updated: 2026-11-25
References: PRD.md, TECHNICAL.md

## Strategy
Test layers per app:

| App | Unit | Integration | End-to-end | Tools |
|---|---|---|---|---|
| api | Pure logic: burn calculation, scope checks, key generation and hashing, validation | Every endpoint against a real Postgres test database, one fresh database per test | — (covered by web E2E) | `cargo test`, `#[sqlx::test]`, `cargo clippy` |
| web | — (screens are tested in packages/ui) | Nuxt pages render with a mocked API client | Critical journeys in a browser against a running api and test database | Vitest, Playwright |
| app | Rust commands in `src-tauri` | Shared screens are tested in packages/ui | Smoke test of the built desktop app on Windows and Linux; manual check on macOS, Android and iOS before each release | `cargo test`, WebdriverIO with `tauri-driver` (TBD) |
| packages/ui | Components and composables | Screens with a mocked API client, at 360 px and desktop widths | — | Vitest, Vue Test Utils |
| packages/api-client-ts | — | Generated client compiles against the committed spec | — | `tsc` |
| sdk-ts, sdk-dart, sdk-rust | Queue, batching, backoff, sampling, offline cap | The shared conformance suite against a mock server and against a real api | — | Vitest, `dart test`, `cargo test` |
| infra | TBD (ADR-002) | TBD | — | TBD |

Contract tests: there is one provider (api) and one contract (`openapi/openapi.json`).
- api tests validate responses against the generated spec.
- CI regenerates the spec, the TypeScript client and the SQLx query data and fails if they differ from what is committed.
- CI compares the spec with the default branch and fails on a breaking change unless the PR is labelled `impact:breaking` (TECHNICAL.md, API compatibility).
- SDKs and the app are tested against the oldest supported contract version once a support window exists.

SDK conformance: one written list of scenarios, derived from the SDK specification (platform-core.md section 6), that every SDK implements in its own test framework: batching, retry with backoff, offline queue cap, never throwing, sampling and disabling, client event IDs, reference data caching and refresh, and the `sdk` identifier.

Test data: isolated per environment; synthetic only. Reference data tests use the real seed files.

## Acceptance tests
| ID | Requirement | Apps | Scenario | Expected result |
|---|---|---|---|---|
| TC-000 | M0 | all | Fresh clone, follow README setup, run the "All apps" checks and start api, web and app | All checks pass; web and the desktop app show the status screen reporting the api as healthy |
| TC-001 | FR-001 | api, web | Create a project with every field; then create another with the same slug | The first appears with every field; the second is rejected with `slug_taken` |
| TC-002 | FR-002 | api, web | Edit each field of a project and reload | New values shown; audit entry recorded |
| TC-003 | FR-003 | api | Set status to each of the five values, then to `done` | The five are accepted; `done` is rejected with a validation error |
| TC-004 | FR-004 | api, web | Archive a project with links, costs and keys; toggle "show archived"; unarchive | Hidden by default, shown with the toggle, all related data intact; no delete endpoint exists |
| TC-005 | FR-005 | api, web | Add a link of each type; add one with an invalid URL; edit and remove a link | Valid links saved with type and label; invalid URL rejected |
| TC-006 | FR-006 | api, web, app | Reorder links in web, then open the project in app | Same order in both |
| TC-007 | FR-007 | api, web | Log a cost with every field, with and without an end date | Shown with every field as entered |
| TC-008 | FR-008 | api | Project with 10/month, 120/year and 50 one-off; plus a monthly cost that ended last month | Burn 20, one-off 50; the ended cost is excluded |
| TC-009 | FR-009 | api, web | Two projects with burn 20 and 30 in the display currency | Total burn 50 |
| TC-010 | FR-010 | api | A cost in a non-display currency with a known stored rate | Converted amount equals amount × rate, with the rate date shown |
| TC-011 | FR-011 | api, web | Create keys with each preset and one with individually picked scopes | Each key has exactly the expected scopes and environment |
| TC-012 | FR-012 | api | Create a key; list keys; fetch the key by ID; inspect the database | Full key returned only in the create response; list shows prefix only; database holds only the hash |
| TC-013 | FR-013 | api | Use a key after its expiry date | 401 with `credential_expired` |
| TC-014 | FR-014 | api, web | Use a key, check "last used", revoke it, use it again | "Last used" updated; after revoking, 401 with `credential_revoked` |
| TC-015 | FR-015 | api, web, app | Sign in with correct, then wrong password, then wrong email; sign out | Correct opens the dashboard; both wrong cases show the same error; signed-out session is rejected |
| TC-016 | FR-016 | api | PAT with `projects:read` lists projects across two projects, then tries to edit one | List succeeds for both projects; edit gets 403 `missing_scope` |
| TC-017 | FR-017 | api | Perform each kind of write with a key, a PAT and an admin session | Each write has an audit entry with actor, actor kind, action, target and time |
| TC-018 | FR-018 | api, web | View a project's audit trail and filter by one actor | Newest first; filter shows only that actor |
| TC-019 | FR-019 | api | Run the seed on an empty database | Each dataset holds the full standard list (count matches the source) |
| TC-020 | FR-020 | api | List, get by code and search each dataset with a publishable key; get an unknown code; call with no key | Results returned; unknown code 404 `not_found`; no key 401 |
| TC-021 | FR-021 | api | Fetch a dataset, then repeat with `If-None-Match` set to the returned ETag | Second response is 304 with no body |
| TC-022 | FR-022 | api, web | Edit a reference entry, then fetch it with the old ETag | Version increased; new value returned with a new ETag (200, not 304) |
| TC-023 | FR-023 | api | Send a batch with one event of each type; send a batch over the maximum | Every event stored against the key's project; oversized batch rejected with 413 |
| TC-024 | FR-024 | api, sdk-ts | Send the same batch twice | Each event stored once; second response reports duplicates |
| TC-025 | FR-025 | api | Exceed the rate limit with key A, then call with key B | Key A gets 429 with `Retry-After`; key B succeeds |
| TC-026 | FR-026 | api | Run the retention job with events older and newer than the retention period | Older events removed or rolled up; newer kept |
| TC-027 | FR-027 | api, web | Send events while the feed is open; filter by `error` | New events appear without reload; filter shows only errors |
| TC-028 | FR-028 | api, web | Seed known event counts across 30 days | Chart totals for 7 and 30 days match |
| TC-029 | FR-029 | api, web | Seed revenue, errors and pings; stop pinging past the threshold | Values match; project marked "not reporting" |
| TC-030 | FR-030 | api, web | Three projects, one archived | Two listed with status, burn and last activity |
| TC-031 | FR-031 | sdk-ts | Run the conformance suite in Node and in a browser | All scenarios pass |
| TC-032 | FR-032 | sdk-dart | Run the conformance suite in a Flutter test app | All scenarios pass |
| TC-033 | FR-033 | sdk-rust | Run the conformance suite | All scenarios pass |
| TC-034 | FR-034 | api, web | Use the dashboard for a few minutes | Platform Core's own project shows the resulting events |
| TC-035 | FR-035, NFR-007 | web, app | Run the critical journeys (FLOW-001, 002, 006, 008) at 360 px and desktop width, and in the desktop and mobile app | Every step completes with no clipped or unreachable controls |
| TC-036 | NFR-001 | api | Trigger a 400, 401, 403, 404 and 500 | Each body has code, message and request ID; the ID appears in the logs; the 500 reveals no internals |
| TC-037 | NFR-004 | api | Create, use and revoke keys and sign in, then search the logs | No full key, token or password appears; keys appear by prefix only |
| TC-038 | NFR-006 | sdk-ts, sdk-dart | Point the SDK at an unreachable server and call every method; fill the offline queue past its cap | No exceptions reach the app; the main thread is not blocked; the queue stays at its cap |
| TC-039 | FR-036 | api, web | Add a component of each kind; add a second with the same slug in the same project, then in another project | Each appears with every field; the duplicate in the same project gets 409 `component_slug_taken`; the other project accepts it |
| TC-040 | FR-037 | api, web | Edit a component; retire one that has links, costs, a key and events; toggle "show retired"; restore it | Edits shown and audited; hidden by default, shown with the toggle, all related data intact; no delete endpoint exists |
| TC-041 | FR-038 | api, web | Tag a link with a component; filter by it; try to tag a link with another project's component | Tag shown; filter shows only that component's links; the foreign component is rejected with a validation error |
| TC-042 | FR-039 | api | Project with costs 10/month (tagged server), 120/year (untagged) and 50 one-off (tagged web) | Burn 20 and one-off 50 as before tagging; server subtotal 10/month; web subtotal one-off 50 |
| TC-043 | FR-040 | api | Send events with a key tied to component A, then with a project-wide key; try to create a key for another project's component | First events stored with component A, second with none; the foreign component is rejected |
| TC-044 | FR-041 | api, web | Seed events and pings for components A and B; stop B's pings past the threshold; filter metrics by A | Every figure counts only A's events; B is marked not reporting and A is not |
| TC-045 | FR-042 | api, sdk-ts | Send events from the SDK in Node and in a browser, and one raw event with no platform; filter the feed by `web` | Stored as `server`, `web` and none; the filter shows only the browser event |

Cover failure cases, validation, authorization and critical user journeys. Use synthetic data; never production secrets or personal data. A journey that crosses apps is tested end to end at least once.

## Validation commands
See the README [Commands](../README.md#commands) table. Unit, integration and contract checks run locally before a PR and in CI on every PR, for changed apps only. Web E2E runs in CI on every PR that changes api, web or packages/ui. The desktop smoke test runs in CI on Linux and Windows; macOS, Android and iOS are checked by hand before each app release.

## Definition of done
- [ ] Acceptance criteria met and linked to tests
- [ ] Automated checks passed for every changed app and every app depending on a changed package
- [ ] Generated files (OpenAPI spec, TypeScript client, SQLx query data) regenerated and committed
- [ ] No unrelated changes or exposed secrets (including in client app configuration)
- [ ] Documentation and the affected apps' CHANGELOG.md updated where user-visible
- [ ] PR reviewed and merged by authorized human

## Release acceptance
- **api:** TC-036 and TC-037 pass; migrations run on a copy of production data; NFR-002 and NFR-003 targets met (TBD); backup restore tested.
- **web:** critical journeys pass in current Chrome, Edge, Firefox and Safari, at 360 px and desktop width.
- **app:** critical journeys pass on Windows, macOS and Linux and on one Android and one iOS device at the minimum supported versions (TBD); builds are signed (and notarized on macOS).
- **SDKs:** conformance suite passes; README examples run as written.
- Known limitations listed in the release notes. Human sign-off: @Bankole2000.

## Approval
Approved by @Bankole2000 on 2026-11-25, revision 1.0, to start building. Approved as drafted without an item-by-item review; sections are revisited when the milestone that needs them is planned, and open TBDs stay open decisions. Revision 1.1 adds project components (PRD OD-007), approved as drafted by @Bankole2000 on 2026-11-25.
