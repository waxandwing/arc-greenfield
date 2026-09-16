import React from 'react'
import ReactDOM from 'react-dom/client'
import { applyArcBuildStamp } from './buildInfo'
import { applyPublicAssetCssUrls } from './publicAssetUrl'
import { maybeApplyDemoSeed } from './demo/applyDemoSeed'
import App from './App'
import './styles/tokens.css'
import './styles/arc-fonts.css'
import './styles/arc-plan-shell.css'
import './styles/shell-emphasis.css'
import './styles/shell-visibility-lock.css'
import './styles/global.css'
import './styles/calendarControls.css'
import './styles/calendarReadability.css'
import './styles/planningCalendar.css'
import './styles/planningDay.css'
import './styles/planningMonth.css'
import './styles/termSetup.css'
import './styles/classSetup.css'
import './styles/teachingDaySetup.css'
import './styles/curriculumImport.css'
import './styles/setupSectionNav.css'
import './styles/classTabsNav.css'
import './styles/onboarding.css'
import './styles/unitSetup.css'
import './styles/lessonSetup.css'
import './styles/recoveryReview.css'
import './styles/planMoveShift.css'
import './styles/sourceCalendarReview.css'
import './styles/calendarSetupConfirmPreview.css'
import './styles/calendarSetupFlow.css'
import './styles/schoolIdentitySearch.css'
import './styles/visual-reconciliation.css'
import './styles/repair-pass-1-chrome.css'
import './styles/repair-pass-2-chrome.css'
import './styles/repair-pass-3-chrome.css'
import './styles/interaction-laws.css'
import './styles/arc-desk.css'
import './styles/gold-master.css'
import './styles/gold-master-states.css'
import './styles/gold-master-brand-fix.css'
import './styles/gold-master-index.css'
import './styles/gold-master-rigor.css'

maybeApplyDemoSeed(window.location, window.localStorage, {
  envDemo: import.meta.env.VITE_ARC_DEMO === 'true',
  deskPreview: import.meta.env.VITE_ARC_DESK_PREVIEW === 'true',
})
applyPublicAssetCssUrls()
applyArcBuildStamp()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
