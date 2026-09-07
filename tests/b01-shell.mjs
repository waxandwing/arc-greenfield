import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const app = readFileSync('src/components/AppFrame.tsx', 'utf8')
const css = readFileSync('src/styles/b01FurnitureShell.css', 'utf8')
const main = readFileSync('src/main.tsx', 'utf8')
const preferences = readFileSync('src/navigation/viewPreferences.ts', 'utf8')

assert(!app.includes('CalendarViewRail'), 'B01 shell must not render or import a permanent CalendarViewRail.')
assert(!existsSync('src/components/CalendarViewRail.tsx'), 'Obsolete CalendarViewRail component must be removed, not left dead.')
assert(app.includes('furniture-tab-settings') && app.includes('furniture-settings'), 'Settings furniture is missing.')
assert(app.includes('furniture-tab-fridge') && app.includes('furniture-fridge'), 'Fridge furniture is missing.')
assert(app.includes('furniture-tab-task') && app.includes('furniture-task'), 'Task Bar furniture is missing.')
assert(app.includes('b01-fixed-calendar'), 'Calendar does not carry the fixed B01 geometry contract.')
assert(app.includes('moveLessonToFridge') && app.includes('moveLessonFromFridge') && app.includes('undoFridgeRoundTrip'), 'Fridge furniture is not wired to canonical round-trip behavior.')
assert(app.includes('TASK_STORAGE_KEY'), 'Task Bar note persistence is missing.')
assert(!css.includes('PLACEHOLDER'), 'B01 furniture stylesheet is still a placeholder.')
assert(css.includes('--b01-calendar-width') && css.includes('.b01-fixed-calendar'), 'Fixed central calendar geometry CSS is missing.')
assert(css.includes('.furniture-settings') && css.includes('.furniture-fridge') && css.includes('.furniture-task'), 'One or more furniture open-state surfaces are unstyled.')
assert(css.includes('position: fixed'), 'Furniture must emerge from exterior edges instead of participating in calendar reflow.')
assert(main.includes("./styles/b01FurnitureShell.css"), 'B01 furniture stylesheet is not loaded by the app.')
assert(preferences.includes('showWeekends: false'), 'Default teacher week must remain Monday–Friday.')

const parallelPlanningDir = 'src/arc/planning'
const parallelFiles = existsSync(parallelPlanningDir) ? readdirSync(parallelPlanningDir).filter((name) => !name.startsWith('.')) : []
assert(parallelFiles.length === 0, `Parallel donor planning modules remain: ${parallelFiles.join(', ')}`)

const canonicalPlanning = readdirSync('src/planning')
assert(canonicalPlanning.includes('objectActions.ts') && canonicalPlanning.includes('fridgeRoundTrip.ts'), 'Canonical planning boundary is incomplete.')

console.log('B01 shell-law contract passed')
