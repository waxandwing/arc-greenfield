import type { ArcTableDeskAccess } from './arcTableDeskAccess'
import { deskQuadrantToTeacherTool, type ArcTableDeskQuadrant, type ArcTableDeskTeacherTool } from './arcTableDeskMark'

/** Configurable desk mark actions (center + four quadrants). */
export type ArcTableDeskAction =
  | 'open'
  | 'startOrResume'
  | 'timerCleanup'
  | 'classTools'
  | 'mediaDirections'

export type ArcTableDeskTarget = 'center' | ArcTableDeskQuadrant

export const ARC_TABLE_DESK_TARGET_ORDER: ArcTableDeskTarget[] = [
  'center',
  'live',
  'timer',
  'tools',
  'media',
]

export function deskTargetToAction(target: ArcTableDeskTarget): ArcTableDeskAction {
  if (target === 'center') return 'open'
  switch (target) {
    case 'live':
      return 'startOrResume'
    case 'timer':
      return 'timerCleanup'
    case 'tools':
      return 'classTools'
    case 'media':
      return 'mediaDirections'
    default:
      return 'open'
  }
}

export function deskActionToTarget(action: ArcTableDeskAction): ArcTableDeskTarget {
  switch (action) {
    case 'open':
      return 'center'
    case 'startOrResume':
      return 'live'
    case 'timerCleanup':
      return 'timer'
    case 'classTools':
      return 'tools'
    case 'mediaDirections':
      return 'media'
    default:
      return 'center'
  }
}

export function deskActionToTeacherTool(action: ArcTableDeskAction): ArcTableDeskTeacherTool | null {
  if (action === 'open' || action === 'startOrResume') return null
  return deskQuadrantToTeacherTool(deskActionToTarget(action) as ArcTableDeskQuadrant)
}

export function resolveDeskActionLabel(action: ArcTableDeskAction, liveActive: boolean): string {
  switch (action) {
    case 'open':
      return 'Open ArcTable'
    case 'startOrResume':
      return liveActive ? 'Resume class' : 'Start class'
    case 'timerCleanup':
      return 'Timer & cleanup'
    case 'classTools':
      return 'People & class tools'
    case 'mediaDirections':
      return 'Media & directions'
    default:
      return 'ArcTable'
  }
}

export type ArcTableDeskEntitlementRoute = 'execute' | 'preview'

export function routeArcTableDeskAction(access: ArcTableDeskAccess): ArcTableDeskEntitlementRoute {
  return access === 'paid-live' ? 'execute' : 'preview'
}

export type ArcTableDeskPreviewCopy = {
  kicker: string
  title: string
  body: string
}

export const ARC_TABLE_DESK_PREVIEW_COPY: Record<ArcTableDeskAction, ArcTableDeskPreviewCopy> = {
  open: {
    kicker: 'ArcTable home',
    title: 'Open ArcTable from your desk',
    body: 'ArcTable is the live classroom layer on top of Plan. Center the mark to land in ArcTable when your account includes live teaching.',
  },
  startOrResume: {
    kicker: 'Live class',
    title: 'Start or resume today’s class',
    body: 'Launch the blue quadrant to begin teaching or pick up an in-progress session. Plan stays free; live delivery requires ArcTable.',
  },
  timerCleanup: {
    kicker: 'Timer & cleanup',
    title: 'Preview classroom timer',
    body: 'Countdown, cleanup bell, and wrap-up tools live inside ArcTable during class. Explore how they work before you add ArcTable.',
  },
  classTools: {
    kicker: 'People & class tools',
    title: 'Pick someone, passes, and roster tools',
    body: 'People picker, passes, and class tools are part of ArcTable live surfaces — not duplicated in Plan.',
  },
  mediaDirections: {
    kicker: 'Media & directions',
    title: 'Project media and directions',
    body: 'Media queue and student-facing directions launch from ArcTable during live class.',
  },
}
