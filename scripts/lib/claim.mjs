// Claiming a task by creating its branch on the remote (docs/GITHUB.md, "Claiming").
//
// Agents share the owner's GitHub login, so the assignee can't tell two agents apart. The
// branch is the lock instead: it is created with a push that only succeeds if the branch
// doesn't exist yet (--force-with-lease with an empty expected value). Of two agents
// claiming the same task at once, exactly one push succeeds.
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'

export function git(args, { cwd } = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

/**
 * Creates `branch` on `remote` from `base` (e.g. origin/main), with a commit naming the
 * claimant so the push carries something of its own, and checks it out locally: in a new
 * worktree at `worktree` when given, otherwise in `cwd`.
 * @returns { {ok: true, sha: string, path: string} | {ok: false, reason: string} }
 */
export function claimBranch({ cwd, remote = 'origin', base, branch, claimant, worktree }) {
  const ref = `refs/heads/${branch}`
  if (git(['ls-remote', '--heads', remote, ref], { cwd })) {
    return {
      ok: false,
      reason: `${branch} already exists on ${remote}: someone else has claimed this task`,
    }
  }
  // An empty commit on top of base: the claim is visible in the branch history.
  const tree = git(['rev-parse', `${base}^{tree}`], { cwd })
  const parent = git(['rev-parse', base], { cwd })
  // The nonce keeps two claims from the same machine in the same second from being the
  // same commit: an identical push would "succeed" for both.
  const nonce = randomBytes(4).toString('hex')
  const sha = git(
    ['commit-tree', tree, '-p', parent, '-m', `chore: claim ${branch} (${claimant}, ${nonce})`],
    { cwd },
  )
  try {
    git(['push', '--porcelain', `--force-with-lease=${ref}:`, remote, `${sha}:${ref}`], { cwd })
  } catch (e) {
    return {
      ok: false,
      reason: `${branch} was created on ${remote} by someone else first (${firstLine(e)})`,
    }
  }
  if (worktree) {
    // Its own folder, so several agents can work on one machine without switching branches
    // under each other.
    git(['worktree', 'add', '-b', branch, worktree, sha], { cwd })
    git(['branch', `--set-upstream-to=${remote}/${branch}`, branch], { cwd })
    return { ok: true, sha, path: worktree }
  }
  git(['switch', '-c', branch, sha], { cwd })
  git(['branch', `--set-upstream-to=${remote}/${branch}`], { cwd })
  return { ok: true, sha, path: cwd }
}

/** The main checkout of a repository (not a linked worktree), from any folder in it. */
export function mainRoot(cwd) {
  const common = git(['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd })
  return common.replace(/[\\/]\.git[\\/]?$/, '')
}

/**
 * Where task worktrees live: `.worktrees/<branch>` inside the main checkout (gitignored), so
 * they stay inside the folder an agent is allowed to work in.
 */
export function worktreePath(cwd, branch) {
  return `${mainRoot(cwd)}/.worktrees/${branch.replace(/[\\/]/g, '-')}`
}

/** Linked worktrees: [{ path, branch }] (branch is '' when detached). */
export function worktrees(cwd) {
  const out = []
  let cur = null
  for (const line of git(['worktree', 'list', '--porcelain'], { cwd }).split('\n')) {
    if (line.startsWith('worktree ')) {
      cur = { path: line.slice(9), branch: '' }
      out.push(cur)
    } else if (line.startsWith('branch ') && cur)
      cur.branch = line.slice(7).replace(/^refs\/heads\//, '')
  }
  return out.slice(1) // the first is the main checkout
}

/** Deletes the remote branch only if it still points at our claim commit. */
export function releaseBranch({ cwd, remote = 'origin', branch, sha }) {
  try {
    git(
      [
        'push',
        '--porcelain',
        `--force-with-lease=refs/heads/${branch}:${sha}`,
        remote,
        `:refs/heads/${branch}`,
      ],
      { cwd },
    )
    return true
  } catch {
    return false
  }
}

const firstLine = (e) =>
  String(e.stderr || e.message || e)
    .split('\n')
    .find((l) => l.trim()) ?? 'push refused'
