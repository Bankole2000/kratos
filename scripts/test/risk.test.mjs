import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { globToRegExp, classify, breakingOpenApiChanges, independentReview } from '../lib/risk.mjs'

const rules = JSON.parse(
  readFileSync(new URL('../../.github/risk-rules.json', import.meta.url), 'utf8'),
)

test('globs', () => {
  assert.ok(globToRegExp('**/migrations/**').test('apps/api/migrations/1_init.sql'))
  assert.ok(globToRegExp('**/AGENTS.md').test('AGENTS.md'))
  assert.ok(globToRegExp('docs/*.md').test('docs/PRD.md'))
  assert.ok(!globToRegExp('docs/*.md').test('docs/reviews/PRD.md'))
  assert.ok(globToRegExp('file?.txt').test('file1.txt'))
  assert.ok(!globToRegExp('a.b').test('axb'), 'dots are literal')
})

test('ordinary app code is low risk', () => {
  const r = classify(
    ['apps/api/src/routes/health.rs', 'apps/api/CHANGELOG.md', 'docs/reviews/PRD-review.md'],
    [],
    rules,
  )
  assert.deepEqual(r, { level: 'low', reasons: [] })
})

test('workflow, infrastructure, spec documents, money and secrets are high risk', () => {
  for (const f of [
    '.github/workflows/ci.yml',
    'scripts/agent.mjs',
    'docs/FEATURES.md',
    'infra/main.tf',
    'AGENTS.md',
    'apps/api/AGENTS.md',
    'apps/web/src/payments/form.tsx',
    'apps/api/src/routes/payouts.rs',
    'apps/api/src/secrets.rs',
  ]) {
    assert.equal(classify([f], [], rules).level, 'high', f)
  }
  assert.equal(classify(['apps/web/src/a.ts'], ['review:security'], rules).level, 'high')
  assert.equal(classify(['apps/web/src/a.ts'], ['type:feature'], rules).level, 'low')
})

test('auth, roles, shared packages and dependencies are medium risk', () => {
  for (const f of [
    'apps/api/src/auth/mod.rs',
    'apps/api/src/routes/staff_roles.rs',
    'apps/api/src/session.rs',
    'packages/ui/src/Button.vue',
    'apps/api/Cargo.toml',
    'Cargo.lock',
    'apps/api/.env.example',
    'docker-compose.yml',
  ]) {
    assert.equal(classify([f], [], rules).level, 'medium', f)
  }
  // Keywords match whole path segments, not parts of words.
  assert.equal(classify(['apps/web/src/author.tsx'], [], rules).level, 'low')
  // The highest level wins.
  assert.equal(classify(['apps/api/src/auth/mod.rs', 'scripts/x.mjs'], [], rules).level, 'high')
})

test('migrations are judged by status and SQL', () => {
  const f = 'apps/api/migrations/2_x.sql'
  const m = (status, sql) => ({ migrations: [{ file: f, status, sql }] })
  assert.equal(
    classify([f], [], rules, m('added', 'CREATE TABLE t (id bigint primary key);')).level,
    'medium',
  )
  assert.equal(classify([f], [], rules, m('added', 'ALTER TABLE t RENAME TO u;')).level, 'high')
  assert.equal(classify([f], [], rules, m('added', 'UPDATE t SET a = 1;')).level, 'high')
  assert.equal(
    classify([f], [], rules, m('added', '-- DROP in a comment only\nCREATE INDEX i ON t (a);'))
      .level,
    'medium',
  )
  assert.equal(classify([f], [], rules, m('modified')).level, 'high')
  assert.equal(classify([f], [], rules).level, 'high', 'unknown status')
})

test('contract files are judged by their changes', () => {
  const f = 'openapi/openapi.json'
  assert.equal(classify([f], [], rules).level, 'low')
  assert.equal(classify([f], [], rules, { changedContracts: [f] }).level, 'medium')
  assert.equal(
    classify([f], [], rules, { breakingContracts: [`${f}: path removed`] }).level,
    'high',
  )
})

test('an independent review names a different reviewer and covers scope and risk', () => {
  const pr = 'Closes #1\n<!-- agent:author worker-1 -->'
  const r = (name, extra = '\nScope and risk\nnone') =>
    `Verdict: Approve${extra}\n<!-- agent:reviewer ${name} -->`
  assert.equal(independentReview(pr, r('reviewer-2')).ok, true)
  assert.equal(independentReview(pr, r('Worker-1')).ok, false)
  assert.equal(independentReview(pr, r('reviewer-2', '')).ok, false)
  assert.equal(independentReview(pr, 'Verdict: Approve\nScope and risk').ok, false)
})

test('breaking OpenAPI changes', () => {
  const base = {
    paths: { '/a': { get: { parameters: [] } }, '/b': { post: {} } },
    components: { schemas: { User: { properties: { id: {}, phone: {} }, required: ['id'] } } },
  }
  assert.deepEqual(breakingOpenApiChanges(base, base), [])
  const additive = structuredClone(base)
  additive.paths['/c'] = { get: {} }
  additive.components.schemas.User.properties.email = {}
  assert.deepEqual(breakingOpenApiChanges(base, additive), [])
  const breaking = structuredClone(base)
  delete breaking.paths['/b']
  delete breaking.components.schemas.User.properties.phone
  breaking.components.schemas.User.required.push('email')
  breaking.paths['/a'].get.parameters.push({ in: 'query', name: 'q', required: true })
  assert.deepEqual(breakingOpenApiChanges(base, breaking).sort(), [
    'new required parameter: query q on GET /a',
    'newly required: User.email',
    'path removed: /b',
    'property removed: User.phone',
  ])
  assert.deepEqual(breakingOpenApiChanges(null, base), [])
  assert.deepEqual(breakingOpenApiChanges(base, null), ['contract file removed'])
})
