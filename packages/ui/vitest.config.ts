import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    // Process only this package's own component styles, so tests can read them with
    // getComputedStyle; Vuetify's CSS is skipped to keep the run fast.
    css: { include: [/\/src\/components\/.*\.vue/] },
    // Vuetify's components import their own CSS files. The vmThreads pool loads Vuetify as an
    // external module and stubs those imports (deps.web.transformCss), which is much faster
    // than inlining Vuetify through Vite (server.deps.inline took about 4 minutes cold).
    pool: 'vmThreads',
  },
})
