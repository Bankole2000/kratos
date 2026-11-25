# AGENTS.md — packages/types

These instructions add to the repository root `AGENTS.md`; they never relax it. Read the root file first.

## What this package is
- Purpose: Rust domain types shared by the Rust parts of Platform Core, so they agree on names and wire formats (for example `ProjectStatus`, FR-003).
- Kind: shared logic
- Used by: api (`apps/api`) now; later app (`apps/app/src-tauri`) and sdk-rust (`sdks/rust`).
- Stack: Rust crate `types` in the Cargo workspace (edition and toolchain from the root `Cargo.toml` and `rust-toolchain.toml`), serde.

## Rules for this package
- Packages are not deployed or versioned on their own; they ship inside the apps that use them.
- A change here affects every consumer. Run the checks of every app listed under "Used by" (README [Commands](../../README.md#commands) table), not just this package's.
- Breaking changes (renamed or removed exports, changed shapes) must update every consumer in the same PR, or be made additive first. API contracts also follow the compatibility rules in docs/TECHNICAL.md, because released mobile and desktop apps keep using old versions.
- Never import from an app. Never put secrets or environment-specific values here.
- Generated files: none.
- Types only: no database access, HTTP, I/O or app logic. Keep dependencies small (serde); `sdks/rust` will depend on this crate. OpenAPI schema derives (utoipa) may be added in M1 if the api needs them; database code (SQLx) stays in `apps/api`.
- Serialized names are part of the API contract: enums use `snake_case` strings, and the `Display`/`FromStr` strings must match the serde strings. Renaming or removing a variant is a breaking change.
- Keep the code plain (root AGENTS.md, Rust): no custom macros or generic layers; give every public item a short doc comment.

## Commands
Run from the repo root: `cargo test -p types`, `cargo clippy -p types --all-targets -- -D warnings`. Then run the api's checks (`cargo test -p api`, `cargo clippy -p api --all-targets -- -D warnings`).
