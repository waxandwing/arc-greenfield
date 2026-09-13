import {
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

let people = createArcTablePeopleState('section-p4')
if (selectedArcTablePerson(pickNextArcTablePerson(people)) !== null) throw new Error('Empty people picker must fail quiet.')
people = addArcTablePerson(addArcTablePerson(people, '  Maya   Chen '), 'Luis Rivera')
people = addArcTablePerson(people, 'maya chen')
if (people.roster.length !== 2 || people.sectionId !== 'section-p4') throw new Error('People picker must normalize names, avoid duplicates, and remain Section-scoped.')
people = pickNextArcTablePerson(people)
if (selectedArcTablePerson(people)?.name !== 'Maya Chen') throw new Error('People picker must return an explicit teacher-visible selection.')

let passes = createArcTablePassState('section-p4')
passes = setArcTablePassStatus(passes, 'hall-pass', 'requested')
passes = setArcTablePassStatus(passes, 'hall-pass', 'active')
if (passes.sectionId !== 'section-p4' || passes.passes.find((pass) => pass.id === 'hall-pass')?.status !== 'active') throw new Error('Pass state must preserve active/requested/inactive truth inside one Section.')

let media = createArcTableMediaState('section-p4')
media = addArcTableMedia(media, { title: 'Chartres west façade', kind: 'image', source: '/assets/arc/arc-mark.png' })
media = addArcTableMedia(media, { title: 'Gothic comparison deck', kind: 'slides', source: '/slides/gothic' })
if (media.sectionId !== 'section-p4' || media.items.length !== 2 || media.activeId !== media.items[1].id) throw new Error('Media must support artwork and slides while remaining live-Section scoped.')
media = addArcTableMedia(media, { title: 'Unsafe', kind: 'slides', source: 'javascript:alert(1)' })
if (media.items.length !== 2) throw new Error('Media surface must reject unsafe source schemes.')

console.log('ArcTable timer, cleanup, people, pass, and media tools contract passed')
