/** Exploration gate — desk ArcTable mark launcher (brief §11–14). */

export type ArcTableDeskAccess = 'paid-live' | 'free-preview'

export function normalizeArcTableDeskAccess(raw: string | undefined): ArcTableDeskAccess {
  if (raw === 'paid-live') return 'paid-live'
  return 'free-preview'
}

/** Quadrant hit targets need ~36px corners; fall back to single control when mark is too small. */
export function quadrantLauncherMeetsA11y(markSizePx: number, _prefersReducedMotion = false): boolean {
  if (markSizePx < 88) return false
  const corner = markSizePx * 0.42
  return corner >= 36
}

type DeskDayLesson = { lessonId: string; deliveryStatus: string }
type DeskDaySection = { sectionId: string; scheduledLessons: DeskDayLesson[]; carryovers: DeskDayLesson[] }
type DeskDayProjection = { courses: Array<{ sections: DeskDaySection[] }> }

export function resolveDeskLiveLaunchTarget(day: DeskDayProjection): { sectionId: string; lessonId: string } | null {
  for (const course of day.courses) {
    for (const section of course.sections) {
      for (const lesson of [...section.scheduledLessons, ...section.carryovers]) {
        if (lesson.deliveryStatus === 'in-progress') {
          return { sectionId: section.sectionId, lessonId: lesson.lessonId }
        }
      }
    }
  }
  for (const course of day.courses) {
    for (const section of course.sections) {
      const lesson = section.scheduledLessons[0] ?? section.carryovers[0]
      if (lesson) return { sectionId: section.sectionId, lessonId: lesson.lessonId }
    }
  }
  return null
}
