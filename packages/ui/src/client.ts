// The api client that the host app configures through createPlatformUi, and the composable
// screens use to reach it (docs/TECHNICAL.md, ui `client` module).
import { inject, type InjectionKey } from 'vue'
import type { ApiClient } from 'api-client-ts'

/** Injection key for the client provided by {@link createPlatformUi}. */
export const apiClientKey: InjectionKey<ApiClient> = Symbol('platform-ui:api-client')

/**
 * Returns the api client provided by `createPlatformUi`. Call it from a component's `setup`.
 * Throws when the plugin is not installed, because every screen needs the client.
 */
export function useApiClient(): ApiClient {
  const client = inject(apiClientKey, null)
  if (!client) {
    throw new Error('useApiClient: no api client. Install createPlatformUi({ apiBaseUrl }) first.')
  }
  return client
}
