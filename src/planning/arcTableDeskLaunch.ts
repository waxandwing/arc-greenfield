import type { ArcTableDeskTeacherTool } from './arcTableDeskMark'

const STORAGE_KEY = 'arc.arctable.desk-launch.v1'

let memoryLaunch: ArcTableDeskTeacherTool | null = null

function hasSessionStorage(): boolean {
  try {
    return typeof sessionStorage !== 'undefined'
  } catch {
    return false
  }
}

export function setArcTableDeskLaunch(tool: ArcTableDeskTeacherTool | null) {
  if (hasSessionStorage()) {
    if (!tool) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    sessionStorage.setItem(STORAGE_KEY, tool)
    return
  }
  memoryLaunch = tool
}

export function consumeArcTableDeskLaunch(): ArcTableDeskTeacherTool | null {
  if (hasSessionStorage()) {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    if (raw === 'timer' || raw === 'people' || raw === 'passes' || raw === 'media') return raw
    return null
  }
  const value = memoryLaunch
  memoryLaunch = null
  return value
}
