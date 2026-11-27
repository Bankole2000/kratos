#!/usr/bin/env node
// Task workflow for agents and the owner (docs/GITHUB.md, "Agent workflow"). Uses the GitHub
// CLI (gh) with the signed-in login; needs the project scope (gh auth refresh -s project).
//
//   next                          The next tasks to work on: approved, ready, unclaimed, unblocked
//   claim <issue> [--here]        Claim it: create its branch (the lock) in its own worktree
//                                 (.worktrees/<branch>; --here: in this checkout), assign, In Progress
//   pr --title <t> --body-file <f> [--draft]
//                                 Push the branch and open its PR; ready PRs go to In Review and
//                                 get auto-merge (once ci-ok and risk-gate are required)
//   block <issue> --reason <text> Status Blocked, needs:human-input, with the reason
//   ask <issue> --question <text> Ask the owner a question on the issue (needs:human-input)
//   ready [<issue>… | --all]      Re-run the definition-of-ready check and set AI Ready; approve
//                                 tasks the approved documents cover; undo stale approvals
//   plan --file <plan.json> [--dry-run]
//                                 Create or update a milestone's plan issues and tasks (idempotent
//                                 by task key), with waves, coverage and wave contracts
//   review <pr> --body-file <f>   Post an agent review ("Verdict: …") and re-run the risk gate
//   review-next                   Take the next PR that needs an agent review, in its own worktree
//   work                          Claim the next task in its own worktree and print its brief
//   loop --role work|review [--name <n>] [--max <n>] [--wait <seconds>] [--cmd "<agent command>"]
//                                 Run agent sessions one task (or review) at a time
//   swarm [--workers 2] [--reviewers 1] [--wait <seconds>] [--cmd "<agent command>"]
//                                 Several loops at once, each in its own process
//   cleanup                       Remove worktrees and review locks of merged or closed work
//   risk [--base origin/main]     Risk of the current branch, as the risk gate will judge it
//   digest                        What needs the owner: approvals, questions, PRs to merge
//
// Human only (refused inside Claude Code, and blocked by .claude/hooks/guard.mjs):
//   approve-journey <J-xx|Platform> [--milestone M1] [--dry-run]
//   approve-milestone <M1> [--dry-run]
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdtempSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hostname, tmpdir } from 'node:os'
import {
  PLATFORM,
  specIndex,
  lintTask,
  journeyOf,
  approvalHash,
  branchName,
  compareTasks,
  milestoneKey,
  sections,
  docsApproval,
  roadmapMilestones,
  planWaves,
  uncoveredFeatures,
  parseProjectLine,
} from './lib/ready.mjs'
import {
  classify,
  breakingOpenApiChanges,
  matchesAny,
  AUTHOR_MARK,
  REVIEWER_MARK,
} from './lib/risk.mjs'
import { claimBranch, releaseBranch, git, worktreePath, worktrees, mainRoot } from './lib/claim.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SELF = fileURLToPath(import.meta.url)
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '')
const RULES = JSON.parse(read('.github/risk-rules.json') || '{}')
const APPROVAL_MARK = /<!-- agent:approval journey=(\S+) hash=([0-9a-f]+)(?: by=(\S+))? -->/
const VERDICT_FIRST_LINE = /^\s*Verdict:\s*(Approve|Request changes|Comment only)\s*$/i
const DEFAULT_CMD = process.env.AGENT_CMD || 'claude -p --permission-mode acceptEdits'

// ---------- gh ----------
function gh(args, { input, json = false, allowFail = false } = {}) {
  try {
    const out = execFileSync('gh', args, {
      cwd: ROOT,
      encoding: 'utf8',
      input,
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 64 << 20,
    })
    return json ? JSON.parse(out || 'null') : out.trim()
  } catch (e) {
    if (allowFail) return null
    throw new Error(
      `gh ${args.slice(0, 3).join(' ')} failed: ${String(e.stderr || e.message).trim()}`,
    )
  }
}
const graphql = (query, vars = {}) => {
  const args = ['api', 'graphql', '-f', `query=${query}`]
  for (const [k, v] of Object.entries(vars))
    args.push(typeof v === 'number' ? '-F' : '-f', `${k}=${v}`)
  return gh(args, { json: true }).data
}

let repoCache
function repo() {
  if (!repoCache) {
    const r = gh(['repo', 'view', '--json', 'nameWithOwner,defaultBranchRef'], { json: true })
    const [owner, name] = r.nameWithOwner.split('/')
    repoCache = { owner, name, nwo: r.nameWithOwner, defaultBranch: r.defaultBranchRef.name }
  }
  return repoCache
}

/** Project from docs/GITHUB.md ("- Project: <owner> #<number>"), or none (label fallback). */
function projectConfig() {
  return parseProjectLine(read('docs/GITHUB.md'))
}

/** A temporary file with the given text, for gh --body-file. */
function tempFile(name, text) {
  const p = join(mkdtempSync(join(tmpdir(), 'agent-')), name)
  writeFileSync(p, text)
  return p
}
const sleep = (s) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, s * 1000)

// ---------- fields: Project #N, or labels without a Project (docs/GITHUB.md) ----------
const FIELD_LABELS = {
  Status: {
    Todo: 'status:todo',
    'In Progress': 'status:in-progress',
    'In Review': 'status:in-review',
    Blocked: 'status:blocked',
  },
  'Human Review': { Approved: 'human:approved', 'Changes Requested': 'human:changes-requested' },
  'AI Ready': { Yes: 'ai:ready' },
}

class Board {
  constructor() {
    this.project = projectConfig()
    this.items = new Map() // issue number -> { itemId, fields: {name: value} }
    if (!this.project) return
    const { owner, number } = this.project
    const meta = gh(
      [
        'project',
        'field-list',
        String(number),
        '--owner',
        owner,
        '--format',
        'json',
        '--limit',
        '50',
      ],
      { json: true },
    )
    this.fields = new Map(meta.fields.map((f) => [f.name, f]))
    this.projectId = gh([
      'project',
      'view',
      String(number),
      '--owner',
      owner,
      '--format',
      'json',
      '--jq',
      '.id',
    ])
    this.load()
  }

  // One query (paged) for every item's fields, including the Approval text field, so checking
  // approvals doesn't need a call per issue.
  load() {
    const { owner, number } = this.project
    const q = `query($o:String!,$n:Int!,$after:String){repositoryOwner(login:$o){... on ProjectV2Owner{projectV2(number:$n){items(first:100,after:$after){pageInfo{hasNextPage endCursor}nodes{id content{... on Issue{number repository{nameWithOwner}}}fieldValues(first:30){nodes{... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2FieldCommon{name}}} ... on ProjectV2ItemFieldTextValue{text field{... on ProjectV2FieldCommon{name}}}}}}}}}}}`
    let after = ''
    for (;;) {
      const vars = { o: owner, n: number }
      if (after) vars.after = after
      const page = graphql(q, vars).repositoryOwner.projectV2.items
      for (const node of page.nodes) {
        if (node.content?.repository?.nameWithOwner?.toLowerCase() !== repo().nwo.toLowerCase())
          continue
        const fields = {}
        for (const v of node.fieldValues.nodes)
          if (v?.field?.name) fields[v.field.name] = v.name ?? v.text ?? ''
        this.items.set(node.content.number, { itemId: node.id, fields })
      }
      if (!page.pageInfo.hasNextPage) break
      after = page.pageInfo.endCursor
    }
  }

