import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    // Vuetify imports its own CSS; inline it so Vite handles those imports.
    server: { deps: { inline: ['vuetify'] } },
  },
})
