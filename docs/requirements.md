# Common Resources Server — Requirements & Feature Specification

## Overview

The Common Resources Server is a centralized service for data that is shared across multiple projects rather than owned by any single one. Two different kinds of "shared" are in scope, kept deliberately separate:

1. **Public / quasi-public reference data** — countries, currencies, timezones, languages, phone codes, and org-curated lists like vendors or categories. This data doesn't belong to any user; it's the same for everyone. Today every project would otherwise embed its own copy of this data, which duplicates effort and drifts out of sync when it changes.
2. **Federated personal data** — a user's identity and personal entities (contacts, vendors they've used, preferences) that could be meaningfully shared *across projects the same person uses*, if that user opts in. Today each project has its own independent `User` model with no way to recognize "this is the same person" across projects, let alone let them share data between the two.

This server exists to solve (1) now and lay the groundwork for (2) later, without forcing every project to solve either problem itself.

---

## Two-Server Architecture

Consuming projects need this data fast, and some of them need it **offline** — with no network path to this service at all. Those two constraints (speed, offline) point at two different solutions depending on the resource type, so this service is split into two servers with distinct jobs from day one:

- **Management server (NestJS)** — the source of truth. Owns the admin write API, API-key issuance/auth, and the **sync API**: versioned bulk snapshots that consuming projects pull down once and persist locally (SQLite/IndexedDB/file). This is the only server that writes.
- **Read server (Rust)** — a no-auth, read-only query API, purpose-built for speed. Serves resource types that are too large or too frequently-changing to fully mirror on every client. Never writes.

This split exists because not every resource type fits the same access pattern:

| Resource type shape | Access pattern | Served by |
|---|---|---|
| Small, rarely changes (countries, currencies, timezones, languages) | Client fetches the full set once, persists locally, reads offline forever after. Re-syncs only on version bump. | NestJS sync API |
| Large or frequently-changing (e.g. a big vendor catalog, paginated/searchable lists) | Too large or too volatile to fully mirror client-side — queried live, online only. Needs to be fast since it's on the hot path of every request. | Rust read API |

A consuming project therefore talks to **both** servers depending on what it's asking for: sync-and-cache small datasets from NestJS at startup/on a schedule, and query the Rust API live for anything that doesn't fit fully on the client.

### How the two servers stay in sync

They share one Postgres database, each with its own independent connection string — there is no custom sync pipeline (no pub/sub, no webhook, no queue) between them. NestJS writes through its connection; Rust reads through its own. Consistency is immediate because there's only one copy of the data — this was chosen over event-driven push because it's simpler to build and operate while still meeting the near-instant freshness requirement, and "independently deployable" only required that the two services remain separate processes that can scale/release independently, not that they avoid all shared infrastructure. The only real requirement this places on deployment is that both services can open a network connection to the same Postgres instance, wherever it's hosted.

Rust should still keep its own lightweight in-process cache or connection pool tuned for its read patterns — sharing a database doesn't mean every request should necessarily hit it fresh if a short in-memory cache in front of the DB gets latency down further without sacrificing the near-instant freshness bar.

---

# Phase 1 — Minimum Viable Product (MVP)

Scope: **public and org reference data only.** No user identity, no federation. Read-heavy, low-risk, immediately useful to any project that needs a list of countries or currencies.

### 1. Resource Type Registry

The system shall support multiple distinct "resource types" (countries, currencies, timezones, vendors, categories, etc.) under one service, not one hardcoded schema.

- Each resource type has its own schema (fields vary: a currency has a code/symbol/decimal-places; a vendor has a name/contact/category).
- Each resource type is classified as **sync** (small, fully mirrorable, served by the NestJS sync API) or **live** (large/volatile, served by the Rust read API). This classification is a property of the resource type, decided when it's registered.
- New resource types can be added without redesigning the service — this is the core extensibility requirement for Phase 1.

---

### 2. Seeded Reference Data

The system shall ship with pre-populated, standard reference datasets — all classified as **sync** type:

- Countries (ISO 3166) — name, ISO alpha-2/alpha-3 codes, calling code, region
- Currencies (ISO 4217) — code, name, symbol, decimal precision
- Timezones (IANA) — identifier, UTC offset, display name
- Languages (ISO 639) — code, name, native name

