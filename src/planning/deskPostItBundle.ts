/** Linked unit-magnet + lesson sticky packages dropped onto planner dates. */

import type { ISODate } from '../calendar/types'
import { deskPostItStackForMember, type DeskPostItLinkWorkspace } from './deskPostItLinks'
import { isDeskPostItLesson, type DeskPostItLessonMarks } from './deskPostItLessons'

export const DESK_POSTIT_BUNDLE_PLACEMENTS_STORAGE_KEY = 'arc.desk-postit-bundle-placements.v1'
export const DESK_POSTIT_BUNDLE_PLACEMENTS_SCHEMA_VERSION = 1 as const

export type DeskPostItBundleMemberKind = 'unit-magnet' | 'lesson' | 'other'

export type DeskPostItBundleMember = {
  postItId: string
  kind: DeskPostItBundleMemberKind
  text: string
  form?: 'sticky' | 'magnet'
  captureKind?: string | null
}

export type DeskPostItBundle = {
  stackId: string
  memberIds: string[]
  unitMagnetId: string | null
  unitText: string | null
  lessonIds: string[]
  lessonTexts: string[]
  isBundledUnit: boolean
  members: DeskPostItBundleMember[]
}

export type DeskPostItBundlePlacement = {
  placementId: string
  date: ISODate
  stackId: string
  unitPostItId: string | null
  unitText: string | null
  lessonPostItIds: string[]
  lessonTexts: string[]
  memberIds: string[]
  attachedAt: string
}

export type DeskPostItBundlePlacements = {
  schemaVersion: typeof DESK_POSTIT_BUNDLE_PLACEMENTS_SCHEMA_VERSION
  placements: DeskPostItBundlePlacement[]
}

export const EMPTY_DESK_POSTIT_BUNDLE_PLACEMENTS: DeskPostItBundlePlacements = {
  schemaVersion: DESK_POSTIT_BUNDLE_PLACEMENTS_SCHEMA_VERSION,
  placements: [],
}

export type DeskPostItBundleCatalogEntry = {
  postItId: string
  form?: 'sticky' | 'magnet'
  kind?: string | null
}

export function classifyDeskPostItBundleMember(
  entry: DeskPostItBundleCatalogEntry | undefined,
  lessonMarks: DeskPostItLessonMarks,
  text: string,
): DeskPostItBundleMember {
  const postItId = entry?.postItId ?? ''
  const form = entry?.form
  const captureKind = entry?.kind ?? null
  const isUnitMagnet = form === 'magnet' && (captureKind === 'unit' || captureKind == null)
  const isLesson = isDeskPostItLesson(lessonMarks, postItId) || captureKind === 'lesson'
  let kind: DeskPostItBundleMemberKind = 'other'
  if (isUnitMagnet) kind = 'unit-magnet'
  else if (isLesson) kind = 'lesson'
  return { postItId, kind, text: text.trim(), form, captureKind }
}

export function resolveDeskPostItBundle(input: {
  draggedId: string
  links: DeskPostItLinkWorkspace
  lessons: DeskPostItLessonMarks
  catalog: DeskPostItBundleCatalogEntry[]
  texts: Record<string, string>
}): DeskPostItBundle {
  const stack = deskPostItStackForMember(input.links, input.draggedId)
  const memberIds = stack?.memberIds ?? [input.draggedId]
  const byId = new Map(input.catalog.map((entry) => [entry.postItId, entry]))
  const members = memberIds.map((id) =>
    classifyDeskPostItBundleMember(byId.get(id) ?? { postItId: id }, input.lessons, input.texts[id] ?? ''),
  )
  const unit = members.find((member) => member.kind === 'unit-magnet') ?? null
  const lessons = members.filter((member) => member.kind === 'lesson')
  return {
    stackId: stack?.stackId ?? `solo-${input.draggedId}`,
    memberIds,
    unitMagnetId: unit?.postItId ?? null,
    unitText: unit?.text ? unit.text : null,
    lessonIds: lessons.map((member) => member.postItId),
    lessonTexts: lessons.map((member) => member.text).filter(Boolean),
    isBundledUnit: Boolean(unit && lessons.length > 0),
    members,
  }
}

export function bundleCalendarNoteTexts(bundle: DeskPostItBundle): string[] {
  const notes: string[] = []
  if (bundle.unitText) notes.push(`Unit: ${bundle.unitText}`)
  for (const lessonText of bundle.lessonTexts) notes.push(`Lesson: ${lessonText}`)
  if (notes.length > 0) return notes
  for (const member of bundle.members) {
    if (member.text) notes.push(member.text)
  }
  return notes
}

