import {
  DESK_POSTIT_LESSONS_STORAGE_KEY,
  EMPTY_DESK_POSTIT_LESSONS,
  isDeskPostItLesson,
  loadDeskPostItLessons,
  normalizeDeskPostItLessons,
  saveDeskPostItLessons,
  setDeskPostItLesson,
} from './deskPostItLessons'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

let marks = setDeskPostItLesson(EMPTY_DESK_POSTIT_LESSONS, 'accent-pink', true)
assert(isDeskPostItLesson(marks, 'accent-pink'), 'Marking must treat the post-it as a lesson.')
assert(!isDeskPostItLesson(marks, 'accent-blue'), 'Unmarked accents must not count as lessons.')

marks = setDeskPostItLesson(marks, 'accent-pink', true)
assert(marks.lessonIds.join(',') === 'accent-pink', 'Re-marking the same id must stay idempotent.')

marks = setDeskPostItLesson(marks, 'accent-blue', true)
assert(marks.lessonIds.includes('accent-blue') && marks.lessonIds.includes('accent-pink'), 'Multiple lesson marks must coexist for unit + class grouping.')

marks = setDeskPostItLesson(marks, 'accent-pink', false)
assert(!isDeskPostItLesson(marks, 'accent-pink'), 'Clearing must remove the lesson mark.')
assert(isDeskPostItLesson(marks, 'accent-blue'), 'Clearing one mark must leave peers intact.')

const normalized = normalizeDeskPostItLessons({
  schemaVersion: 1,
  lessonIds: ['accent-pink', 'accent-pink', '', 'accent-mustard'],
})
assert(normalized.lessonIds.join(',') === 'accent-pink,accent-mustard', 'Normalize must de-dupe and drop empty ids.')

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
}
marks = setDeskPostItLesson(EMPTY_DESK_POSTIT_LESSONS, 'accent-pink', true)
assert(saveDeskPostItLessons(marks, storage), 'Lesson marks must persist to localStorage.')
assert(memory.has(DESK_POSTIT_LESSONS_STORAGE_KEY), 'Persistence must write the canonical lessons key.')
const reloaded = loadDeskPostItLessons(storage)
assert(isDeskPostItLesson(reloaded, 'accent-pink'), 'Reload must restore lesson marks.')

console.log('deskPostItLessons contract passed')
