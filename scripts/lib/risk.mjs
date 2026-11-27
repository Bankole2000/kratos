// Risk classification for pull requests (docs/GITHUB.md, "Merging and the risk gate").
// Pure functions, shared by the risk-gate workflow (scripts/lib/risk-gate.mjs) and
// `scripts/agent risk`, so both classify a change the same way.
// The rules live in .github/risk-rules.json. Levels: high (a human merges), medium (an
// approving review by a different agent session than the author's), low (any approving
// agent review).

/** Converts a glob (`**` any path, `*` anything but `/`, `?` one character) to a RegExp. */
export function globToRegExp(glob) {
  let re = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // `**/` matches zero or more folders; a trailing `**` matches the rest.
        if (glob[i + 2] === '/') {
          re += '(?:.*/)?'
          i += 2
        } else {
          re += '.*'
          i += 1
        }
      } else {
        re += '[^/]*'
      }
    } else if (c === '?') {
      re += '[^/]'
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    }
  }
  return new RegExp(`^${re}$`)
}

export function matchesAny(path, globs) {
  return (globs ?? []).find((g) => globToRegExp(g).test(path))
}

/** Labels may be written with a trailing `*` (e.g. `review:*`). */
function labelMatches(label, pattern) {
  return pattern.endsWith('*') ? label.startsWith(pattern.slice(0, -1)) : label === pattern
}

/** A sensitive word that is a whole path segment (or part of one split by _ . -), or null. */
function keyword(path, words) {
  if (!words?.length) return null
  const m = path.match(new RegExp(`(^|[/_.-])(${words.join('|')})([/_.-]|$)`, 'i'))
  return m ? m[2].toLowerCase() : null
}

/** Destructive statements in a migration's SQL (comments ignored), or []. */
export function destructiveSql(sql, rules) {
  if (!sql || !rules.destructiveSql) return []
  const code = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  return [
    ...new Set(
      (code.match(new RegExp(rules.destructiveSql, 'gi')) ?? []).map((s) =>
        s.replace(/\s+/g, ' ').toUpperCase(),
      ),
    ),
  ]
}

/**
 * Classifies a change.
 * @param {string[]} files   changed paths (renamed files: both old and new path)
 * @param {string[]} labels  labels on the pull request
 * @param {object}   rules   .github/risk-rules.json
 * @param { {breakingContracts?: string[], changedContracts?: string[],
 *          migrations?: {file: string, status: string, sql?: string}[]}} [extra]
 *   contract files with breaking or additive changes, and changed migration files with
 *   their status (added, modified, removed, renamed) and, for added ones, their SQL
 * @returns { {level: 'high'|'medium'|'low', reasons: string[]} } the reasons for that level
 */
export function classify(files, labels, rules, extra = {}) {
  const high = [],
    medium = []
  const migrations = new Map((extra.migrations ?? []).map((m) => [m.file, m]))
  for (const f of files) {
    if (matchesAny(f, rules.contractFiles)) continue // judged by content below
    if (matchesAny(f, rules.migrationFiles)) {
      const m = migrations.get(f)
      if (!m || m.status !== 'added')
        high.push(`${f} (${m ? m.status : 'changed'} migration; migrations are forward-only)`)
      else {
        const bad = destructiveSql(m.sql, rules)
        if (bad.length) high.push(`${f} (destructive migration: ${bad.join(', ')})`)
        else medium.push(`${f} (new additive migration)`)
      }
      continue
    }
    const hp = matchesAny(f, rules.high?.paths)
    if (hp) {
      high.push(`${f} (matches ${hp})`)
      continue
    }
    const inScope = matchesAny(f, rules.keywordScope)
    const hk = inScope && keyword(f, rules.high?.keywords)
    if (hk) {
      high.push(`${f} (sensitive area: ${hk})`)
      continue
    }
    const mp = matchesAny(f, rules.medium?.paths)
    if (mp) {
      medium.push(`${f} (matches ${mp})`)
      continue
    }
    const mk = inScope && keyword(f, rules.medium?.keywords)
    if (mk) medium.push(`${f} (sensitive area: ${mk})`)
  }
  for (const c of extra.breakingContracts ?? []) high.push(`${c} (breaking API contract change)`)
  for (const c of extra.changedContracts ?? []) medium.push(`${c} (additive API contract change)`)
  for (const l of labels) {
    if ((rules.high?.labels ?? []).some((p) => labelMatches(l, p))) high.push(`label ${l}`)
  }
  if (high.length) return { level: 'high', reasons: high }
  if (medium.length) return { level: 'medium', reasons: medium }
  return { level: 'low', reasons: [] }
}

