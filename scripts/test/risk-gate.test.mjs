// The risk gate against a fake GitHub API.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { run } from '../lib/risk-gate.mjs'

const rulesPath = fileURLToPath(new URL('../../.github/risk-rules.json', import.meta.url))
const HEAD = 'a'.repeat(40)

function fakeGitHub({ files, labels = [], reviews = [], draft = false, contents = {}, body = '' }) {
  const state = { labels: [...labels], statuses: [], removed: [], added: [] }
  const api = {
    rest: {
      pulls: {
        get: async () => ({
          data: {
            number: 5,
            draft,
            body,
            head: { sha: HEAD },
            base: { sha: 'b'.repeat(40) },
            labels: state.labels.map((name) => ({ name })),
          },
        }),
        listFiles: 'listFiles',
        listReviews: 'listReviews',
      },
      issues: {
        addLabels: async ({ labels: l }) => {
          state.added.push(...l)
          state.labels.push(...l)
        },
        removeLabel: async ({ name }) => {
          state.removed.push(name)
          state.labels = state.labels.filter((x) => x !== name)
        },
      },
      repos: {
        createCommitStatus: async (s) => {
          state.statuses.push(s)
        },
        getContent: async ({ path, ref }) => {
          const c = contents[`${ref}:${path}`]
          if (c === undefined) {
            const e = new Error('nf')
            e.status = 404
            throw e
          }
          return {
            data: {
              content: Buffer.from(typeof c === 'string' ? c : JSON.stringify(c)).toString(
                'base64',
              ),
            },
          }
        },
      },
    },
    paginate: async (what) => (what === 'listReviews' ? reviews : []),
  }
  api.paginate.iterator = async function* () {
    yield {
      data: files.map((f) => (typeof f === 'string' ? { filename: f, status: 'modified' } : f)),
    }
  }
  return { api, state }
}

async function gate(opts, action = 'opened') {
  const { api, state } = fakeGitHub(opts)
  const logs = []
  const core = {
    info: (m) => logs.push(m),
    notice: () => {},
    summary: {
      addRaw() {
        return this
      },
      write: async () => {},
    },
  }
  const context = {
    repo: { owner: 'o', repo: 'r' },
    payload: { action, pull_request: { number: 5 } },
    serverUrl: 'https://github.com',
    runId: 1,
  }
  await run({ github: api, context, core, rulesPath })
  return { state, status: state.statuses.at(-1) }
}

const review = (body, commit_id = HEAD) => ({ body, commit_id })

test('low risk with an approving agent review of the head commit passes', async () => {
  const { status, state } = await gate({
    files: ['apps/api/src/routes/health.rs'],
    reviews: [review('Verdict: Approve\n\nLooks right.')],
  })
  assert.equal(status.state, 'success')
  assert.equal(status.context, 'risk-gate')
  assert.equal(status.sha, HEAD)
  assert.deepEqual(state.added, ['risk:low'])
})

test('low risk waits for a review, and fails on a non-approving one', async () => {
  assert.equal((await gate({ files: ['apps/api/src/a.rs'] })).status.state, 'pending')
  assert.equal(
    (await gate({ files: ['apps/api/src/a.rs'], reviews: [review('Verdict: Request changes')] }))
      .status.state,
    'failure',
  )
  // A review of an older commit doesn't count.
  assert.equal(
    (
      await gate({
        files: ['apps/api/src/a.rs'],
        reviews: [review('Verdict: Approve', 'c'.repeat(40))],
      })
    ).status.state,
    'pending',
  )
  // The latest review on the head commit wins.
  assert.equal(
    (
      await gate({
        files: ['apps/api/src/a.rs'],
        reviews: [review('Verdict: Approve'), review('Verdict: Request changes')],
      })
    ).status.state,
    'failure',
  )
})

