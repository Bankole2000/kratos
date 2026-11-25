import { flushPromises, mount } from '@vue/test-utils'
import { createPlatformUi } from 'ui'
import { afterEach, describe, expect, it, vi } from 'vitest'
import IndexPage from '../app/pages/index.vue'

const apiBaseUrl = 'http://api.test'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('index page', () => {
  it('renders the shared status screen inside the layout shell, using a mocked api', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: 'ok', database: 'up', version: '9.8.7' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    // The ui plugin builds its api client from the global fetch when installed.
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(IndexPage, {
      global: { plugins: [createPlatformUi({ apiBaseUrl, ssr: false })] },
    })
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const request = (fetchMock.mock.calls[0] as unknown[])[0]
    const url = request instanceof Request ? request.url : String(request)
    expect(url).toBe(`${apiBaseUrl}/health`)
    expect(wrapper.text()).toContain('9.8.7')
  })
})
