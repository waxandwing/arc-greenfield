import {
  ARC_TABLE_DESK_QUADRANT_LABELS,
  deskQuadrantToTeacherTool,
} from './arcTableDeskMark'
import {
  normalizeArcTableDeskAccess,
  quadrantLauncherMeetsA11y,
  resolveDeskLiveLaunchTarget,
} from './arcTableDeskAccess'
import { consumeArcTableDeskLaunch, setArcTableDeskLaunch } from './arcTableDeskLaunch'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(normalizeArcTableDeskAccess(undefined) === 'free-preview', 'Default desk access is free preview.')
assert(normalizeArcTableDeskAccess('paid-live') === 'paid-live', 'Paid-live gate must normalize.')
assert(quadrantLauncherMeetsA11y(96, false), '96px mark should allow quadrant launcher when motion is allowed.')
assert(quadrantLauncherMeetsA11y(96, true), 'Reduced motion keeps five keyboard targets; motion is CSS-only.')
assert(!quadrantLauncherMeetsA11y(72, false), 'Small marks must fall back to single entry.')

assert(ARC_TABLE_DESK_QUADRANT_LABELS.live === 'Live class', 'Blue quadrant maps to Start/Live class.')
assert(ARC_TABLE_DESK_QUADRANT_LABELS.timer === 'Timer & cleanup', 'Clay quadrant maps to Timer/Cleanup.')
assert(ARC_TABLE_DESK_QUADRANT_LABELS.tools.includes('People'), 'Mustard quadrant maps to People/Class tools.')
assert(ARC_TABLE_DESK_QUADRANT_LABELS.media.includes('Media'), 'Green quadrant maps to Media/Directions.')
assert(deskQuadrantToTeacherTool('live') === null, 'Live quadrant starts session rather than opening a tool panel.')
assert(deskQuadrantToTeacherTool('timer') === 'timer', 'Timer quadrant opens timer focus.')
assert(deskQuadrantToTeacherTool('tools') === 'people', 'Tools quadrant opens people/class tools.')
assert(deskQuadrantToTeacherTool('media') === 'media', 'Media quadrant opens media.')

const target = resolveDeskLiveLaunchTarget({
  courses: [{
    sections: [{
      sectionId: 's1',
      scheduledLessons: [{ lessonId: 'l1', deliveryStatus: 'not-started' }],
      carryovers: [{ lessonId: 'l2', deliveryStatus: 'in-progress' }],
    }],
  }],
})
assert(target?.lessonId === 'l2', 'Desk launch resolver must prefer in-progress lessons.')

setArcTableDeskLaunch('media')
assert(consumeArcTableDeskLaunch() === 'media', 'Desk launch intent must round-trip through session storage.')
assert(consumeArcTableDeskLaunch() === null, 'Desk launch intent must be consumed once.')

console.log('arcTable desk access contract passed')
