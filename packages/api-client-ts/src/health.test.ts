// Runtime check: the client calls GET {baseUrl}/health and returns the parsed body as typed data.
import { describe, expect, expectTypeOf, test } from 'vitest'
import { createApiClient, type ErrorBody, type Health } from './index.ts'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('createApiClient', () => {
  test('GET /health returns typed data', async () => {
    const requests: Request[] = []
    const client = createApiClient({
      baseUrl: 'http://localhost:3000',
      fetch: async (request) => {
        requests.push(request)
        return jsonResponse(200, { status: 'ok', version: '0.1.0', database: 'up' })
      },
    })

    const { data, error } = await client.GET('/health')

    expect(requests.map((r) => `${r.method} ${r.url}`)).toEqual([
      'GET http://localhost:3000/health',
    ])
    expect(error).toBeUndefined()
    expect(data).toEqual({ status: 'ok', version: '0.1.0', database: 'up' })
    expectTypeOf(data).toEqualTypeOf<Health | undefined>()
    if (data) expectTypeOf(data.status).toEqualTypeOf<'ok' | 'degraded'>()
  })

  test('an error response is returned as a typed ErrorBody', async () => {
    const body: ErrorBody = {
      error: { code: 'internal_error', message: 'Something went wrong.', request_id: 'req-1' },
    }
    const client = createApiClient({
      baseUrl: 'http://localhost:3000',
      fetch: async () => jsonResponse(500, body),
    })

    const { data, error, response } = await client.GET('/health')

    expect(response.status).toBe(500)
    expect(data).toBeUndefined()
    expect(error).toEqual(body)
    expectTypeOf(error).toEqualTypeOf<ErrorBody | undefined>()
  })
})
