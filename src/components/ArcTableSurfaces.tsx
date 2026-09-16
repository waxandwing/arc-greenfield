import { useEffect, useRef, useState } from 'react'
import {
  ARC_TABLE_MAX_COUNTDOWN_SECONDS,
  addArcTablePassDefinition,
  addArcTableMedia,
  addArcTablePerson,
  cleanupIsActive,
  countdownRemaining,
  elapsedLiveMinutes,
  pauseArcTableCountdown,
  pickNextArcTablePerson,
  resetArcTableCountdown,
  selectedArcTablePerson,
  setArcTableCountdownDuration,
  setArcTablePassStatus,
  settleArcTableCountdown,
  startArcTableCountdown,
  type ArcTableLiveState,
  type ArcTableMediaState,
  type ArcTableTeachingOutcome,
} from '../planning'
import { consumeArcTableDeskLaunch } from '../planning/arcTableDeskLaunch'
import { ARC_TABLE_HEADER_DARK_ASSET, ARC_TABLE_MARK_ASSET } from '../planning/arcTableDeskMark'
import { publicAssetUrl } from '../publicAssetUrl'
import '../styles/arctable.css'

type SharedProps = {
  live: ArcTableLiveState
  onOpenPlan: () => void
  /** @deprecated Table settings stay on ArcTable; plan SETTINGS is a separate object. */
  onOpenSettings?: () => void
  onShowTeacher: () => void
  onShowStudent: () => void
  onSyncLive?: () => boolean
  onUpdate: (value: Partial<Omit<ArcTableLiveState, 'version' | 'session' | 'startedAt'>>) => void
  onEnd: (outcome: ArcTableTeachingOutcome) => string | null
}

