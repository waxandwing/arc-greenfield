import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { spawnSync } from 'node:child_process'

const contracts = [
  'tests/generated/tests/calendar.contract.js',
  'tests/generated/src/calendar/projections.contract.js',
  'tests/generated/src/calendar/hydration.contract.js',
  'tests/generated/src/calendar/persistence.contract.js',
  'tests/generated/src/calendar/navigation.contract.js',
  'tests/generated/src/calendar/manualSetup.contract.js',
  'tests/generated/src/calendar/calendarProposal.contract.js',
  'tests/generated/src/calendar/sourceAcquisition.contract.js',
  'tests/generated/src/calendar/ncesSchoolIdentityProvider.contract.js',
  'tests/generated/src/calendar/terms.contract.js',
  'tests/generated/src/planning/courses.contract.js',
  'tests/generated/src/planning/units.contract.js',
  'tests/generated/src/planning/workspace.contract.js',
  'tests/generated/src/planning/dayNotes.contract.js',
  'tests/generated/src/planning/unitWorkspace.contract.js',
  'tests/generated/src/planning/deliveryState.contract.js',
  'tests/generated/src/planning/lessonWorkspace.contract.js',
  'tests/generated/src/planning/planningProjection.contract.js',
  'tests/generated/src/planning/planningProjection.hostile.contract.js',
  'tests/generated/src/planning/planningLessonSignals.contract.js',
  'tests/generated/src/planning/monthPlanningProjection.contract.js',
  'tests/generated/src/planning/planningCrossView.contract.js',
  'tests/generated/src/planning/dayContinuityProjection.contract.js',
  'tests/generated/src/planning/easelSessionProjection.contract.js',
  'tests/generated/src/planning/easelTeachingOutcome.contract.js',
  'tests/generated/src/planning/easelCoreLoop.hostile.contract.js',
  'tests/generated/src/planning/objectActions.contract.js',
  'tests/generated/src/planning/recoveryPreview.contract.js',
  'tests/generated/src/planning/recoveryShiftDraft.contract.js',
  'tests/generated/src/planning/recoveryResolution.contract.js',
  'tests/generated/src/planning/recoveryApply.contract.js',
  'tests/generated/src/planning/sameDayApproval.contract.js',
  'tests/generated/src/planning/sectionScheduleWorkspace.contract.js',
  'tests/generated/src/planning/shiftOperation.contract.js',
  'tests/generated/src/planning/shiftPersistence.contract.js',
  'tests/generated/src/planning/lessonShiftPersistence.contract.js',
]

assertManifestComplete()
for (const contract of contracts) run(process.execPath, [contract])

function assertManifestComplete() {
  const discovered = [
    ...discoverContracts('src/calendar'),
    ...discoverContracts('src/planning'),
    ...discoverContracts('tests', { topLevelOnly: true }),
  ].map(toGeneratedPath).sort()

  const listed = [...contracts].sort()
  const missing = discovered.filter((path) => !listed.includes(path))
  const stale = listed.filter((path) => !discovered.includes(path))

  if (missing.length === 0 && stale.length === 0) return

  const messages = [
    missing.length ? `Contract files missing from runner:\n- ${missing.join('\n- ')}` : null,
    stale.length ? `Runner entries without source contract:\n- ${stale.join('\n- ')}` : null,
  ].filter(Boolean)

  throw new Error(messages.join('\n\n'))
}

function discoverContracts(root, options = {}) {
  const results = []
  for (const entry of readdirSync(root)) {
    const path = join(root, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) {
      if (!options.topLevelOnly && entry !== 'generated') results.push(...discoverContracts(path, options))
      continue
    }
    if (entry.endsWith('.contract.ts')) results.push(path)
  }
  return results
}

function toGeneratedPath(sourcePath) {
  const normalized = relative('.', sourcePath).split(sep).join('/')
  return `tests/generated/${normalized.replace(/\.ts$/, '.js')}`
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