  has(name) {
    return !!this.project && this.fields.has(name)
  }

  /** Field value of an issue; labels stand in for fields without a Project. */
  get(issue, name) {
    if (this.project) return this.items.get(issue.number)?.fields[name] ?? ''
    const labels = issue.labels.map((l) => l.name ?? l)
    if (name === 'Journey') return labels.find((l) => l.startsWith('journey:'))?.slice(8) ?? ''
    for (const [value, label] of Object.entries(FIELD_LABELS[name] ?? {}))
      if (labels.includes(label)) return value
    return { Status: 'Todo', 'Human Review': 'Required', 'AI Ready': 'No' }[name] ?? ''
  }

  ensureItem(issue) {
    let item = this.items.get(issue.number)
    if (!item) {
      const { owner, number } = this.project
      const added = gh(
        [
          'project',
          'item-add',
          String(number),
          '--owner',
          owner,
          '--url',
          issue.url,
          '--format',
          'json',
        ],
        { json: true },
      )
      item = { itemId: added.id, fields: {} }
      this.items.set(issue.number, item)
    }
    return item
  }

  set(issue, name, value) {
    if (this.get(issue, name) === value) return
    if (!this.project) return this.setLabel(issue, name, value)
    const field = this.fields.get(name)
    if (!field)
      throw new Error(
        `Project #${this.project.number} has no "${name}" field: run scripts/setup-github.sh --project ${this.project.number}`,
      )
    const item = this.ensureItem(issue)
    const args = [
      'project',
      'item-edit',
      '--id',
      item.itemId,
      '--project-id',
      this.projectId,
      '--field-id',
      field.id,
    ]
    if (field.options) {
      const option = field.options.find((o) => o.name === value)
      if (!option)
        throw new Error(
          `Project field "${name}" has no option "${value}": run scripts/setup-github.sh --project ${this.project.number}`,
        )
      args.push('--single-select-option-id', option.id)
    } else if (value) args.push('--text', value)
    else args.push('--clear')
    gh(args)
    item.fields[name] = value
  }

  setLabel(issue, name, value) {
    if (!FIELD_LABELS[name] && name !== 'Journey') return // no label stands in for it
    const labels = issue.labels.map((l) => l.name ?? l)
    const all =
      name === 'Journey'
        ? labels.filter((l) => l.startsWith('journey:'))
        : Object.values(FIELD_LABELS[name] ?? {})
    const want =
      name === 'Journey'
        ? value
          ? `journey:${value}`
          : null
        : (FIELD_LABELS[name]?.[value] ?? null)
    const remove = all.filter((l) => l !== want && labels.includes(l))
    const args = ['issue', 'edit', String(issue.number)]
    for (const l of remove) args.push('--remove-label', l)
    if (want && !labels.includes(want)) args.push('--add-label', want)
    if (args.length > 3) gh(args)
    issue.labels = [...labels.filter((l) => !remove.includes(l)), ...(want ? [want] : [])].map(
      (n) => ({ name: n }),
    )
  }
}

// ---------- issues ----------
const ISSUE_FIELDS = 'number,title,body,state,labels,milestone,assignees,url,id'
const getIssue = (n) => gh(['issue', 'view', String(n), '--json', ISSUE_FIELDS], { json: true })
const listByTitle = (prefix) =>
  gh(
    [
      'issue',
      'list',
      '--state',
      'open',
      '--limit',
      '500',
      '--search',
      `"${prefix}" in:title`,
      '--json',
      ISSUE_FIELDS,
    ],
    { json: true },
  ).filter((i) => i.title.startsWith(prefix))
const openTasks = () => listByTitle('[Task]')
const taskKey = (title) => title.match(/\bTASK-\d+\b/)?.[0] ?? null
const issueId = (n) => gh(['api', `repos/${repo().nwo}/issues/${n}`, '--jq', '.id'])

function spec() {
  return specIndex({
    features: read('docs/FEATURES.md'),
    prd: read('docs/PRD.md'),
    testing: read('docs/TESTING.md'),
  })
}
const appNames = () => {
  const dir = join(ROOT, 'apps')
  const apps = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : []
  return [...apps, 'packages', 'infra', 'repo']
}

function lint(issue, board, index) {
  return lintTask(issue.body ?? '', index, {
    apps: appNames(),
    journey: board.get(issue, 'Journey'),
    milestone: issue.milestone?.title ?? '',
  })
}

