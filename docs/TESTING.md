# Testing and Acceptance

Status: Draft | Owner: {{owner}} | Version: 0.1 | Last updated: {{YYYY-MM-DD}}
References: PRD.md, TECHNICAL.md

## Strategy
Test layers per app:

| App | Unit | Integration | End-to-end | Tools |
|---|---|---|---|---|
| {{web}} | {{scope}} | {{scope}} | {{scope}} | {{tools}} |
| {{api}} | {{scope}} | {{scope, e.g. against a real test database}} | — | {{tools}} |
| {{mobile}} | {{scope}} | {{scope}} | {{scope, devices/simulators}} | {{tools}} |
| {{desktop}} | {{scope}} | {{scope}} | {{scope, per operating system}} | {{tools}} |
| infra | {{validate/lint}} | {{plan reviewed in PR}} | — | {{tools}} |

Contract tests: one per provider–consumer pair in the API contracts table (TECHNICAL.md), including server-to-server pairs. {{How each pair is checked against its contract package, e.g. schema validation of responses in provider tests and generated client types in consumers}}. Providers with installed-client consumers (mobile, desktop) also test against the oldest supported contract version.

Test data: isolated per environment; synthetic only.

## Acceptance tests
| ID | Requirement | Apps | Scenario | Expected result |
|---|---|---|---|---|
| TC-001 | FR-001 | {{web, api}} | {{Action and preconditions}} | {{Observable result}} |

Cover failure cases, validation, authorization and critical user journeys. Use synthetic data; never production secrets or personal data. A journey that crosses apps is tested end to end at least once.

## Validation commands
See the README [Commands](../README.md#commands) table. Record here only how and when each check runs (locally, in CI, before release).

## Definition of done
- [ ] Acceptance criteria met and linked to tests
- [ ] Automated checks passed for every changed app and every app depending on a changed package
- [ ] No unrelated changes or exposed secrets (including in client app configuration)
- [ ] Documentation and the affected apps' CHANGELOG.md updated where user-visible
- [ ] PR reviewed and merged by authorized human

## Release acceptance
{{Per app: critical journeys, security checks, performance targets, supported browsers/devices/OS versions, known limitations, human sign-off}}
