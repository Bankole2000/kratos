// Typed client for the Platform Core API. The types come from src/generated/schema.ts,
// which `pnpm --filter api-client-ts generate` writes from openapi/openapi.json; never
// edit that file by hand. This file is the only hand-written code in the package.
import createClient, { type Client, type ClientOptions } from 'openapi-fetch'
import type { components, operations, paths } from './generated/schema.ts'

export type { components, operations, paths }

/** The body of `GET /health`. */
export type Health = components['schemas']['Health']
/** Overall health in `Health.status`: `ok`, or `degraded` when the database is down. */
export type HealthStatus = components['schemas']['HealthStatus']
/** Database health in `Health.database`: `up` or `down`. */
export type DatabaseStatus = components['schemas']['DatabaseStatus']
/** The JSON body of every error response. */
export type ErrorBody = components['schemas']['ErrorBody']
/** The fields inside `error` in an error response. */
export type ErrorDetails = components['schemas']['ErrorDetails']

/** Options for {@link createApiClient}; any other openapi-fetch option (such as `fetch`) passes through. */
export interface ApiClientOptions extends ClientOptions {
  /** Root URL of the api, without a trailing slash, e.g. `http://localhost:3000`. */
  baseUrl: string
}

/** A client whose methods (`GET`, `POST`, …) are typed by the OpenAPI spec. */
export type ApiClient = Client<paths>

/**
 * Creates a typed client for the api at `baseUrl`. No auth handling yet: callers that need
 * headers pass them in `options.headers` or add openapi-fetch middleware with `client.use`.
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  return createClient<paths>(options)
}
