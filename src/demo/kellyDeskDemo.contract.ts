import { hydrateSchoolCalendar } from '../calendar/hydration'
import { buildKellyDeskDemoBundle } from './kellyDeskDemo'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const bundle = buildKellyDeskDemoBundle()
assert(hydrateSchoolCalendar(bundle.calendarInput).id === bundle.calendarInput.id, 'Kelly desk demo calendar must hydrate.')
assert(bundle.planContext.anchorDate === '2026-09-10', 'Kelly demo anchors Thursday of teaching week.')
assert(bundle.lessonsInput.lessons.length === 15, 'Kelly demo must seed 3 courses × 5 weekdays.')
assert(bundle.lessonsInput.lessons.some((lesson) => lesson.title === 'White Temple'), 'Kelly AP Art History lesson titles must match comp.')

console.log('Kelly desk demo contract passed')
