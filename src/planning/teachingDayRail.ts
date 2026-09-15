import type { TeachingDayBlock, TeachingDayBlockType } from './teachingDay'
import type { DayContinuityCourse, DayContinuityProjection } from './dayContinuityProjection'
import type { PlanningWorkspace } from './workspace'

export type TeachingDayRailItem = {
  id: string
  label: string
  type: TeachingDayBlockType
  sectionId: string | null
  courseId: string | null
  courseTitle: string | null
  sectionName: string | null
  block: TeachingDayBlock | null
  course: DayContinuityCourse | null
}

export function buildTeachingDayRail(planning: PlanningWorkspace, continuity: DayContinuityProjection): TeachingDayRailItem[] {
  const periods = continuity.courses
    .flatMap((course) => course.sections.map((section) => ({ course, section })))
    .sort((a, b) => periodNumber(a.section.sectionName) - periodNumber(b.section.sectionName))
  const numberedPeriods = periods.map((entry) => ({ entry, number: periodNumber(entry.section.sectionName) })).filter(({ number }) => Number.isFinite(number))
  const firstPeriod = numberedPeriods[0]?.number ?? 1
  const lastPeriod = numberedPeriods.at(-1)?.number ?? 0
  const legacyRail = Array.from({ length: Math.max(0, lastPeriod - firstPeriod + 1) }, (_, index) => {
    const number = firstPeriod + index
    const entry = numberedPeriods.find((candidate) => candidate.number === number)?.entry ?? null
    return toRailItem({
      id: entry?.section.sectionId ?? `legacy-planning-${number}`,
      label: `Period ${number}`,
      type: entry ? 'teaching' : 'planning',
      entry,
      block: null,
    })
  })
  const explicitRail = planning.teachingDay?.blocks.map((block) => toRailItem({
    id: block.id,
    label: block.label,
    type: block.type,
    entry: block.sectionId ? periods.find((candidate) => candidate.section.sectionId === block.sectionId) ?? null : null,
    block,
  })) ?? []
  return explicitRail.length > 0 ? explicitRail : legacyRail
}

function toRailItem(input: {
  id: string
  label: string
  type: TeachingDayBlockType
  entry: { course: DayContinuityCourse; section: DayContinuityCourse['sections'][number] } | null
  block: TeachingDayBlock | null
}): TeachingDayRailItem {
  return {
    id: input.id,
    label: input.label,
    type: input.type,
    sectionId: input.entry?.section.sectionId ?? input.block?.sectionId ?? null,
    courseId: input.entry?.course.courseId ?? null,
    courseTitle: input.entry?.course.courseTitle ?? null,
    sectionName: input.entry?.section.sectionName ?? null,
    block: input.block,
    course: input.entry?.course ?? null,
  }
}

export function periodNumber(label: string): number {
  const match = label.match(/\d+/)
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY
}
