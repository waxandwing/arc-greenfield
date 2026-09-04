import { hydrateSchoolCalendar } from '../calendar'
import { createLesson } from './lessons'
import { createUnit, placeUnit } from './units'
import { createEmptyFridgeDoorState, createMagnet, placeEntity } from './fridgeDoor'
import {
  prepareLessonDeleteWithFridge,
  prepareLessonUnplaceWithFridge,
  prepareUnitDeleteWithFridge,
} from './fridgeDoorOperations'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-a',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-01',
  lastDay: '2026-09-30',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})

const unit = placeUnit(
  createUnit({ id: 'unit-a', calendarId: calendar.id, courseId: 'course-a', title: 'Medieval' }),
  calendar,
  { startDate: '2026-09-01', endDate: '2026-09-18' },
)
const emptyUnit = createUnit({ id: 'unit-empty', calendarId: calendar.id, courseId: 'course-a', title: 'Empty Unit' })
const lesson = createLesson({
  id: 'lesson-a',
  calendarId: calendar.id,
  courseId: 'course-a',
  unitId: unit.id,
  title: 'Manuscripts',
  sequence: 1,
  plannedDate: '2026-09-08',
  datePolicy: 'fixed',
})

{
  const magnet = createMagnet('Keep this visible', 'magnet-a')
  let fridge = createEmptyFridgeDoorState()
  fridge = { ...fridge, magnets: [magnet] }
  fridge = placeEntity(fridge, 'magnet:magnet-a', 'door', 0, 0)

  const result = prepareLessonUnplaceWithFridge({
    calendar,
    units: { calendarId: calendar.id, units: [unit] },
    lessons: { calendarId: calendar.id, lessons: [lesson], deliveryStates: [] },
    overrides: [{ sectionId: 'section-a', lessonId: lesson.id, plannedDate: '2026-09-09' }],
    fridge,
    capacity: { rows: 1, columns: 1 },
    lessonId: lesson.id,
  })

  const unplaced = result.lessons.lessons.find((item) => item.id === lesson.id)
  assert(unplaced?.plannedDate === null, 'Prepared Unplace must clear shared Lesson placement.')
  assert(result.overrides.every((override) => override.lessonId !== lesson.id), 'Prepared Unplace must clear Section-specific placements.')
  assert(result.removedOverrides.length === 1, 'Prepared Unplace must report cleared Section-specific placements.')
  assert(result.destination === 'drawer', 'Full Door must reserve Drawer as the discoverable Unplace destination.')
  assert(result.fridge.placements.some((item) => item.entityRef === 'lesson:lesson-a' && item.surface === 'drawer'), 'Prepared Unplace must create a discoverable Fridge representation.')
  assert(result.fridge.placements.some((item) => item.entityRef === 'magnet:magnet-a' && item.surface === 'door'), 'Prepared Unplace must not evict an existing Door item.')
}

{
  let fridge = placeEntity(createEmptyFridgeDoorState(), 'lesson:lesson-a', 'door', 0, 0)
  const result = prepareLessonDeleteWithFridge({
    calendar,
    units: { calendarId: calendar.id, units: [unit] },
    lessons: { calendarId: calendar.id, lessons: [lesson], deliveryStates: [] },
    overrides: [],
    fridge,
    lessonId: lesson.id,
  })
  assert(result.lessons.lessons.length === 0, 'Prepared Lesson Delete must use canonical Delete result.')
  assert(!result.fridge.placements.some((item) => item.entityRef === 'lesson:lesson-a'), 'Successful Lesson Delete must remove its Fridge reference.')
}

{
  const fridge = placeEntity(createEmptyFridgeDoorState(), 'lesson:lesson-a', 'door', 0, 0)
  const original = JSON.stringify(fridge)
  let blocked = false
  try {
    prepareLessonDeleteWithFridge({
      calendar,
      units: { calendarId: calendar.id, units: [unit] },
      lessons: {
        calendarId: calendar.id,
        lessons: [lesson],
        deliveryStates: [{ lessonId: lesson.id, sectionId: 'section-a', status: 'completed', taughtDate: '2026-09-08', resumeNote: null }],
      },
      overrides: [],
      fridge,
      lessonId: lesson.id,
    })
  } catch {
    blocked = true
  }
  assert(blocked, 'Canonical teaching-history blocker must still reject Lesson Delete.')
  assert(JSON.stringify(fridge) === original, 'Rejected Lesson Delete must not mutate Fridge state.')
}

{
  const fridge = placeEntity(createEmptyFridgeDoorState(), 'unit:unit-empty', 'door', 0, 0)
  const result = prepareUnitDeleteWithFridge({
    calendar,
    units: { calendarId: calendar.id, units: [emptyUnit] },
    lessons: { calendarId: calendar.id, lessons: [], deliveryStates: [] },
    overrides: [],
    fridge,
    unitId: emptyUnit.id,
  })
  assert(result.units.units.length === 0, 'Prepared Unit Delete must use canonical Delete result.')
  assert(!result.fridge.placements.some((item) => item.entityRef === 'unit:unit-empty'), 'Successful Unit Delete must remove its Fridge reference.')
}

console.log('Fridge application operation coordinator contract passed.')
