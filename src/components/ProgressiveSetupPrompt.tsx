import type { SetupCapabilities } from '../planning'

export function ProgressiveSetupPrompt({ capabilities, onOpenTeachingDay, onOpenImport }: { capabilities: SetupCapabilities; onOpenTeachingDay: () => void; onOpenImport: () => void }) {
  if (!capabilities.coursesEstablished) return null
  const needsDay = !capabilities.dayOrderEstablished || !capabilities.planningPeriodEstablished
  const needsTimes = capabilities.dayOrderEstablished && !capabilities.bellTimesEstablished
  const needsCurriculum = !capabilities.curriculumEstablished
  if (!needsDay && !needsTimes && !needsCurriculum) return null
  return <aside className="progressive-setup" aria-label="Optional setup"><p className="section-label">When you’re ready</p><div>{needsDay ? <button type="button" onClick={onOpenTeachingDay}><strong>Shape the teaching day</strong><span>Add the real order and mark Planning explicitly.</span></button> : needsTimes ? <button type="button" onClick={onOpenTeachingDay}><strong>Finish bell times</strong><span>The day already works without them.</span></button> : null}{needsCurriculum ? <button type="button" onClick={onOpenImport}><strong>Bring in curriculum</strong><span>Review a CSV before anything becomes Lesson truth.</span></button> : null}</div></aside>
}
