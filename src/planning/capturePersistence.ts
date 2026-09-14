import { validateCaptureWorkspace, type CaptureWorkspace } from './captureWorkspace'

export const CAPTURE_STORAGE_KEY = 'arc.captures.v1'

export type CaptureLoadResult =
  | { status: 'empty' }
  | { status: 'restored'; workspace: CaptureWorkspace }
  | { status: 'invalid' }
  | { status: 'unavailable' }

export function serializeCaptures(workspace: CaptureWorkspace): string {
  return JSON.stringify({ schemaVersion: 1, workspace })
}

export function deserializeCaptures(raw: string): CaptureWorkspace | null {
  try {
    const parsed = JSON.parse(raw) as { schemaVersion?: unknown; workspace?: Partial<CaptureWorkspace> }
    if (parsed.schemaVersion !== 1 || !parsed.workspace || typeof parsed.workspace.calendarId !== 'string' || !Array.isArray(parsed.workspace.captures)) return null
    const workspace: CaptureWorkspace = {
      calendarId: parsed.workspace.calendarId,
      captures: parsed.workspace.captures.map((capture) => {
        const row = {
          id: typeof capture.id === 'string' ? capture.id : '',
          calendarId: typeof capture.calendarId === 'string' ? capture.calendarId : '',
          text: typeof capture.text === 'string' ? capture.text : '',
          createdAt: typeof capture.createdAt === 'string' ? capture.createdAt : '',
        } as CaptureWorkspace['captures'][number]
        if (typeof capture.anchorDate === 'string' && capture.anchorDate.trim()) row.anchorDate = capture.anchorDate as CaptureWorkspace['captures'][number]['anchorDate']
        if (typeof capture.courseId === 'string' && capture.courseId.trim()) row.courseId = capture.courseId
        if (typeof capture.sectionId === 'string' && capture.sectionId.trim()) row.sectionId = capture.sectionId
        if (typeof capture.unitId === 'string' && capture.unitId.trim()) row.unitId = capture.unitId
        if (typeof capture.lessonId === 'string' && capture.lessonId.trim()) row.lessonId = capture.lessonId
        if (typeof capture.sourceView === 'string' && capture.sourceView.trim()) row.sourceView = capture.sourceView
        if (capture.important === true) row.important = true
        return row
      }),
    }
    return validateCaptureWorkspace(workspace).length === 0 ? workspace : null
  } catch {
    return null
  }
}

export function saveCapturesToBrowser(workspace: CaptureWorkspace): boolean {
  try {
    if (validateCaptureWorkspace(workspace).length > 0) return false
    window.localStorage.setItem(CAPTURE_STORAGE_KEY, serializeCaptures(workspace))
    return true
  } catch {
    return false
  }
}

export function loadCapturesFromBrowser(calendarId: string): CaptureLoadResult {
  try {
    const raw = window.localStorage.getItem(CAPTURE_STORAGE_KEY)
    if (!raw) return { status: 'empty' }
    const workspace = deserializeCaptures(raw)
    if (!workspace) return { status: 'invalid' }
    if (workspace.calendarId !== calendarId) return { status: 'empty' }
    return { status: 'restored', workspace }
  } catch {
    return { status: 'unavailable' }
  }
}
