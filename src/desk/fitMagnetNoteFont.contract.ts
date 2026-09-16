import {
  chooseFittingSize,
  MAGNET_NOTE_MAX_PX,
  MAGNET_NOTE_MIN_PX,
} from './fitMagnetNoteFont'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(MAGNET_NOTE_MIN_PX < MAGNET_NOTE_MAX_PX, 'Magnet note size range must be ordered.')

const alwaysFits = chooseFittingSize(9, 26, () => true)
assert(alwaysFits === 26, 'When every size fits, choose the max.')

const neverFits = chooseFittingSize(9, 26, () => false)
assert(neverFits === 9, 'When nothing fits, fall back to the min (caller still applies it).')

const threshold = chooseFittingSize(9, 26, (px) => px <= 14)
assert(threshold === 14, 'Binary search must pick the largest size that still fits.')

const shortLabelBudget = chooseFittingSize(9, 26, (px) => px <= 24)
assert(shortLabelBudget === 24, 'Short labels like Asia should be allowed near the max.')

const longNameBudget = chooseFittingSize(9, 26, (px) => px <= 10)
assert(longNameBudget === 10, 'Long unit names must shrink to stay inside the face.')

console.log('fit magnet note font contract passed')
