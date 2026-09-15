import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createLesson } from './lessons'
import { moveLesson } from './objectActions'
import {
  addCalendarDayNote,
  moveCalendarDayNote,
  removeCalendarDayNote,
  setCalendarDayNoteImportant,
  updateCalendarDayNoteText,
} from './calendarNotes'
import { createPlanningNote } from './notes'
import { setCaptureImportant, moveCaptureAnchorDate } from './captureWorkspace'
import { setLessonImportant } from './lessons'
import type { LessonWorkspace } from './lessonWorkspace'
import type { UnitWorkspace } from './unitWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'interaction-laws',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-01',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})

let notes = [
  createPlanningNote({
    id: 'note-a',
    calendarId: calendar.id,
    date: '2026-09-10',
    text: 'Parent conferences',
    placement: 'calendar',
    important: true,
    sourceLabel: null,
    sourceLocator: null,
  }),
]

notes = addCalendarDayNote(notes, { calendarId: calendar.id, date: '2026-09-10', text: 'Order clay', id: 'b' })
assert(notes.length === 2, 'Day note create must append a calendar note.')
assert(notes.some((note) => note.text === 'Order clay' && note.date === '2026-09-10'), 'Created note must inherit the target date.')

notes = updateCalendarDayNoteText(notes, 'note-b', 'Order clay and slip')
assert(notes.find((note) => note.id === 'note-b')?.text === 'Order clay and slip', 'Day note text update must preserve identity.')

notes = moveCalendarDayNote(notes, 'note-a', '2026-09-12')
const moved = notes.find((note) => note.id === 'note-a')
assert(moved?.date === '2026-09-12' && moved.important === true, 'Moving a Day Note must preserve Important and metadata on the same object.')

notes = setCalendarDayNoteImportant(notes, 'note-b', true)
assert(notes.find((note) => note.id === 'note-b')?.important === true, 'Important toggle must persist on the Day Note.')

notes = removeCalendarDayNote(notes, 'note-b')
assert(!notes.some((note) => note.id === 'note-b'), 'Day note delete must remove only that note.')

const unit: UnitWorkspace = {
  calendarId: calendar.id,
  units: [{
    id: 'unit-1',
    calendarId: calendar.id,
    courseId: 'course-1',
    title: 'Line',
    placement: { startDate: '2026-09-01', endDate: '2026-09-30' },
  }],
}

const lessons: LessonWorkspace = {
  calendarId: calendar.id,
  lessons: [
    setLessonImportant(
      createLesson({
        id: 'lesson-1',
        calendarId: calendar.id,
        courseId: 'course-1',
        unitId: 'unit-1',
        title: 'Contour',
        sequence: 1,
        plannedDate: '2026-09-08',
      }),
      true,
    ),
  ],
  deliveryStates: [],
}

const movedLessons = moveLesson({
  calendar,
  units: unit,
  lessons,
  overrides: [],
  lessonId: 'lesson-1',
  plannedDate: '2026-09-09',
})

assert(
  movedLessons.lessons[0].plannedDate === '2026-09-09' && movedLessons.lessons[0].important === true,
  'Lesson move must preserve Important on the canonical Lesson object.',
)

const captures = {
  calendarId: calendar.id,
  captures: [{
    id: 'capture-1',
    calendarId: calendar.id,
    text: 'Gallery walk idea',
    createdAt: '2026-09-01T12:00:00.000Z',
    anchorDate: '2026-09-05' as const,
    important: true,
  }],
}

const movedCapture = moveCaptureAnchorDate(captures, 'capture-1', '2026-09-07')
assert(
  movedCapture.captures[0].anchorDate === '2026-09-07' && movedCapture.captures[0].important === true,
  'Capture date move must preserve Important on the same Capture.',
)

const toggled = setCaptureImportant(captures, 'capture-1', false)
assert(toggled.captures[0].important === false, 'Capture Important toggle must update canonical Capture.')

console.log('interaction laws contract passed')
