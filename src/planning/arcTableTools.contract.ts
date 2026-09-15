import {
  ARC_TABLE_MAX_COUNTDOWN_SECONDS,
  ARC_TABLE_MAX_INLINE_IMAGE_CHARACTERS,
  addArcTablePassDefinition,
  addArcTableMedia,
  addArcTablePerson,
  countdownRemaining,
  createArcTableCountdown,
  createArcTableMediaState,
  createArcTablePassState,
  createArcTablePeopleState,
  pauseArcTableCountdown,
  pickNextArcTablePerson,
  resetArcTableCountdown,
  selectedArcTablePerson,
  setArcTableCountdownDuration,
  setArcTablePassStatus,
  settleArcTableCountdown,
  startArcTableCountdown,
} from './arcTableTools'

const t0 = new Date('2026-10-16T15:20:00.000Z')
let timer = startArcTableCountdown(createArcTableCountdown(120), t0)
if (countdownRemaining(timer, new Date('2026-10-16T15:20:30.000Z')) !== 90) throw new Error('Running classroom timer must use its own deterministic origin.')
timer = pauseArcTableCountdown(timer, new Date('2026-10-16T15:20:30.000Z'))
if (timer.status !== 'paused' || countdownRemaining(timer, new Date('2026-10-16T18:00:00.000Z')) !== 90) throw new Error('Paused classroom timer must remain paused across navigation or refresh.')
timer = startArcTableCountdown(timer, new Date('2026-10-16T18:00:00.000Z'))
if (countdownRemaining(timer, new Date('2026-10-16T18:01:30.000Z')) !== 0 || settleArcTableCountdown(timer, new Date('2026-10-16T18:01:30.000Z')).status !== 'completed') throw new Error('Completed countdown must settle explicitly.')
timer = setArcTableCountdownDuration(timer, 300)
if (timer.durationSeconds !== 300 || timer.remainingSeconds !== 300 || resetArcTableCountdown(timer).status !== 'idle') throw new Error('Timer duration and reset must be independent of class elapsed time.')
timer = setArcTableCountdownDuration(timer, ARC_TABLE_MAX_COUNTDOWN_SECONDS + 60)
if (timer.durationSeconds !== ARC_TABLE_MAX_COUNTDOWN_SECONDS) throw new Error('Timer must use the shared authoritative maximum rather than silently disagreeing with the UI.')

let people = createArcTablePeopleState('section-p4')
if (selectedArcTablePerson(pickNextArcTablePerson(people)) !== null) throw new Error('Empty people picker must fail quiet.')
people = addArcTablePerson(addArcTablePerson(people, '  Maya   Chen '), 'Luis Rivera')
people = addArcTablePerson(people, 'maya chen')
if (people.roster.length !== 2 || people.sectionId !== 'section-p4') throw new Error('People picker must normalize names, avoid duplicates, and remain Section-scoped.')
people = pickNextArcTablePerson(people)
if (!selectedArcTablePerson(people)) throw new Error('Random people picker must return an explicit teacher-visible selection.')
people = { ...people, mode: 'round-robin', selectedId: null }
people = pickNextArcTablePerson(people)
if (selectedArcTablePerson(people)?.name !== 'Maya Chen') throw new Error('Round-robin picker must be explicit and deterministic.')

let passes = createArcTablePassState('section-p4')
passes = addArcTablePassDefinition(passes, 'Office')
passes = setArcTablePassStatus(passes, 'hall-pass', 'requested', people.roster[0].id)
passes = setArcTablePassStatus(passes, 'hall-pass', 'active', people.roster[0].id)
if (passes.sectionId !== 'section-p4' || passes.passes.find((pass) => pass.id === 'hall-pass')?.personId !== people.roster[0].id || !passes.passes.some((pass) => pass.label === 'Office')) throw new Error('Pass state must preserve configurable type, ownership, and active/requested truth inside one Section.')
passes = setArcTablePassStatus(passes, 'hall-pass', 'inactive')
if (passes.passes.find((pass) => pass.id === 'hall-pass')?.personId !== null) throw new Error('Returned passes must clear transient ownership.')

let media = createArcTableMediaState('section-p4')
media = addArcTableMedia(media, { title: 'Chartres west façade', kind: 'image', source: '/assets/arc/arc-mark.png' })
media = addArcTableMedia(media, { title: 'Gothic comparison deck', kind: 'slides', source: '/slides/gothic' })
if (media.items.length !== 1) throw new Error('Slides must reject unsupported providers and local paths rather than rendering a blank frame.')
media = addArcTableMedia(media, { title: 'Public design deck', kind: 'slides', source: 'https://docs.google.com/presentation/d/1NDNfwoWFSYbQaebMiiXE8GOW0ivDZii4We8I552AFgs/edit?usp=sharing' })
if (media.sectionId !== 'section-p4' || media.items.length !== 2 || !media.items[1].source.includes('/embed?')) throw new Error('Google Slides edit URLs must normalize to an intentional view-only embed URL.')
media = addArcTableMedia(media, { title: 'Unsafe', kind: 'slides', source: 'javascript:alert(1)' })
if (media.items.length !== 2) throw new Error('Media surface must reject unsafe source schemes.')
media = addArcTableMedia(media, { title: 'Oversized inline image', kind: 'image', source: `data:image/png;base64,${'a'.repeat(ARC_TABLE_MAX_INLINE_IMAGE_CHARACTERS)}` })
if (media.items.length !== 2) throw new Error('Media must reject oversized inline payloads before they bloat live-session storage.')

console.log('ArcTable timer, cleanup, people, pass, and media tools contract passed')
