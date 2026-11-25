import { describe, expect, it } from 'vitest'
import config from '../nuxt.config.ts'

// The config's own shape, rather than Nuxt's wide input type for runtimeConfig.
const runtimeConfig = config.runtimeConfig as { public?: Record<string, unknown> }

describe('nuxt.config', () => {
  it('serves the dev server on port 13000', () => {
    expect(config.devServer?.port).toBe(13000)
  })

  it('defaults the public api base URL to the local api', () => {
    expect(runtimeConfig.public?.apiBaseUrl).toBe('http://127.0.0.1:18080')
  })

  it('keeps every runtime setting public (no server-only secrets)', () => {
    const { public: _public, ...serverOnly } = runtimeConfig
    expect(serverOnly).toEqual({})
  })

  it('compiles vuetify and ui for the client and SSR bundles', () => {
    expect(config.build?.transpile).toEqual(expect.arrayContaining(['vuetify', 'ui']))
    expect(config.vite?.ssr?.noExternal).toEqual(expect.arrayContaining(['vuetify', 'ui']))
  })
})