test('high risk needs human:merge-ok, whatever the agent says', async () => {
  const files = ['apps/api/migrations/3_x.sql']
  const { status, state } = await gate({
    files,
    reviews: [review('Verdict: Approve')],
    labels: ['risk:low'],
  })
  assert.equal(status.state, 'failure')
  assert.match(status.description, /human:merge-ok/)
  assert.deepEqual(state.added, ['risk:high'])
  assert.deepEqual(state.removed, ['risk:low'])
  assert.equal((await gate({ files, labels: ['human:merge-ok'] })).status.state, 'success')
})

test('new commits remove earlier approvals', async () => {
  const { status, state } = await gate(
    { files: ['apps/api/migrations/3_x.sql'], labels: ['human:merge-ok', 'agent:reviewed'] },
    'synchronize',
  )
  assert.deepEqual(state.removed.sort(), ['agent:reviewed', 'human:merge-ok'])
  assert.equal(status.state, 'failure')
})

test('drafts are pending', async () => {
  assert.equal(
    (
      await gate({
        files: ['apps/api/src/a.rs'],
        draft: true,
        reviews: [review('Verdict: Approve')],
      })
    ).status.state,
    'pending',
  )
})

test('a breaking contract change is high risk; an additive one is medium', async () => {
  const f = 'openapi/openapi.json'
  const base = { paths: { '/v1/me': { get: {} } } }
  const contents = (head) => ({ [`${'b'.repeat(40)}:${f}`]: base, [`${HEAD}:${f}`]: head })
  const additive = { paths: { '/v1/me': { get: {} }, '/v1/x': { get: {} } } }
  const add = await gate({
    files: [f],
    contents: contents(additive),
    reviews: [review('Verdict: Approve')],
  })
  assert.equal(add.status.state, 'pending', 'medium: the plain review is not independent')
  assert.deepEqual(add.state.added, ['risk:medium'])
  const { status } = await gate({
    files: [f],
    contents: contents({ paths: {} }),
    reviews: [review('Verdict: Approve')],
  })
  assert.equal(status.state, 'failure')
})

const independent = (name) =>
  `Verdict: Approve\n\nScope and risk\nOnly the sign-in route.\n\n<!-- agent:reviewer ${name} -->`

test('medium risk needs an approving review by a different agent session', async () => {
  const files = ['apps/api/src/auth/otp.rs']
  const body = 'Closes #3\n<!-- agent:author worker-1 -->'
  assert.equal(
    (await gate({ files, body, reviews: [review(independent('reviewer-1'))] })).status.state,
    'success',
  )
  const self = await gate({ files, body, reviews: [review(independent('worker-1'))] })
  assert.equal(self.status.state, 'pending')
  assert.match(self.status.description, /is the author/)
  const noRisk = await gate({
    files,
    body,
    reviews: [review('Verdict: Approve\n<!-- agent:reviewer reviewer-1 -->')],
  })
  assert.match(noRisk.status.description, /Scope and risk/)
})

test('migrations: new additive ones are medium; destructive or edited ones are high', async () => {
  const f = 'apps/api/migrations/20261128000000_x.sql'
  const sql = (text) => ({ [`${HEAD}:${f}`]: text })
  const body = '<!-- agent:author worker-1 -->'
  const ok = await gate({
    files: [{ filename: f, status: 'added' }],
    contents: sql('CREATE TABLE x (id int); -- DROP nothing'),
    body,
    reviews: [review(independent('reviewer-1'))],
  })
  assert.equal(ok.status.state, 'success')
  assert.deepEqual(ok.state.added, ['risk:medium'])
  const drop = await gate({
    files: [{ filename: f, status: 'added' }],
    contents: sql('ALTER TABLE x DROP COLUMN y;'),
    reviews: [review(independent('reviewer-1'))],
  })
  assert.equal(drop.status.state, 'failure')
  assert.match(drop.status.description, /destructive migration: DROP/)
  const edited = await gate({
    files: [{ filename: f, status: 'modified' }],
    reviews: [review(independent('reviewer-1'))],
  })
  assert.equal(edited.status.state, 'failure')
})
