// Public build-time configuration. Every VITE_* value is compiled into the app and ships to
// users, so none of them may be secret (docs/platform-core.md, principle 10).

/** The api address used when `VITE_API_BASE_URL` is not set: the local api (README). */
export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:18080'

/** Returns the api base URL from the build environment, or the local default. */
export function apiBaseUrl(env: { VITE_API_BASE_URL?: string | undefined }): string {
  return env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
}
