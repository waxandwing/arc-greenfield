import { createSection } from './courses'
import { bellTimesFromSectionLabel, createTeachingDayBlock, teachingDayHasBellTimes, validateTeachingDaySchedule } from './teachingDay'
import { deserializePlanningWorkspace, serializePlanningWorkspace } from './workspacePersistence'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }

const section = createSection({ id: 'section-p1', calendarId: 'calendar', courseId: 'course', name: 'P1' })
const schedule = { blocks: [
  createTeachingDayBlock({ id: 'block-1', label: 'Period 1', type: 'teaching', order: 1, sectionId: section.id, startTime: '08:00', endTime: '08:45' }),
  createTeachingDayBlock({ id: 'block-2', label: 'Period 2', type: 'planning', order: 2, startTime: '08:50', endTime: '09:35' }),
] }
assert(validateTeachingDaySchedule(schedule, [section]).length === 0, 'Explicit teaching and planning blocks must validate.')
assert(teachingDayHasBellTimes(schedule), 'Complete optional times must establish bell times.')
assert(validateTeachingDaySchedule({ blocks: [{ ...schedule.blocks[1], sectionId: section.id }] }, [section]).some((error) => error.includes('cannot reference')), 'Planning must not masquerade as a Section.')
assert(validateTeachingDaySchedule({ blocks: [{ ...schedule.blocks[0], sectionId: 'missing' }] }, [section]).some((error) => error.includes('does not exist')), 'Teaching blocks must reference real Sections.')
assert(validateTeachingDaySchedule({ blocks: [{ ...schedule.blocks[0], endTime: null }] }, [section]).some((error) => error.includes('both a start and end')), 'Partial bell times must remain visibly incomplete.')

const restored = deserializePlanningWorkspace(serializePlanningWorkspace({ calendarId: 'calendar', courses: [{ id: 'course', title: 'Art' }], sections: [section], teachingDay: schedule }))
assert(restored?.teachingDay?.blocks[1].type === 'planning', 'Explicit planning truth must survive persistence.')
assert(deserializePlanningWorkspace(serializePlanningWorkspace({ calendarId: 'calendar', courses: [{ id: 'course', title: 'Art' }], sections: [section] }))?.teachingDay === undefined, 'Older workspaces without a teaching day must remain compatible.')

const kellyP1 = bellTimesFromSectionLabel('P1 • 8:05–9:00')
assert(kellyP1?.startTime === '08:05' && kellyP1.endTime === '09:00', 'Class labels must yield the embedded period times teachers already see.')
const kellyP5 = bellTimesFromSectionLabel('P5 • 12:35–1:30')
assert(kellyP5?.startTime === '12:35' && kellyP5.endTime === '13:30', 'Afternoon shorthand end times must cross noon correctly.')
assert(bellTimesFromSectionLabel('Period 2') === null, 'Labels without a time range must not invent starts/ends.')

console.log('explicit teaching-day contract passed')
