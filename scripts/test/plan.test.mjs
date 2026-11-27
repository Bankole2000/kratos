// Approval by approved documents, milestone plans (waves, coverage) and task worktrees.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  specIndex,
  docHeader,
  roadmapMilestones,
  docsApproval,
  planWaves,
  uncoveredFeatures,
  PLATFORM,
  parseProjectLine,
} from '../lib/ready.mjs'
import { claimBranch, git, worktreePath, worktrees, mainRoot } from '../lib/claim.mjs'

// Small spec documents in fixtures/, so the tests don't depend on the project's own docs.
const doc = (p) =>
  readFileSync(new URL(`./fixtures/${p.split('/').pop()}`, import.meta.url), 'utf8')
const features = doc('docs/FEATURES.md')
const index = specIndex({ features, prd: doc('docs/PRD.md'), testing: doc('docs/TESTING.md') })
const anyFr = [...index.fr][0]
const anyTc = [...index.tc][0]
const body = (ids) => `## Task key, feature, requirement and test IDs\n${ids}\n\n## App\napi\n`
const approved = (text) => text.replace(/^Status: [^|]+/m, 'Status: Approved ')
const roadmap = `# Roadmap\n\nStatus: Approved | Version: 1.0\n\n## Milestones\n| Milestone | Outcome | Journeys | Exit criteria |\n|---|---|---|---|\n| M0 - Foundation | x | — | x |\n| M1 - Vendors and drivers can join | x | J-12, J-05 | x |\n`
const docs = { 'docs/FEATURES.md': approved(features), 'docs/ROADMAP.md': roadmap }
const ms = 'M1 - Vendors and drivers can join'

test('document headers and ROADMAP milestones', () => {
  assert.deepEqual(
    { ...docHeader('# X\n\nStatus: In review | Owner: @a | Version: 1.2 | Last updated: x') },
    { status: 'In review', version: '1.2' },
  )
  const m = roadmapMilestones(roadmap)
  assert.deepEqual([...m.get('M1')], ['J-12', 'J-05'])
  assert.equal(m.get('M0').size, 0)
})

test('approved documents approve product work of a journey in its milestone', () => {
  const b = body(`TASK-020 / FT-070 / ${anyFr} / ${anyTc}`)
  const r = docsApproval({ body: b, index, milestone: ms, docs, roadmap })
  assert.equal(r.ok, true, r.why)
  assert.match(r.why, /FEATURES\.md .*ROADMAP\.md 1\.0/)
})

