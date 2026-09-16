export type ClassTabCourse = {
  id: string
  title: string
}

type Props = {
  courses: readonly ClassTabCourse[]
  /** `null` means All classes. */
  activeId: string | null
  onSelect: (courseId: string | null) => void
}

/** Horizontal course filter for the Lessons library header. */
export function ClassTabsNav({ courses, activeId, onSelect }: Props) {
  if (courses.length === 0) return null

  const allCurrent = activeId === null

  return (
    <nav className="class-tabs-nav" aria-label="Classes" data-testid="class-tabs-nav">
      <button
        type="button"
        className={`class-tabs-nav-item${allCurrent ? ' class-tabs-nav-item--current' : ''}`}
        aria-current={allCurrent ? 'page' : undefined}
        onClick={() => {
          if (!allCurrent) onSelect(null)
        }}
      >
        All classes
      </button>
      {courses.map((course) => {
        const current = course.id === activeId
        return (
          <button
            key={course.id}
            type="button"
            className={`class-tabs-nav-item${current ? ' class-tabs-nav-item--current' : ''}`}
            aria-current={current ? 'page' : undefined}
            onClick={() => {
              if (!current) onSelect(course.id)
            }}
          >
            {course.title}
          </button>
        )
      })}
    </nav>
  )
}
