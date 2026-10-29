# CLAUDE.md — Project conventions for AI-assisted development

## Stack
- **Nuxt 3** (file-based routing, auto-imports, server routes in `server/api/`)
- **Vuetify 4** (component library, theme, layout system)
- **Pinia** (stores in `stores/`)
- **VueUse** (utility composables)

## Layout system — critical
- There is **one** `<v-app>` root in `app.vue`. Never add another `<v-app>` anywhere.
- Layout files (`layouts/*.vue`) use a plain `<div>` as their root — not `<v-app>`.
- `v-app-bar`, `v-navigation-drawer`, and `v-main` register themselves with the nearest `<v-app>` ancestor. Nesting breaks sticky positioning.
- `scroll-behavior="fixed"` on `v-app-bar` keeps the header sticky.

## Component naming
- Nuxt does **not** prepend the folder name to the component name.
  - `components/common/Foo.vue` → `<CommonFoo />`
  - `components/map/MapView.vue` → `<MapView />` ✗ wrong → `<MapView />` ✓
  - `components/global/UiProvider.vue` → `<UiProvider />`
- Client-only components (Leaflet, PDF viewer, QR code) must be wrapped in `<ClientOnly>`.

## TypeScript patterns
- Do **not** use `generic="T extends..."` on `<script setup>` — it breaks at runtime with Vite. Use `any[]` instead.
- Vuetify composables (`useDisplay`, `useTheme`) need explicit imports: `import { useDisplay } from 'vuetify'`.
- Change Vuetify theme via `vuetifyTheme.change(name)`, not `vuetifyTheme.global.name.value = name`.

## Preventing lint errors — rules for AI-assisted code generation

### Array index access
- `noUncheckedIndexedAccess` is effectively active — every `array[i]` is `T | undefined`.
- Use `!` when the index is guaranteed valid by surrounding logic: `items[0]!`
- Use a guard variable when the truthiness matters: `const x = arr[i]; if (x) use(x)`
- Use `as const` on literal arrays so TypeScript knows the exact length: `['a', 'b'] as const`

### Third-party type imports
- **Never assume a type's export path.** Before writing `import type { Foo } from 'some-pkg/internal/path'`, grep `node_modules` to confirm: `grep -rn "export.*Foo" node_modules/some-pkg/dist --include="*.d.ts"`
- Prefer top-level imports (`'vuetify'`, `'ofetch'`) over deep paths — internal paths change between versions.
- Known correct imports for this project:
  - `import type { SnackbarQueueMessage } from 'vuetify'` (not `SnackbarMessage` from a sub-path)
  - Fetch API `Headers` class is not indexable — use `new Headers(existing)` + `.set()` instead of casting to `Record<string, string>`

### Vuetify prop types
- Always verify prop value unions against the installed version before using them.
- `v-timeline :side` accepts `'start' | 'end'` only — `'alternating'` was removed in Vuetify 4.
- `useSeoMeta` `ogType` accepts the OG protocol spec values: `'website' | 'article' | 'book' | 'profile' | 'music.song' | 'music.album' | 'music.playlist' | 'music.radio_status' | 'video.movie' | 'video.episode' | 'video.tv_show' | 'video.other'`

### After generating files
- Run `npx vue-tsc --noEmit` after generating any new file or making significant edits.
- Fix all errors before moving on — accumulated type errors compound quickly.

## Slot scope in v-for + Vuetify components
- Vuetify components that use internal slots (`v-list-item`, `v-card`, `v-chip`) break `v-for` slot scope when item data is passed as props.
- Fix: use plain HTML + Vuetify utility classes inside the slot instead of Vuetify component props.
- Example: use `<p class="text-body-2">{{ item.label }}</p>` not `<v-list-item :title="item.label" />`.

## Code snippets in templates
- Add `v-pre` to `<pre>` tags containing `{{ }}` expressions to prevent Vue from evaluating them.

## Asset conventions
- Videos → `public/assets/video/{landscape,vertical,square}/`
- Audio → `public/assets/audio/`
- Images → `public/assets/images/`
- PDFs → `public/assets/documents/`
- Reference in templates as `/assets/...` (no `/public` prefix).

## Auth middleware
- Auth is commented out by default (template mode). To protect a page:
  ```ts
  definePageMeta({ middleware: 'auth' })
  ```
- The middleware is in `middleware/auth.ts` — uncomment the logic there too.

## SEO
- Use `useSeo({ title, description, image })` at the top of every page `<script setup>`.
- Configured in `composables/useSeo.ts` — update `SITE_NAME` and `DEFAULT_IMAGE` there.

## Environment / config
- Typed config helpers live in `config/app.ts` — use `useAppConfig()` instead of calling `useRuntimeConfig()` directly.
- Feature flags go in `useFeatureFlags()` in the same file.
- All env vars are documented in `.env.example`.

## API error handling
- Global 401/403/5xx handling is wired in `app.vue` via `useApiInterceptor()`.
- 401 → clears auth tokens + redirects to login.
- 403 → error toast.
- 5xx → error toast.

## PWA
- Configured in `nuxt.config.ts` under `pwa:`.
- Service worker is **disabled in dev** (`devOptions.enabled: false`) to avoid cache confusion.
- Replace placeholder icons in `public/icons/` with real 192×192 and 512×512 PNGs before shipping.

## Module-level reactive state
- `useNotifications`, `useCommandPalette`, `usePageTransition` use module-level `ref()` for shared state across components without Pinia. This is intentional — don't move them to Pinia stores.

## DnD (drag and drop)
- Uses the HTML5 DnD API — no third-party packages.
- `CommonDragList` for sortable lists, `CommonKanban` for board-style columns.

## No comments policy
- Only add a comment when the WHY is non-obvious (hidden constraint, workaround, subtle invariant).
- Never describe WHAT the code does — well-named identifiers do that.
