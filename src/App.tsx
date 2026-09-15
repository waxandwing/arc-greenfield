import { useState } from 'react'
import { AppFrame } from './components/AppFrame'
import { DeskBuildStamp } from './components/DeskBuildStamp'
import { IcarusEntryFlow } from './entry/IcarusEntryFlow'
import { isEntryComplete } from './entry/entryAccess'

export default function App() {
  const [entryComplete, setEntryComplete] = useState(() => isEntryComplete())

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
