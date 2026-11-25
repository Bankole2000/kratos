// Navigation destinations shown by AppShell (DESIGN.md, Platforms and navigation). They are
// placeholders until routing exists: the host app reacts to the selected `value`.
import { mdiCogOutline, mdiDatabaseOutline, mdiKeyVariant, mdiViewDashboardOutline } from '@mdi/js'

/** One navigation destination. */
export interface NavItem {
  /** Stable identifier, used as the `v-model` value of AppShell. */
  value: string
  /** Label shown next to or under the icon, and read by screen readers. */
  title: string
  /** An SVG path from `@mdi/js`. */
  icon: string
}

/** Portfolio, Reference data, Tokens and Settings. */
export const defaultNavItems: readonly NavItem[] = Object.freeze([
  { value: 'portfolio', title: 'Portfolio', icon: mdiViewDashboardOutline },
  { value: 'reference-data', title: 'Reference data', icon: mdiDatabaseOutline },
  { value: 'tokens', title: 'Tokens', icon: mdiKeyVariant },
  { value: 'settings', title: 'Settings', icon: mdiCogOutline },
])
