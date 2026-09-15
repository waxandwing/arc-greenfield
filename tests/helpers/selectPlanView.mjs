/** Stage 7.2+: planner index tabs replace the calendar view dropdown. */
export async function selectPlanView(page, view) {
  const tabLabels = { Day: 'DAY', Week: 'WEEK', Month: 'MONTH', Year: 'YEAR' }
  const label = tabLabels[view]
  if (!label) throw new Error(`Unknown plan view: ${view}`)
  const nav = page.getByRole('navigation', { name: 'Planner index' })
  const tab = nav.getByRole('button', { name: label, exact: true })
  // Desk furniture (quick capture sticky, edge tickets) can sit above the index hit target;
  // smokes must still change view without depending on pointer stacking.
  await tab.evaluate((element) => element.click())
}

/** Teaching Day retreat law: DAY tab returns to Teaching Day on the same anchor date. */
export async function retreatToTeachingDayViaDayTab(page) {
  await selectPlanView(page, 'Day')
}

/** Wordmark home matches DAY retreat when not in Workspace overlay workflows. */
export async function retreatToTeachingDayViaWordmark(page) {
  await page.getByRole('button', { name: 'Teaching Day home' }).click()
}

/** @deprecated alias for smokes migrating from dropdown navigation */
export async function selectView(page, view) {
  return selectPlanView(page, view)
}
