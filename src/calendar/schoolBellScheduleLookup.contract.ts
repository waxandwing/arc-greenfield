import {
  lookupSchoolBellSchedule,
  ncesSchoolIdFromToken,
  resolveBellScheduleSchoolId,
} from './schoolBellScheduleLookup'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(ncesSchoolIdFromToken('nces:120144001406') === '120144001406', 'NCES token must normalize school id.')
assert(resolveBellScheduleSchoolId({ onboardingSchoolNcesId: 'nces:120144001406' }) === '120144001406', 'Onboarding school id must resolve for bell lookup.')

const found = lookupSchoolBellSchedule({ ncesSchoolId: '120144001406', sectionCount: 2 })
assert(found.status === 'found', 'Known NCES school must return a proposed bell schedule.')
if (found.status === 'found') {
  assert(found.blocks.some((block) => block.type === 'planning'), 'Proposal must include an explicit planning block.')
  assert(found.sourceLabel.includes('confirmation'), 'Source transparency must mention teacher confirmation.')
}

const missing = lookupSchoolBellSchedule({ ncesSchoolId: 'nces:000000000000', sectionCount: 1 })
assert(missing.status === 'unavailable', 'Unknown school must fail closed with manual fallback message.')
if (missing.status === 'unavailable') {
  assert(missing.message.includes('Build your day manually'), 'Fallback must invite manual build without requiring lookup.')
}

console.log('school bell schedule lookup contract passed')
