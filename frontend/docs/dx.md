# Developer Experience

## TypeScript

`tsconfig.json` extends Nuxt's generated config and adds:

| Option | Purpose |
|--------|---------|
| `strict` | Enables all strict checks (nullability, implicit any, etc.) |
| `noUnusedLocals` | Errors on declared but unused variables |
| `noUnusedParameters` | Errors on unused function parameters |
| `noFallthroughCasesInSwitch` | Prevents accidental switch fallthrough |
| `forceConsistentCasingInFileNames` | Prevents case-sensitivity bugs across OSes |

Nuxt auto-generates types for pages, layouts, components, composables, and plugins — no manual type registration needed.

## VS Code

### Settings (`.vscode/settings.json`)

- Format on save using Volar (Vue LSP)
- Use the workspace TypeScript version (matches `node_modules/typescript`)
- Volar inlay hints for missing props
- `.vue` files associated with the Vue language

### Recommended Extensions (`.vscode/extensions.json`)

| Extension | Purpose |
|-----------|---------|
| `Vue.volar` | Vue 3 language support, TypeScript integration |
| `dbaeumer.vscode-eslint` | ESLint inline errors |
| `streetsidesoftware.code-spell-checker` | Spell checking in code and comments |
| `mikestead.dotenv` | `.env` file syntax highlighting |
| `PKief.material-icon-theme` | File icons matching the project structure |
| `antfu.iconify` | MDI icon previews inline in the editor |

When you open the project VS Code will prompt to install these if missing.

---

## Component Catalogue

An interactive reference for every UI pattern in the template. Available at `/catalogue` in development.

### Sections

| Route | Contents |
|-------|---------|
| `/catalogue` | Overview grid with links to all sections |
| `/catalogue/typography` | Type scale, color utilities, font weights |
| `/catalogue/components` | Buttons (all variants/sizes), chips, avatars, badges, cards |
| `/catalogue/forms` | Text fields, textarea, selects, checkboxes, switches, radio, sliders |
| `/catalogue/feedback` | All toast types, all positions (interactive), loading overlay, confirm dialogs |
| `/catalogue/data-display` | Stat cards, sparkline types, activity list, data table |
| `/catalogue/layouts` | All four layouts with feature lists and usage code |

### Key properties

- **No extra packages** — built entirely with Nuxt pages and what's already installed
- **Real composables** — the Feedback section uses the actual `useToast`, `useLoader`, `useConfirm` — not mocks
- **Theme aware** — dark mode toggle in the catalogue header works immediately
- **Dev only** — a catalogue icon appears in the app bar only when `NODE_ENV !== 'production'`

### Accessing it

The catalogue icon (`mdi-puzzle-outline`) appears in the top-right app bar during development. Click it or navigate directly to `/catalogue`.

The catalogue uses its own `layouts/catalogue.vue` — it does not require auth and does not use any of the app layouts.
