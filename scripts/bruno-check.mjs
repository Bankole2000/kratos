// Drift check: fails when an endpoint in the OpenAPI spec has no request in the Bruno collection.
//
// Usage (from the repo root): node scripts/bruno-check.mjs [--spec <openapi.json>] [--collection <dir>]
// Defaults: openapi/openapi.json and apps/api/bruno. Run it with `pnpm bruno:check`.
//
// Requests are the OpenCollection YAML files in the collection (one `.yml` per request, with
// `http.method` and `http.url`). Requests that are not in the spec (e.g. the 404 check) are fine.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']
// Collection files that are not requests.
const NOT_REQUESTS = new Set(['opencollection.yml', 'folder.yml'])

function argValue(name, fallback) {
  const index = process.argv.indexOf(name)
  return index === -1 ? fallback : process.argv[index + 1]
}

// "/v1/projects/{slug}", "{{baseUrl}}/v1/projects/:slug" and ".../{{slug}}" all become
// "/v1/projects/{}". The query string and a trailing slash are ignored.
function normalizePath(url) {
  let path = url.trim().replace(/^["']|["']$/g, '')
  path = path.replace(/^\{\{baseUrl\}\}/, '')
  path = path.split('?')[0]
  path = path
    .split('/')
    .map((segment) =>
      /^\{\{[^}]+\}\}$/.test(segment) || /^\{[^}]+\}$/.test(segment) || segment.startsWith(':')
        ? '{}'
        : segment,
    )
    .join('/')
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path.startsWith('/') ? path : `/${path}`
}

function specEndpoints(specPath) {
  const spec = JSON.parse(readFileSync(specPath, 'utf8'))
  const endpoints = []
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    for (const method of Object.keys(item)) {
      if (HTTP_METHODS.includes(method)) endpoints.push({ method: method.toUpperCase(), path })
    }
  }
  return endpoints
}

function yamlFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'environments' && entry.name !== 'node_modules')
        files.push(...yamlFiles(full))
    } else if (entry.name.endsWith('.yml') && !NOT_REQUESTS.has(entry.name)) {
      files.push(full)
    }
  }
  return files
}

// Reads `method:` and `url:` from the top-level `http:` block. No YAML library needed:
// Bruno writes these as plain one-line scalars.
function collectionRequests(collectionDir) {
  const requests = []
  for (const file of yamlFiles(collectionDir)) {
    let inHttp = false
    let method
    let url
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (/^\S/.test(line)) inHttp = line.startsWith('http:')
      if (!inHttp) continue
      const match = line.match(/^ {2}(method|url):\s*(.+)$/)
      if (match && match[1] === 'method') method = match[2].trim().toUpperCase()
      if (match && match[1] === 'url') url = match[2]
    }
    if (method && url) requests.push({ method, path: normalizePath(url), file })
  }
  return requests
}

const specPath = argValue('--spec', 'openapi/openapi.json')
const collectionDir = argValue('--collection', 'apps/api/bruno')

const requests = collectionRequests(collectionDir)
const covered = new Set(requests.map((r) => `${r.method} ${r.path}`))
const endpoints = specEndpoints(specPath)
const missing = endpoints.filter((e) => !covered.has(`${e.method} ${normalizePath(e.path)}`))

if (missing.length > 0) {
  console.error(`Bruno collection ${collectionDir} has no request for:`)
  for (const e of missing) console.error(`  ${e.method} ${e.path}`)
  console.error(
    `Add a request (with assertions) for each one. See README, "Trying the api with Bruno".`,
  )
  process.exit(1)
}

console.log(
  `Bruno collection covers all ${endpoints.length} endpoint(s) in ${specPath} ` +
    `(${requests.length} request(s) in ${collectionDir}).`,
)
