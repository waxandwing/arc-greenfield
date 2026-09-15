import type { SchoolCalendar } from '../calendar/types'
import type { ISODate } from '../calendar/types'
import type { DayContinuityProjection } from './dayContinuityProjection'
import { arcTableLaunchOptions, type ArcTableLaunchOption } from './arcTableSession'

export function collectArcTableDeskLaunchOptions(input: {
  day: DayContinuityProjection
  calendar: SchoolCalendar
  liveDate: ISODate
}): ArcTableLaunchOption[] {
  const merged: ArcTableLaunchOption[] = []
  const seen = new Set<string>()
  for (const course of input.day.courses) {
    for (const section of course.sections) {
      let options: ArcTableLaunchOption[] = []
      try {
        options = arcTableLaunchOptions({
          day: input.day,
          sectionId: section.sectionId,
          calendar: input.calendar,
          liveDate: input.liveDate,
        })
      } catch {
        continue
      }
      for (const option of options) {
        const key = `${option.sectionId}:${option.lessonId}`
        if (seen.has(key)) continue
        seen.add(key)
        merged.push(option)
      }
    }
  }
  merged.sort((left, right) => {
    if (left.deliveryStatus === 'in-progress' && right.deliveryStatus !== 'in-progress') return -1
    if (right.deliveryStatus === 'in-progress' && left.deliveryStatus !== 'in-progress') return 1
    return left.title.localeCompare(right.title)
  })
  return merged
}