These are seeded once and rarely change; updates are an administrative/deploy-time action, not a runtime one.

---

### 3. Org-Curated Resource Lists

Beyond standard datasets, the system shall support custom lists that you define and maintain yourself:

- Vendors/suppliers
- Categories/tags
- Any other flat reference list a project needs

These are managed the same way as standard datasets (same CRUD, same API shape) but the data itself is yours, not sourced from an external standard. Whether a given list is classified **sync** or **live** depends on its size/volatility — a short curated category list is sync; a large, growing vendor catalog is live.

---

### 4. Sync API (NestJS)

For resource types classified **sync**, the management server shall expose an endpoint for consuming projects to pull the full current dataset and persist it locally:

- Fetch the complete set of items for a resource type, plus a version identifier
- Fetch only what changed since a previously-seen version (delta sync), where practical
- Consuming projects are expected to call this once at startup or on a schedule, store the result locally (SQLite/IndexedDB/file), and read from that local copy thereafter — online or offline
- No live per-lookup network round-trip is expected for sync-type resources once a client has synced

---

### 4a. Live Read API (Rust)

For resource types classified **live** (too large or too volatile to fully mirror on-device), a separate, no-auth, read-only Rust service shall expose:

- List items of a resource type, with pagination
- Get a single item by ID or code
- Filter/search within a resource type

This service reads from a store the management server keeps up to date; it never writes. It has no auth because it's the hot path optimized purely for latency — access control, if ever needed here, happens at the network/infrastructure layer (e.g. only reachable from known consuming services), not per-request.

---

### 5. Admin Write API

A separate, authenticated API surface for managing resource data:

- Create/update/delete org-curated resources (vendors, categories, etc.)
- Re-seed or patch standard datasets when upstream standards change (e.g. a new currency, a country name change)

Write access is restricted to admins of the Common Resources Server itself — consuming projects never write through this API, only read.

---

### 6. Caching Strategy

- **Sync-type resources**: caching happens on the client, by design — once synced, a consuming project reads its local copy and doesn't call the server again until checking for a new version. The management server still sets HTTP caching headers on the sync endpoint as a courtesy, but the primary caching strategy *is* the client-side persistence itself.
- **Live-type resources**: the Rust read API is the one that needs to be fast on every call, since these can't be fully cached client-side. It queries Postgres directly via its own `sqlx` connection (see "How the two servers stay in sync" above) and may add a short-lived in-process cache in front of that if per-request DB latency needs shaving further — but the database itself, not a separately-maintained store, is always the source of truth it reads from.

---

### 7. API Key Access

Each consuming project shall authenticate its requests to the **management server** (admin API, sync API) with an API key, primarily for:

- Rate limiting / usage tracking per project
- Ability to revoke a specific project's access if needed

This does **not** imply user-level auth in Phase 1 — the key identifies the *project*, not a person. The Rust read API is intentionally unauthenticated (see 4a) — it is not gated by this key.

---

### 8. Admin UI

A minimal frontend for managing resource data:

- Browse all resource types and their contents
- CRUD for org-curated lists (vendors, categories)
- View/manage per-project API keys

No end-user-facing UI in Phase 1 — this is an internal tool.

---

# Phase 2 — Federated Personal Data (Opt-In)

Scope: introduce shared user identity and let participating projects reference/share personal data across each other, strictly opt-in per user and per project.

### 9. Shared Identity

Provide a way to recognize that the "user" in Project A and the "user" in Project B are the same person — without forcing every project to migrate off its own `User` table.

- Each project keeps its own local `User` model (as today).
- The Common Resources Server holds a federated identity record that links local user records across projects via a shared identifier.
- Linking is **opt-in**: a user must explicitly connect their account in Project A to their account in Project B (e.g. via an account-linking flow), not an automatic match on email.

---

### 10. Cross-Project Personal Entities

Once identity is linked, allow specific personal data types to be shared across the user's connected projects:

- Contacts (a person the user knows/works with)
- Personal vendor list (distinct from the org-wide vendor list in Phase 1 — this is "vendors *I* use")
- User preferences (locale, currency, timezone — sourced from Phase 1 reference data)

