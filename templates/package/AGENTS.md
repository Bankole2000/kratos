# AGENTS.md — packages/{{package name, e.g. api-contract}}

These instructions add to the repository root `AGENTS.md`; they never relax it. Read the root file first.

## What this package is
- Purpose: {{e.g. the API contract for apps/api: OpenAPI spec and generated types}}
- Kind: {{API contract | design tokens | UI components | shared logic | config}}
- Used by: {{apps and packages that depend on it, e.g. web, android, ios, desktop, admin}}
- Stack: {{language, build/generation tooling}}

## Rules for this package
- Packages are not deployed or versioned on their own; they ship inside the apps that use them.
- A change here affects every consumer. Run the checks of every app listed under "Used by" (README [Commands](../../README.md#commands) table), not just this package's.
- Breaking changes (renamed or removed exports, changed shapes) must update every consumer in the same PR, or be made additive first. API contracts also follow the compatibility rules in docs/TECHNICAL.md, because released mobile and desktop apps keep using old versions.
- Never import from an app. Never put secrets or environment-specific values here.
- Generated files: {{which files are generated, from what, and the command; never edit them by hand}}
- {{Other package-specific conventions}}