/**
 * Lists breaking changes between two OpenAPI documents: removed paths or operations,
 * removed schemas or schema properties, newly required properties or parameters.
 * Additive changes are not breaking (docs/TECHNICAL.md, compatibility rules).
 */
export function breakingOpenApiChanges(base, head) {
  if (!base) return []
  if (!head) return ['contract file removed']
  const out = []
  const methods = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options']
  for (const [p, ops] of Object.entries(base.paths ?? {})) {
    const h = head.paths?.[p]
    if (!h) {
      out.push(`path removed: ${p}`)
      continue
    }
    for (const m of methods) {
      if (!ops[m]) continue
      if (!h[m]) {
        out.push(`operation removed: ${m.toUpperCase()} ${p}`)
        continue
      }
      const baseReq = new Set(
        (ops[m].parameters ?? []).filter((x) => x.required).map((x) => `${x.in}:${x.name}`),
      )
      for (const x of h[m].parameters ?? []) {
        if (x.required && !baseReq.has(`${x.in}:${x.name}`))
          out.push(`new required parameter: ${x.in} ${x.name} on ${m.toUpperCase()} ${p}`)
      }
    }
  }
  const bs = base.components?.schemas ?? {}
  const hs = head.components?.schemas ?? {}
  for (const [name, s] of Object.entries(bs)) {
    const t = hs[name]
    if (!t) {
      out.push(`schema removed: ${name}`)
      continue
    }
    for (const prop of Object.keys(s.properties ?? {})) {
      if (!(t.properties ?? {})[prop]) out.push(`property removed: ${name}.${prop}`)
    }
    const req = new Set(s.required ?? [])
    for (const r of t.required ?? []) if (!req.has(r)) out.push(`newly required: ${name}.${r}`)
  }
  return out
}

// Markers scripts/agent writes, so the gate can tell agent sessions apart: they all use the
// owner's GitHub login. `scripts/agent pr` puts the author's name in the PR body and
// `scripts/agent review` puts the reviewer's name in the review.
export const AUTHOR_MARK = /<!--\s*agent:author\s+(.+?)\s*-->/
export const REVIEWER_MARK = /<!--\s*agent:reviewer\s+(.+?)\s*-->/

/**
 * Whether an approving review is independent enough for a medium-risk PR: written by a
 * named agent session other than the PR's author, with a "Scope and risk" section.
 */
export function independentReview(prBody, reviewBody) {
  const author = (prBody ?? '').match(AUTHOR_MARK)?.[1]
  const reviewer = (reviewBody ?? '').match(REVIEWER_MARK)?.[1]
  if (!reviewer)
    return { ok: false, why: 'the review has no reviewer name (post it with scripts/agent review)' }
  if (author && author.toLowerCase() === reviewer.toLowerCase())
    return { ok: false, why: `the reviewer (${reviewer}) is the author` }
  if (!/^\s*(#+\s*)?Scope and risk\b/im.test(reviewBody))
    return { ok: false, why: 'the review has no "Scope and risk" section' }
  return { ok: true, why: `reviewed by ${reviewer}${author ? `, written by ${author}` : ''}` }
}
