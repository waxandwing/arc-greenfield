import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DeploymentRouter } from './deployment/DeploymentRouter'
import './styles/tokens.css'
import './styles/global.css'
import './styles/calendarControls.css'
import './styles/calendarReadability.css'
import './styles/planningCalendar.css'
import './styles/planningDay.css'
import './styles/planningMonth.css'
import './styles/termSetup.css'
import './styles/classSetup.css'
import './styles/unitSetup.css'
import './styles/lessonSetup.css'
import './styles/recoveryReview.css'
import './styles/sourceCalendarReview.css'
import './styles/schoolIdentitySearch.css'

const localPlannerRegression = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
  && window.location.pathname === '/'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{localPlannerRegression ? <App /> : <DeploymentRouter />}</React.StrictMode>,
)