test('and nothing else', () => {
  const b = body(`TASK-020 / FT-070 / ${anyFr} / ${anyTc}`)
  const no = (extra, re) => {
    const r = docsApproval({ body: b, index, milestone: ms, docs, roadmap, ...extra })
    assert.equal(r.ok, false)
    assert.match(r.why, re)
  }
  no(
    { docs: { ...docs, 'docs/ROADMAP.md': roadmap.replace('Approved', 'Draft') } },
    /ROADMAP\.md is Draft/,
  )
  no({ milestone: 'M2 - Customers' }, /doesn't put J-12 in M2/)
  no({ problems: ['missing section'] }, /not ready/)
  no({ openQuestions: true }, /open questions/)
  no({ body: body('TASK-021 / Platform') }, /Platform/)
  assert.equal(PLATFORM, 'Platform')
})

test('waves order a plan for parallel work and catch cycles and unknown keys', () => {
  const tasks = [
    { key: 'TASK-001' },
    { key: 'TASK-002', blockedBy: ['TASK-001'] },
    { key: 'TASK-003', blockedBy: ['TASK-001', 42] },
    { key: 'TASK-004', blockedBy: ['TASK-002', 'TASK-003'] },
  ]
  const { waves, errors } = planWaves(tasks)
  assert.deepEqual(errors, [])
  assert.deepEqual(
    waves.map((w) => [...w]),
    [['TASK-001'], ['TASK-002', 'TASK-003'], ['TASK-004']],
  )
  assert.match(
    planWaves([
      { key: 'A', blockedBy: ['B'] },
      { key: 'B', blockedBy: ['A'] },
    ]).errors[0],
    /cycle/,
  )
  assert.match(planWaves([{ key: 'A', blockedBy: ['TASK-999'] }]).errors[0], /isn't in the plan/)
})

test('coverage: every approved feature of a journey has a task or a reason to wait', () => {
  const j = index.journeys.get('J-12')
  const approvedFts = j.features.filter((f) => index.ft.get(f) === 'approved')
  assert.ok(approvedFts.length > 2)
  const [first, second, ...rest] = approvedFts
  const bodies = [body(`TASK-030 / ${first} / ${anyFr} / ${anyTc}`), body(`TASK-031 / ${second}`)]
  assert.deepEqual([...uncoveredFeatures('J-12', bodies, index)], rest)
  const deferred = Object.fromEntries(rest.map((f) => [f, 'later']))
  assert.deepEqual([...uncoveredFeatures('J-12', bodies, index, deferred)], [])
})

test('claims can get their own worktree under .worktrees/', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'wt-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const remote = join(dir, 'remote.git')
  git(['init', '--quiet', '--bare', '--initial-branch=main', remote])
  const repo = join(dir, 'repo')
  git(['clone', '--quiet', remote, repo])
  for (const [k, v] of [
    ['user.name', 'T'],
    ['user.email', 't@example.invalid'],
    ['commit.gpgsign', 'false'],
  ])
    git(['config', k, v], { cwd: repo })
  writeFileSync(join(repo, 'README.md'), 'x\n')
  git(['add', '.'], { cwd: repo })
  git(['commit', '--quiet', '-m', 'init'], { cwd: repo })
  git(['push', '--quiet', 'origin', 'HEAD:main'], { cwd: repo })

  const branch = '15-zones'
  const path = worktreePath(repo, branch)
  assert.match(path.replace(/\\/g, '/'), /\/repo\/\.worktrees\/15-zones$/)
  const r = claimBranch({ cwd: repo, base: 'origin/main', branch, claimant: 'w1', worktree: path })
  assert.equal(r.ok, true)
  assert.ok(existsSync(join(path, 'README.md')))
  assert.equal(git(['branch', '--show-current'], { cwd: path }), branch)
  assert.equal(
    git(['branch', '--show-current'], { cwd: repo }),
    'main',
    'the main checkout stays where it was',
  )
  assert.equal(
    mainRoot(path).replace(/\\/g, '/').toLowerCase(),
    repo.replace(/\\/g, '/').toLowerCase(),
  )
  assert.deepEqual(
    worktrees(repo).map((w) => w.branch),
    [branch],
  )
})

test('the Project line in docs/GITHUB.md, however it is written', () => {
  const p = (line, repo = '- Repository: acme/shop\n') =>
    JSON.stringify(parseProjectLine(`${repo}${line}\n`))
  assert.equal(p('- Project: octocat #3'), '{"owner":"octocat","number":3}')
  assert.equal(p('- Project: @octocat #3'), '{"owner":"octocat","number":3}')
  assert.equal(
    p('- Project: #3 "Kratos" (owned by @Bankole2000), with the fields below'),
    '{"owner":"Bankole2000","number":3}',
  )
  assert.equal(
    p('- Project: Bankole2000 #5, with the fields below'),
    '{"owner":"Bankole2000","number":5}',
  )
  assert.equal(p('- Project: 7'), '{"owner":"acme","number":7}')
  assert.equal(p('- Project: none yet; states are kept in labels'), 'null')
  assert.equal(p(`- Project: ${'{'.repeat(2)}owner, project number or ID${'}'.repeat(2)}`), 'null') // an unfilled placeholder
  assert.equal(p('- Project: TBD'), 'null')
})
