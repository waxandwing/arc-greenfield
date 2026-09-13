import type { Section } from './courses'

export type TeachingDayBlockType = 'teaching' | 'planning' | 'non-teaching'

export type TeachingDayBlock = {
  id: string
  label: string
  type: TeachingDayBlockType
  order: number
  sectionId: string | null
  startTime: string | null
  endTime: string | null
}

export type TeachingDaySchedule = {
  blocks: TeachingDayBlock[]
}

export function createTeachingDayBlock(input: Partial<TeachingDayBlock> & Pick<TeachingDayBlock, 'label' | 'type' | 'order'>): TeachingDayBlock {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return {
    id: input.id?.trim() || `day-block-${token}`,
    label: input.label.trim(),
    type: input.type,
    order: input.order,
    sectionId: input.sectionId?.trim() || null,
    startTime: input.startTime?.trim() || null,
    endTime: input.endTime?.trim() || null,
  }
}

export function normalizeTeachingDaySchedule(schedule: TeachingDaySchedule | undefined): TeachingDaySchedule | undefined {
  if (!schedule) return undefined
  return {
    blocks: schedule.blocks
      .map((block) => createTeachingDayBlock(block))
      .sort((a, b) => a.order - b.order),
  }
}

export function validateTeachingDaySchedule(schedule: TeachingDaySchedule, sections: Section[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const orders = new Set<number>()
  for (const block of schedule.blocks) {
    if (!block.id) errors.push('Teaching-day block ID is required.')
    if (ids.has(block.id)) errors.push(`Duplicate teaching-day block ID: ${block.id}.`)
    ids.add(block.id)
    if (!block.label) errors.push('Teaching-day block label is required.')
    if (!Number.isInteger(block.order) || block.order < 1) errors.push(`${block.label || block.id} needs a positive whole-number order.`)
    if (orders.has(block.order)) errors.push(`Teaching-day block order ${block.order} is duplicated.`)
    orders.add(block.order)
    if (!['teaching', 'planning', 'non-teaching'].includes(block.type)) errors.push(`${block.label || block.id} has an unsupported block type.`)
    if (block.type === 'teaching') {
      if (!block.sectionId) errors.push(`${block.label || block.id} needs a Section.`)
      else if (!sections.some((section) => section.id === block.sectionId)) errors.push(`${block.label || block.id} references a Section that does not exist.`)
    } else if (block.sectionId) errors.push(`${block.label || block.id} cannot reference a Section unless it is a teaching block.`)
    if ((block.startTime === null) !== (block.endTime === null)) errors.push(`${block.label || block.id} needs both a start and end time, or neither.`)
    if (block.startTime && !validTime(block.startTime)) errors.push(`${block.label || block.id} has an invalid start time.`)
    if (block.endTime && !validTime(block.endTime)) errors.push(`${block.label || block.id} has an invalid end time.`)
    if (block.startTime && block.endTime && block.startTime >= block.endTime) errors.push(`${block.label || block.id} must end after it starts.`)
  }
  return [...new Set(errors)]
}

export function teachingDayHasBellTimes(schedule: TeachingDaySchedule | undefined): boolean {
  return Boolean(schedule?.blocks.length && schedule.blocks.every((block) => block.startTime && block.endTime))
}

function validTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}
