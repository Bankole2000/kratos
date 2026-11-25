// defineConfig from vitest/config is Vite's, plus the `test` options for `pnpm test`.
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Set by `tauri android dev` / `tauri ios dev` to the machine's network address, so a
// phone or emulator can reach the dev server. Unset on desktop.
const host = process.env.TAURI_DEV_HOST

// https://v2.tauri.app/start/frontend/vite/
export default defineConfig({
  plugins: [vue()],
  // Keep Tauri's Rust errors visible in the terminal.
  clearScreen: false,
  server: {
    // Tauri expects a fixed port (tauri.conf.json devUrl); fail instead of picking another.
    port: 1420,
    strictPort: true,
    host: host || false,
    ...(host ? { hmr: { protocol: 'ws', host, port: 1421 } } : {}),
    watch: {
      // src-tauri is watched by `tauri dev` itself.
      ignored: ['**/src-tauri/**'],
    },
  },
  // Expose only VITE_* variables (all public) and TAURI_ENV_* (platform info from the CLI).
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // The oldest web views Tauri 2 supports: WebView2 (Chromium) on Windows, WebKit on
    // macOS, iOS and Linux.
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: process.env.TAURI_ENV_DEBUG ? false : 'oxc',
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
})
