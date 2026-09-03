import { useState } from 'react'
import {
  createCourseId,
  createSectionId,
  hydratePlanningWorkspace,
  sectionsForWorkspaceCourse,
  type Course,
  type PlanningWorkspace,
  type PlanningWorkspaceInput,
  type Section,
} from '../planning'

type Props = {
  calendarId: string
  initialValue: PlanningWorkspaceInput | null
  onSave: (input: PlanningWorkspaceInput, workspace: PlanningWorkspace) => void
  onCancel: () => void
}

export function ClassSetup({ calendarId, initialValue, onSave, onCancel }: Props) {
  const [courses, setCourses] = useState<Course[]>(() => initialValue?.courses.map((course) => ({ ...course })) ?? [])
  const [sections, setSections] = useState<Section[]>(() => initialValue?.sections.map((section) => ({ ...section })) ?? [])
  const [errors, setErrors] = useState<string[]>([])

  function addCourse() {
    setCourses((current) => [...current, { id: createCourseId(), title: '' }])
  }

  function removeCourse(courseId: string) {
    setCourses((current) => current.filter((course) => course.id !== courseId))
    setSections((current) => current.filter((section) => section.courseId !== courseId))
  }

  function addSection(courseId: string) {
    setSections((current) => [
      ...current,
      { id: createSectionId(), courseId, calendarId, name: '' },
    ])
  }

  function submit() {
    try {
      const input: PlanningWorkspaceInput = {
        calendarId,
        courses: courses.map((course) => ({ ...course, title: course.title.trim() })),
        sections: sections.map((section) => ({ ...section, name: section.name.trim(), calendarId })),
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
    <div className="class-setup">
      <div className="calendar-setup-intro">
        <p className="section-label">Classes</p>
        <h2>Tell Arc what you actually teach.</h2>
        <p>Add each course once, then add the periods or sections that use that same plan. Arc keeps the curriculum shared without pretending every class moves at the same speed.</p>
      </div>

      {errors.length > 0 && (
        <div className="setup-errors" role="alert">
          <strong>Check the class setup.</strong>
          <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </div>
      )}

      <div className="class-course-list">
        {courses.length === 0 && (
          <div className="class-empty-state">
            <p>No classes yet.</p>
            <button type="button" className="primary-button" onClick={addCourse}>Add a course</button>
          </div>
        )}

        {courses.map((course) => {
          const courseSections = sectionsForWorkspaceCourse({ calendarId, courses, sections }, course.id)
          return (
            <section className="class-course" key={course.id} aria-labelledby={`${course.id}-label`}>
              <div className="class-course-heading">
                <label className="class-course-title" id={`${course.id}-label`}>
                  <span>Course</span>
                  <input
                    value={course.title}
                    placeholder="AP Art History"
                    onChange={(event) => setCourses((current) => current.map((item) => item.id === course.id ? { ...item, title: event.target.value } : item))}
                  />
                </label>
                <button type="button" className="text-button" onClick={() => removeCourse(course.id)}>Remove course</button>
              </div>

              <div className="class-section-list">
                {courseSections.map((section) => (
                  <div className="class-section-row" key={section.id}>
                    <label>
                      <span>Period or section</span>
                      <input
                        value={section.name}
                        placeholder="Period 2"
                        onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, name: event.target.value } : item))}
                      />
                    </label>
                    <button type="button" className="text-button" onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}>Remove</button>
                  </div>
                ))}

                <button type="button" className="quiet-button class-add-section" onClick={() => addSection(course.id)}>Add a period or section</button>
              </div>
            </section>
          )
        })}
      </div>

      {courses.length > 0 && (
        <button type="button" className="quiet-button class-add-course" onClick={addCourse}>Add another course</button>
      )}

      <div className="setup-actions">
        <p>Course names are shared curriculum. Periods and sections are the actual groups you teach. Their individual progress comes later, after Lessons exist.</p>
        <div className="setup-action-buttons">
          <button type="button" className="text-button" onClick={onCancel}>Cancel</button>
          <button type="button" className="primary-button" onClick={submit}>Save classes</button>
        </div>
      </div>
    </div>
  )
}
