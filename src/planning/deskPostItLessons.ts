/** Accent desk post-it lesson marks — corner-dot identity for unit + class grouping. */

export const DESK_POSTIT_LESSONS_STORAGE_KEY = 'arc.desk-postit-lessons.v1'
export const DESK_POSTIT_LESSONS_SCHEMA_VERSION = 1 as const

export type DeskPostItLessonMarks = {
  schemaVersion: typeof DESK_POSTIT_LESSONS_SCHEMA_VERSION
  /** Post-it ids considered lessons (bottom-corner dot + light marking). */
  lessonIds: string[]
}

export const EMPTY_DESK_POSTIT_LESSONS: DeskPostItLessonMarks = {
  schemaVersion: DESK_POSTIT_LESSONS_SCHEMA_VERSION,
  lessonIds: [],
}

export function normalizeDeskPostItLessons(value: unknown): DeskPostItLessonMarks {
  if (!value || typeof value !== 'object') return EMPTY_DESK_POSTIT_LESSONS
  const candidate = value as Partial<DeskPostItLessonMarks>
  const lessonIds = Array.isArray(candidate.lessonIds)
    ? candidate.lessonIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : []
  const unique = lessonIds.filter((id, index) => lessonIds.indexOf(id) === index)
  return {
    schemaVersion: DESK_POSTIT_LESSONS_SCHEMA_VERSION,
    lessonIds: unique,
  }
}

export function isDeskPostItLesson(marks: DeskPostItLessonMarks, postItId: string): boolean {
  return marks.lessonIds.includes(postItId)
}

export function setDeskPostItLesson(
  marks: DeskPostItLessonMarks,
  postItId: string,
  lesson: boolean,
): DeskPostItLessonMarks {
  const id = postItId.trim()
  if (!id) return marks
  const without = marks.lessonIds.filter((item) => item !== id)
  return {
    schemaVersion: DESK_POSTIT_LESSONS_SCHEMA_VERSION,
    lessonIds: lesson ? [...without, id] : without,
  }
}

export function loadDeskPostItLessons(
  storage: Pick<Storage, 'getItem'> | null = browserStorage(),
): DeskPostItLessonMarks {
  if (!storage) return EMPTY_DESK_POSTIT_LESSONS
  try {
    const raw = storage.getItem(DESK_POSTIT_LESSONS_STORAGE_KEY)
    if (!raw) return EMPTY_DESK_POSTIT_LESSONS
    return normalizeDeskPostItLessons(JSON.parse(raw) as unknown)
  } catch {
    return EMPTY_DESK_POSTIT_LESSONS
  }
}

export function saveDeskPostItLessons(
  marks: DeskPostItLessonMarks,
  storage: Pick<Storage, 'setItem'> | null = browserStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(DESK_POSTIT_LESSONS_STORAGE_KEY, JSON.stringify(normalizeDeskPostItLessons(marks)))
    return true
  } catch {
    return false
  }
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
