// Theme tokens for every screen in web and app (DESIGN.md, Visual guidelines). Brand colours
// and typography are still TBD, so these are neutral placeholders: change them here, never in
// an app. Vuetify turns each colour into a CSS variable (`--v-theme-primary`) and a utility
// class (`bg-primary`, `text-primary`).
import type { ThemeDefinition } from 'vuetify'

/** Light theme (Vuetify name `light`), used when the system setting is light. */
export const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    primary: '#2F5BD3',
    secondary: '#5B6478',
    success: '#1E7F4F',
    warning: '#9A6700',
    error: '#C62828',
    info: '#0B6BCB',
  },
}

/** Dark theme (Vuetify name `dark`), used when the system setting is dark. */
export const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#111318',
    surface: '#1B1E25',
    primary: '#8AB0FF',
    secondary: '#B4BCCD',
    success: '#6BD39B',
    warning: '#F2C14E',
    error: '#FF8A80',
    info: '#7CC4FF',
  },
}

/**
 * Width in px below which the layout switches from the side rail to the bottom bar
 * (DESIGN.md, Platforms and navigation). It is Vuetify's `sm` threshold.
 */
export const narrowBreakpoint = 600

/** Width of the side navigation rail in px. */
export const railWidth = 88
