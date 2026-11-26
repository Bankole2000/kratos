// StatusScreen hydrates without a mismatch when the browser differs from the server render.
// Vuetify's indeterminate spinner adds `v-progress-circular--disable-shrink` only when the
// browser reports `prefers-reduced-motion: reduce`, which a server cannot know. Here the
// "server" render sees no reduced motion and the browser sees it, as on a machine with
// animations turned off.
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { StatusScreen, createPlatformUi } from '../src/index.ts'
import { apiBaseUrl } from './helpers.ts'

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion: reduce'),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }))
}

function createApp() {
  // The request never answers, so both renders stay in the loading state.
  const fetch = () => new Promise<Response>(() => {})
  const app = createSSRApp({ render: () => h(StatusScreen) })
  app.use(createPlatformUi({ apiBaseUrl, ssr: true, fetch }))
  return app
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('StatusScreen hydration', () => {
  test('matches the server render when the browser prefers reduced motion', async () => {
    stubReducedMotion(false)
    const html = await renderToString(createApp())

    stubReducedMotion(true)
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const app = createApp()
    app.mount(container)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const messages = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0]))
    expect(messages.filter((m) => /hydration/i.test(m))).toEqual([])
    // After mounting, the browser shows the spinner.
    expect(container.querySelector('[role="progressbar"]')).not.toBeNull()
    app.unmount()
  })
})
