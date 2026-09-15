import {
  findLocalSchoolById,
  isNcesReachabilityFailure,
  LOCAL_SCHOOL_DIRECTORY,
  searchLocalSchoolDirectory,
} from './localSchoolDirectory'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(LOCAL_SCHOOL_DIRECTORY.some((school) => school.id === 'nces:120144001406'), 'Local directory must include Oak Ridge High for bell-schedule alignment.')
assert(findLocalSchoolById('nces:120144001406')?.schoolName === 'Oak Ridge High', 'findLocalSchoolById must resolve curated schools.')
assert(findLocalSchoolById(null) === null, 'Missing id must not invent a school.')

const found = searchLocalSchoolDirectory({ schoolName: 'Oak Ridge', city: 'Orlando', state: 'FL' })
assert(found.status === 'candidates' && found.candidates.length >= 1, 'Local search must find Oak Ridge.')
assert(found.status === 'candidates' && found.candidates[0]?.id === 'nces:120144001406', 'Oak Ridge must keep stable NCES id.')

const none = searchLocalSchoolDirectory({ schoolName: 'Definitely Missing School', state: 'FL' })
assert(none.status === 'none', 'Unknown schools must stay honest none.')

const invalid = searchLocalSchoolDirectory({ schoolName: '' })
assert(invalid.status === 'invalid', 'Empty school name must fail validation.')

assert(isNcesReachabilityFailure({ status: 'invalid', candidates: [], message: 'Arc could not reach the NCES public-school directory. Nothing was selected or saved.' }), 'Reachability failures must be detected for fallback.')
assert(!isNcesReachabilityFailure({ status: 'invalid', candidates: [], message: 'Enter a school name before searching official sources.' }), 'Validation errors must not trigger fallback.')
assert(!isNcesReachabilityFailure({ status: 'none', candidates: [] }), 'Honest none is not a reachability failure.')

console.log('Local school directory contract passed')
