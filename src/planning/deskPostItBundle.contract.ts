import {
  bundleCalendarNoteTexts,
  createBundlePlacement,
  formatBundledUnitDropNotice,
  normalizeDeskPostItBundlePlacements,
  recordBundlePlacement,
  resolveDeskPostItBundle,
  unionDeskPostItRects,
} from './deskPostItBundle'
import { EMPTY_DESK_POSTIT_LESSONS, setDeskPostItLesson } from './deskPostItLessons'
import { createDeskPostItLink, EMPTY_DESK_POSTIT_LINKS } from './deskPostItLinks'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const links = createDeskPostItLink(EMPTY_DESK_POSTIT_LINKS, ['magnet-asia', 'sticky-blue'], 'stack-asia')
const lessons = setDeskPostItLesson(EMPTY_DESK_POSTIT_LESSONS, 'sticky-blue', true)
const catalog = [
  { postItId: 'magnet-asia', form: 'magnet' as const, kind: 'unit' },
  { postItId: 'sticky-blue', form: 'sticky' as const, kind: 'lesson' },
]
const texts = { 'magnet-asia': 'Asia', 'sticky-blue': 'Cylinders' }

const bundle = resolveDeskPostItBundle({ draggedId: 'magnet-asia', links, lessons, catalog, texts })
assert(bundle.isBundledUnit, 'Unit magnet + lesson sticky must resolve as a bundled unit.')
assert(bundle.unitText === 'Asia', 'Bundle must capture unit magnet text.')
assert(bundle.lessonTexts.join(',') === 'Cylinders', 'Bundle must capture lesson sticky text.')

const notes = bundleCalendarNoteTexts(bundle)
assert(notes[0] === 'Unit: Asia' && notes[1] === 'Lesson: Cylinders', 'Bundle notes must label unit + lesson.')

const notice = formatBundledUnitDropNotice(bundle, 'Tue Sep 8')
assert(notice.includes('Asia') && notice.includes('lesson') && notice.includes('Tue Sep 8'), 'Notice must name unit, lesson, and date.')

const placement = createBundlePlacement({ date: '2026-09-08', bundle })
let store = recordBundlePlacement(normalizeDeskPostItBundlePlacements(null), placement)
assert(store.placements.length === 1, 'First placement must persist.')
store = recordBundlePlacement(store, createBundlePlacement({ date: '2026-09-08', bundle }))
assert(store.placements.length === 1, 'Same stack+date must replace prior placement.')

const union = unionDeskPostItRects([
  { left: 10, top: 20, width: 40, height: 40 },
  { left: 30, top: 40, width: 50, height: 50 },
])
assert(union && union.left === 10 && union.top === 20 && union.width === 70 && union.height === 70, 'Union rect must cover all members.')

const solo = resolveDeskPostItBundle({
  draggedId: 'alone',
  links: EMPTY_DESK_POSTIT_LINKS,
  lessons: EMPTY_DESK_POSTIT_LESSONS,
  catalog: [{ postItId: 'alone', form: 'sticky', kind: 'note' }],
  texts: { alone: 'bring clay' },
})
assert(!solo.isBundledUnit, 'Solo sticky is not a bundled unit.')
assert(bundleCalendarNoteTexts(solo)[0] === 'bring clay', 'Solo sticky still yields its text as a note.')

console.log('deskPostItBundle contract passed')
