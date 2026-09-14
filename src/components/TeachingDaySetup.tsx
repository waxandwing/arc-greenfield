import { useEffect, useRef, useState } from 'react'
import {
  lookupSchoolBellSchedule,
  resolveBellScheduleSchoolId,
  type BellScheduleBlockProposal,
} from '../calendar'
import {
  createTeachingDayBlock,
  hydratePlanningWorkspace,
  type PlanningWorkspace,
  type PlanningWorkspaceInput,
  type TeachingDayBlock,
  type TeachingDayBlockType,
} from '../planning'

type Props = {
  initialValue: PlanningWorkspaceInput
  schoolNcesId?: string
  calendarProvenance?: Array<{ id?: string; locator?: string }>
  onSave: (input: PlanningWorkspaceInput, workspace: PlanningWorkspace) => void
  onCancel: () => void
  onDraftChange?: (input: PlanningWorkspaceInput) => void
}

export function TeachingDaySetup({ initialValue, schoolNcesId, calendarProvenance, onSave, onCancel, onDraftChange }: Props) {
  const [blocks, setBlocks] = useState<TeachingDayBlock[]>(() => initialValue.teachingDay?.blocks.map((block) => ({ ...block })) ?? initialValue.sections.map((section, index) => createTeachingDayBlock({ label: section.name, type: 'teaching', order: index + 1, sectionId: section.id })))
  const [errors, setErrors] = useState<string[]>([])
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null)
  const [scheduleSource, setScheduleSource] = useState<{ label: string; locator: string } | null>(null)
  const [pendingProposal, setPendingProposal] = useState<BellScheduleBlockProposal[] | null>(null)
  const lastDraftRef = useRef('')
  const lookupStarted = useRef(false)

  useEffect(() => { const draft = { ...initialValue, teachingDay: { blocks: blocks.map((block, index) => ({ ...block, order: index + 1 })) } }; const serialized = JSON.stringify(draft); if (serialized !== lastDraftRef.current) { lastDraftRef.current = serialized; onDraftChange?.(draft) } }, [blocks, initialValue, onDraftChange])

  useEffect(() => {
    if (lookupStarted.current) return
    lookupStarted.current = true
    const ncesId = resolveBellScheduleSchoolId({ onboardingSchoolNcesId: schoolNcesId, calendarProvenance })
    if (!ncesId) return
    const result = lookupSchoolBellSchedule({ ncesSchoolId: ncesId, sectionCount: initialValue.sections.length })
    if (result.status === 'found') {
      setScheduleSource({ label: result.sourceLabel, locator: result.sourceLocator })
      setPendingProposal(result.blocks)
      setScheduleNotice('Arc found a bell schedule to review. Confirm before it becomes your teaching day.')
    } else {
      setScheduleNotice(result.message)
    }
  }, [calendarProvenance, initialValue.sections.length, schoolNcesId])

  function applyBellProposal() {
    if (!pendingProposal) return
    const sections = initialValue.sections
    const next = pendingProposal.map((proposal, index) => {
      const sectionId = proposal.type === 'teaching'
        ? sections[proposal.sectionIndex ?? index]?.id ?? sections[0]?.id ?? null
        : null
      return createTeachingDayBlock({
        label: proposal.label,
        type: proposal.type,
        order: index + 1,
        sectionId,
        startTime: proposal.startTime,
        endTime: proposal.endTime,
      })
    })
    setBlocks(next)
    setPendingProposal(null)
    setScheduleNotice('Bell schedule applied. Reorder or edit anything that does not match your day.')
  }

  function addBlock(type: TeachingDayBlockType) {
    const order = blocks.length + 1
    setBlocks((current) => [...current, createTeachingDayBlock({
      label: type === 'planning' ? 'Planning' : type === 'non-teaching' ? 'Lunch / other' : `Block ${order}`,
      type,
      order,
      sectionId: type === 'teaching' ? initialValue.sections[0]?.id ?? null : null,
    })])
  }

  function updateBlock(id: string, patch: Partial<TeachingDayBlock>) {
    setBlocks((current) => current.map((block) => block.id === id ? {
      ...block,
      ...patch,
      sectionId: patch.type && patch.type !== 'teaching' ? null : patch.sectionId === undefined ? block.sectionId : patch.sectionId,
    } : block))
  }

  function move(id: string, direction: -1 | 1) {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((block, nextIndex) => ({ ...block, order: nextIndex + 1 }))
    })
  }

  function remove(id: string) {
    setBlocks((current) => current.filter((block) => block.id !== id).map((block, index) => ({ ...block, order: index + 1 })))
  }

  function submit() {
    try {
      const input: PlanningWorkspaceInput = {
        ...initialValue,
        teachingDay: { blocks: blocks.map((block, index) => ({ ...block, order: index + 1 })) },
      }
      const workspace = hydratePlanningWorkspace(input)
      setErrors([])
      onSave(input, workspace)
    } catch (error) {
      const message = error instanceof Error ? error.message.replace(/^Cannot use class setup\.\s*/, '') : String(error)
      setErrors(message.split(/(?<=\.)\s+/).filter(Boolean))
    }
  }

  return (
    <div className="teaching-day-setup">
      <div className="calendar-setup-intro"><p className="section-label">Build your teaching day</p><h2>Teaching, planning, lunch, and other blocks—in your order.</h2><p>Planning is a real block, not a guessed gap. Times are useful, but optional.</p></div>
      {scheduleNotice ? (
        <div className="teaching-day-schedule-notice" role="status">
          <p>{scheduleNotice}</p>
          {scheduleSource ? <p className="teaching-day-schedule-source">Source: {scheduleSource.label}</p> : null}
          {pendingProposal ? (
            <button type="button" className="quiet-button" onClick={applyBellProposal}>Use proposed schedule</button>
          ) : null}
        </div>
      ) : null}
      {errors.length > 0 ? <div className="setup-errors" role="alert"><strong>Check the teaching day.</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div> : null}
      <div className="teaching-day-list">
        {blocks.map((block, index) => (
          <section className={`teaching-day-block teaching-day-block--${block.type}`} key={block.id} aria-label={`Block ${index + 1}: ${block.label || 'Untitled'}`}>
            <span className="teaching-day-order" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div className="teaching-day-fields">
              <label><span>Block label</span><input value={block.label} onChange={(event) => updateBlock(block.id, { label: event.target.value })} /></label>
              <label><span>What happens here?</span><select value={block.type} onChange={(event) => updateBlock(block.id, { type: event.target.value as TeachingDayBlockType })}><option value="teaching">Teach a class</option><option value="planning">Planning</option><option value="non-teaching">Lunch / other</option></select></label>
              {block.type === 'teaching' ? <label><span>Class</span><select value={block.sectionId ?? ''} onChange={(event) => updateBlock(block.id, { sectionId: event.target.value || null })}><option value="">Choose a class</option>{initialValue.sections.map((section) => { const course = initialValue.courses.find((candidate) => candidate.id === section.courseId); return <option key={section.id} value={section.id}>{section.name} · {course?.title}</option> })}</select></label> : null}
              <div className="teaching-day-times"><label><span>Starts (optional)</span><input type="time" value={block.startTime ?? ''} onChange={(event) => updateBlock(block.id, { startTime: event.target.value || null })} /></label><label><span>Ends (optional)</span><input type="time" value={block.endTime ?? ''} onChange={(event) => updateBlock(block.id, { endTime: event.target.value || null })} /></label></div>
            </div>
            <div className="teaching-day-controls"><button type="button" className="text-button" disabled={index === 0} onClick={() => move(block.id, -1)} aria-label={`Move ${block.label || 'block'} earlier`}>Earlier</button><button type="button" className="text-button" disabled={index === blocks.length - 1} onClick={() => move(block.id, 1)} aria-label={`Move ${block.label || 'block'} later`}>Later</button><button type="button" className="text-button" onClick={() => remove(block.id)}>Remove</button></div>
          </section>
        ))}
      </div>
      <div className="teaching-day-add" aria-label="Add teaching-day block"><button type="button" className="quiet-button" onClick={() => addBlock('teaching')}>Add class</button><button type="button" className="quiet-button" onClick={() => addBlock('planning')}>Add planning</button><button type="button" className="quiet-button" onClick={() => addBlock('non-teaching')}>Add lunch / other</button></div>
      <div className="setup-actions"><p>Only the order and block type are required. You can finish bell times later.</p><div className="setup-action-buttons"><button type="button" className="text-button" onClick={onCancel}>Cancel</button><button type="button" className="primary-button" onClick={submit}>Use this teaching day</button></div></div>
    </div>
  )
}