export function formatBundledUnitDropNotice(bundle: DeskPostItBundle, dateLabel: string): string {
  if (bundle.isBundledUnit) {
    const unit = bundle.unitText || 'Unit'
    const lessonCount = bundle.lessonTexts.length
    if (lessonCount <= 0) return `${unit} unit attached to ${dateLabel}.`
    if (lessonCount === 1) return `${unit} unit + lesson attached to ${dateLabel}.`
    return `${unit} unit + ${lessonCount} lessons attached to ${dateLabel}.`
  }
  const first = bundle.members.find((member) => member.text)?.text
  if (first) return `Attached "${first}" to ${dateLabel}.`
  return `Attached to ${dateLabel}.`
}

export function createBundlePlacement(input: {
  date: ISODate
  bundle: DeskPostItBundle
  attachedAt?: string
}): DeskPostItBundlePlacement {
  return {
    placementId: `bundle-place-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: input.date,
    stackId: input.bundle.stackId,
    unitPostItId: input.bundle.unitMagnetId,
    unitText: input.bundle.unitText,
    lessonPostItIds: input.bundle.lessonIds,
    lessonTexts: input.bundle.lessonTexts,
    memberIds: input.bundle.memberIds,
    attachedAt: input.attachedAt ?? new Date().toISOString(),
  }
}

export function normalizeDeskPostItBundlePlacements(value: unknown): DeskPostItBundlePlacements {
  if (!value || typeof value !== 'object') return EMPTY_DESK_POSTIT_BUNDLE_PLACEMENTS
  const candidate = value as Partial<DeskPostItBundlePlacements>
  const placements: DeskPostItBundlePlacement[] = []
  if (Array.isArray(candidate.placements)) {
    for (const raw of candidate.placements) {
      if (!raw || typeof raw !== 'object') continue
      const row = raw as Partial<DeskPostItBundlePlacement>
      if (typeof row.placementId !== 'string' || !row.placementId.trim()) continue
      if (typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) continue
      if (typeof row.stackId !== 'string' || !row.stackId.trim()) continue
      placements.push({
        placementId: row.placementId,
        date: row.date as ISODate,
        stackId: row.stackId,
        unitPostItId: typeof row.unitPostItId === 'string' ? row.unitPostItId : null,
        unitText: typeof row.unitText === 'string' ? row.unitText : null,
        lessonPostItIds: Array.isArray(row.lessonPostItIds)
          ? row.lessonPostItIds.filter((id): id is string => typeof id === 'string')
          : [],
        lessonTexts: Array.isArray(row.lessonTexts)
          ? row.lessonTexts.filter((text): text is string => typeof text === 'string')
          : [],
        memberIds: Array.isArray(row.memberIds)
          ? row.memberIds.filter((id): id is string => typeof id === 'string')
          : [],
        attachedAt: typeof row.attachedAt === 'string' ? row.attachedAt : new Date(0).toISOString(),
      })
    }
  }
  return { schemaVersion: DESK_POSTIT_BUNDLE_PLACEMENTS_SCHEMA_VERSION, placements }
}

export function recordBundlePlacement(
  workspace: DeskPostItBundlePlacements,
  placement: DeskPostItBundlePlacement,
): DeskPostItBundlePlacements {
  const withoutSameStack = workspace.placements.filter(
    (row) => !(row.stackId === placement.stackId && row.date === placement.date),
  )
  return {
    schemaVersion: DESK_POSTIT_BUNDLE_PLACEMENTS_SCHEMA_VERSION,
    placements: [...withoutSameStack, placement],
  }
}

export function loadDeskPostItBundlePlacements(
  storage: Pick<Storage, 'getItem'> | null = browserStorage(),
): DeskPostItBundlePlacements {
  if (!storage) return EMPTY_DESK_POSTIT_BUNDLE_PLACEMENTS
  try {
    const raw = storage.getItem(DESK_POSTIT_BUNDLE_PLACEMENTS_STORAGE_KEY)
    if (!raw) return EMPTY_DESK_POSTIT_BUNDLE_PLACEMENTS
    return normalizeDeskPostItBundlePlacements(JSON.parse(raw) as unknown)
  } catch {
    return EMPTY_DESK_POSTIT_BUNDLE_PLACEMENTS
  }
}

export function saveDeskPostItBundlePlacements(
  workspace: DeskPostItBundlePlacements,
  storage: Pick<Storage, 'setItem'> | null = browserStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(
      DESK_POSTIT_BUNDLE_PLACEMENTS_STORAGE_KEY,
      JSON.stringify(normalizeDeskPostItBundlePlacements(workspace)),
    )
    return true
  } catch {
    return false
  }
}

export function unionDeskPostItRects(
  rects: Array<{ left: number; top: number; width: number; height: number }>,
): { left: number; top: number; width: number; height: number } | null {
  if (rects.length === 0) return null
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const rect of rects) {
    left = Math.min(left, rect.left)
    top = Math.min(top, rect.top)
    right = Math.max(right, rect.left + rect.width)
    bottom = Math.max(bottom, rect.top + rect.height)
  }
  if (!Number.isFinite(left) || !Number.isFinite(top)) return null
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