Each data type is shareable independently — linking identity does not mean *all* data becomes shared by default.

---

### 11. Per-Project, Per-Data-Type Opt-In

Sharing shall be granular, not all-or-nothing:

- A user can link Project A ↔ Project B but choose to share contacts while keeping personal vendor lists private to each.
- Each project declares which shared data types it wants to *consume*; the user separately approves what it may *see*.

---

### 12. Consent & Revocation

- Users can view exactly what is shared, with which projects, at any time.
- Users can revoke a project's access to federated data, or unlink accounts entirely, without losing data in either individual project (unlinking degrades gracefully back to Phase 1 behavior — each project's local data stays intact).

---

### 13. Data Ownership Rules

Since federated data is now visible to multiple projects, ownership must be unambiguous:

- Every federated record has exactly one owning project (where it was created).
- Other linked projects can read (and, if permitted, propose changes to) it, but only the owner can delete it outright.

---

# Phase 3 — Refinement

### 14. Fine-Grained Sharing Controls

- Field-level sharing (e.g. share a contact's name but not their phone number).
- Scoped/temporary sharing (share with Project B for 30 days, then auto-revoke).

### 15. Federated Data Sync & Conflict Resolution

- If the same logical entity (e.g. a contact) is edited independently in two linked projects, define how conflicts are detected and resolved.

### 16. Audit Log for Federated Access

- Record which project accessed or modified federated data and when — necessary once personal data crosses project boundaries.

### 17. Self-Service Resource Type Definition

- Let a project define its own custom resource type through the admin UI/API instead of requiring a manual schema change in the Common Resources Server.

---

# Design Principles

## Separation of Public and Personal Data

Phase 1 (public/org reference data) and Phase 2 (federated personal data) are architecturally distinct concerns that happen to live in the same service. Phase 1 has no concept of "user"; Phase 2 introduces it deliberately and later. Do not conflate the two schemas.

## Opt-In, Never Automatic

Federation (Phase 2) never links accounts or shares data without explicit user action. No matching on email or heuristics — the user drives every connection.

## Read-Optimized, Split by Access Pattern

The overwhelming majority of traffic is read traffic. Design and cache accordingly; do not over-engineer for write throughput. But "read-optimized" means different things for different resource types — sync-type resources are optimized by getting them off the network entirely (client-side persistence), while live-type resources are optimized by making the server itself fast (the Rust read path). Don't default every resource type into the live path just because it's simpler to reason about one API — the sync path is the better answer whenever a resource type is small enough to fully mirror.

## Projects Stay Independent

No consuming project should have a hard runtime dependency on the Common Resources Server being available. If it's down, a project should degrade gracefully (fall back to a last-known-good cached copy) rather than fail outright — especially important since this same failure mode would otherwise ripple across every project in the portfolio at once.

## API-First

Every capability (read, admin write, identity linking, consent management) is available via API first; the admin UI is a thin client over that API, matching the same principle used in Portfolio Manager.

---

# Suggested Architecture (Phase 1)

```
                     Consuming Projects (Portfolio Manager, Expense Tracker, Bookkeeping, ...)
                                │                                    │
                   (API key, occasional)                    (no auth, frequent —
                                │                              hot-path reads)
                                ▼                                    ▼
                    ┌───────────────────────┐          ┌──────────────────────────┐
                    │  Management Server    │          │   Live Read Server       │
                    │  (NestJS + Prisma)    │          │   (Rust + sqlx)          │
                    │                       │          │                          │
                    │ - Resource Type       │          │ - list / get / filter    │
                    │   Registry            │          │   for "live"-classified  │
                    │ - Admin Write API     │          │   resource types only    │
                    │   (auth-gated)        │          │ - no writes, no auth     │
                    │ - Sync API            │          │ - optimized purely       │
                    │   (bulk + versioned,  │          │   for read latency       │
                    │   "sync"-classified   │          │ - optional short-lived   │
                    │   resource types)     │          │   in-process cache       │
                    │ - API key issuance    │          └────────────┬─────────────┘
                    │ - owns schema/        │                       │
                    │   migrations          │                       │
                    └───────────┬───────────┘                       │
                                │                                   │
                                │        (own connection string)    │
                                ▼                                   ▼
                    ┌─────────────────────────────────────────────────────┐
                    │                   Postgres                          │
                    │  (single source of truth — no sync pipeline needed  │
                    │   between the two services; both read/write it      │
                    │   directly through independent connections)         │
                    └─────────────────────────────────────────────────────┘

                                │
                                ▼ (from Management Server)
                       Admin UI (internal only)
```

Consuming projects call the management server's sync API once (or on a version check) for small/static resource types and persist the result locally — no further network calls needed for those, even offline. They call the Rust read API live, on every lookup, for large/volatile resource types that don't fit fully on-device. NestJS and Rust never talk to each other directly — Postgres is the only thing they share.

## Suggested Architecture (Phase 2 addition)

```
Project A ──┐                    Project B
  (local     │                     (local
   User)     ▼                      User)
             Federated Identity Link
             (opt-in, user-driven)
                       │
                       ▼
          Shared Personal Data
      (contacts, personal vendors, prefs)
        — per-type, per-project consent —
```

---

# MVP Deliverables

The initial release should include:

**Management server (NestJS)**
- Resource type registry supporting multiple schemas, with sync/live classification per type
- Seeded standard datasets: countries, currencies, timezones, languages (all sync-type)
- Org-curated resource lists (starting with vendors, categories — classified sync or live based on size)
- Sync API: full-set + versioned delta fetch for sync-type resources
- Admin write API for managing resource data
- API key issuance and per-project rate limiting
- Minimal admin UI for browsing/editing resources and managing API keys

**Live read server (Rust)**
- Read-only list/get/filter API for live-type resource types
- No auth — optimized purely for latency
- Connects directly to the same Postgres database as the management server (own connection string, no custom sync pipeline); optionally fronted by a short-lived in-process cache

---

# Future Expansion

- Federated user identity and opt-in account linking (Phase 2)
- Cross-project personal data sharing: contacts, personal vendor lists, preferences (Phase 2)
- Consent management and revocation UI (Phase 2)
- Field-level and time-scoped sharing controls (Phase 3)
- Conflict resolution for federated data sync (Phase 3)
- Federated access audit log (Phase 3)
- Self-service custom resource type definition (Phase 3)
- Client SDKs per language/framework, mirroring the Portfolio Manager SDK approach

---

# Open Questions

~~Rust ↔ NestJS data sync mechanism~~ — **resolved:** both services connect directly to the same Postgres database via their own independent connection strings. No pub/sub, webhook, or queue between them. This gives immediate consistency (one copy of the data) and satisfies independent deployability, since that requirement was about the two services remaining separate, independently releasable processes — not about avoiding all shared infrastructure. The only deployment requirement is that both can reach the same Postgres instance over the network.

~~Rust's database access pattern~~ — **resolved:** Prisma remains the sole owner of schema and migrations (NestJS side only). The Rust read server connects with `sqlx` against the same Postgres tables as a plain SQL client — no shared ORM, no generated Rust types from Prisma. The database schema is the contract between the two services; `sqlx`'s compile-time query checking guards the Rust side against that contract drifting silently.

Still need a decision before Phase 1 build goes deep:

- **Where does sync/live classification live, and can it change?** If a resource type starts as "sync" (small) and later grows too large to mirror client-side, what's the migration path for consuming projects already caching it locally?

Need a decision before Phase 2 design starts in earnest:

- Where does the federated identity record live — inside this server, or should it be its own separate identity service that this server (and others) consume?
- Does linking accounts require both projects to already have the Common Resources Server integrated, or can linking happen "centrally" (e.g. via a dedicated account page) independent of any one project?
- How does this relate to the planned SDK / Integration Layer project (#4) and Workflow Engine (#3) — is federation a capability of this server, or should cross-project data flow live in one of those instead?

---

# Goal

Deliver a working Phase 1 MVP quickly — it's a small, low-risk service that several other planned projects (Expense Tracker, Loom Online, Double-Entry Bookkeeping) will want on day one for currency and country data. Treat Phase 2 federation as a deliberate, separately-scoped effort once at least one or two of those consuming projects exist and the real cross-project sharing needs are concrete rather than speculative.
