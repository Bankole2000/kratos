# AGENTS.md — {{app name, e.g. web}}

These instructions add to the repository root `AGENTS.md`; they never relax it. Read the root file first.

## What this app is
- Purpose: {{e.g. customer-facing web app}}
- Kind: {{web client | mobile client | desktop client | server/API | worker}}
- Stack: {{framework, language and version}}. Details in docs/TECHNICAL.md, Components.
- Depends on: {{other apps and packages, e.g. api, packages/api-contract}}

## Commands
Use this app's row in the README [Commands](../../README.md#commands) table. Run them from {{repo root with a filter, e.g. `pnpm --filter web test`, or from this folder}}.

## Rules for this app
- Configuration: {{Client app: "Every variable in .env.example ships to users and is public; never put secrets here." Server app: "Secrets come from the secret store named in docs/DEPLOYMENT.md and are never logged."}}
- Directories not to edit by hand: {{generated code, e.g. src/generated/, ios/Pods/}}
- {{Other app-specific conventions: state management, styling, API client usage, platform quirks}}

## Release
Versioned separately; tags are `{{app}}-vX.Y.Z`. Record user-visible changes in this folder's CHANGELOG.md. Release steps are in docs/DEPLOYMENT.md; signed builds for mobile and desktop apps run in `.github/workflows/release.yml`, never on a developer machine or in an agent session.
