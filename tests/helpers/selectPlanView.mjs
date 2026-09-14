/** Stage 7.2+: planner index tabs replace the calendar view dropdown. */
export async function selectPlanView(page, view) {
  const tabLabels = { Day: 'DAY', Week: 'WEEK', Month: 'MONTH', Year: 'YEAR' }
  const label = tabLabels[view]
  if (!label) throw new Error(`Unknown plan view: ${view}`)
  const nav = page.getByRole('navigation', { name: 'Planner index' })
  await nav.getByRole('button', { name: label, exact: true }).click()
}

/** @deprecated alias for smokes migrating from dropdown navigation */
export async function selectView(page, view) {
  return selectPlanView(page, view)
}
