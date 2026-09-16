import { useState } from 'react'
import { AppFrame } from './components/AppFrame'
import { DeskBuildStamp } from './components/DeskBuildStamp'
import { GoldMasterGallery } from './components/GoldMasterGallery'
import { GoldMasterShiftPreview, GoldMasterWeekEdit } from './components/GoldMasterStates'
import { IcarusEntryFlow } from './entry/IcarusEntryFlow'
import { isEntryComplete } from './entry/entryAccess'

function goldMasterView() {
  const params = new URLSearchParams(window.location.search)
  return params.get('gold')
}

function goldMasterRequested() {
  const params = new URLSearchParams(window.location.search)
  return params.has('gold') || params.get('gallery') === 'gold-master'
}

export default function App() {
  const [entryComplete, setEntryComplete] = useState(() => isEntryComplete())

  if (goldMasterView() === 'week-edit') {
    return <GoldMasterWeekEdit />
  }

  if (goldMasterView() === 'shift') {
    return <GoldMasterShiftPreview />
  }

  if (goldMasterRequested()) {
    return <GoldMasterGallery />
  }

  if (!entryComplete) {
    return <IcarusEntryFlow onComplete={() => setEntryComplete(true)} />
  }

  return (
    <>
      <AppFrame />
      <DeskBuildStamp />
    </>
  )
}
