import { GAUNTLET_DEMO_CALENDAR_ID } from './gauntletDemo'
import { readDeskShellForceFromSearch, shouldForceDeskShell } from './deskPreviewGate'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(!readDeskShellForceFromSearch('?demo=1', false), 'demo query is ignored outside desk preview builds.')
assert(!shouldForceDeskShell({ locationSearch: '?forceDesk=1', deskPreview: false }), 'forceDesk is preview-build only.')

assert(readDeskShellForceFromSearch('?demo=1', true), 'demo=1 must force desk shell on preview builds.')
assert(readDeskShellForceFromSearch('?demoReset=1', true), 'demoReset must force desk shell on preview builds.')
assert(readDeskShellForceFromSearch('?forceDesk=1', true), 'forceDesk=1 must force desk shell on preview builds.')
assert(
  shouldForceDeskShell({ locationSearch: '', calendarId: GAUNTLET_DEMO_CALENDAR_ID, deskPreview: true }),
  'Gauntlet calendar id must force desk shell on preview builds.',
)
assert(
  shouldForceDeskShell({ locationSearch: '', sessionSeeded: true, deskPreview: true }),
  'Demo seed session marker must force desk shell on preview builds.',
)

console.log('desk preview gate contract passed')
