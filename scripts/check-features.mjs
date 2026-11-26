#!/usr/bin/env node
// Checks docs/FEATURES.md against itself and docs/PRD.md, and keeps its generated parts
// up to date. No dependencies; needs Node 18 or later.
//
// Usage:
//   node scripts/check-features.mjs           # check only (CI); exits 1 on any problem
//   node scripts/check-features.mjs --write   # also rewrite the generated parts
//
// Checks:
//   - IDs are unique; every reference (U-, A-, R-, S-, J-, FT-) points at an existing row.
//   - Each feature names a user, action, resource and at least one surface, and has a
//     valid priority and status.
//   - Each feature is listed in its journey, and each journey lists only its own features.
//   - The PRD's requirements reference only existing features, and every approved
//     feature is referenced by at least one requirement (FEATURES.md feeds the PRD).
//   - If docs/ROADMAP.md's Milestones table has a Journeys column: each journey is in at
//     most one milestone, and no feature depends on one in a later milestone. A summary
//     of what each milestone delivers is printed.
// Generated (rewritten by --write, checked otherwise):
//   - The Features table's Requirements column, from the PRD's Features column.
//   - The Journeys table's Milestone column, from ROADMAP.md's Journeys column.
//   - The coverage matrix between <!-- matrix:start --> and <!-- matrix:end -->.
//
// Rows still holding template placeholders (double curly braces) are not checked, so the
// script passes on a fresh copy of the template.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const featuresPath = join(root, 'docs', 'FEATURES.md')
const prdPath = join(root, 'docs', 'PRD.md')
const write = process.argv.includes('--write')

if (!existsSync(featuresPath)) {
  console.log('docs/FEATURES.md not found; nothing to check.')
  process.exit(0)
}
let text = readFileSync(featuresPath, 'utf8')
const prd = existsSync(prdPath) ? readFileSync(prdPath, 'utf8') : ''
const eol = text.includes('\r\n') ? '\r\n' : '\n'

const PRIORITIES = ['Must', 'Should', 'Could', "Won't"]
const STATUSES = ['proposed', 'approved', 'deferred', 'out-of-scope']
const ID_RE = /\b(?:U|A|R|S|J|FT|FR)-\d+\b/g
const hasPlaceholder = (s) => /\{\{[^{}]*\}\}/.test(s)
const idsIn = (s) => String(s).match(ID_RE) ?? []

// Table cells, honouring escaped pipes (\|).
function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim())
}

