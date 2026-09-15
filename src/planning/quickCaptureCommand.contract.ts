import {
  parseQuickCaptureCommand,
  quickCaptureDestinationLabel,
  quickCaptureHintForDraft,
} from './quickCaptureCommand'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const unit = parseQuickCaptureCommand('u mesopotamia')
assert(unit.kind === 'unit' && unit.text === 'mesopotamia' && unit.hadPrefix, 'u prefix must yield unit + body.')

const lesson = parseQuickCaptureCommand('l Intro slides')
assert(lesson.kind === 'lesson' && lesson.text === 'Intro slides', 'l prefix must yield lesson.')

const idea = parseQuickCaptureCommand('i field trip')
assert(idea.kind === 'idea' && idea.text === 'field trip', 'i prefix must yield idea.')

const note = parseQuickCaptureCommand('n bring clay')
assert(note.kind === 'note' && note.text === 'bring clay', 'n prefix must yield note.')

const bare = parseQuickCaptureCommand('just a thought')
assert(bare.kind === 'idea' && bare.text === 'just a thought' && !bare.hadPrefix, 'Bare text defaults to idea.')

const lonelyU = parseQuickCaptureCommand('u')
assert(lonelyU.kind === 'idea' && lonelyU.text === 'u' && !lonelyU.hadPrefix, 'Lone u without body stays literal idea text.')

assert(quickCaptureDestinationLabel('idea') === 'Saved to IDEAS', 'Idea destination label.')
assert(quickCaptureHintForDraft('u meso').includes('unit'), 'Draft hint must reflect u prefix.')

console.log('quick capture command contract passed')
