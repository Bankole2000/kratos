// Compile-time checks that GET /health is typed as the spec says. Run by `vitest --typecheck`
// and by `tsc --noEmit`; a mismatch with openapi/openapi.json fails both.
import { describe, expectTypeOf, test } from 'vitest'
import { createApiClient, type ErrorBody, type Health } from './index.ts'

describe('GET /health types', () => {
  test('Health matches the spec schema', () => {
    expectTypeOf<Health>().toEqualTypeOf<{ status: string; version: string }>()
  })

  test('ErrorBody matches the spec schema', () => {
    expectTypeOf<ErrorBody>().toEqualTypeOf<{
      error: { code: string; message: string; request_id: string }
    }>()
  })

  test('client.GET returns Health as data and ErrorBody as error', () => {
    const client = createApiClient({ baseUrl: 'http://localhost:3000' })
    const getHealth = () => client.GET('/health')
    type Result = Awaited<ReturnType<typeof getHealth>>
    expectTypeOf<Result['data']>().toEqualTypeOf<Health | undefined>()
    expectTypeOf<Result['error']>().toEqualTypeOf<ErrorBody | undefined>()
    expectTypeOf<Result['response']>().toEqualTypeOf<Response>()
  })

  test('unknown paths are rejected', () => {
    const client = createApiClient({ baseUrl: 'http://localhost:3000' })
    // @ts-expect-error '/nope' is not in the spec
    void client.GET('/nope')
  })
})
