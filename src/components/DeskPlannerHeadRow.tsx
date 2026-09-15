import type { ComponentProps } from 'react'
import { PlanStateHeader } from './PlanStateHeader'

type PlanStateProps = ComponentProps<typeof PlanStateHeader>

type Props = PlanStateProps & {
  deskEnabled?: boolean
  todayDisabled?: boolean
  onToday?: () => void
  searchQuery?: string
  onSearchQueryChange?: (value: string) => void
}

export function DeskPlannerHeadRow({
  deskEnabled = false,
  todayDisabled = false,
  onToday,
  searchQuery = '',
  onSearchQueryChange,
  ...planState
}: Props) {
  if (!deskEnabled) {
    return <PlanStateHeader {...planState} />
  }

  return (
    <div className="desk-planner-head-row" data-testid="desk-planner-head-row">
      <PlanStateHeader {...planState} />
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
        <button
          type="button"
          className="quiet-button today-button desk-planner-today"
          data-testid="desk-planner-today"
          disabled={todayDisabled}
          onClick={onToday}
        >
          Today
        </button>
      </div>
    </div>
  )
}