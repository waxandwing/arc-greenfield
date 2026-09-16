import { DESK_IDEAS_CLEAN_UP_EVENT, DESK_IDEAS_OPEN_EVENT, requestDeskIdeasCleanUp, requestDeskIdeasOpen } from './deskIdeasEvents'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(DESK_IDEAS_OPEN_EVENT === 'arc-desk-ideas-open', 'IDEAS open event name must stay stable.')
assert(DESK_IDEAS_CLEAN_UP_EVENT === 'arc-desk-ideas-clean-up', 'IDEAS clean-up event name must stay stable.')

const source = requestDeskIdeasCleanUp.toString()
assert(!source.includes('requestDeskIdeasOpen'), 'Clean up must not open the IDEAS tray.')
assert(typeof requestDeskIdeasOpen === 'function', 'Open helper must remain available for explicit open.')

console.log('desk ideas events contract passed')