/** Issues this one is blocked by that are still open (GitHub issue dependencies). */
function openBlockers(n) {
  const deps = gh(
    ['api', `repos/${repo().nwo}/issues/${n}/dependencies/blocked_by`, '--paginate'],
    { json: true, allowFail: true },
  )
  if (deps) return deps.filter((d) => d.state === 'open').map((d) => d.number)
  // Dependencies API unavailable: fall back to "#123" links in the Dependencies section.
  const dep = (getIssue(n).body ?? '').split(/^## Dependencies\s*$/m)[1]?.split(/^## /m)[0] ?? ''
  return [...new Set((dep.match(/#(\d+)/g) ?? []).map((x) => Number(x.slice(1))))].filter(
    (d) => getIssue(d).state === 'OPEN',
  )
}

// ---------- approvals ----------
// An approval is recorded twice: as a comment on the issue (the audit trail people read) and
// in the Project's Approval text field as "<journey> <hash> <by>" (what the scripts read, in
// the same query as the other fields). Without a Project, or for approvals recorded before
// the field existed, the comments are read instead.

function commentApproval(n) {
  const comments =
    gh(['api', `repos/${repo().nwo}/issues/${n}/comments`, '--paginate'], { json: true }) ?? []
  for (const c of comments.reverse()) {
    const m = (c.body ?? '').match(APPROVAL_MARK)
    if (m) return { journey: m[1], hash: m[2], by: m[3] ?? 'owner' }
  }
  return null
}

/** The latest approval of an issue: { journey, hash, by } or null. */
function latestApproval(issue, board) {
  if (board.has('Approval')) {
    const [journey, hash, by] = (board.get(issue, 'Approval') || '').split(' ')
    if (hash) return { journey, hash, by: by ?? 'owner' }
  }
  const a = commentApproval(issue.number)
  if (a && board.has('Approval')) board.set(issue, 'Approval', `${a.journey} ${a.hash} ${a.by}`)
  return a
}

function recordApproval(issue, board, { journey, by, note }) {
  const hash = approvalHash(issue.body ?? '')
  board.set(issue, 'Journey', journey)
  board.set(issue, 'AI Ready', 'Yes')
  board.set(issue, 'Human Review', 'Approved')
  if (board.has('Approval')) board.set(issue, 'Approval', `${journey} ${hash} ${by}`)
  comment(
    issue.number,
    `<!-- agent:approval journey=${journey} hash=${hash} by=${by} -->\n${note} Changing the task's scope undoes this approval.`,
  )
}

/** True if the issue is approved and unchanged since; undoes a stale approval. */
function approvalHolds(issue, board, { fix = true } = {}) {
  if (board.get(issue, 'Human Review') !== 'Approved') return false
  const a = latestApproval(issue, board)
  if (a && a.hash === approvalHash(issue.body ?? '')) return true
  if (fix) {
    board.set(issue, 'Human Review', 'Required')
    if (board.has('Approval')) board.set(issue, 'Approval', '')
    comment(
      issue.number,
      a
        ? 'The task changed after it was approved, so it needs approval again (Human Review = Required).'
        : 'Human Review was Approved without an approval record from `scripts/agent`; set back to Required.',
    )
  }
  return false
}

// Plan issues ("[Plan] M1 J-12: …"): journey + milestone → whether it has open questions.
const PLAN_TITLE = /^\[Plan\] (M\d+) (J-\d+|Platform):/
function planQuestions() {
  const out = new Map()
  for (const p of listByTitle('[Plan]')) {
    const m = p.title.match(PLAN_TITLE)
    if (!m) continue
    const q = (sections(p.body).find((s) => s.heading === 'Open questions')?.text ?? '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim()
    out.set(`${m[1]} ${m[2]}`, !!q && !/^([-*]\s*)?none\.?$/i.test(q))
  }
  return out
}

const DOCS = () => Object.fromEntries((RULES.approval?.documents ?? []).map((p) => [p, read(p)]))

/**
 * Approves a task through the approved documents when the owner's rule covers it
 * (.github/risk-rules.json, approval). Returns why it did or didn't.
 */
function approveFromDocs(issue, board, index, problems, plans) {
  if (!RULES.approval?.fromApprovedDocs) return { ok: false, why: 'approval from documents is off' }
  if (approvalHolds(issue, board, { fix: false })) return { ok: true, why: 'already approved' }
  const journey = journeyOf(issue.body ?? '', index)
  const ms = milestoneKey(issue.milestone?.title)
  const r = docsApproval({
    body: issue.body ?? '',
    index,
    milestone: issue.milestone?.title,
    docs: DOCS(),
    roadmap: read('docs/ROADMAP.md'),
    problems,
    openQuestions: plans?.get(`${ms} ${journey}`) ?? false,
  })
  if (r.ok)
    recordApproval(issue, board, {
      journey,
      by: 'docs',
      note: `Approved by the ${r.why}: the task uses only approved features of ${journey}, which ROADMAP.md delivers in ${ms} (owner's rule, docs/GITHUB.md, Journey approval).`,
    })
  return r
}

const comment = (n, body) =>
  gh(['issue', 'comment', String(n), '--body-file', '-'], { input: body })
const claimant = () =>
  process.env.AGENT_NAME || `${process.env.CLAUDECODE ? 'Claude Code' : 'agent'} on ${hostname()}`

// ---------- finding and claiming work ----------

/** Workable tasks, best first. Tasks the approved documents cover are approved on the way. */
function candidates(board = new Board(), index = spec()) {
  const plans = planQuestions()
  const out = []
  for (const issue of openTasks()) {
    if (board.get(issue, 'Status') !== 'Todo' || issue.assignees.length) continue
    const problems = lint(issue, board, index)
    board.set(issue, 'AI Ready', problems.length ? 'No' : 'Yes')
    if (problems.length) continue
    if (!approvalHolds(issue, board) && !approveFromDocs(issue, board, index, problems, plans).ok)
      continue
    if (openBlockers(issue.number).length) continue
    out.push({
      ...issue,
      priority: board.get(issue, 'Priority'),
      milestone: issue.milestone?.title,
    })
  }
  return out.sort(compareTasks)
}

/** Claims one issue; returns { issue, branch, path }. Throws with the reasons it can't. */
function claimIssue(n, { here = false, board = new Board() } = {}) {
  const issue = getIssue(n)
  const index = spec()
  const problems = []
  if (issue.state !== 'OPEN') problems.push('the issue is closed')
  if (board.get(issue, 'Status') !== 'Todo')
    problems.push(`Status is ${board.get(issue, 'Status') || 'unset'}, not Todo`)
  const lintProblems = lint(issue, board, index)
  if (lintProblems.length) problems.push(`not ready: ${lintProblems.join('; ')}`)
  else if (
    !approvalHolds(issue, board) &&
    !approveFromDocs(issue, board, index, lintProblems, planQuestions()).ok
  ) {
    problems.push('not approved: the owner approves its journey with scripts/agent approve-journey')
  }
  const blockers = openBlockers(issue.number)
  if (blockers.length)
    problems.push(
      `blocked by open ${blockers.map((b) => `#${b}`).join(', ')} (early start: AGENTS.md, Execution rules 2)`,
    )
  const linked = gh(
    ['pr', 'list', '--state', 'open', '--search', `${n} in:body`, '--json', 'number,body'],
    { json: true },
  ).filter((p) => new RegExp(`#${n}\\b`).test(p.body))
  if (linked.length) problems.push(`already has an open PR (#${linked[0].number})`)
  if (problems.length) throw new Error(`Can't claim #${n}:\n- ${problems.join('\n- ')}`)

  const branch = branchName(issue.number, issue.title)
  git(['fetch', '--quiet', 'origin'], { cwd: ROOT })
  const who = claimant()
  const result = claimBranch({
    cwd: ROOT,
    base: `origin/${repo().defaultBranch}`,
    branch,
    claimant: who,
    worktree: here ? undefined : worktreePath(ROOT, branch),
  })
  if (!result.ok)
    throw new Error(`Can't claim #${n}: ${result.reason}. Pick another task (scripts/agent next).`)
  try {
    gh(['issue', 'edit', String(n), '--add-assignee', '@me'])
    board.set(issue, 'Status', 'In Progress')
    comment(n, `Claimed by ${who} on branch \`${branch}\`.`)
  } catch (e) {
    releaseBranch({ cwd: ROOT, branch, sha: result.sha })
    throw e
  }
  return { issue, branch, path: result.path }
}

/** The parent plan issue of a task, if any. */
function parentOf(n) {
  return gh(['api', `repos/${repo().nwo}/issues/${n}/parent`], { json: true, allowFail: true })
}

function workBrief({ issue, branch, path }, name) {
  const parent = parentOf(issue.number)
  return `You are ${name}, an implementation agent for this repository. Follow AGENTS.md.

Your task is issue #${issue.number}: ${issue.title}. It is already claimed for you, on branch ${branch}; this folder (${path}) is its worktree. Work only here, and don't claim other tasks.

1. Read the issue below${parent ? `, its plan #${parent.number} (the wave contract: interfaces other tasks rely on)` : ''} and the documents it references.
2. Implement the acceptance criteria with tests (AGENTS.md, Execution rules 4 to 6). Run the checks in the README Commands for every app you change.
3. Commit (Conventional Commits), write the PR body from .github/pull_request_template.md (it must link #${issue.number}), then run: scripts/agent pr --title "<type(scope): summary>" --body-file <file>
4. If you can't finish, run: scripts/agent block ${issue.number} --reason "<what is missing and the input you need>"

Stop once the PR is open or the task is blocked.

Issue #${issue.number}:
${issue.body ?? ''}
`
}

/** Claims the best workable task (trying the next one if another agent wins it). */
function takeTask(opts = {}) {
  const board = new Board()
  for (const c of candidates(board)) {
    try {
      return claimIssue(c.number, { board, here: opts.here })
    } catch (e) {
      console.error(e.message.split('\n')[0])
    }
  }
  return null
}

// ---------- reviews ----------
const myName = () => claimant()
const labelsOf = (p) => p.labels.map((l) => l.name ?? l)

/** Open PRs that need an agent review, and that this session didn't write. */
function reviewCandidates() {
  const prs = gh(
    [
      'pr',
      'list',
      '--state',
      'open',
      '--limit',
      '100',
      '--json',
      'number,title,isDraft,labels,headRefName,headRefOid,body',
    ],
    { json: true },
  )
  const want = [RULES.riskLabels?.low, RULES.riskLabels?.medium].filter(Boolean)
  return prs
    .filter(
      (p) =>
        !p.isDraft &&
        labelsOf(p).some((l) => want.includes(l)) &&
        !labelsOf(p).includes(RULES.agentReviewLabel) &&
        (p.body ?? '').match(AUTHOR_MARK)?.[1]?.toLowerCase() !== myName().toLowerCase(),
    )
    .sort((a, b) => a.number - b.number)
}

const lockBranch = (pr) => `agent-lock/review-${pr.number}-${pr.headRefOid.slice(0, 7)}`
const releaseLock = (lock) => {
  try {
    git(['push', '--quiet', 'origin', `:refs/heads/${lock}`], { cwd: ROOT })
  } catch {
    /* already gone */
  }
}

/** Takes a review: a lock branch on the remote (one reviewer per head commit) and a worktree. */
function takeReview() {
  for (const pr of reviewCandidates()) {
    const lock = lockBranch(pr)
    git(['fetch', '--quiet', 'origin', `pull/${pr.number}/head`], { cwd: ROOT })
    try {
      git(
        [
          'push',
          '--porcelain',
          `--force-with-lease=refs/heads/${lock}:`,
          'origin',
          `${pr.headRefOid}:refs/heads/${lock}`,
        ],
        { cwd: ROOT },
      )
    } catch {
      continue
    } // another reviewer has it
    const path = worktreePath(ROOT, `review-${pr.number}-${pr.headRefOid.slice(0, 7)}`)
    if (!existsSync(path)) git(['worktree', 'add', '--detach', path, pr.headRefOid], { cwd: ROOT })
    const level =
      labelsOf(pr)
        .find((l) => l.startsWith('risk:'))
        ?.slice(5) ?? 'low'
    return { pr, path, lock, level }
  }
  return null
}

function reviewBrief({ pr, path, level }, name) {
  return `You are ${name}, a review agent for this repository. Follow AGENTS.md (Review output).

Review pull request #${pr.number}: ${pr.title} (risk: ${level}). This folder (${path}) is a detached checkout of its head commit ${pr.headRefOid.slice(0, 7)}. Don't commit or push here: you are reviewing, not fixing.

1. Read the PR description and the issue it links; check every acceptance criterion against the code and its tests.
2. Run the checks in the README Commands for every app the PR changes.
3. Write the review in the Review output format: the "Verdict:" line first, evidence for each criterion, findings, and a "Scope and risk" section${level === 'medium' ? ' (required for medium risk: say why each sensitive change is safe)' : ''}.
4. Post it: scripts/agent review ${pr.number} --body-file <file>

Approve only when every criterion has evidence and nothing is blocking. You didn't write this code; judge it on its own.
`
}

// ---------- merging ----------
let requiredCache
/** Whether the default branch requires every check in risk-rules.json requiredChecks. */
function requiredChecksOn() {
  if (requiredCache === undefined) {
    const rules =
      gh(['api', `repos/${repo().nwo}/rules/branches/${repo().defaultBranch}`], {
        json: true,
        allowFail: true,
      }) ?? []
    const have = new Set(
      rules
        .filter((r) => r.type === 'required_status_checks')
        .flatMap((r) => r.parameters?.required_status_checks ?? [])
        .map((c) => c.context),
    )
    requiredCache = (RULES.requiredChecks ?? ['ci-ok', 'risk-gate']).every((c) => have.has(c))
  }
  return requiredCache
}

// ---------- commands ----------
const commandsTable = {
  next() {
    const list = candidates()
    if (!list.length)
      return console.log(
        'No task is ready: nothing is approved, ready, unclaimed and unblocked. See `scripts/agent digest`.',
      )
    const board = new Board()
    for (const c of list.slice(0, 5))
      console.log(
        `#${c.number}  ${c.title}  [${c.priority || 'Medium'}, ${milestoneKey(c.milestone) || 'no milestone'}, ${board.get(c, 'Journey')}]`,
      )
    console.log(
      `\nClaim the first with: scripts/agent claim ${list[0].number}   (or let scripts/agent work pick it)`,
    )
  },

  claim([n], opts) {
    if (!n) throw new Error('Usage: scripts/agent claim <issue> [--here]')
    const r = claimIssue(n, { here: !!opts.here })
    console.log(`Claimed #${n} on branch ${r.branch}. Status: In Progress.\nWork in: ${r.path}`)
  },

  work(_, opts) {
    const t = takeTask(opts)
    if (!t) {
      console.log('No task is ready. See `scripts/agent digest`.')
      process.exitCode = 3
      return
    }
    console.log(workBrief(t, myName()))
  },

  'review-next'() {
    const r = takeReview()
    if (!r) {
      console.log('No pull request needs an agent review.')
      process.exitCode = 3
      return
    }
    console.log(reviewBrief(r, myName()))
  },

  pr(_, opts) {
    if (!opts.title || !opts['body-file'])
      throw new Error(
        'Usage: scripts/agent pr --title "<type(scope): …>" --body-file <file> [--draft]',
      )
    const branch = git(['branch', '--show-current'], { cwd: ROOT })
    const n = Number(branch.match(/^(\d+)-/)?.[1])
    if (!n)
      throw new Error(
        `Branch ${branch} isn't named <issue>-<title>; claim the issue with scripts/agent claim <issue>`,
      )
    let body = readFileSync(opts['body-file'], 'utf8')
    if (!new RegExp(`#${n}\\b`).test(body))
      throw new Error(`The PR body must link the issue (#${n}), under "Related issue".`)
    // The author's name lets the risk gate require a different session for medium-risk reviews.
    if (!AUTHOR_MARK.test(body)) body = `${body.trimEnd()}\n\n<!-- agent:author ${claimant()} -->\n`
    git(['push', '--quiet', '-u', 'origin', branch], { cwd: ROOT })
    const args = [
      'pr',
      'create',
      '--title',
      opts.title,
      '--body-file',
      tempFile('pr.md', body),
      '--head',
      branch,
    ]
    if (opts.draft) args.push('--draft')
    console.log(gh(args))
    if (!opts.draft) new Board().set(getIssue(n), 'Status', 'In Review')
    const risk = localRisk(opts.base)
    console.log(
      `Risk: ${risk.level}${risk.reasons.length ? ` (${risk.reasons.slice(0, 3).join('; ')})` : ''}`,
    )
    console.log(
      {
        high: 'High risk: the owner approves the merge (human:merge-ok, or merges it).',
        medium:
          'Medium risk: merges after an approving review by a different agent session (scripts/agent review-next).',
        low: 'Low risk: merges after an approving agent review (scripts/agent review-next).',
      }[risk.level],
    )
    if (RULES.autoMerge && !opts.draft) {
      if (requiredChecksOn()) {
        gh(['pr', 'merge', branch, '--auto', '--merge'], { allowFail: true })
        console.log('Auto-merge is on: it merges when ci-ok and risk-gate pass.')
      } else {
        console.log(
          `Auto-merge not turned on: ${repo().defaultBranch} doesn't require ${(RULES.requiredChecks ?? []).join(' and ')} yet (docs/GITHUB.md, Merging).`,
        )
      }
    }
  },

  block([n], opts) {
    if (!n || !opts.reason)
      throw new Error(
        'Usage: scripts/agent block <issue> --reason "<problem and the input needed>"',
      )
    const issue = getIssue(n)
    new Board().set(issue, 'Status', 'Blocked')
    gh(['issue', 'edit', String(n), '--add-label', 'needs:human-input'])
    comment(n, `**Blocked.** ${opts.reason}`)
    console.log(`#${n} is Blocked and waiting on the owner.`)
  },

  ask([n], opts) {
    if (!n || !opts.question)
      throw new Error('Usage: scripts/agent ask <issue> --question "<question>"')
    gh(['issue', 'edit', String(n), '--add-label', 'needs:human-input'])
    comment(
      n,
      `**Question for the owner:** ${opts.question}\n\nAnswer here; remove \`needs:human-input\` when answered.`,
    )
    console.log(`Asked on #${n}.`)
  },

  ready(nums, opts) {
    const board = new Board()
    const index = spec()
    const plans = planQuestions()
    const issues = opts.all || !nums.length ? openTasks() : nums.map(getIssue)
    let bad = 0
    for (const issue of issues) {
      const problems = lint(issue, board, index)
      board.set(issue, 'AI Ready', problems.length ? 'No' : 'Yes')
      if (problems.length) {
        bad++
        console.log(`#${issue.number} not ready:\n    - ${problems.join('\n    - ')}`)
        continue
      }
      const holds = approvalHolds(issue, board)
      const docs = holds ? null : approveFromDocs(issue, board, index, problems, plans)
      console.log(
        `#${issue.number} ready; ${holds ? 'approved' : docs.ok ? `approved by the ${docs.why}` : `awaiting the owner (${docs.why})`}`,
      )
    }
    if (bad) process.exitCode = 1
  },

  plan(_, opts) {
    if (!opts.file) throw new Error('Usage: scripts/agent plan --file <plan.json> [--dry-run]')
    planCommand(JSON.parse(readFileSync(opts.file, 'utf8')), !!opts['dry-run'])
  },

  'approve-journey'([journey], opts) {
    humanOnly()
    if (!journey)
      throw new Error(
        'Usage: scripts/agent approve-journey <J-xx|Platform> [--milestone M1] [--dry-run]',
      )
    const index = spec()
    if (journey !== PLATFORM && !index.journeys.has(journey))
      throw new Error(`${journey} isn't in docs/FEATURES.md (Journeys)`)
    const wantMs =
      journey === PLATFORM ? milestoneKey(opts.milestone) : index.journeys.get(journey).milestone
    if (journey === PLATFORM && !wantMs)
      throw new Error('Platform work is approved per milestone: add --milestone M1')
    approveJourney(journey, wantMs, new Board(), index, opts['dry-run'])
  },

  'approve-milestone'([ms], opts) {
    humanOnly()
    const key = milestoneKey(ms)
    if (!key) throw new Error('Usage: scripts/agent approve-milestone <M1> [--dry-run]')
    const index = spec()
    const board = new Board()
    const journeys = [...index.journeys].filter(([, j]) => j.milestone === key).map(([id]) => id)
    for (const j of [...journeys, PLATFORM]) approveJourney(j, key, board, index, opts['dry-run'])
  },

  review([pr], opts) {
    if (!pr || !opts['body-file'])
      throw new Error('Usage: scripts/agent review <pr> --body-file <file>')
    let body = readFileSync(opts['body-file'], 'utf8')
    const first = body
      .replace(/\r/g, '')
      .split('\n')
      .find((l) => l.trim())
    if (!VERDICT_FIRST_LINE.test(first ?? ''))
      throw new Error(
        'The review must start with "Verdict: Approve | Request changes | Comment only" (AGENTS.md, Review output).',
      )
    const info = gh(['pr', 'view', String(pr), '--json', 'body,labels,headRefOid'], { json: true })
    const author = (info.body ?? '').match(AUTHOR_MARK)?.[1]
    if (author && author.toLowerCase() === myName().toLowerCase())
      throw new Error(
        `You (${myName()}) wrote #${pr}; a different session reviews it (set AGENT_NAME).`,
      )
    if (!REVIEWER_MARK.test(body))
      body = `${body.trimEnd()}\n\n<!-- agent:reviewer ${myName()} -->\n`
    // A comment review: GitHub doesn't let the PR's author approve it, and agents use the owner's login.
    gh(['pr', 'review', String(pr), '--comment', '--body-file', tempFile('review.md', body)])
    const label = RULES.agentReviewLabel ?? 'agent:reviewed'
    // Adding the label (with a person's token) re-runs the risk gate from the default branch.
    if (labelsOf(info).includes(label)) gh(['pr', 'edit', String(pr), '--remove-label', label])
    gh(['pr', 'edit', String(pr), '--add-label', label])
    releaseLock(lockBranch({ number: pr, headRefOid: info.headRefOid }))
    console.log(`Review posted on #${pr}; the risk gate runs again.`)
  },

  loop(_, opts) {
    loopCommand(opts)
  },

  swarm(_, opts) {
    const workers = Number(opts.workers ?? 2),
      reviewers = Number(opts.reviewers ?? 1)
    const pass = ['--wait', String(opts.wait ?? 120)]
    if (opts.cmd) pass.push('--cmd', opts.cmd)
    if (opts.max) pass.push('--max', String(opts.max))
    const kids = []
    const start = (role, name) => {
      const child = spawn(
        process.execPath,
        [SELF, 'loop', '--role', role, '--name', name, ...pass],
        { cwd: ROOT, stdio: 'inherit' },
      )
      kids.push(child)
    }
    for (let i = 1; i <= workers; i++) start('work', `worker-${i}`)
    for (let i = 1; i <= reviewers; i++) start('review', `reviewer-${i}`)
    console.log(`Started ${workers} worker(s) and ${reviewers} reviewer(s). Ctrl+C stops them.`)
    process.on('SIGINT', () => {
      for (const k of kids) k.kill()
      process.exit(130)
    })
  },

  cleanup() {
    const main = mainRoot(ROOT)
    let removed = 0
    const prs = gh(
      [
        'pr',
        'list',
        '--state',
        'all',
        '--limit',
        '200',
        '--json',
        'number,state,headRefName,labels',
      ],
      { json: true },
    )
    for (const w of worktrees(main)) {
      if (!w.path.replace(/\\/g, '/').includes('/.worktrees/')) continue
      const review = w.path.match(/review-(\d+)-/)
      const pr = review
        ? prs.find((p) => p.number === Number(review[1]))
        : prs.find((p) => p.headRefName === w.branch)
      const done =
        pr && (pr.state !== 'OPEN' || (review && labelsOf(pr).includes(RULES.agentReviewLabel)))
      if (!done) continue
      try {
        git(['worktree', 'remove', w.path], { cwd: main })
        if (w.branch) git(['branch', '-D', w.branch], { cwd: main })
        removed++
        console.log(`removed ${w.path}`)
      } catch (e) {
        console.log(`kept ${w.path}: ${String(e.stderr || e.message).split('\n')[0]}`)
      }
    }
    const locks = git(['ls-remote', '--heads', 'origin', 'agent-lock/*'], { cwd: main })
      .split('\n')
      .filter(Boolean)
    for (const l of locks) {
      const ref = l.split('\t')[1]
      const n = Number(ref.match(/review-(\d+)-/)?.[1])
      const pr = prs.find((p) => p.number === n)
      if (!pr || pr.state !== 'OPEN' || labelsOf(pr).includes(RULES.agentReviewLabel)) {
        git(['push', '--quiet', 'origin', `:${ref}`], { cwd: main })
        console.log(`released ${ref.replace('refs/heads/', '')}`)
      }
    }
    git(['worktree', 'prune'], { cwd: main })
    console.log(`${removed} worktree(s) removed.`)
  },

  risk(_, opts) {
    const r = localRisk(opts.base)
    console.log(`Risk: ${r.level}`)
    for (const x of r.reasons) console.log(`- ${x}`)
  },

  digest() {
    const board = new Board()
    const index = spec()
    const tasks = openTasks()
    const plans = planQuestions()
    const out = []
    const section = (title, lines) => {
      if (lines.length) out.push(`## ${title}`, ...lines, '')
    }
    const prs = gh(['pr', 'list', '--state', 'open', '--json', 'number,title,isDraft,labels,url'], {
      json: true,
    })
    section(
      'Pull requests waiting for your merge or human:merge-ok',
      prs
        .filter(
          (p) =>
            !p.isDraft &&
            !labelsOf(p).includes(RULES.humanOkLabel) &&
            !labelsOf(p).some((l) => l === RULES.riskLabels?.low || l === RULES.riskLabels?.medium),
        )
        .map(
          (p) =>
            `- #${p.number} ${p.title} (${labelsOf(p).find((l) => l.startsWith('risk:')) ?? 'risk not judged yet'})`,
        ),
    )
    section(
      'Questions and blocked tasks (needs:human-input)',
      tasks
        .filter((i) => i.labels.some((l) => l.name === 'needs:human-input'))
        .map((i) => `- #${i.number} ${i.title} (${board.get(i, 'Status')})`),
    )
    section(
      'Plans with open questions',
      [...plans].filter(([, q]) => q).map(([k]) => `- ${k}: answer on its [Plan] issue`),
    )
    const awaiting = new Map()
    for (const i of tasks) {
      if (board.get(i, 'Human Review') === 'Approved' && approvalHolds(i, board, { fix: false }))
        continue
      const problems = lint(i, board, index)
      const j = board.get(i, 'Journey') || journeyOf(i.body ?? '', index)
      const ms = milestoneKey(i.milestone?.title)
      // Tasks the approved documents will approve don't need the owner.
      if (
        !problems.length &&
        docsApproval({
          body: i.body ?? '',
          index,
          milestone: i.milestone?.title,
          docs: DOCS(),
          roadmap: read('docs/ROADMAP.md'),
          openQuestions: plans.get(`${ms} ${j}`),
        }).ok &&
        RULES.approval?.fromApprovedDocs
      )
        continue
      const key = j === PLATFORM ? `${PLATFORM} ${ms}`.trim() : j
      const e = awaiting.get(key) ?? { ready: 0, notReady: 0 }
      e[problems.length ? 'notReady' : 'ready']++
      awaiting.set(key, e)
    }
    section(
      'Journeys waiting for your approval',
      [...awaiting].sort().map(([j, e]) => {
        const name = index.journeys.get(j)?.name
        const cmd = j.startsWith(PLATFORM)
          ? `approve-journey Platform --milestone ${j.split(' ')[1] ?? 'M?'}`
          : `approve-journey ${j}`
        return `- ${j}${name ? ` ${name}` : ''}: ${e.ready} ready${e.notReady ? `, ${e.notReady} not ready yet` : ''} → scripts/agent ${cmd}`
      }),
    )
    section(
      'In progress',
      tasks
        .filter((i) => board.get(i, 'Status') === 'In Progress')
        .map((i) => `- #${i.number} ${i.title}`),
    )
    section(
      'Waiting for an agent review (no action needed)',
      prs
        .filter(
          (p) =>
            !p.isDraft &&
            labelsOf(p).some(
              (l) => l === RULES.riskLabels?.low || l === RULES.riskLabels?.medium,
            ) &&
            !labelsOf(p).includes(RULES.agentReviewLabel),
        )
        .map(
          (p) => `- #${p.number} ${p.title} (${labelsOf(p).find((l) => l.startsWith('risk:'))})`,
        ),
    )
    console.log(out.length ? out.join('\n') : 'Nothing needs you right now.')
  },
}

// ---------- plan ----------
// A plan is a milestone's work in one file:
//   { "milestone": "M1",
//     "journeys": { "J-12": { "outcome": "…", "contract": "…", "questions": "None",
//                             "deferred": { "FT-031": "reason" } },
//                   "Platform": { "outcome": "…", "contract": "None", "questions": "None" } },
//     "tasks": [ { "key": "TASK-010", "title": "…", "body": "…", "priority": "High",
//                  "complexity": "Small", "blockedBy": ["TASK-009", 12], "labels": ["app:api"] } ] }
// A bare array of tasks (or { tasks }) still works; then no plan issues are written.
function planCommand(plan, dry) {
  const tasks = Array.isArray(plan) ? plan : plan.tasks
  const journeysCfg = Array.isArray(plan) ? null : (plan.journeys ?? null)
  const index = spec()
  const milestones = gh(['api', `repos/${repo().nwo}/milestones?state=open&per_page=100`], {
    json: true,
  }).map((m) => m.title)
  const errors = [],
    warnings = []
  for (const t of tasks) {
    t.milestone ??= plan.milestone
    if (!/^TASK-\d{3,}$/.test(t.key ?? ''))
      errors.push(`${t.key ?? '(no key)'}: key must be TASK-###`)
    if (!t.title || !t.body) errors.push(`${t.key}: needs a title and a body`)
    const ms = milestones.find((m) => milestoneKey(m) === milestoneKey(t.milestone))
    if (!ms)
      errors.push(
        `${t.key}: milestone "${t.milestone}" doesn't exist on GitHub (scripts/setup-github.sh --milestones)`,
      )
    else t.milestone = ms
    t.journey = journeyOf(t.body ?? '', index)
    const problems = lintTask(t.body ?? '', index, {
      apps: appNames(),
      journey: t.journey,
      milestone: t.milestone,
    })
    if (problems.length) errors.push(`${t.key}: ${problems.join('; ')}`)
    if (journeysCfg && !journeysCfg[t.journey])
      errors.push(`${t.key}: belongs to ${t.journey}, which the plan's "journeys" doesn't describe`)
  }
  const { waves, errors: waveErrors } = planWaves(tasks)
  errors.push(...waveErrors)
  const msKey = milestoneKey(plan.milestone ?? tasks[0]?.milestone)
  if (journeysCfg) {
    for (const [j, cfg] of Object.entries(journeysCfg)) {
      if (j === PLATFORM) continue
      if (!index.journeys.has(j)) {
        errors.push(`${j} isn't in docs/FEATURES.md`)
        continue
      }
      const missing = uncoveredFeatures(
        j,
        tasks.filter((t) => t.journey === j).map((t) => t.body),
        index,
        cfg.deferred,
      )
      if (missing.length)
        errors.push(
          `${j}: approved feature(s) ${missing.join(', ')} have no task; add one or list them under "deferred" with a reason`,
        )
    }
    const inRoadmap = roadmapMilestones(read('docs/ROADMAP.md')).get(msKey) ?? new Set()
    for (const j of inRoadmap)
      if (!journeysCfg[j])
        warnings.push(`ROADMAP.md puts ${j} in ${msKey}, but this plan doesn't cover it`)
  }
  if (errors.length)
    throw new Error(`The plan has problems; nothing was written:\n- ${errors.join('\n- ')}`)
  for (const w of warnings) console.warn(`warning: ${w}`)

  const existing = new Map(openTasks().map((i) => [taskKey(i.title), i]))
  const byKeyTask = new Map(tasks.map((t) => [t.key, t]))
  console.log(`Waves (tasks in one wave can be built in parallel):`)
  waves.forEach((w, k) =>
    console.log(`  ${k + 1}. ${w.map((key) => `${key} ${byKeyTask.get(key).title}`).join(' | ')}`),
  )
  if (dry) {
    for (const t of tasks)
      console.log(
        `${existing.has(t.key) ? 'update' : 'create'} ${t.key}: ${t.title} [${t.journey}, ${milestoneKey(t.milestone)}]`,
      )
    if (journeysCfg)
      for (const j of Object.keys(journeysCfg)) console.log(`plan issue: [Plan] ${msKey} ${j}`)
    return
  }

  const board = new Board()
  const byKey = new Map()
  for (const t of tasks) {
    const title = `[Task] ${t.key}: ${t.title}`
    const labels = [...new Set(['ai:planned', ...(t.labels ?? [])])]
    let issue = existing.get(t.key)
    if (issue) {
      const args = [
        'issue',
        'edit',
        String(issue.number),
        '--title',
        title,
        '--body-file',
        '-',
        '--milestone',
        t.milestone,
      ]
      for (const l of labels) args.push('--add-label', l)
      gh(args, { input: t.body })
      issue = getIssue(issue.number)
      console.log(`updated #${issue.number} ${title}`)
    } else {
      const url = gh(
        [
          'issue',
          'create',
          '--title',
          title,
          '--body-file',
          '-',
          '--milestone',
          t.milestone,
          '--label',
          labels.join(','),
        ],
        { input: t.body },
      )
      issue = getIssue(Number(url.split('/').pop()))
      console.log(`created #${issue.number} ${title}`)
      board.set(issue, 'Status', 'Todo')
      board.set(issue, 'Human Review', 'Required')
    }
    board.set(issue, 'Journey', t.journey)
    if (t.priority) board.set(issue, 'Priority', t.priority)
    if (t.complexity) board.set(issue, 'Complexity', t.complexity)
    board.set(issue, 'AI Ready', lint(issue, board, index).length ? 'No' : 'Yes')
    approvalHolds(issue, board)
    byKey.set(t.key, issue)
  }

  // Plan issues, one per journey, holding the outcome, wave contract and open questions.
  const planIssues = new Map()
  if (journeysCfg) {
    const openPlans = listByTitle('[Plan]')
    for (const [j, cfg] of Object.entries(journeysCfg)) {
      const name = j === PLATFORM ? 'Platform work' : index.journeys.get(j).name
      const title = `[Plan] ${msKey} ${j}: ${name}`
      const mine = tasks.filter((t) => t.journey === j)
      const body = planBody({ j, name, msKey, cfg, mine, waves, byKey, index })
      const found = openPlans.find((p) => p.title.startsWith(`[Plan] ${msKey} ${j}:`))
      const msTitle = mine[0]?.milestone ?? milestones.find((m) => milestoneKey(m) === msKey)
      let issue
      if (found) {
        gh(
          [
            'issue',
            'edit',
            String(found.number),
            '--title',
            title,
            '--body-file',
            '-',
            ...(msTitle ? ['--milestone', msTitle] : []),
          ],
          { input: body },
        )
        issue = found
        console.log(`updated plan #${found.number} ${title}`)
      } else {
        const url = gh(
          [
            'issue',
            'create',
            '--title',
            title,
            '--body-file',
            '-',
            '--label',
            'ai:planned',
            ...(msTitle ? ['--milestone', msTitle] : []),
          ],
          { input: body },
        )
        issue = getIssue(Number(url.split('/').pop()))
        console.log(`created plan #${issue.number} ${title}`)
      }
      planIssues.set(j, issue.number)
    }
  }

  // Relationships once every issue exists: parent/sub-issue and blocked-by.
  const ref = (x) =>
    typeof x === 'number' || /^#?\d+$/.test(String(x))
      ? Number(String(x).replace('#', ''))
      : (byKey.get(x) ?? existing.get(x))?.number
  for (const t of tasks) {
    const issue = byKey.get(t.key)
    const parent = t.parent ? ref(t.parent) : planIssues.get(t.journey)
    if (parent)
      gh(
        [
          'api',
          '-X',
          'POST',
          `repos/${repo().nwo}/issues/${parent}/sub_issues`,
          '-F',
          `sub_issue_id=${issueId(issue.number)}`,
        ],
        { allowFail: true },
      )
    for (const b of t.blockedBy ?? []) {
      const num = ref(b)
      if (!num) {
        console.warn(`  ${t.key}: unknown dependency ${b}`)
        continue
      }
      gh(
        [
          'api',
          '-X',
          'POST',
          `repos/${repo().nwo}/issues/${issue.number}/dependencies/blocked_by`,
          '-F',
          `issue_id=${issueId(num)}`,
        ],
        { allowFail: true },
      )
    }
  }

  // Approval: the approved documents approve what they cover; the rest waits for the owner.
  const plans = planQuestions()
  const waiting = new Map()
  let byDocs = 0
  for (const t of tasks) {
    const issue = getIssue(byKey.get(t.key).number)
    const problems = lint(issue, board, index)
    if (approvalHolds(issue, board, { fix: false })) continue
    const r = approveFromDocs(issue, board, index, problems, plans)
    if (r.ok) byDocs++
    else waiting.set(t.journey, r.why)
  }
  console.log(`\n${byDocs} task(s) approved by the approved documents.`)
  for (const [j, why] of waiting) {
    console.log(
      `${j}: waits for the owner (${why}) → scripts/agent approve-journey ${j === PLATFORM ? `Platform --milestone ${msKey}` : j}`,
    )
  }
}

function planBody({ j, name, msKey, cfg, mine, waves, byKey, index }) {
  const ids = (re) =>
    [...new Set(mine.flatMap((t) => (t.body.split(/^## /m)[1] ?? '').match(re) ?? []))].sort()
  const deferred = Object.entries(cfg.deferred ?? {}).map(
    ([f, why]) => `- Left for later: ${f} (${why})`,
  )
  const taskLines = waves
    .map((w, k) => {
      const here = w.filter((key) => mine.some((t) => t.key === key))
      if (!here.length) return null
      return `- Wave ${k + 1}${here.length > 1 ? ' (in parallel)' : ''}: ${here
        .map((key) => {
          const t = mine.find((x) => x.key === key)
          const app = (t.body.match(/^## App\s*\n+([^\n]+)/m)?.[1] ?? '').trim()
          return `#${byKey.get(key).number} ${key} ${t.title}${app ? ` (${app})` : ''}`
        })
        .join('; ')}`
    })
    .filter(Boolean)
  const outcome =
    cfg.outcome ??
    (j === PLATFORM
      ? 'Repository, tooling and infrastructure work for the milestone.'
      : (index.journeys.get(j)?.goal ?? ''))
  return `## Journey and milestone
${j === PLATFORM ? 'Platform' : `${j} ${name}`}; ${msKey}

## Outcome
${outcome}

## Features and requirements
- Features: ${ids(/FT-\d{3,}/g).join(', ') || 'None (Platform work)'}
- Requirements: ${ids(/FR-\d{3,}/g).join(', ') || 'None'}
${deferred.join('\n') || '- Left for later: None'}

## Tasks
${taskLines.join('\n')}

## Wave contract
${cfg.contract?.trim() || 'None'}

## Open questions
${cfg.questions?.trim() || 'None'}

## Approval
${
  j === PLATFORM
    ? `The owner approves Platform work with \`scripts/agent approve-journey Platform --milestone ${msKey}\`.`
    : `While docs/FEATURES.md and docs/ROADMAP.md are Approved and this plan has no open questions, its tasks are approved by those documents (docs/GITHUB.md, Journey approval). Otherwise the owner approves them with \`scripts/agent approve-journey ${j}\`.`
} Approval is recorded on each task.

<!-- Written by scripts/agent plan; re-running the plan rewrites it. -->
`
}

// ---------- loops ----------
function loopCommand(opts) {
  const role = opts.role === 'review' ? 'review' : 'work'
  const name =
    opts.name ||
    process.env.AGENT_NAME ||
    `${role === 'review' ? 'reviewer' : 'worker'}-${process.pid}`
  process.env.AGENT_NAME = name
  const cmd = opts.cmd || DEFAULT_CMD
  const max = Number(opts.max ?? Infinity)
  const wait = Number(opts.wait ?? 0)
  for (let done = 0; done < max;) {
    let job
    try {
      job = role === 'work' ? takeTask() : takeReview()
    } catch (e) {
      console.error(`[${name}] ${e.message}`)
      job = null
    }
    if (!job) {
      if (!wait) {
        console.log(`[${name}] nothing to ${role === 'work' ? 'build' : 'review'}; stopping.`)
        return
      }
      sleep(wait)
      continue
    }
    const what =
      role === 'work' ? `#${job.issue.number} ${job.issue.title}` : `PR #${job.pr.number}`
    console.log(`[${name}] ${role === 'work' ? 'working on' : 'reviewing'} ${what} in ${job.path}`)
    const prompt = role === 'work' ? workBrief(job, name) : reviewBrief(job, name)
    // A fresh agent session per job, started in the job's worktree; the prompt goes on stdin.
    const r = spawnSync(cmd, {
      cwd: job.path,
      shell: true,
      input: prompt,
      stdio: ['pipe', 'inherit', 'inherit'],
      env: { ...process.env, AGENT_NAME: name },
    })
    done++
    if (role === 'work') {
      const pr = gh(['pr', 'list', '--head', job.branch, '--state', 'all', '--json', 'number'], {
        json: true,
      })
      const status = new Board().get(getIssue(job.issue.number), 'Status')
      if (!pr.length && status === 'In Progress') {
        commandsTable.block([job.issue.number], {
          reason: `The agent session (${name}) ended without a PR or a reason (exit code ${r.status}). The branch ${job.branch} has its work so far.`,
        })
      }
    } else {
      const labels = gh(['pr', 'view', String(job.pr.number), '--json', 'labels'], {
        json: true,
      }).labels.map((l) => l.name)
      if (!labels.includes(RULES.agentReviewLabel)) {
        releaseLock(job.lock)
        console.log(
          `[${name}] no review was posted on PR #${job.pr.number}; released it for another reviewer.`,
        )
      }
    }
  }
}

function approveJourney(journey, ms, board, index, dry) {
  const issues = openTasks().filter((i) => {
    const j = board.get(i, 'Journey') || journeyOf(i.body ?? '', index)
    return j === journey && (journey !== PLATFORM || milestoneKey(i.milestone?.title) === ms)
  })
  const label =
    journey === PLATFORM
      ? `${PLATFORM} (${ms})`
      : `${journey} ${index.journeys.get(journey)?.name ?? ''}`.trim()
  if (!issues.length) return console.log(`${label}: no open tasks.`)
  console.log(`${label}${dry ? ' (dry run)' : ''}:`)
  for (const issue of issues) {
    const problems = lint(issue, board, index)
    if (problems.length) {
      console.log(`  skipped #${issue.number} ${issue.title}: ${problems.join('; ')}`)
      continue
    }
    if (approvalHolds(issue, board, { fix: false })) {
      console.log(`  already approved #${issue.number} ${issue.title}`)
      continue
    }
    if (!dry)
      recordApproval(issue, board, {
        journey,
        by: 'owner',
        note: `Approved for work by the owner as part of ${label}.`,
      })
    console.log(`  approved #${issue.number} ${issue.title}`)
  }
}

function humanOnly() {
  if (
    process.env.CLAUDECODE ||
    process.env.CLAUDE_CODE_ENTRYPOINT ||
    process.env.CODEX_SANDBOX ||
    process.env.AGENT_NAME
  ) {
    throw new Error(
      'Approving is a human action: run this in your own terminal, not through an agent.',
    )
  }
}

/** Risk of the current branch against base, as the risk gate judges it (labels aside). */
function localRisk(base = `origin/${repo().defaultBranch}`) {
  const lines = git(['diff', '--name-status', '-M', `${base}...HEAD`], { cwd: ROOT })
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'))
  const files = lines.flatMap((p) => p.slice(1))
  const STATUS = { A: 'added', M: 'modified', D: 'removed', R: 'renamed', C: 'added' }
  const migrations = lines
    .filter((p) => p.slice(1).some((f) => matchesAny(f, RULES.migrationFiles)))
    .flatMap(([s, ...fs]) =>
      fs.map((f) => ({
        file: f,
        status: STATUS[s[0]] ?? 'modified',
        sql: s[0] === 'A' ? readFileSync(join(ROOT, f), 'utf8') : '',
      })),
    )
  const breaking = [],
    changed = []
  for (const f of files.filter((x) => matchesAny(x, RULES.contractFiles))) {
    const show = (ref) => {
      try {
        return git(['show', `${ref}:${f}`], { cwd: ROOT })
      } catch {
        return null
      }
    }
    const [b, h] = [show(base), show('HEAD')]
    const parse = (t) => {
      try {
        return t === null ? null : JSON.parse(t)
      } catch {
        return null
      }
    }
    const changes = breakingOpenApiChanges(parse(b), parse(h))
    if (changes.length) breaking.push(`${f}: ${changes.slice(0, 3).join('; ')}`)
    else if (b !== h) changed.push(f)
  }
  return classify([...new Set(files)], [], RULES, {
    breakingContracts: breaking,
    changedContracts: changed,
    migrations,
  })
}

// ---------- main ----------
function parse(argv) {
  const pos = [],
    opts = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) {
      pos.push(a)
      continue
    }
    const [k, v] = a.slice(2).split(/=(.*)/s)
    if (v !== undefined) opts[k] = v
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) opts[k] = argv[++i]
    else opts[k] = true
  }
  return { pos, opts }
}

const [cmd, ...rest] = process.argv.slice(2)
const run = commandsTable[cmd]
if (!run) {
  const text = readFileSync(SELF, 'utf8').split('\n')
  const end = text.findIndex((l) => l.startsWith('import '))
  console.log(
    text
      .slice(1, end)
      .map((l) => l.replace(/^\/\/ ?/, ''))
      .join('\n'),
  )
  process.exit(cmd && cmd !== 'help' && cmd !== '--help' ? 2 : 0)
}
const { pos, opts } = parse(rest)
try {
  run(pos, opts)
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