// The table under "## <heading>": { header, rows: [{ line, cells, obj }] }.
function table(source, heading) {
  const lines = source.split(/\r?\n/)
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`)
  const result = { header: null, rows: [] }
  if (start < 0) return result
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    const l = lines[i].trim()
    if (!l.startsWith('|')) {
      if (result.rows.length) break
      continue
    }
    if (/^\|[\s:|-]+\|$/.test(l)) continue
    const cells = splitRow(l)
    if (!result.header) result.header = cells
    else
      result.rows.push({
        line: i,
        cells,
        obj: Object.fromEntries(result.header.map((h, j) => [h, cells[j] ?? ''])),
      })
  }
  return result
}

const errors = []
const lists = {
  users: table(text, 'Users'),
  actions: table(text, 'Actions'),
  resources: table(text, 'Resources'),
  surfaces: table(text, 'Surfaces'),
  journeys: table(text, 'Journeys'),
  features: table(text, 'Features'),
}
const byId = new Map()
for (const [name, t] of Object.entries(lists)) {
  if (!t.header) errors.push(`FEATURES.md: missing the "${name}" table`)
  for (const r of t.rows) {
    const id = r.obj.ID
    if (!/^(?:U|A|R|S|J|FT)-\d+$/.test(id)) {
      if (!hasPlaceholder(r.cells.join('')))
        errors.push(`FEATURES.md line ${r.line + 1}: "${id}" is not an ID`)
      continue
    }
    if (byId.has(id)) errors.push(`FEATURES.md: duplicate ID ${id}`)
    byId.set(id, r.obj)
  }
}
const features = lists.features.rows.filter((r) => /^FT-\d+$/.test(r.obj.ID))
const journeys = lists.journeys.rows.filter((r) => /^J-\d+$/.test(r.obj.ID))
const known = (id, prefix) => id.startsWith(prefix) && byId.has(id)

for (const { obj: f, cells } of features) {
  if (hasPlaceholder(cells.join(''))) continue
  const at = `${f.ID}:`
  for (const [col, prefix] of [
    ['User', 'U-'],
    ['Action', 'A-'],
    ['Resource', 'R-'],
  ]) {
    const id = idsIn(f[col])[0]
    if (!id || !known(id, prefix))
      errors.push(`${at} ${col} must start with an existing ${prefix} ID (got "${f[col]}")`)
  }
  const surfaces = idsIn(f.Surfaces)
  if (!surfaces.length) errors.push(`${at} needs at least one surface`)
  for (const id of surfaces) if (!known(id, 'S-')) errors.push(`${at} unknown surface ${id}`)
  for (const id of idsIn(f['Depends on']))
    if (!known(id, 'FT-')) errors.push(`${at} depends on unknown ${id}`)
  if (f.Journey && f.Journey !== '—' && !known(f.Journey, 'J-'))
    errors.push(`${at} unknown journey "${f.Journey}"`)
  if (!PRIORITIES.includes(f.Priority))
    errors.push(`${at} priority must be one of ${PRIORITIES.join(', ')}`)
  if (!STATUSES.includes(f.Status))
    errors.push(`${at} status must be one of ${STATUSES.join(', ')}`)
  const j = journeys.find((r) => r.obj.ID === f.Journey)
  if (j && !idsIn(j.obj['Features, in order']).includes(f.ID))
    errors.push(`${at} not listed in ${f.Journey}`)
}
for (const { obj: j, cells } of journeys) {
  if (hasPlaceholder(cells.join(''))) continue
  for (const id of idsIn(j['Features, in order'])) {
    const f = features.find((r) => r.obj.ID === id)
    if (!f) errors.push(`${j.ID}: unknown feature ${id}`)
    else if (f.obj.Journey !== j.ID)
      errors.push(`${j.ID}: ${id} belongs to ${f.obj.Journey || 'no journey'}`)
  }
  const user = idsIn(j['Main user'])[0]
  if (user && !known(user, 'U-')) errors.push(`${j.ID}: unknown main user ${user}`)
}

// PRD: the requirements table with a Features column (FR-### rows).
const requirementsOf = new Map()
let prdHasFeatures = false
{
  const lines = prd.split(/\r?\n/)
  let header = null
  for (const l of lines) {
    const t = l.trim()
    if (!t.startsWith('|')) {
      header = null
      continue
    }
    if (/^\|[\s:|-]+\|$/.test(t)) continue
    const cells = splitRow(t)
    if (!header) {
      header = cells
      continue
    }
    const fr = cells[0]
    const fi = header.indexOf('Features')
    if (!/^FR-\d+$/.test(fr) || fi < 0) continue
    prdHasFeatures = true
    for (const id of idsIn(cells[fi])) {
      if (!id.startsWith('FT-')) continue
      if (!byId.has(id)) errors.push(`PRD.md ${fr}: unknown feature ${id}`)
      requirementsOf.set(id, [...(requirementsOf.get(id) ?? []), fr])
    }
  }
}
if (prdHasFeatures) {
  for (const { obj: f } of features) {
    if (f.Status === 'approved' && !requirementsOf.has(f.ID)) {
      errors.push(`${f.ID} is approved but no PRD requirement lists it in its Features column`)
    }
  }
}

// Milestones: docs/ROADMAP.md is the source. Each milestone lists the journeys it delivers
// in a Journeys column; a journey belongs to at most one milestone, and a feature may only
// depend on features delivered in the same or an earlier milestone.
const roadmapPath = join(root, 'docs', 'ROADMAP.md')
const roadmap = existsSync(roadmapPath) ? readFileSync(roadmapPath, 'utf8') : ''
const msTable = table(roadmap, 'Milestones')
const milestonesManaged = !!(msTable.header && msTable.header.includes('Journeys'))
const milestoneOf = new Map() // J-01 → 'M1'
const milestones = [] // { code, name, journeys }
if (milestonesManaged) {
  for (const r of msTable.rows) {
    const code = ((r.obj.Milestone || '').match(/^M\d+/) || [])[0]
    if (!code) continue
    const m = { code, name: r.obj.Milestone, journeys: [] }
    milestones.push(m)
    if (hasPlaceholder(r.obj.Journeys)) continue
    for (const id of idsIn(r.obj.Journeys).filter((x) => x.startsWith('J-'))) {
      if (!byId.has(id)) errors.push(`ROADMAP.md ${code}: unknown journey ${id}`)
      else if (milestoneOf.has(id))
        errors.push(`ROADMAP.md: ${id} is in both ${milestoneOf.get(id)} and ${code}`)
      else {
        milestoneOf.set(id, code)
        m.journeys.push(id)
      }
    }
  }
  const order = (code) => Number(code.slice(1))
  const msOfFeature = (f) => milestoneOf.get(f.Journey)
  for (const { obj: f } of features) {
    if (!['approved', 'proposed'].includes(f.Status) || !msOfFeature(f)) continue
    for (const dep of idsIn(f['Depends on']).filter((x) => x.startsWith('FT-'))) {
      const d = features.find((r) => r.obj.ID === dep)?.obj
      if (!d) continue
      const dm = msOfFeature(d)
      if (!dm)
        errors.push(`${f.ID} (${msOfFeature(f)}) depends on ${dep}, which is in no milestone`)
      else if (order(dm) > order(msOfFeature(f)))
        errors.push(`${f.ID} (${msOfFeature(f)}) depends on ${dep}, which comes later (${dm})`)
    }
  }
}

// Generated part 1: the Requirements column, and the journeys' Milestone column.
const lines = text.split(/\r?\n/)
const reqCol = lists.features.header ? lists.features.header.indexOf('Requirements') : -1
const stale = []
if (reqCol >= 0 && prdHasFeatures) {
  for (const r of features) {
    // "— (new)" marks a live feature still waiting for a requirement; deferred ones need none.
    const want =
      (requirementsOf.get(r.obj.ID) ?? []).join(', ') ||
      (['approved', 'proposed'].includes(r.obj.Status) ? '— (new)' : '—')
    if (r.cells[reqCol] !== want) {
      stale.push(r.obj.ID)
      const cells = [...r.cells]
      cells[reqCol] = want
      lines[r.line] = `| ${cells.join(' | ')} |`
    }
  }
}
const msCol = lists.journeys.header ? lists.journeys.header.indexOf('Milestone') : -1
const staleJourneys = []
if (msCol >= 0 && milestonesManaged) {
  for (const r of journeys) {
    if (hasPlaceholder(r.cells.join(''))) continue
    const want = milestoneOf.get(r.obj.ID) || '—'
    if (r.cells[msCol] !== want) {
      staleJourneys.push(r.obj.ID)
      const cells = [...r.cells]
      cells[msCol] = want
      lines[r.line] = `| ${cells.join(' | ')} |`
    }
  }
}
if (stale.length || staleJourneys.length) text = lines.join(eol)

// Generated part 2: the coverage matrix (users down, resources across, actions in cells).
const live = features.map((r) => r.obj).filter((f) => ['approved', 'proposed'].includes(f.Status))
const first = (s) => idsIn(s)[0]
const name = (id, col) => (byId.get(id) ?? {})[col] ?? id
const resources = lists.resources.rows
  .map((r) => r.obj.ID)
  .filter((id) => live.some((f) => first(f.Resource) === id))
const users = lists.users.rows
  .map((r) => r.obj)
  .filter((u) => /^U-\d+$/.test(u.ID) && u.Priority !== 'Deferred')
let matrix = 'No approved or proposed features yet.'
if (resources.length) {
  const rows = users.map((u) => {
    const cells = resources.map((rid) => {
      const verbs = live
        .filter((f) => first(f.User) === u.ID && first(f.Resource) === rid)
        .map((f) => name(first(f.Action), 'Verb'))
      return [...new Set(verbs)].join(', ')
    })
    return `| ${u.ID} ${u.Name} | ${cells.join(' | ')} |`
  })
  matrix = [
    `| User \\ Resource | ${resources.map((id) => name(id, 'Name')).join(' | ')} |`,
    `|---|${resources.map(() => '---').join('|')}|`,
    ...rows,
  ].join(eol)
}
const markers = /<!-- matrix:start -->[\s\S]*?<!-- matrix:end -->/
const wantMatrix = `<!-- matrix:start -->${eol}${matrix}${eol}<!-- matrix:end -->`
const matrixStale = markers.test(text) && text.match(markers)[0] !== wantMatrix
if (!markers.test(text))
  errors.push('FEATURES.md: missing the <!-- matrix:start --> and <!-- matrix:end --> markers')
if (matrixStale) text = text.replace(markers, wantMatrix)

if (write && (stale.length || staleJourneys.length || matrixStale)) {
  writeFileSync(featuresPath, text)
  console.log(
    `Updated FEATURES.md: ${stale.length} Requirements cells, ${staleJourneys.length} journey milestones${matrixStale ? ', coverage matrix' : ''}.`,
  )
} else {
  if (stale.length)
    errors.push(
      `FEATURES.md: Requirements column out of date for ${stale.join(', ')} (run node scripts/check-features.mjs --write)`,
    )
  if (staleJourneys.length)
    errors.push(
      `FEATURES.md: Milestone column out of date for ${staleJourneys.join(', ')}; ROADMAP.md decides it (run node scripts/check-features.mjs --write)`,
    )
  if (matrixStale)
    errors.push(
      'FEATURES.md: coverage matrix out of date (run node scripts/check-features.mjs --write)',
    )
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join('\n'))
  process.exit(1)
}
console.log(
  `FEATURES.md: ${features.length} features, ${journeys.length} journeys; all references resolve.`,
)

// What each milestone delivers, from ROADMAP.md's Journeys column.
if (milestonesManaged && milestones.length) {
  const approved = features.map((r) => r.obj).filter((f) => f.Status === 'approved')
  const unplanned = journeys
    .map((r) => r.obj.ID)
    .filter((id) => !milestoneOf.has(id) && approved.some((f) => f.Journey === id))
  console.log('Milestones (ROADMAP.md):')
  for (const m of milestones) {
    const fs = approved.filter((f) => m.journeys.includes(f.Journey))
    const must = fs.filter((f) => f.Priority === 'Must').length
    const js = m.journeys.map((id) => `${id} ${name(id, 'Name')}`).join(', ') || 'no journeys'
    console.log(
      `  ${m.name}: ${js}${fs.length ? ` — ${fs.length} approved features (${must} Must)` : ''}`,
    )
  }
  if (unplanned.length)
    console.log(
      `  Not in any milestone yet: ${unplanned.map((id) => `${id} ${name(id, 'Name')}`).join(', ')}`,
    )
}
