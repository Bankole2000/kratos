import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  specIndex,
  lintTask,
  journeyOf,
  approvalHash,
  branchName,
  compareTasks,
  tableRows,
  PLATFORM,
} from '../lib/ready.mjs'

// Small spec documents in fixtures/, so the tests don't depend on the project's own docs.
const doc = (p) =>
  readFileSync(new URL(`./fixtures/${p.split('/').pop()}`, import.meta.url), 'utf8')
const index = specIndex({
  features: doc('docs/FEATURES.md'),
  prd: doc('docs/PRD.md'),
  testing: doc('docs/TESTING.md'),
})

const body = ({
  ids = 'TASK-012 / FT-070 / FR-030 / TC-012',
  app = 'api',
  criteria = '- [ ] Zones can be drawn',
} = {}) => `## Task key, feature, requirement and test IDs
${ids}

## App
${app}

## Objective and context
Admins set up service zones.

## Requirements
- Polygon zones

## Acceptance criteria
${criteria}

## Out of scope and constraints
None

## Dependencies
None

## Testing
Integration tests.

## Definition of done
See docs/TESTING.md.
`

// IDs that exist in the current docs, looked up rather than hard-coded where possible.
const anyFr = [...index.fr][0]
const anyTc = [...index.tc][0]
const good = (ft = 'FT-070') => body({ ids: `TASK-012 / ${ft} / ${anyFr} / ${anyTc}` })

test('the spec documents parse', () => {
  assert.ok(index.ft.size === 7 && index.fr.size === 1 && index.tc.size === 1)
  assert.equal(index.ftJourney.get('FT-070'), 'J-12')
  assert.equal(index.journeys.get('J-12').milestone, 'M1')
  assert.ok(index.journeys.get('J-12').features.includes('FT-072'))
})

test('a complete task is ready', () => {
  assert.deepEqual(
    lintTask(good(), index, {
      apps: ['api'],
      journey: 'J-12',
      milestone: 'M1 - Vendors and drivers can join',
    }),
    [],
  )
})

test('missing, empty and out-of-order sections', () => {
  const b = good()
    .replace('## Testing\nIntegration tests.\n', '')
    .replace('Admins set up service zones.', '<!-- todo -->')
  const p = lintTask(b, index)
  assert.ok(p.includes('missing section "## Testing"'))
  assert.ok(p.includes('section "## Objective and context" is empty'))
  const swapped = good().replace('## App\napi', '## Appx\napi') + '\n## App\napi\n'
  assert.ok(lintTask(swapped, index).some((x) => x.includes('out of order')))
  assert.ok(
    lintTask(body({ criteria: '- [ ]' }), index).some((x) => x.includes('acceptance criteria')),
  )
  assert.ok(
    lintTask(good().replace('Polygon zones', 'None'), index).includes(
      'section "## Requirements" can\'t be "None"',
    ),
  )
})

test('IDs must exist and features must be approved', () => {
  const p = lintTask(body({ ids: 'TASK-1 / FT-999 / FR-999 / TC-999' }), index)
  assert.ok(p.includes('no task key (TASK-###)'))
  assert.ok(p.includes('FT-999 is not in docs/FEATURES.md'))
  assert.ok(p.includes('FR-999 is not in docs/PRD.md'))
  assert.ok(p.includes('TC-999 is not in docs/TESTING.md'))
  const notApproved = [...index.ft].find(([, s]) => s !== 'approved')?.[0]
  if (notApproved)
    assert.ok(lintTask(good(notApproved), index).some((x) => x.startsWith(`${notApproved} is`)))
})

test('Platform work: repo or infra without product IDs', () => {
  const platform = body({ ids: 'TASK-001 / Platform', app: 'repo' })
  assert.deepEqual(
    lintTask(platform, index, { journey: PLATFORM, milestone: 'M0 - Foundation' }),
    [],
  )
  assert.equal(journeyOf(platform, index), PLATFORM)
  // App code still needs IDs.
  assert.ok(
    lintTask(body({ ids: 'TASK-001 / Platform', app: 'api' }), index).some((x) =>
      x.startsWith('no feature ID'),
    ),
  )
})

test('journey and milestone must match the features', () => {
  assert.equal(journeyOf(good(), index), 'J-12')
  assert.ok(
    lintTask(good(), index, { journey: 'J-05' }).includes(
      'Journey is J-05, but the task belongs to J-12',
    ),
  )
  assert.ok(lintTask(good(), index, { journey: '' }).includes('no Journey set (expected J-12)'))
  assert.ok(
    lintTask(good(), index, { milestone: 'M2 - Customers' }).includes(
      'milestone is M2, but J-12 is delivered in M1',
    ),
  )
  assert.ok(lintTask(good(), index, { milestone: '' }).includes('no milestone'))
  const twoJourneys = body({ ids: `TASK-012 / FT-070, FT-001 / ${anyFr} / ${anyTc}` })
  assert.ok(
    lintTask(twoJourneys, index).some((x) => x.startsWith('features belong to several journeys')),
  )
})

test('approval hash ignores ticks and formatting, not scope', () => {
  const h = approvalHash(good())
  assert.equal(approvalHash(good().replace('- [ ] Zones', '- [x] Zones')), h)
  assert.equal(approvalHash(good().replace(/\n/g, '\r\n\n') + '<!-- note -->'), h)
  assert.notEqual(approvalHash(good().replace('Polygon zones', 'Polygon and circle zones')), h)
})

test('branch names and task order', () => {
  assert.equal(
    branchName(42, '[Task] TASK-012: Service zones — draw & edit'),
    '42-service-zones-draw-edit',
  )
  assert.equal(branchName(7, '[Task] TASK-1: Café'), '7-cafe')
  const tasks = [
    { number: 3, priority: 'Medium', milestone: 'M1 - x' },
    { number: 9, priority: 'High', milestone: 'M2 - y' },
    { number: 2, priority: 'Medium', milestone: 'M1 - x' },
    { number: 1, priority: 'Medium', milestone: 'M2 - y' },
  ].sort(compareTasks)
  assert.deepEqual(
    tasks.map((t) => t.number),
    [9, 2, 3, 1],
  )
})

test('tableRows stops at the end of the first table', () => {
  const md =
    '## T\n\n| ID | A |\n|---|---|\n| 1 | x |\n\ntext\n\n| ID | A |\n|---|---|\n| 2 | y |\n'
  assert.deepEqual(tableRows(md, 'T'), [{ ID: '1', A: 'x' }])
})
