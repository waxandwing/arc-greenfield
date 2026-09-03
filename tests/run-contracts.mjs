import { spawnSync } from 'node:child_process'

const contracts = [
  'tests/generated/tests/calendar.contract.js',
  'tests/generated/src/calendar/projections.contract.js',
  'tests/generated/src/calendar/hydration.contract.js',
  'tests/generated/src/calendar/persistence.contract.js',
  'tests/generated/src/calendar/navigation.contract.js',
  'tests/generated/src/calendar/manualSetup.contract.js',
  'tests/generated/src/calendar/terms.contract.js',
  'tests/generated/src/planning/courses.contract.js',
  'tests/generated/src/planning/units.contract.js',
  'tests/generated/src/planning/workspace.contract.js',
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
  'tests/generated/src/planning/recoveryPreview.contract.js',
  'tests/generated/src/planning/recoveryShiftDraft.contract.js',
  'tests/generated/src/planning/recoveryResolution.contract.js',
  'tests/generated/src/planning/recoveryApply.contract.js',
  'tests/generated/src/planning/sameDayApproval.contract.js',
  'tests/generated/src/planning/sectionScheduleWorkspace.contract.js',
  'tests/generated/src/planning/shiftOperation.contract.js',
  'tests/generated/src/planning/shiftPersistence.contract.js',
]

for (const contract of contracts) run(process.execPath, [contract])

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
