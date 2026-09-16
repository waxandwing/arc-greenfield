import {
  DEFAULT_CLASS_TIME_DRAFTS,
  classTimeDraftsForSchool,
  suggestSchoolYearDates,
} from './schoolSetupSuggestions'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const oakRidge = suggestSchoolYearDates('nces:120144001406')
assert(oakRidge?.firstDay === '2026-08-11', 'Oak Ridge must suggest OCPS first day.')
assert(oakRidge?.lastDay === '2027-05-26', 'Oak Ridge must suggest OCPS last day.')
assert(oakRidge?.schoolYearLabel === '2026–27', 'Oak Ridge must suggest 2026–27 label.')
assert(Boolean(oakRidge?.sourceLabel.includes('suggested')), 'Date suggestion must stay honest about confirm/edit.')

assert(suggestSchoolYearDates('nces:062271003406') === null, 'Berkeley must not invent district dates.')
assert(suggestSchoolYearDates(null) === null, 'Missing school must not invent dates.')

const oakTimes = classTimeDraftsForSchool('nces:120144001406')
assert(oakTimes.fromSchoolData, 'Oak Ridge must use curated bell schedule for class times.')
assert(oakTimes.drafts.some((row) => row.label === 'Period 1'), 'Oak Ridge class times must include Period 1.')
assert(oakTimes.drafts.some((row) => row.kind === 'planning'), 'Oak Ridge class times must include planning.')

const fallback = classTimeDraftsForSchool('nces:000000000000')
assert(!fallback.fromSchoolData, 'Unknown school must use demo class times.')
assert(fallback.drafts.length === DEFAULT_CLASS_TIME_DRAFTS.length, 'Demo class times must stay editable defaults.')
assert(fallback.sourceLabel.toLowerCase().includes('demo'), 'Fallback source label must say demo.')

console.log('school setup suggestions contract passed')
