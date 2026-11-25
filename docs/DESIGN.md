# Product Design

Status: Approved | Owner: @Bankole2000 | Version: 1.0 | Last updated: 2026-11-25
References: PRD.md

## Platforms and navigation
- **Web** (`apps/web`): current versions of Chrome, Edge, Firefox and Safari. How much of the web app is public is open (D4); in the MVP every screen except sign-in needs a session.
- **Desktop** (`apps/app` in Tauri): Windows, macOS and Linux; minimum versions TBD (Tauri 2's WebView requirements set the floor).
- **Mobile** (`apps/app` in Tauri): Android and iOS; minimum versions TBD.

Every screen is written once in `packages/ui` and looks the same on every platform. Navigation adapts to width:
- Wide (desktop, tablet, web): a side navigation rail with Portfolio, Reference data, Tokens and Settings.
- Narrow (phones, under 600 px): a bottom navigation bar with the same four destinations.

Hierarchy:
- Portfolio (UI-002)
  - Project (UI-003), with tabs: Overview, Links, Costs, Keys, Metrics, Audit
- Reference data (UI-010)
- Personal access tokens (UI-011)
- Settings (UI-012)

## User flows
- FLOW-001 (FR-015): Admin opens any client → sign-in screen → enters email and password → portfolio overview. Failure: wrong credentials show one generic error; repeated failures are rate limited.
- FLOW-002 (FR-001, FR-002): Portfolio → New project → enters name (slug is suggested from the name and can be edited), status and other fields → Save → project overview. Failure: duplicate slug is shown on the slug field.
- FLOW-003 (FR-004): Project → Archive → confirm → project disappears from the default portfolio list, with an Undo option. Unarchive from the list with "show archived" on.
- FLOW-004 (FR-005, FR-006): Project → Links → Add link → type, label, URL → Save. Reorder by dragging, or with up and down buttons on touch screens and keyboards.
- FLOW-005 (FR-007 to FR-010): Project → Costs → Add cost → fields → Save → the project's burn and the portfolio total update. Costs in other currencies show the converted amount and rate date.
- FLOW-006 (FR-011, FR-012): Project → Keys → New key → name, environment, preset or individual scopes → Create → the full key is shown once with a Copy button and a warning that it can't be shown again → Done. A publishable preset shows a note that it's the only key safe in client apps.
- FLOW-007 (FR-014, FR-016): Keys or Tokens → Revoke on a row → confirm, naming the key → the row shows Revoked.
- FLOW-008 (FR-027 to FR-029): Portfolio → a project with recent errors → Metrics → filter the feed to `error` → open an event to see its details.
- FLOW-009 (FR-022): Reference data → choose a dataset → search → edit an entry → Save → the dataset version increases.

## Screens
| ID | Screen | Platforms | Requirements | Actions and states |
|---|---|---|---|---|
| UI-001 | Sign in | All | FR-015 | Sign in; loading; invalid credentials; rate limited; offline |
| UI-002 | Portfolio overview | All | FR-009, FR-030 | List or cards of projects with status, burn, last activity; filter by status; show archived; total monthly burn; new project; empty (no projects yet); loading; error; offline (cached data with a banner) |
| UI-003 | Project overview | All | FR-002, FR-003, FR-004, FR-029 | Edit, change status, archive; status, burn, revenue this month, latest errors, last ping (marked "not reporting" when stale); loading; error |
| UI-004 | Project form | All | FR-001, FR-002 | Create or edit; field validation; duplicate slug; saving |
| UI-005 | Links tab | All | FR-005, FR-006 | Add, edit, remove, reorder, open link; empty |
| UI-006 | Costs tab | All | FR-007, FR-008, FR-010 | Add, edit cost; burn and one-off totals; converted amounts with rate date; empty |
| UI-007 | Keys tab | All | FR-011 to FR-014 | Create key (with show-once dialog), revoke; prefix, environment, scopes, expiry, last used, revoked state; empty |
| UI-008 | Metrics tab | All | FR-027 to FR-029 | Live feed with type filter and event details; 7 and 30 day volume chart; empty (with SDK setup hint and the project's publishable key prefix); loading |
| UI-009 | Audit tab | All | FR-018 | Entries newest first; filter by actor; actor kind shown as app, person or agent; empty |
| UI-010 | Reference data | All | FR-019, FR-022 | Choose dataset, search, view and edit entries; dataset version; saving; error |
| UI-011 | Personal access tokens | All | FR-016, FR-014 | Create token (show-once dialog), revoke; scopes, expiry, last used; empty |
| UI-012 | Settings | All | FR-010, FR-015 | Display currency (D5), change password, sign out, app version |
| UI-013 | Update required | app | NFR-005 | Shown when the installed app is below the minimum supported version; links to the store or download |

## Visual guidelines
- Vuetify 3 components and theming, with light and dark themes following the system setting. Brand colours and typography TBD.
- Theme tokens (colours, spacing, typography) live in `packages/ui` and are used by both web and app; no separate design-tokens package in the MVP.
- Mobile first: every screen is designed at 360 px wide first (NFR-007). Tables become lists of cards on narrow screens.
- Money is shown with its currency code and two decimals; converted amounts are marked as converted.
- Secrets (full keys and tokens) are shown in a monospace font, only in the show-once dialog.

## Accessibility
Target TBD (proposed: WCAG 2.2 AA, NFR-008). Every action is reachable by keyboard with a visible focus indicator; every input has a label; drag-to-reorder has a keyboard and touch alternative; charts have a text or table equivalent; touch targets are at least 44 × 44 px in the app.

## References
None yet. Wireframes TBD.

## Open decisions and approval
- D4: which web pages are public (affects SSR and SEO work in `apps/web`).
- Brand colours, typography and logo.
- Minimum desktop and mobile OS versions.
Approval: Approved by @Bankole2000 on 2026-11-25, revision 1.0, to start building. Approved as drafted without an item-by-item review; sections are revisited when the milestone that needs them is planned, and open TBDs stay open decisions.
