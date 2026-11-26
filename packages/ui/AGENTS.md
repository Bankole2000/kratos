# AGENTS.md — packages/ui

These instructions add to the repository root `AGENTS.md`; they never relax it. Read the root file first.

## What this package is
- Purpose: every screen, component and composable of the dashboard, written once for web and app (principle 18, ADR-006), plus the theme tokens and the configured api client.
- Kind: UI components
- Used by: web (`apps/web`, Nuxt 4 with SSR) and app (`apps/app`, Vue + Vite inside Tauri 2).
- Stack: Vue 3 + Vuetify 4 (PRD OD-008), TypeScript (strict, ESM), icons from `@mdi/js` (SVG, no icon font), the api client from `api-client-ts`. Consumers import the TypeScript and `.vue` source directly (`exports` points at `src/index.ts`); there is no build step, because Nuxt and Vite compile it themselves. Tests use Vitest with happy-dom and `@vue/test-utils`.

## Public API
Import only from `'ui'` (`src/index.ts`), never from files inside the package.
- `createPlatformUi({ apiBaseUrl, ssr?, fetch? })`: Vue plugin. Installs Vuetify (all components and directives, light and dark themes, default theme `system` so it follows the OS setting, `@mdi/js` icon set), imports Vuetify's CSS, and provides an `ApiClient` for `apiBaseUrl`. Nuxt passes `ssr: true`; the Tauri app passes `false`.
- `useApiClient()`: the provided `ApiClient`; throws if the plugin is not installed.
- `<AppShell>`: the layout (it renders `v-app`). A side navigation rail at 600 px and wider, a bottom navigation bar below. Props: `items` (default `defaultNavItems`: Portfolio, Reference data, Tokens, Settings), `title`; `v-model` is the active item's `value`. The default slot is the page content.
- `<StatusScreen>`: calls `GET /health` on mount (client side only) and shows loading, healthy, unhealthy (degraded or an error response) or offline, with the api version and a Retry button.
- Also exported: `apiClientKey`, `defaultNavItems`, `NavItem`, `lightTheme`, `darkTheme`, `narrowBreakpoint`, `PlatformUiOptions`, `HealthState`.

## Rules for this package
- Packages are not deployed or versioned on their own; they ship inside the apps that use them.
- A change here affects every consumer. Run the checks of every app listed under "Used by" (README [Commands](../../README.md#commands) table), not just this package's.
- Breaking changes (renamed or removed exports, changed shapes) must update every consumer in the same PR, or be made additive first. API contracts also follow the compatibility rules in docs/TECHNICAL.md, because released mobile and desktop apps keep using old versions.
- Never import from an app. Never put secrets or environment-specific values here: the api URL comes from the host app's public configuration through `createPlatformUi`.
- Generated files: none.
- No SSR assumptions (principle 19): no `window`, `document` or `localStorage` at module top level or in `setup`; browser-only work goes in `onMounted` or event handlers. Nothing Nuxt- or Tauri-specific belongs here.
- Screens are written once and look the same on every platform. Design at 360 px wide first (NFR-007); nothing may scroll sideways at that width.
- Theme tokens (colours now; spacing and typography when they are decided) live in `src/theme.ts`. Components use theme colours (`color="primary"`, `bg-surface`), never hard-coded colours.
- Icons come from `@mdi/js` and are passed as SVG paths (`:icon="mdiKeyVariant"`); never add an icon font.
- Accessibility (DESIGN.md): every action is reachable by keyboard, navigation marks the current item with `aria-current`, icon-only controls have an `aria-label`, and status changes are announced (`role="status"`).
- happy-dom does no layout, so tests cannot measure overflow. Test the breakpoint logic and the styles that prevent overflow, and ask the owner to check real layouts in a browser at 360 px (agents don't run browser checks; see "Working with the owner" in the root AGENTS.md).

## Commands
Run from the repo root: `pnpm --filter ui typecheck` (vue-tsc), `pnpm --filter ui test` (Vitest). No package linter yet; Prettier runs from the root (`pnpm lint`).
