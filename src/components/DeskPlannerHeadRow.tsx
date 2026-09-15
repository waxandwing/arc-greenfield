import type { ComponentProps, RefObject } from 'react'
import { deskPlannerTitleMarkUrl, deskCommittedRasterChromeEnabled } from '../desk/deskSliceRuntime'
import { PlanStateHeader } from './PlanStateHeader'

type PlanStateProps = ComponentProps<typeof PlanStateHeader>

type Props = PlanStateProps & {
  deskEnabled?: boolean
  todayDisabled?: boolean
  onToday?: () => void
  searchQuery?: string
  onSearchQueryChange?: (value: string) => void
  onEnlargeCalendar?: () => void
  calendarEnlarged?: boolean
  enlargeTriggerRef?: React.RefObject<HTMLButtonElement | null>
}

export function DeskPlannerHeadRow({
  deskEnabled = false,
  todayDisabled = false,
  onToday,
  searchQuery = '',
  onSearchQueryChange,
  onEnlargeCalendar,
  calendarEnlarged = false,
  enlargeTriggerRef,
  ...planState
}: Props) {
  if (!deskEnabled) {
    return <PlanStateHeader {...planState} />
  }

  const showRainbowMark = planState.view === 'Week'
  const titleMarkUrl = deskPlannerTitleMarkUrl()

  return (
    <div className="desk-planner-head-row" data-testid="desk-planner-head-row">
      <div className="desk-planner-head-title-cluster">
        {showRainbowMark ? (
          <img
            className="desk-planner-rainbow-mark"
            src={titleMarkUrl}
            alt=""
            width={120}
            height={96}
            aria-hidden="true"
            data-testid="desk-planner-rainbow-mark"
            data-desk-mark-source={deskCommittedRasterChromeEnabled() ? 'committed-png' : 'vector'}
            decoding="async"
          />
        ) : null}
        <PlanStateHeader {...planState} />
      </div>
      <div className="desk-planner-head-tools" role="group" aria-label="Planner tools">
        <label className="desk-planner-search-field">
          <span className="sr-only">Search plan</span>
          <input
            type="search"
            className="desk-planner-search"
            data-testid="desk-planner-search"
            placeholder="Search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange?.(event.target.value)}
          />
        </label>
        <div
          className="desk-planner-today-cluster period-controls"
          role="group"
          aria-label="Today navigation"
        >
          <button
            type="button"
            className="quiet-button period-button desk-planner-today-nav"
            data-testid="desk-planner-today-prev"
            disabled
            aria-label="Previous day"
          >
            ←
          </button>
          <button
            type="button"
            className="quiet-button today-button desk-planner-today"
            data-testid="desk-planner-today"
            disabled={todayDisabled}
            onClick={onToday}
          >
            Today
          </button>
          <button
            type="button"
            className="quiet-button period-button desk-planner-today-nav"
            data-testid="desk-planner-today-next"
            disabled
            aria-label="Next day"
          >
            →
          </button>
        </div>
        {onEnlargeCalendar ? (
          <button
            ref={enlargeTriggerRef as RefObject<HTMLButtonElement> | undefined}
            type="button"
            className="quiet-button desk-planner-enlarge"
            data-testid="calendar-enlarge"
            aria-expanded={calendarEnlarged}
            aria-haspopup="dialog"
            onClick={onEnlargeCalendar}
          >
            Enlarge
          </button>
        ) : null}
      </div>
    </div>
  )
}