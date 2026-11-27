// Two agents claiming the same task: exactly one gets the branch. Uses local repositories
// only (a bare "remote" and two clones), nothing on GitHub.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { claimBranch, releaseBranch, git } from '../lib/claim.mjs'

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'claim-test-'))
  const remote = join(dir, 'remote.git')
  git(['init', '--quiet', '--bare', '--initial-branch=main', remote])
  const seed = join(dir, 'seed')
  git(['clone', '--quiet', remote, seed])
  for (const [k, v] of [
    ['user.name', 'Test'],
    ['user.email', 'test@example.invalid'],
    ['commit.gpgsign', 'false'],
  ])
    git(['config', k, v], { cwd: seed })
  writeFileSync(join(seed, 'README.md'), 'x\n')
  git(['add', '.'], { cwd: seed })
  git(['commit', '--quiet', '-m', 'init'], { cwd: seed })
  git(['push', '--quiet', 'origin', 'HEAD:main'], { cwd: seed })
  const clone = (name) => {
    const c = join(dir, name)
    git(['clone', '--quiet', remote, c])
    for (const [k, v] of [
      ['user.name', name],
      ['user.email', `${name}@example.invalid`],
      ['commit.gpgsign', 'false'],
    ])
      git(['config', k, v], { cwd: c })
    return c
  }
  return { dir, a: clone('a'), b: clone('b') }
}

test('the second claim of a task is refused, even from the same base commit', (t) => {
  const { dir, a, b } = setup()
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const branch = '12-service-zones'
  const first = claimBranch({ cwd: a, base: 'origin/main', branch, claimant: 'agent a' })
  assert.equal(first.ok, true)
  assert.equal(git(['branch', '--show-current'], { cwd: a }), branch)
  assert.equal(git(['rev-parse', '--abbrev-ref', '@{upstream}'], { cwd: a }), `origin/${branch}`)

  // b hasn't fetched: its ls-remote sees the branch.
  const second = claimBranch({ cwd: b, base: 'origin/main', branch, claimant: 'agent b' })
  assert.equal(second.ok, false)
  assert.match(second.reason, /already exists|someone else/)
})

test('the push itself refuses a branch that appeared after the check', (t) => {
  const { dir, a, b } = setup()
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const branch = '13-race'
  // Simulate the race: b creates the branch between a's check and a's push.
  const tree = git(['rev-parse', 'origin/main^{tree}'], { cwd: b })
  const sha = git(['commit-tree', tree, '-p', 'origin/main', '-m', 'b'], { cwd: b })
  const ref = `refs/heads/${branch}`
  git(['push', '--quiet', `--force-with-lease=${ref}:`, 'origin', `${sha}:${ref}`], { cwd: b })
  const mine = git(['commit-tree', tree, '-p', 'origin/main', '-m', 'a'], { cwd: a })
  assert.throws(() =>
    git(['push', '--porcelain', `--force-with-lease=${ref}:`, 'origin', `${mine}:${ref}`], {
      cwd: a,
    }),
  )
})

test('release deletes only our own claim', (t) => {
  const { dir, a, b } = setup()
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const branch = '14-release'
  const claim = claimBranch({ cwd: a, base: 'origin/main', branch, claimant: 'a' })
  assert.equal(
    releaseBranch({ cwd: b, branch, sha: 'f'.repeat(40) }),
    false,
    'a different sha is not ours',
  )
  assert.equal(releaseBranch({ cwd: a, branch, sha: claim.sha }), true)
  assert.equal(git(['ls-remote', '--heads', 'origin', `refs/heads/${branch}`], { cwd: a }), '')
})
