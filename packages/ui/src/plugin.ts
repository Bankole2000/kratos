// The Vue plugin every host app installs once: Vuetify 4 with the platform themes and SVG
// icons, plus the api client for the host's api URL. Nothing here touches `window` or
// `document`, so it runs in Nuxt's server render as well as in the Tauri WebView.
import type { Plugin } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import 'vuetify/styles'
import { createApiClient } from 'api-client-ts'
import { apiClientKey } from './client.ts'
import { darkTheme, lightTheme, narrowBreakpoint } from './theme.ts'

/** Options for {@link createPlatformUi}. */
export interface PlatformUiOptions {
  /**
   * Root URL of the api, without a trailing slash, e.g. `http://127.0.0.1:18080`. The host
   * app reads it from its public configuration; it ships to users, so it is never a secret.
   */
  apiBaseUrl: string
  /** `true` when the app renders on a server (Nuxt). The Tauri app passes `false`. */
  ssr?: boolean
  /** A `fetch` for the api client; defaults to the global one. Tests pass a mock here. */
  fetch?: typeof globalThis.fetch
}

/**
 * Creates the plugin that installs Vuetify (light and dark themes following the system
 * setting) and provides an api client for `apiBaseUrl` (read it with {@link useApiClient}).
 *
 * ```ts
 * app.use(createPlatformUi({ apiBaseUrl: 'http://127.0.0.1:18080', ssr: false }))
 * ```
 */
export function createPlatformUi(options: PlatformUiOptions): Plugin {
  return {
    install(app) {
      const vuetify = createVuetify({
        components,
        directives,
        ssr: options.ssr ?? false,
        theme: {
          // `system` follows the OS light or dark setting and switches when it changes.
          defaultTheme: 'system',
          themes: { light: lightTheme, dark: darkTheme },
        },
        display: { thresholds: { sm: narrowBreakpoint } },
        icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
      })
      app.use(vuetify)
      app.provide(
        apiClientKey,
        createApiClient({
          baseUrl: options.apiBaseUrl,
          ...(options.fetch ? { fetch: options.fetch } : {}),
        }),
      )
    },
  }
}
