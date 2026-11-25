// Turns a GET /health call into one of the states StatusScreen shows. Kept apart from the
// component so the mapping is easy to read and test.
import type { ApiClient, Health } from 'api-client-ts'

/** What StatusScreen shows. */
export type HealthState =
  | { kind: 'loading' }
  /** `status: ok`. */
  | { kind: 'healthy'; health: Health }
  /** `status: degraded`, or the api answered with an error response. */
  | { kind: 'unhealthy'; message: string; health?: Health; requestId?: string }
  /** The request failed: no network, the api is down, or the browser blocked it (CORS). */
  | { kind: 'offline' }

/** Calls GET /health and maps the outcome to a {@link HealthState}. Never throws. */
export async function loadHealth(
  client: ApiClient,
): Promise<Exclude<HealthState, { kind: 'loading' }>> {
  try {
    const { data, error } = await client.GET('/health')
    if (data) {
      if (data.status === 'ok') return { kind: 'healthy', health: data }
      return { kind: 'unhealthy', message: 'The database is down.', health: data }
    }
    // An error response always has an ErrorBody; anything else (such as an empty body) gets
    // a generic message.
    return {
      kind: 'unhealthy',
      message: error?.error?.message ?? 'The api answered with an unexpected response.',
      ...(error?.error?.request_id ? { requestId: error.error.request_id } : {}),
    }
  } catch {
    return { kind: 'offline' }
  }
}
