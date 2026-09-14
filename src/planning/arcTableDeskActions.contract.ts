import {
  ARC_TABLE_DESK_PREVIEW_COPY,
  deskActionToTarget,
  deskActionToTeacherTool,
  deskTargetToAction,
  resolveDeskActionLabel,
  routeArcTableDeskAction,
} from './arcTableDeskActions'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(deskTargetToAction('center') === 'open', 'Center cream opens ArcTable home.')
assert(deskTargetToAction('live') === 'startOrResume', 'Blue quadrant starts or resumes class.')
assert(deskTargetToAction('timer') === 'timerCleanup', 'Clay quadrant opens timer/cleanup.')
assert(deskTargetToAction('tools') === 'classTools', 'Mustard quadrant opens class tools.')
assert(deskTargetToAction('media') === 'mediaDirections', 'Green quadrant opens media/directions.')

assert(deskActionToTarget('timerCleanup') === 'timer', 'Timer action maps back to timer quadrant.')
assert(deskActionToTeacherTool('timerCleanup') === 'timer', 'Timer action launches timer surface.')
assert(deskActionToTeacherTool('classTools') === 'people', 'Class tools action launches people picker.')
assert(deskActionToTeacherTool('mediaDirections') === 'media', 'Media action launches media panel.')
assert(deskActionToTeacherTool('open') === null, 'Open action does not pre-select a tool.')
assert(deskActionToTeacherTool('startOrResume') === null, 'Start/resume does not pre-select a tool.')

assert(resolveDeskActionLabel('startOrResume', false) === 'Start class', 'Idle blue label is Start class.')
assert(resolveDeskActionLabel('startOrResume', true) === 'Resume class', 'Live blue label is Resume class.')
assert(resolveDeskActionLabel('open', false) === 'Open ArcTable', 'Center label opens ArcTable.')

assert(routeArcTableDeskAction('paid-live') === 'execute', 'Paid-live routes to execute.')
assert(routeArcTableDeskAction('free-preview') === 'preview', 'Free preview routes to contextual preview.')
assert(ARC_TABLE_DESK_PREVIEW_COPY.timerCleanup.title.includes('timer'), 'Timer preview copy is contextual.')

console.log('arcTable desk actions contract passed')
