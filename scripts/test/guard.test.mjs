import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { checkCommand, checkToolCall } from '../lib/guard.mjs'

const blocked = [
  'gh pr merge 12 --squash',
  'cd apps && gh pr merge 12',
  'gh -R o/r pr merge 3',
  'gh api -X PUT repos/o/r/pulls/3/merge',
  'gh pr review 3 --approve',
  'gh pr review 3 -a -b ok',
  'gh pr edit 3 --add-label human:merge-ok',
  'gh issue edit 3 --add-label "human:approved"',
  'gh api repos/o/r/issues/3/labels -f labels[]=human:merge-ok',
  'node scripts/agent.mjs approve-journey J-12',
  'scripts/agent approve-milestone M1',
  'git push origin main',
  'git push origin HEAD:refs/heads/main',
  'git push --force origin 12-x',
  'git push -f',
  'git push --force-with-lease origin 12-x',
  'git push origin +12-x',
  'git push --tags',
  'git tag v1.0.0',
  'gh release create v1.0.0',
  'gh workflow run release.yml',
  'tofu -chdir=infra apply',
  'terraform destroy',
  'bash scripts/setup-github.sh --all --project 6',
  './scripts/setup-github.sh --labels',
  'cd x && sh scripts/setup-github.sh',
  'cat apps/api/.env',
  'Get-Content .env.local',
  'echo x > .env',
  'gh project item-edit --id PVTI_1 --project-id PVT_1 --field-id F --text "J-12 abc owner"',
  'gh issue comment 3 --body "<!-- agent:approval journey=J-12 hash=abc -->"',
]
const allowed = [
  'gh pr view 3',
  'gh pr list -l human:merge-ok',
  'gh pr review 3 --comment --body-file r.md',
  'gh pr edit 3 --add-label agent:reviewed',
  'node scripts/agent.mjs claim 12',
  'scripts/agent loop --role work --name worker-1',
  'scripts/agent swarm --workers 2 --reviewers 1',
  'scripts/agent review-next',
  'gh project item-list 3 --owner someone',
  'git push -u origin 12-service-zones',
  'git tag -l',
  'tofu plan',
  'bash scripts/setup-github.sh --all --project 6 --dry-run',
  'grep -n "built-in" docs/GITHUB.md scripts/setup-github.sh',
  'git diff scripts/setup-github.sh',
  'cat apps/api/.env.example',
  'cargo test -p api',
  'node -e "console.log(process.env.HOME)"',
  'git log --oneline main',
]

test('blocks human-only commands', () => {
  for (const c of blocked) assert.ok(checkCommand(c), `should block: ${c}`)
})

test('allows everyday commands', () => {
  for (const c of allowed) assert.equal(checkCommand(c), null, `should allow: ${c}`)
})

test('file tools: .env blocked, .env.example allowed', () => {
  assert.ok(checkToolCall('Read', { file_path: 'C:\\repo\\apps\\api\\.env' }))
  assert.ok(checkToolCall('Edit', { file_path: '/repo/.env.production' }))
  assert.equal(checkToolCall('Read', { file_path: '/repo/apps/api/.env.example' }), null)
  assert.equal(checkToolCall('Read', { file_path: '/repo/src/env.rs' }), null)
  assert.ok(checkToolCall('PowerShell', { command: 'gh pr merge 1' }))
  assert.equal(checkToolCall('Grep', { pattern: 'x' }), null)
})

test('the hook exits 2 with a reason, 0 otherwise', () => {
  const hook = fileURLToPath(new URL('../../.claude/hooks/guard.mjs', import.meta.url))
  const call = (tool_input, tool_name = 'Bash') =>
    spawnSync(process.execPath, [hook], {
      input: JSON.stringify({ tool_name, tool_input }),
      encoding: 'utf8',
    })
  const no = call({ command: 'gh pr merge 1' })
  assert.equal(no.status, 2)
  assert.match(no.stderr, /merging is a human decision/)
  assert.equal(call({ command: 'cargo test' }).status, 0)
  assert.equal(
    spawnSync(process.execPath, [hook], { input: 'not json', encoding: 'utf8' }).status,
    0,
  )
})
