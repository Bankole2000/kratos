import { defineNuxtConfig } from 'nuxt/config'

// Nuxt 4 host for packages/ui (ADR-006). Only routing, layouts and config live in this app;
// screens and components come from `ui` (principles 18 and 19).
export default defineNuxtConfig({
  compatibilityDate: '2026-11-25',
  devtools: { enabled: false },
  // 3000 is often taken; the api's local default is 18080 (README).
  devServer: { port: 13000 },
  runtimeConfig: {
    // Public values only: everything under `public` ships to the browser.
    // Override with NUXT_PUBLIC_API_BASE_URL (.env.example).
    public: {
      apiBaseUrl: 'http://127.0.0.1:18080',
    },
  },
  // Vuetify and `ui` (TypeScript and .vue source, no build step) are compiled by Nuxt's Vite,
  // including for the SSR bundle, so their CSS imports and .vue files are processed.
  build: {
    transpile: ['vuetify', 'ui'],
  },
  vite: {
    ssr: {
      noExternal: ['vuetify', 'ui'],
    },
  },
  typescript: {
    strict: true,
    // `nuxt typecheck` also checks the unit tests and their Vitest config.
    nodeTsConfig: {
      include: ['../test/**/*', '../vitest.config.ts'],
    },
  },
})
