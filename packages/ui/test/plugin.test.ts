// createPlatformUi installs Vuetify with the platform themes and provides the api client.
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { defineComponent, h } from 'vue'
import { useTheme } from 'vuetify'
import { createPlatformUi, darkTheme, lightTheme, useApiClient } from '../src/index.ts'
import { apiBaseUrl, jsonResponse } from './helpers.ts'

describe('createPlatformUi', () => {
  test('uses the system theme with the light and dark tokens from this package', () => {
    let theme: ReturnType<typeof useTheme> | undefined
    const Probe = defineComponent({
      setup() {
        theme = useTheme()
        return () => h('div')
      },
    })
    mount(Probe, { global: { plugins: [createPlatformUi({ apiBaseUrl })] } })

    expect(theme?.global.name.value).toMatch(/^(light|dark)$/)
    expect(theme?.themes.value.light?.colors.primary).toBe(lightTheme.colors?.primary)
    expect(theme?.themes.value.dark?.colors.primary).toBe(darkTheme.colors?.primary)
    expect(theme?.themes.value.dark?.dark).toBe(true)
  })

  test('useApiClient returns a client for apiBaseUrl', async () => {
    const urls: string[] = []
    let client: ReturnType<typeof useApiClient> | undefined
    const Probe = defineComponent({
      setup() {
        client = useApiClient()
        return () => h('div')
      },
    })
    const fetch = async (input: RequestInfo | URL) => {
      urls.push((input as Request).url)
      return jsonResponse(200, { status: 'ok', version: '0.1.0', database: 'up' })
    }
    mount(Probe, { global: { plugins: [createPlatformUi({ apiBaseUrl, fetch })] } })

    const { data } = await client!.GET('/health')
    expect(urls).toEqual([`${apiBaseUrl}/health`])
    expect(data?.status).toBe('ok')
  })

  test('useApiClient throws without the plugin', () => {
    const Probe = defineComponent({
      setup() {
        useApiClient()
        return () => h('div')
      },
    })
    expect(() => mount(Probe)).toThrow(/createPlatformUi/)
  })
})