export function ArcTableTeacherMonitor({ live, onOpenPlan, onShowStudent, onUpdate, onEnd }: SharedProps) {
  const [ending, setEnding] = useState(false)
  const [resumeNote, setResumeNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [tool, setTool] = useState<'people' | 'passes' | 'media' | null>(null)
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false)
  const [boardComposing, setBoardComposing] = useState(false)
  const [boardDraft, setBoardDraft] = useState('')
  const [editingMaterials, setEditingMaterials] = useState(false)
  const [personName, setPersonName] = useState('')
  const [mediaTitle, setMediaTitle] = useState('')
  const [mediaSource, setMediaSource] = useState('')
  const [mediaKind, setMediaKind] = useState<'image' | 'slides'>('image')
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [passLabel, setPassLabel] = useState('')
  const [passPeople, setPassPeople] = useState<Record<string, string>>({})
  const [editingTimerDuration, setEditingTimerDuration] = useState(false)
  const timerDurationInputRef = useRef<HTMLInputElement>(null)
  const toolPanelRef = useRef<HTMLElement>(null)
  const toolRowRef = useRef<HTMLDivElement>(null)
  const tableSettingsRef = useRef<HTMLElement>(null)
  const tableSettingsButtonRef = useRef<HTMLButtonElement>(null)
  const boardDraftRef = useRef<HTMLInputElement>(null)
  const materialsFieldRef = useRef<HTMLInputElement>(null)
  const now = useClock()
  const classElapsed = elapsedLiveMinutes(live, now)
  const timerRemaining = countdownRemaining(live.timer, now)
  const cleanupRemaining = countdownRemaining(live.cleanupTimer, now)
  const cleanupActive = cleanupIsActive(live)
  const selectedPerson = selectedArcTablePerson(live.people)
  const activeMedia = live.media.items.find((item) => item.id === live.media.activeId) ?? null
  const timerIdle = live.timer.status === 'idle' || live.timer.status === 'completed'
  const timerCanEditDuration = timerIdle || live.timer.status === 'paused'
  useSettleCountdowns(live, now, onUpdate)
  useEffect(() => {
    if (!editingTimerDuration) return
    timerDurationInputRef.current?.focus()
    timerDurationInputRef.current?.select()
  }, [editingTimerDuration])
  useEffect(() => {
    if (!timerCanEditDuration && editingTimerDuration) setEditingTimerDuration(false)
  }, [editingTimerDuration, timerCanEditDuration])
  useEffect(() => {
    if (!tool && !tableSettingsOpen && !boardComposing && !editingMaterials) return
    const closeOverlay = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (boardComposing) {
        setBoardComposing(false)
        setBoardDraft('')
        return
      }
      if (editingMaterials) {
        setEditingMaterials(false)
        return
      }
      if (tableSettingsOpen) setTableSettingsOpen(false)
      else setTool(null)
    }
    window.addEventListener('keydown', closeOverlay)
    return () => window.removeEventListener('keydown', closeOverlay)
  }, [tool, tableSettingsOpen, boardComposing, editingMaterials])
  useEffect(() => {
    if (!boardComposing) return
    boardDraftRef.current?.focus()
  }, [boardComposing])
  useEffect(() => {
    if (!editingMaterials) return
    materialsFieldRef.current?.focus()
    materialsFieldRef.current?.select()
  }, [editingMaterials])
  useEffect(() => {
    if (!tool) return
    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node
      if (toolPanelRef.current?.contains(target)) return
      if (toolRowRef.current?.contains(target)) return
      setTool(null)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [tool])
  useEffect(() => {
    if (!tableSettingsOpen) return
    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node
      if (tableSettingsRef.current?.contains(target)) return
      if (tableSettingsButtonRef.current?.contains(target)) return
      setTableSettingsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [tableSettingsOpen])

  function openClassroomTool(next: 'people' | 'passes' | 'media') {
    setTableSettingsOpen(false)
    setBoardComposing(false)
    setEditingMaterials(false)
    setTool(next)
  }

  useEffect(() => {
    const launch = consumeArcTableDeskLaunch()
    if (!launch) return
    if (launch === 'timer') {
      document.getElementById('classroom-timer-heading')?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
      return
    }
    if (launch === 'people') setTool('people')
    if (launch === 'passes') setTool('passes')
    if (launch === 'media') setTool('media')
  }, [])

  function finish(outcome: ArcTableTeachingOutcome) {
    const message = onEnd(outcome)
    setError(message)
    if (!message) setEnding(false)
  }

  function addPerson(event: React.FormEvent) {
    event.preventDefault()
    const people = addArcTablePerson(live.people, personName)
    onUpdate({ people })
    if (people !== live.people) setPersonName('')
  }

  function addMedia(event: React.FormEvent) {
    event.preventDefault()
    const media = addArcTableMedia(live.media, { title: mediaTitle, source: mediaSource, kind: mediaKind })
    onUpdate({ media })
    if (media !== live.media) {
      setMediaTitle('')
      setMediaSource('')
      setMediaError(null)
    } else {
      setMediaError(mediaKind === 'slides' ? 'Use a valid Google Slides presentation URL.' : 'Use a valid image URL/path. Inline images larger than 100 KB are not stored.')
    }
  }

  function addPass(event: React.FormEvent) {
    event.preventDefault()
    const passes = addArcTablePassDefinition(live.passes, passLabel)
    onUpdate({ passes })
    if (passes !== live.passes) setPassLabel('')
  }

  function beginBoardCompose(focus: 'direction' | 'materials' = 'direction') {
    if (live.boardLocked) onUpdate({ boardLocked: false })
    setTableSettingsOpen(false)
    setTool(null)
    if (focus === 'materials') {
      setBoardComposing(false)
      setBoardDraft('')
      setEditingMaterials(true)
      return
    }
    setEditingMaterials(false)
    setBoardComposing(true)
  }

  function commitBoardDirection() {
    const next = boardDraft.trim()
    if (!next) {
      setBoardComposing(false)
      setBoardDraft('')
      return
    }
    onUpdate({ directions: [...live.directions, next], boardLocked: false })
    setBoardDraft('')
    setBoardComposing(true)
  }

  function openBoardMedia() {
    if (live.boardLocked) onUpdate({ boardLocked: false })
    setBoardComposing(false)
    setEditingMaterials(false)
    openClassroomTool('media')
  }

  const timerDisplaySeconds = live.timer.status === 'idle' && timerRemaining === 0 && live.timer.durationSeconds > 0
    ? live.timer.durationSeconds
    : timerRemaining
  const phaseFlow = live.session.phases.map((label) => label.trim()).filter(Boolean)

  return (
    <main className="arctable arctable--teacher">
      <div className="arctable-paper-texture" aria-hidden="true" />
      <header className="arctable-header">
        <div className="arctable-header-brand">
          <img
            className="arctable-header-mark"
            src={publicAssetUrl(ARC_TABLE_MARK_ASSET)}
            alt=""
            width={44}
            height={44}
            data-testid="arctable-header-mark"
          />
          <span className="arctable-header-table-word">TABLE</span>
        </div>
        <div><p className="arctable-kicker">Teacher Monitor</p><strong>{live.session.courseTitle} · {live.session.sectionName}</strong></div>
        <div className="arctable-header-actions">
          <button type="button" className="quiet-button" onClick={onOpenPlan}>Plan View</button>
          <button
            type="button"
            ref={tableSettingsButtonRef}
            className={`arctable-table-settings-button${tableSettingsOpen ? ' is-open' : ''}`}
            data-testid="arctable-settings"
            aria-expanded={tableSettingsOpen}
            aria-controls="arctable-table-settings-surface"
            onClick={() => {
              setTool(null)
              setTableSettingsOpen((open) => !open)
            }}
          >
            <span className="arctable-table-settings-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="14" height="14" focusable="false">
                <path
                  fill="currentColor"
                  d="M8.2 1.6h3.6l.3 1.7a5.8 5.8 0 0 1 1.5.9l1.6-.7 1.8 1.8-.7 1.6c.4.5.7 1 .9 1.5l1.7.3v3.6l-1.7.3a5.8 5.8 0 0 1-.9 1.5l.7 1.6-1.8 1.8-1.6-.7a5.8 5.8 0 0 1-1.5.9l-.3 1.7H8.2l-.3-1.7a5.8 5.8 0 0 1-1.5-.9l-1.6.7-1.8-1.8.7-1.6a5.8 5.8 0 0 1-.9-1.5L1.1 11V7.4l1.7-.3c.2-.5.5-1 .9-1.5l-.7-1.6L4.8 2.2l1.6.7c.5-.4 1-.7 1.5-.9l.3-1.7Zm1.8 5.2a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"
                />
              </svg>
            </span>
            <span className="arctable-table-settings-label">Table settings</span>
          </button>
          <span className="arctable-live-chip">Live · {classElapsed} min</span>
          <button type="button" className="quiet-button" onClick={() => setEnding(true)}>End Class</button>
        </div>
      </header>

      {tableSettingsOpen ? (
        <section
          ref={tableSettingsRef}
          id="arctable-table-settings-surface"
          className="arctable-table-settings-panel"
          data-testid="arctable-table-settings-surface"
          aria-labelledby="arctable-table-settings-heading"
        >
          <div className="arctable-table-settings-heading-row">
            <div>
              <p className="arctable-kicker">This classroom</p>
              <h2 id="arctable-table-settings-heading">Table settings</h2>
            </div>
            <button type="button" className="quiet-button" onClick={() => setTableSettingsOpen(false)}>Close</button>
          </div>
          <p className="arctable-table-settings-scope">
            Tools and defaults for <strong>{live.session.sectionName}</strong> · {live.session.courseTitle}. School year, calendar, and courses stay in Plan → SETTINGS.
          </p>
          <div className="arctable-table-settings-groups">
            <section className="arctable-table-settings-group" aria-labelledby="arctable-table-tools-heading">
              <h3 id="arctable-table-tools-heading">Classroom tools</h3>
              <div className="arctable-table-settings-actions">
                <button type="button" onClick={() => openClassroomTool('people')}>People picker · {live.people.roster.length || 0}</button>
                <button type="button" onClick={() => openClassroomTool('passes')}>Pass types · {live.passes.passes.length || 0}</button>
                <button type="button" onClick={() => openClassroomTool('media')}>Media · {live.media.items.length || 0}</button>
              </div>
            </section>
            <section className="arctable-table-settings-group" aria-labelledby="arctable-table-session-heading">
              <h3 id="arctable-table-session-heading">Live class defaults</h3>
              <label>
                <span>Timer minutes</span>
                <input
                  aria-label="Table default timer minutes"
                  type="number"
                  min="1"
                  max={ARC_TABLE_MAX_COUNTDOWN_SECONDS / 60}
                  value={Math.ceil(live.timer.durationSeconds / 60)}
                  onChange={(event) => onUpdate({ timer: setArcTableCountdownDuration(live.timer, Number(event.target.value) * 60) })}
                />
              </label>
              <label>
                <span>Cleanup minutes</span>
                <input
                  aria-label="Table default cleanup minutes"
                  type="number"
                  min="1"
                  max="30"
                  value={Math.ceil(live.cleanupTimer.durationSeconds / 60)}
                  onChange={(event) => onUpdate({ cleanupTimer: setArcTableCountdownDuration(live.cleanupTimer, Number(event.target.value) * 60) })}
                />
              </label>
              <label>
                <span>Voice expectation</span>
                <select
                  aria-label="Table default voice expectation"
                  value={live.voiceLevel}
                  onChange={(event) => onUpdate({ voiceLevel: Number(event.target.value) as 1 | 2 | 3 })}
                >
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                </select>
              </label>
              <button
                type="button"
                className="arctable-table-settings-toggle"
                data-testid="arctable-settings-board-lock"
                aria-pressed={!live.boardLocked}
                onClick={() => onUpdate({ boardLocked: !live.boardLocked })}
              >
                <strong>Board</strong>
                <span>{live.boardLocked ? 'Locked for students' : 'Editable'}</span>
              </button>
            </section>
            <section className="arctable-table-settings-group" aria-labelledby="arctable-table-plan-boundary-heading">
              <h3 id="arctable-table-plan-boundary-heading">Not school-year settings</h3>
              <p>Calendar dates, courses, and desk setup live on the planner SETTINGS tab — a different object from this table.</p>
              <button type="button" className="quiet-button" onClick={onOpenPlan}>Open Plan View</button>
            </section>
          </div>
        </section>
      ) : null}

      <div className="arctable-teacher-room">
        <div className="arctable-furniture-tabs" ref={toolRowRef} role="toolbar" aria-label="Classroom tools">
          <button type="button" className={`arctable-furniture-tab arctable-furniture-tab--people${tool === 'people' ? ' is-active' : ''}`} aria-label="People picker" aria-expanded={tool === 'people'} onClick={() => setTool(tool === 'people' ? null : 'people')}>
            <span aria-hidden="true">{live.people.roster.length || '·'}</span>People
          </button>
          <button type="button" className={`arctable-furniture-tab arctable-furniture-tab--pass${tool === 'passes' ? ' is-active' : ''}`} aria-label="Pass tools" aria-expanded={tool === 'passes'} onClick={() => setTool(tool === 'passes' ? null : 'passes')}>
            <span aria-hidden="true">{live.passes.passes.filter((pass) => pass.status === 'active').length || '·'}</span>Pass
          </button>
          <button type="button" className={`arctable-furniture-tab arctable-furniture-tab--media${tool === 'media' ? ' is-active' : ''}`} aria-label="Media" aria-expanded={tool === 'media'} onClick={() => setTool(tool === 'media' ? null : 'media')}>
            <span aria-hidden="true">+</span>Media
          </button>
        </div>

        <div className="arctable-teacher-stage-shell">
          <div className="arctable-arc-crop" aria-hidden="true" />
          <div className="arctable-teacher-layout" data-testid="arctable-teacher-layout">
                        <section
              className={`arctable-board${live.boardLocked ? ' is-locked' : ' is-editable'}`}
              aria-labelledby="arctable-lesson-title"
              data-testid="arctable-board"
              onClick={(event) => {
                if (boardComposing || editingMaterials) return
                const target = event.target as HTMLElement
                if (target.closest('button, a, input, textarea, label, ol, li, h1, .arctable-board-footer, .arctable-progress, .arctable-board-flow, .arctable-board-add-elements')) return
                beginBoardCompose('direction')
              }}
            >
              <div className="arctable-progress" aria-label={`Phase ${live.phase} of ${live.phaseCount}`}><span style={{ width: `${(live.phase / live.phaseCount) * 100}%` }} /></div>
              <div className="arctable-board-stack" data-testid="arctable-board-stack">
                <p className="arctable-kicker">Phase {live.phase} of {live.phaseCount}{live.session.phases[live.phase - 1] ? ` · ${live.session.phases[live.phase - 1]}` : ''}</p>
                <h1 id="arctable-lesson-title">{live.session.lessonTitle}</h1>
                {phaseFlow.length > 1 ? (
                  <ol className="arctable-board-flow" aria-label="Today's flow" data-testid="arctable-board-flow">
                    {phaseFlow.map((label, index) => {
                      const step = index + 1
                      return (
                        <li key={`${step}-${label}`} className={step === live.phase ? 'is-current' : undefined}>
                          <span className="arctable-board-flow-index">{step}</span>
                          <strong>{label}</strong>
                        </li>
                      )
                    })}
                  </ol>
                ) : null}
                {live.directions.length > 0 ? (
                  <ol className="arctable-directions">{live.directions.map((direction, index) => <li key={`${direction}-${index}`}>{direction}</li>)}</ol>
                ) : !boardComposing ? (
                  <button
                    type="button"
                    className="arctable-board-empty-add"
                    data-testid="arctable-board-add-direction"
                    onClick={(event) => {
                      event.stopPropagation()
                      beginBoardCompose('direction')
                    }}
                  >
                    Click to add a direction
                  </button>
                ) : null}
                {boardComposing ? (
                  <form
                    className="arctable-board-compose"
                    data-testid="arctable-board-compose"
                    onSubmit={(event) => {
                      event.preventDefault()
                      commitBoardDirection()
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <label className="sr-only" htmlFor="arctable-board-direction-input">New direction</label>
                    <input
                      ref={boardDraftRef}
                      id="arctable-board-direction-input"
                      value={boardDraft}
                      placeholder="Type a student-facing direction…"
                      onChange={(event) => setBoardDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.preventDefault()
                          setBoardComposing(false)
                          setBoardDraft('')
                        }
                      }}
                    />
                    <div className="arctable-board-compose-actions">
                      <button type="submit" className="primary-button" disabled={!boardDraft.trim()}>Add</button>
                      <button
                        type="button"
                        className="quiet-button"
                        onClick={() => {
                          setBoardComposing(false)
                          setBoardDraft('')
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </form>
                ) : null}
                <div className="arctable-board-add-elements" role="toolbar" aria-label="Add board elements" data-testid="arctable-board-add-elements">
                  <button type="button" data-testid="arctable-board-add-more" onClick={(event) => { event.stopPropagation(); beginBoardCompose('direction') }}>+ Direction</button>
                  <button type="button" data-testid="arctable-board-add-media" onClick={(event) => { event.stopPropagation(); openBoardMedia() }}>+ Media</button>
                  <button type="button" data-testid="arctable-board-add-materials" onClick={(event) => { event.stopPropagation(); beginBoardCompose('materials') }}>+ Materials</button>
                </div>
              </div>
              <div className="arctable-board-footer">
                <div className="arctable-materials-band" data-testid="arctable-materials-band">
                  <span className="arctable-kicker">Materials</span>
                  {editingMaterials ? (
                    <label className="arctable-materials-edit">
                      <span className="sr-only">Materials for this phase</span>
                      <input
                        ref={materialsFieldRef}
                        value={live.materials}
                        placeholder="Sketchbooks · pencils · glue"
                        onChange={(event) => onUpdate({ materials: event.target.value, boardLocked: false })}
                        onBlur={() => setEditingMaterials(false)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === 'Escape') {
                            event.preventDefault()
                            setEditingMaterials(false)
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <button type="button" className="arctable-materials-hit" onClick={(event) => { event.stopPropagation(); beginBoardCompose('materials') }}>
                      <strong>{live.materials || 'Click to add materials'}</strong>
                    </button>
                  )}
                </div>
                <div className="arctable-student-facts">
                  <span>Voice {live.voiceLevel}</span>
                  {cleanupActive ? <strong>{live.cleanupTimer.status === 'completed' ? 'Cleanup complete' : `Cleanup · ${formatDuration(cleanupRemaining)}`}</strong> : <span>Cleanup later</span>}
                </div>
              </div>
            </section>

            
<section className="arctable-stage" aria-label="Center stage" data-testid="arctable-stage">
              <p className="arctable-kicker">Center stage</p>
              <MediaSurface media={live.media} onOpenMedia={() => setTool('media')} onPreviewStudent={onShowStudent} />
              {live.people.projected && selectedPerson ? (
                <p className="arctable-stage-person" role="status">{selectedPerson.name}, you’re up.</p>
              ) : (
                <p className="arctable-stage-hint">Projection for the room — media, artwork, or a selected student.</p>
              )}
            </section>

            <aside className="arctable-controls" aria-label="Teacher controls">
              <p className="arctable-kicker">Teacher controls</p>
              <section className={`arctable-timer-control is-${live.timer.status}`} aria-labelledby="classroom-timer-heading">
                <div className="arctable-timer-control-heading">
                  <strong id="classroom-timer-heading">Timer</strong>
                  {live.timer.status === 'paused' ? <span>Paused</span> : null}
                  {live.timer.status === 'completed' ? <span>Done</span> : null}
                </div>
                {editingTimerDuration && timerCanEditDuration ? (
                  <label className="arctable-timer-edit">
                    <span className="sr-only">Duration in minutes</span>
                    <input
                      ref={timerDurationInputRef}
                      aria-label="Timer duration in minutes"
                      type="number"
                      min={1}
                      max={ARC_TABLE_MAX_COUNTDOWN_SECONDS / 60}
                      value={Math.ceil(live.timer.durationSeconds / 60)}
                      onChange={(event) => onUpdate({ timer: setArcTableCountdownDuration(live.timer, Number(event.target.value) * 60) })}
                      onBlur={() => setEditingTimerDuration(false)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === 'Escape') {
                          event.preventDefault()
                          setEditingTimerDuration(false)
                        }
                      }}
                    />
                    <span aria-hidden="true">min</span>
                  </label>
                ) : (
                  <button
                    type="button"
                    className="arctable-timer-display"
                    aria-live="polite"
                    aria-label={
                      timerCanEditDuration
                        ? `Duration ${formatDuration(timerDisplaySeconds)}. Tap to change minutes.`
                        : `Time remaining ${formatDuration(timerDisplaySeconds)}`
                    }
                    disabled={!timerCanEditDuration}
                    onClick={() => {
                      if (timerCanEditDuration) setEditingTimerDuration(true)
                    }}
                  >
                    <TimerDigits seconds={timerDisplaySeconds} />
                  </button>
                )}
                {timerIdle ? (
                  <div className="arctable-presets" aria-label="Timer presets">
                    {[5, 10, 15].map((minutes) => (
                      <button
                        type="button"
                        key={minutes}
                        className={Math.ceil(live.timer.durationSeconds / 60) === minutes ? 'is-selected' : undefined}
                        onClick={() => onUpdate({ timer: setArcTableCountdownDuration(live.timer, minutes * 60) })}
                      >
                        {minutes}m
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="arctable-timer-actions">
                  {live.timer.status === 'running' ? (
                    <button type="button" className="arctable-timer-primary" onClick={() => onUpdate({ timer: pauseArcTableCountdown(live.timer, now) })}>Pause</button>
                  ) : (
                    <button type="button" className="arctable-timer-primary" onClick={() => onUpdate({ timer: startArcTableCountdown(live.timer, now) })}>
                      {live.timer.status === 'paused' ? 'Resume' : 'Start'}
                    </button>
                  )}
                  {live.timer.status !== 'idle' ? (
                    <button
                      type="button"
                      className="arctable-timer-reset"
                      onClick={() => {
                        setEditingTimerDuration(false)
                        onUpdate({ timer: resetArcTableCountdown(live.timer) })
                      }}
                    >
                      Reset
                    </button>
                  ) : null}
                </div>
              </section>
              <div className="arctable-control-row"><strong>Phase</strong><div className="arctable-stepper"><button type="button" aria-label="Previous phase" disabled={live.phase === 1} onClick={() => onUpdate({ phase: live.phase - 1 })}>−</button><span>{live.phase} / {live.phaseCount}</span><button type="button" aria-label="Next phase" disabled={live.phase === live.phaseCount} onClick={() => onUpdate({ phase: live.phase + 1 })}>+</button></div></div>
              <label className="arctable-control-field"><strong>Materials</strong><input value={live.materials} onChange={(event) => onUpdate({ materials: event.target.value })} /></label>
              <label className="arctable-control-field"><strong>Voice expectation</strong><select value={live.voiceLevel} onChange={(event) => onUpdate({ voiceLevel: Number(event.target.value) as 1 | 2 | 3 })}><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option></select></label>
              <button
                type="button"
                className={`arctable-control-row${!live.boardLocked ? ' is-mode-active' : ''}`}
                data-testid="arctable-mode-editable"
                aria-pressed={!live.boardLocked}
                onClick={() => {
                  if (live.boardLocked) onUpdate({ boardLocked: false })
                }}
              >
                <span>Editable</span>
              </button>
              <button
                type="button"
                className="arctable-control-row"
                data-testid="arctable-mode-projected"
                onClick={onShowStudent}
              >
                <span>Projected view</span>
              </button>
              <section className={`arctable-cleanup-control${cleanupActive ? ' is-active' : ''}`} aria-labelledby="cleanup-heading">
                <div><strong id="cleanup-heading">Cleanup countdown</strong><span>{cleanupActive ? `${live.cleanupTimer.status} · ${formatDuration(cleanupRemaining)}` : 'Ready when you are'}</span></div>
                <label><span>Minutes</span><input aria-label="Cleanup duration in minutes" type="number" min="1" max="30" value={Math.ceil(live.cleanupTimer.durationSeconds / 60)} onChange={(event) => onUpdate({ cleanupTimer: setArcTableCountdownDuration(live.cleanupTimer, Number(event.target.value) * 60) })} /></label>
                <div>
                  {!cleanupActive || live.cleanupTimer.status === 'completed' ? <button type="button" onClick={() => onUpdate({ cleanupTimer: startArcTableCountdown(resetArcTableCountdown(live.cleanupTimer), now) })}>Start cleanup</button> : null}
                  {live.cleanupTimer.status === 'running' ? <button type="button" onClick={() => onUpdate({ cleanupTimer: pauseArcTableCountdown(live.cleanupTimer, now) })}>Pause cleanup</button> : null}
                  {live.cleanupTimer.status === 'paused' ? <button type="button" onClick={() => onUpdate({ cleanupTimer: startArcTableCountdown(live.cleanupTimer, now) })}>Resume cleanup</button> : null}
                  {cleanupActive ? <button type="button" onClick={() => onUpdate({ cleanupTimer: resetArcTableCountdown(live.cleanupTimer) })}>Cancel cleanup</button> : null}
                </div>
              </section>
            </aside>
          </div>

          {tool === 'people' ? (
            <section ref={toolPanelRef} className="arctable-tool-panel arctable-people-panel" aria-labelledby="people-picker-heading">
              <h2 id="people-picker-heading">People · {live.session.sectionName}</h2>
              <form onSubmit={addPerson}><label><span>Student name</span><input value={personName} onChange={(event) => setPersonName(event.target.value)} /></label><button type="submit">Add</button></form>
              {live.people.roster.length === 0 ? <p>No roster yet. Names added here are saved for this Section’s future classes.</p> : <p>{live.people.roster.length} students saved for {live.session.sectionName}.</p>}
              <label><span>Picker mode</span><select aria-label="Picker mode" value={live.people.mode} onChange={(event) => onUpdate({ people: { ...live.people, mode: event.target.value as 'random' | 'round-robin' } })}><option value="random">Random</option><option value="round-robin">Round-robin</option></select></label>
              <button type="button" disabled={live.people.roster.length === 0} onClick={() => onUpdate({ people: pickNextArcTablePerson(live.people) })}>{live.people.mode === 'random' ? 'Pick a random student' : 'Pick next in rotation'}</button>
              <p className="arctable-picker-result" role="status" aria-live="polite">{selectedPerson ? `Selected: ${selectedPerson.name}` : 'No student selected.'}</p>
              <button type="button" disabled={!selectedPerson} onClick={() => onUpdate({ people: { ...live.people, projected: !live.people.projected } })}>{live.people.projected ? 'Hide selection from students' : 'Project selected student'}</button>
            </section>
          ) : null}
          {tool === 'passes' ? (
            <section ref={toolPanelRef} className="arctable-tool-panel arctable-pass-panel" aria-labelledby="pass-tools-heading">
              <h2 id="pass-tools-heading">Passes · {live.session.sectionName}</h2>
              <form onSubmit={addPass}><label><span>Pass type</span><input value={passLabel} placeholder="Restroom, Office…" onChange={(event) => setPassLabel(event.target.value)} /></label><button type="submit">Add pass type</button></form>
              {live.passes.passes.map((pass) => { const owner = live.people.roster.find((person) => person.id === pass.personId); const personId = passPeople[pass.id] || ''; return <div className={`arctable-pass arctable-pass--${pass.status}`} key={pass.id}><div><strong>{pass.label}</strong><span>{pass.status}{owner ? ` · ${owner.name}` : ' · unassigned'}</span></div><label><span>Person · optional</span><select aria-label={`${pass.label} person`} value={personId} onChange={(event) => setPassPeople((current) => ({ ...current, [pass.id]: event.target.value }))}><option value="">Generic pass</option>{live.people.roster.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><div><button type="button" aria-label={`Request ${pass.label}`} onClick={() => onUpdate({ passes: setArcTablePassStatus(live.passes, pass.id, 'requested', personId || null) })}>Request</button><button type="button" aria-label={`Activate ${pass.label}`} onClick={() => onUpdate({ passes: setArcTablePassStatus(live.passes, pass.id, 'active', personId || pass.personId) })}>Activate</button><button type="button" aria-label={`Return ${pass.label}`} onClick={() => onUpdate({ passes: setArcTablePassStatus(live.passes, pass.id, 'inactive') })}>Return</button></div></div> })}
            </section>
          ) : null}
          {tool === 'media' ? (
            <section ref={toolPanelRef} className="arctable-tool-panel arctable-media-panel" aria-labelledby="media-tools-heading">
              <h2 id="media-tools-heading">Media · {live.session.sectionName}</h2>
              <form onSubmit={addMedia}><label><span>Title</span><input value={mediaTitle} onChange={(event) => setMediaTitle(event.target.value)} /></label><label><span>Source URL or path</span><input value={mediaSource} onChange={(event) => setMediaSource(event.target.value)} /></label><label><span>Type</span><select value={mediaKind} onChange={(event) => setMediaKind(event.target.value as 'image' | 'slides')}><option value="image">Artwork / image</option><option value="slides">Presentation / slides</option></select></label><button type="submit">Add media</button></form>
              {mediaError ? <p role="alert" className="arctable-tool-error">{mediaError}</p> : null}
              {live.media.items.length === 0 ? <p>No media selected. The lesson board stays intentionally quiet.</p> : live.media.items.map((item) => <button type="button" className={item.id === live.media.activeId ? 'is-active' : ''} key={item.id} onClick={() => onUpdate({ media: { ...live.media, activeId: item.id, projected: false } })}>{item.title} · {item.kind}</button>)}
              <button type="button" disabled={!activeMedia} onClick={() => onUpdate({ media: { ...live.media, projected: !live.media.projected } })}>{live.media.projected ? 'Stop projecting media' : 'Project active media'}</button>
            </section>
          ) : null}
        </div>
      </div>

      {ending ? <EndClassDialog live={live} resumeNote={resumeNote} error={error} onResumeNote={setResumeNote} onFinish={finish} onCancel={() => setEnding(false)} /> : null}
    </main>
  )
}

export function ArcTableStudentSurface({ live, onShowTeacher, onSyncLive, onUpdate }: SharedProps) {
  const now = useClock()
  const [syncNote, setSyncNote] = useState('Following teacher')
  const [localPhase, setLocalPhase] = useState<number | null>(null)
  const timerRemaining = countdownRemaining(live.timer, now)
  const cleanupRemaining = countdownRemaining(live.cleanupTimer, now)
  const cleanupActive = cleanupIsActive(live)
  const selectedPerson = selectedArcTablePerson(live.people)
  const lessonParts = studentLessonParts(live)
  const displayPhase = localPhase ?? live.phase
  const followingTeacher = localPhase === null
  useSettleCountdowns(live, now, onUpdate)
  useEffect(() => {
    const leaveProjection = (event: KeyboardEvent) => { if (event.key === 'Escape') onShowTeacher() }
    window.addEventListener('keydown', leaveProjection)
    return () => window.removeEventListener('keydown', leaveProjection)
  }, [onShowTeacher])

  // Teacher phase advances while following — stay locked to live state.
  useEffect(() => {
    if (followingTeacher) setSyncNote('Following teacher')
  }, [followingTeacher, live.phase, live.voiceLevel, live.materials, live.timer.status])

  function syncWithTeacher() {
    const ok = onSyncLive?.() ?? true
    setLocalPhase(null)
    setSyncNote(ok ? 'Synced · following teacher' : 'No live session to sync')
  }

  return (
    <main className={`arctable arctable--student${cleanupActive ? ' is-cleanup' : ''}`}>
      <div className="arctable-paper-texture" aria-hidden="true" />
      <header className="arctable-student-header">
        <img
          className="arctable-header-wordmark"
          src={publicAssetUrl(ARC_TABLE_HEADER_DARK_ASSET)}
          alt="ArcTable"
          width={170}
          height={46}
          data-testid="arctable-student-header-mark"
        />
        <div className="arctable-student-session">
          <strong>{live.session.sectionName} · {live.session.courseTitle}</strong>
          <span data-testid="arctable-sync-status" role="status">{syncNote}</span>
        </div>
        <div className="arctable-student-header-actions">
          <button
            type="button"
            className="arctable-sync-button"
            data-testid="arctable-sync"
            onClick={syncWithTeacher}
          >
            Sync
          </button>
          <button
            type="button"
            className="arctable-projection-exit"
            data-testid="arctable-teacher-mode"
            onClick={onShowTeacher}
          >
            Teacher mode
          </button>
        </div>
      </header>
      <section className="arctable-student-stage">
        <div className="arctable-student-decor arctable-student-decor--left" aria-hidden="true" />
        <div className="arctable-student-decor arctable-student-decor--right" aria-hidden="true" />
        <nav className="arctable-student-parts" aria-label="Lesson parts" data-testid="arctable-student-parts">
          <ol>
            {lessonParts.map((label, index) => {
              const partNumber = index + 1
              const current = partNumber === displayPhase
              return (
                <li key={`${partNumber}-${label}`}>
                  <button
                    type="button"
                    className={current ? 'is-current' : undefined}
                    aria-current={current ? 'step' : undefined}
                    aria-label={current ? `Current part: ${label}` : `Go to part: ${label}`}
                    onClick={() => {
                      if (current && followingTeacher) return
                      setLocalPhase(partNumber)
                      setSyncNote('Previewing a part · Sync to follow teacher')
                    }}
                  >
                    <span className="arctable-student-parts-index">{partNumber}</span>
                    <span className="arctable-student-parts-label">{label}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>
        <div className="arctable-student-work">
          <p className="arctable-kicker">{live.session.unitTitle}</p><h1>{live.session.lessonTitle}</h1>
          {live.directions.length > 0 ? <ol>{live.directions.map((direction, index) => <li key={`${direction}-${index}`}><strong>{index + 1}</strong><span>{direction}</span></li>)}</ol> : null}
          {live.media.projected ? <MediaSurface media={live.media} projected /> : null}
          {live.people.projected && selectedPerson ? <p className="arctable-projected-person">{selectedPerson.name}, you’re up.</p> : null}
        </div>
        <aside className="arctable-student-now">
          <div className="arctable-timer-ring" aria-label={cleanupActive ? `Cleanup ${formatDuration(cleanupRemaining)} remaining` : `Classroom timer ${formatDuration(timerRemaining)} remaining`}><TimerDigits as="strong" seconds={cleanupActive ? cleanupRemaining : timerRemaining} /></div>
          <span className="arctable-voice">Voice {live.voiceLevel}</span>
          <p><span>Current phase</span><strong>{displayPhase} of {live.phaseCount}{lessonParts[displayPhase - 1] ? ` · ${lessonParts[displayPhase - 1]}` : ''}{followingTeacher ? '' : ' · preview'}</strong></p>
        </aside>
        <div className="arctable-student-facts-row" data-testid="arctable-student-facts-row">
          <div>
            <span className="arctable-kicker">Materials</span>
            <strong>{live.materials || 'None listed'}</strong>
          </div>
          <div>
            <span className="arctable-kicker">Phase</span>
            <strong>{displayPhase} / {live.phaseCount}{lessonParts[displayPhase - 1] ? ` · ${lessonParts[displayPhase - 1]}` : ''}</strong>
          </div>
          <div>
            <span className="arctable-kicker">Clean up</span>
            <strong>{cleanupActive ? formatDuration(cleanupRemaining) : `${Math.ceil(live.cleanupTimer.durationSeconds / 60)} min`}</strong>
          </div>
        </div>
      </section>
      {cleanupActive ? <div className="arctable-student-cleanup" role="status"><strong>{live.cleanupTimer.status === 'completed' ? 'Cleanup complete' : 'Cleanup now'}</strong><span>Save your work · return materials · stay at your table.</span></div> : null}
    </main>
  )
}

/** Plain-English lesson parts from the plan; pad to phaseCount when phases are sparse. */
function studentLessonParts(live: ArcTableLiveState): string[] {
  const planned = live.session.phases.map((label) => label.trim()).filter(Boolean)
  const count = Math.max(1, live.phaseCount, planned.length)
  return Array.from({ length: count }, (_, index) => planned[index] || `Part ${index + 1}`)
}

function MediaSurface({
  media,
  projected = false,
  onOpenMedia,
  onPreviewStudent,
}: {
  media: ArcTableMediaState
  projected?: boolean
  onOpenMedia?: () => void
  onPreviewStudent?: () => void
}) {
  const active = media.items.find((item) => item.id === media.activeId)
  if (!active) {
    return (
      <section className="arctable-media arctable-media--empty" aria-label="Media surface">
        <p className="arctable-kicker">Media / artwork</p>
        <strong>Nothing on the board yet</strong>
        <div className="arctable-media-empty-actions">
          {onOpenMedia ? <button type="button" onClick={onOpenMedia}>Project media</button> : null}
          {onPreviewStudent ? <button type="button" className="quiet-button" onClick={onPreviewStudent}>Student preview</button> : null}
        </div>
      </section>
    )
  }
  const showing = projected || media.projected
  return (
    <section
      className={`arctable-media arctable-media--active${showing ? ' is-projected' : ' is-dimmed'}`}
      aria-label={`Active media: ${active.title}`}
    >
      <p className="arctable-kicker">{active.title}{showing ? '' : ' · Not projecting'}</p>
      {active.kind === 'image' ? <img src={active.source} alt={active.title} /> : <iframe src={active.source} title={active.title} sandbox="allow-scripts allow-same-origin allow-presentation" allowFullScreen />}
    </section>
  )
}

function EndClassDialog({ live, resumeNote, error, onResumeNote, onFinish, onCancel }: { live: ArcTableLiveState; resumeNote: string; error: string | null; onResumeNote: (value: string) => void; onFinish: (outcome: ArcTableTeachingOutcome) => void; onCancel: () => void }) {
  const neverStarted = live.session.deliveryStatus === 'not-started' && elapsedLiveMinutes(live) === 0 && live.phase === 1 && live.timer.status === 'idle' && live.cleanupTimer.status === 'idle'
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])
  return <div className="arctable-end-layer" role="dialog" aria-modal="true" aria-labelledby="end-class-title"><form className="arctable-end-card" onSubmit={(event) => { event.preventDefault(); if (resumeNote.trim()) onFinish({ kind: 'stopped', resumeNote }) }}><p className="arctable-kicker">Instructional outcome</p><h2 id="end-class-title">Where did this class land?</h2><p>Ending is different from opening Plan View. This updates only {live.session.sectionName} and closes its live tools.</p>{error ? <p className="setup-errors" role="alert">{error}</p> : null}<button type="button" className="primary-button" onClick={() => onFinish({ kind: 'completed' })}>Complete lesson</button><label><span>Stop here + required resume note</span><textarea required value={resumeNote} onChange={(event) => onResumeNote(event.target.value)} /></label><button type="submit" className="quiet-button">Save stop point</button>{neverStarted ? <button type="button" className="text-button" onClick={() => onFinish({ kind: 'skipped' })}>Skip — lesson never started</button> : null}<button type="button" className="text-button" onClick={onCancel}>Keep class running</button></form></div>
}

function useSettleCountdowns(live: ArcTableLiveState, now: Date, onUpdate: SharedProps['onUpdate']) {
  const timerRemaining = countdownRemaining(live.timer, now)
  const cleanupRemaining = countdownRemaining(live.cleanupTimer, now)
  useEffect(() => {
    const update: Partial<ArcTableLiveState> = {}
    if (live.timer.status === 'running' && timerRemaining === 0) update.timer = settleArcTableCountdown(live.timer, now)
    if (live.cleanupTimer.status === 'running' && cleanupRemaining === 0) update.cleanupTimer = settleArcTableCountdown(live.cleanupTimer, now)
    if (update.timer || update.cleanupTimer) onUpdate(update)
  }, [cleanupRemaining, live.cleanupTimer, live.timer, now, onUpdate, timerRemaining])
}

function useClock() { const [now, setNow] = useState(() => new Date()); useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1_000); return () => window.clearInterval(timer) }, []); return now }
function formatDuration(totalSeconds: number): string { const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60; return `${minutes}:${seconds.toString().padStart(2, '0')}` }
function TimerDigits({ seconds, as: Tag = 'span' }: { seconds: number; as?: 'span' | 'strong' }) {
  const label = formatDuration(seconds)
  return <Tag className={`arctable-timer-digits${label.length > 5 ? ' is-compact' : ''}`}>{label}</Tag>
}
