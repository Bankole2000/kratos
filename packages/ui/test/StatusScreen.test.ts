// Every StatusScreen state, with GET /health answered by a mocked fetch passed through the
// api client that createPlatformUi provides.
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, test } from 'vitest'
import { StatusScreen } from '../src/index.ts'
import { apiBaseUrl, jsonResponse, mountWithUi } from './helpers.ts'

let unmount: (() => void) | undefined
afterEach(() => unmount?.())

function mountStatus(fetch: typeof globalThis.fetch) {
  const wrapper = mountWithUi(StatusScreen, { fetch })
  unmount = () => wrapper.unmount()
  return wrapper
}

const card = '[data-testid="status-screen"]'

describe('StatusScreen', () => {
  test('shows loading while GET /health is pending, and calls it through the client', async () => {
    const requests: string[] = []
    const wrapper = mountStatus((input) => {
      const request = input as Request
      requests.push(`${request.method} ${request.url}`)
      return new Promise<Response>(() => {})
    })
    await flushPromises()

    expect(requests).toEqual([`GET ${apiBaseUrl}/health`])
    expect(wrapper.get(card).attributes('data-state')).toBe('loading')
    expect(wrapper.text()).toContain('Checking the api')
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="retry"]').attributes('disabled')).toBeDefined()
  })

  test('shows healthy and the api version for status ok', async () => {
    const wrapper = mountStatus(async () =>
      jsonResponse(200, { status: 'ok', version: '0.1.0', database: 'up' }),
    )
    await flushPromises()

    expect(wrapper.get(card).attributes('data-state')).toBe('healthy')
    expect(wrapper.text()).toContain('The api is healthy')
    expect(wrapper.get('[data-testid="api-version"]').text()).toBe('Api version 0.1.0')
  })

  test('shows unhealthy for status degraded', async () => {
    const wrapper = mountStatus(async () =>
      jsonResponse(200, { status: 'degraded', version: '0.1.0', database: 'down' }),
    )
    await flushPromises()

    expect(wrapper.get(card).attributes('data-state')).toBe('unhealthy')
    expect(wrapper.text()).toContain('The api is unhealthy')
    expect(wrapper.get('[data-testid="status-detail"]').text()).toBe('The database is down.')
    expect(wrapper.get('[data-testid="api-version"]').text()).toBe('Api version 0.1.0')
  })

  test('shows unhealthy with the message and request ID for an error response', async () => {
    const wrapper = mountStatus(async () =>
      jsonResponse(500, {
        error: { code: 'internal_error', message: 'Something went wrong.', request_id: 'req-1' },
      }),
    )
    await flushPromises()

    expect(wrapper.get(card).attributes('data-state')).toBe('unhealthy')
    expect(wrapper.get('[data-testid="status-detail"]').text()).toBe('Something went wrong.')
    expect(wrapper.text()).toContain('Request ID req-1')
    expect(wrapper.find('[data-testid="api-version"]').exists()).toBe(false)
  })

  test('shows offline when the request fails (network or CORS)', async () => {
    const wrapper = mountStatus(async () => {
      throw new TypeError('Failed to fetch')
    })
    await flushPromises()

    expect(wrapper.get(card).attributes('data-state')).toBe('offline')
    expect(wrapper.text()).toContain('Cannot reach the api')
  })

  test('Retry calls GET /health again and shows the new result', async () => {
    let calls = 0
    const wrapper = mountStatus(async () => {
      calls += 1
      if (calls === 1) throw new TypeError('Failed to fetch')
      return jsonResponse(200, { status: 'ok', version: '0.2.0', database: 'up' })
    })
    await flushPromises()
    expect(wrapper.get(card).attributes('data-state')).toBe('offline')

    await wrapper.get('[data-testid="retry"]').trigger('click')
    await flushPromises()

    expect(calls).toBe(2)
    expect(wrapper.get(card).attributes('data-state')).toBe('healthy')
    expect(wrapper.get('[data-testid="api-version"]').text()).toBe('Api version 0.2.0')
  })
})
