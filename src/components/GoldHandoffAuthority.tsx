import { useMemo } from 'react'
import '../styles/gold-handoff-authority-v2.css'

type HandoffView = 'week' | 'divergence' | 'recovery' | 'sync' | 'login' | 'arcpal' | 'arctable'

type Tone = 'apah' | 'tone-2d' | 'tone-3d' | 'neutral'
type Lesson = { meta: string; title: string; tone: Tone }

const weekDays = [
  { day: 'MON', date: '24' },
  { day: 'TUE', date: '25' },
  { day: 'WED', date: '26' },
  { day: 'THU', date: '27' },
  { day: 'FRI', date: '28', today: true },
]

const courseRows: Array<{ label: string; unit: string; tone: Tone; lessons: Array<Lesson | null> }> = [
  {
    label: 'AP ART HISTORY',
    unit: 'Renaissance + Mannerism',
    tone: 'apah',
    lessons: [
      { meta: 'APAH · P1', title: 'Florence Context', tone: 'apah' },
      { meta: 'APAH · P1', title: 'Patronage + Power', tone: 'apah' },
      { meta: 'APAH · P1', title: 'Comparative Analysis', tone: 'apah' },
      { meta: 'APAH · P1', title: 'Review + Claim', tone: 'apah' },
      null,
    ],
  },
  {
    label: '2D ART 1',
    unit: 'Collage + Composition',
    tone: 'tone-2d',
    lessons: [
      { meta: '2D · P2', title: 'Source Gathering', tone: 'tone-2d' },
      { meta: '2D · P2', title: 'Thumbnail Studies', tone: 'tone-2d' },
      { meta: '2D · P2', title: 'Focal Point Studio', tone: 'tone-2d' },
      null,
      { meta: '2D · P2', title: 'Final Mount', tone: 'tone-2d' },
    ],
  },
  {
    label: '3D ART 1',
    unit: 'Paper + Structure',
    tone: 'tone-3d',
    lessons: [
      null,
      { meta: '3D · P3', title: 'Tabs + Slots', tone: 'tone-3d' },
      { meta: '3D · P3', title: 'Structure Test', tone: 'tone-3d' },
      null,
      { meta: '3D · P3', title: 'Critique + Photo', tone: 'tone-3d' },
    ],
  },
]

function ArcHeader({ active = 'week' }: { active?: 'day' | 'week' | 'month' | 'quarter' | 'year' }) {
  return <header className="gh-header">
    <div className="gh-brand">Arc</div>
    <div className="gh-date-lock"><small>WEEK 3</small><strong>August</strong><span>24–28</span></div>
    <div className="gh-step"><button aria-label="Previous week">‹</button><button className="gh-today">TODAY</button><button aria-label="Next week">›</button></div>
    <nav className="gh-views" aria-label="Calendar view">
      {(['day','week','month','quarter','year'] as const).map(v => <button className={active === v ? 'is-active' : ''} key={v}>{v.toUpperCase()}</button>)}
    </nav>
    <div className="gh-family-links"><button>Live · ArcTable</button><button>ArcPal</button></div>
  </header>
}

function EdgeTools() {
  return <nav className="gh-edge-tools" aria-label="Planning tools">
    <button className="ideas">IDEAS</button><button className="todo">TO-DO</button><button className="shift">SHIFT</button><button className="more">MORE</button>
  </nav>
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  return <article className={`gh-lesson ${lesson.tone}`}><small>{lesson.meta}</small><strong>{lesson.title}</strong></article>
}

function WeekAuthority() {
  return <div className="gh-app">
    <ArcHeader />
    <EdgeTools />
    <main className="gh-calendar-viewport" aria-label="Week planner; scrolls inside this frame">
      <div className="gh-week-grid">
        <div className="gh-row-label gh-classes-label">CLASSES</div>
        {weekDays.map(d => <div className={`gh-day-head ${d.today ? 'is-today' : ''}`} key={d.day}><small>{d.day}</small><strong>{d.date}</strong><button aria-label={`Add on ${d.day}`}>＋</button></div>)}
        <div className="gh-row-label">NOTES</div>
        {weekDays.map((d,i) => <div className="gh-note-cell" key={d.day}>{i === 4 ? <span>Check kiln schedule</span> : null}</div>)}
        {courseRows.map(row => <div className="gh-course-block" key={row.label}>
          <div className="gh-row-label gh-course-label">{row.label}</div>
          <div className="gh-course-days">
            <div className={`gh-unit-band ${row.tone}`}><small>UNIT</small><strong>{row.unit}</strong></div>
            <div className="gh-lesson-grid">{row.lessons.map((lesson,i) => <div className="gh-cell" key={i}>{lesson ? <LessonCard lesson={lesson} /> : null}</div>)}</div>
          </div>
        </div>)}
        <div className="gh-row-label gh-course-label">PLANNING</div>
        <div className="gh-planning-row"><div/><div/><div className="gh-planning-card"><strong>Planning + Prep</strong><small>copies · email · materials</small></div><div/><div/></div>
      </div>
      <div className="gh-scroll-proof" aria-hidden="true"><span>Dense schedules continue below without growing the browser page.</span></div>
    </main>
    <footer className="gh-footer"><button>MUST 2 · SHOULD 3 · COULD 4</button><span>ArcPal · Today · change · capture · Live</span><small>v23.3 composition · Greenfield behavior</small></footer>
  </div>
}

function DivergenceAuthority() {
  return <div className="gh-app gh-paper"><ArcHeader active="week"/><main className="gh-state-page"><section className="gh-state-main"><small className="gh-kicker">SECTION RECOVERY</small><h1>Period 6 fell behind.</h1><p>Repair one section without rewriting the shared course plan.</p><div className="gh-recovery-card mustard"><strong>AP Art History · Period 6 · Comparative Analysis</strong><span>12 minutes unfinished · continue Thu Oct 23</span></div><div className="gh-recovery-card coral"><strong>Shared course plan · Patronage + Power</strong><span>Period 2 remains on the shared sequence.</span></div><div className="gh-recovery-card blue"><strong>Period 6 next shared lesson · Review + Claim</strong><span>P6 can rejoin after the unfinished segment is complete.</span></div><h3>PRESERVES</h3><div className="gh-recovery-card fixed"><strong>Friday assessment · fixed for both sections</strong><span>Taught history remains untouched.</span></div><div className="gh-actions"><button className="primary">Rejoin shared plan</button><button>Keep separate</button><button>Cancel</button><span>Nothing changes until you apply.</span></div></section><aside className="gh-safety"><small>WHAT ARC PROTECTS</small><b>1 section changes</b><b>Fixed assessment stays</b><b>Past teaching history stays</b><b>Period 2 stays aligned</b><b>Undo available after rejoin</b><p>Arc repairs the exception, not the whole calendar.</p></aside></main></div>
}

function RecoveryAuthority() {
  const rows = [
    ['7:30','Finish Comparative Analysis','AP Art History · P6 · 12 min remaining','coral'],
    ['8:30','Shared lesson resumes after recovery','AP Art History · P2 stays aligned','mustard'],
    ['9:30','Review + Claim','AP Art History · P6','blue'],
    ['10:30','Planning / Prep','Copies · materials · email','green'],
    ['11:30','Lunch','Quiet pause','neutral'],
    ['12:30','Primary Source Analysis','AP Art History · P5','coral'],
  ]
  return <div className="gh-app gh-paper"><ArcHeader active="day"/><main className="gh-recovery-page"><section><small>FRIDAY · OCTOBER 24</small><h1>Yesterday ran long.</h1><p>Arc carries the unfinished part forward without rewriting what was taught.</p><div className="gh-day-stack">{rows.map(([time,title,meta,tone],i)=><article className={`gh-day-row ${tone}`} key={title}><time>{time}</time><div><strong>{title}</strong><span>{meta}</span></div>{i===1?<div className="gh-row-actions"><button>Open recovery</button><button className="primary">Continue</button></div>:null}</article>)}</div></section><aside><div className="gh-side-note"><small>RECOVERY NOTES</small><p>Period 6 stopped during source comparison.</p><p>Continue from student response notes, not from the beginning.</p><p>Friday assessment remains fixed.</p></div><div className="gh-side-note"><small>AFTER CLASS</small><h3>What changed for next time?</h3><div className="gh-input-like">P6 needed more image comparison time</div><span>Save to lesson history · Enter ↵</span></div></aside></main></div>
}

function SyncAuthority() {
  const states = [
    ['OFFLINE · LOCAL PLAN SAFE','You are offline.','This device still has the latest local plan. New changes are marked pending until Arc Sync returns.','Keep planning'],
    ['SYNC DELAYED','Arc Sync has not confirmed 2 changes.','Nothing is lost. Arc keeps the local copy visible until confirmation arrives.','Retry sync'],
    ['RECONNECT REQUIRED','Your account session expired.','Reconnect without leaving the current planning context.','Reconnect account'],
    ['SHIFT CONFLICT','Friday already has a fixed quiz.','Review what moves before applying.','Review move'],
  ]
  return <div className="gh-app gh-paper"><ArcHeader/><main className="gh-trust"><div><small>SYNC + RECOVERY STATES</small><h1>Failure should make the teacher safer, not more anxious.</h1></div><div className="gh-trust-grid">{states.map(([k,h,p,b])=><article key={k}><small>{k}</small><h2>{h}</h2><p>{p}</p><button>{b}</button></article>)}</div></main></div>
}

function LoginAuthority() {
  return <div className="gh-login"><div className="gh-login-brand">Arc</div><section><small>RESTORE CONTEXT</small><h1>Arc is getting your planner ready.</h1><p>Identity first, then straight back to the work.</p><div className="gh-login-grid"><div><h3>Account</h3><strong>Connected · Wax & Wing</strong><h3>Arc Sync</h3><ul><li>Planner data found</li><li>School calendar found</li><li>ArcPal linked</li></ul></div><div><h3>Loading</h3><p>Restoring Wednesday · Period 6</p><div className="gh-progress"><i/></div><div className="gh-actions"><button>Retry</button><button>Work offline</button></div><h3>Ready</h3><p>Your place is preserved. No dashboard detour.</p></div></div><button className="primary gh-return">Return to planner</button><p className="gh-rule">No fake sync claims. No forced setup wall. No loss of context.</p></section></div>
}

function ArcPalAuthority() {
  const items=[['7:30','Renaissance Context','AP Art History · P1','coral'],['8:30','Blind Contour Practice','2D Art · P2','mustard'],['9:30','Clay Techniques','3D Art · P3','green'],['10:30','Planning + Prep','Materials, email, copies','blue']]
  return <div className="gh-phone"><header><b>ArcPal</b><button aria-label="Settings">Settings</button></header><h1>Good morning.</h1><p>Tuesday, October 21</p><div className="gh-mobile-title"><span>TODAY</span><strong>Your teaching day</strong></div><div className="gh-mobile-classes">{items.map(([time,title,meta,tone])=><article className={tone} key={title}><time>{time}</time><div><strong>{title}</strong><span>{meta}</span></div></article>)}</div><h2>3 things need you</h2>{['Grade sketchbooks','Prepare critique slides','Order clay'].map(x=><label key={x}><input type="checkbox"/>{x}</label>)}<nav><button className="is-active">Today</button><button>Plan</button><button className="add">＋</button><button>Pocket</button><button>Live</button></nav></div>
}

function ArcTableAuthority() {
  return <div className="gh-live"><header><b>ArcTable · Live</b><span>AP Art History · Period 4</span><button>Plan view</button></header><main><section><small>CURRENTLY ON SCREEN</small><h1>Gothic cathedrals: Chartres</h1><h2>LOOK → What makes this space feel taller than it is?</h2><ol><li>Find one vertical line that pulls your eye upward.</li><li>Compare the west façade to the nave elevation.</li><li>Talk with your table: structure, light, or sculpture?</li></ol><div className="gh-student-preview">Student display preview</div></section><aside><small>TEACHER CONTROLS</small><div className="gh-live-sequence"><b>Previous</b><span>Student response</span><b>Next</b><span>Cleanup</span><b>Coming up</b><span>End of lesson</span></div><div className="gh-live-timer"><strong>10:00</strong><button>Start</button><button>+5</button></div><div className="gh-live-actions"><button>Directions</button><button>Pick student</button><button className="cleanup">Cleanup</button><button>Blank screen</button></div><button className="end">End class</button></aside></main></div>
}

export function GoldHandoffAuthority() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const view = (params.get('handoff') || 'week') as HandoffView
  if (view === 'divergence') return <DivergenceAuthority />
  if (view === 'recovery') return <RecoveryAuthority />
  if (view === 'sync') return <SyncAuthority />
  if (view === 'login') return <LoginAuthority />
  if (view === 'arcpal') return <ArcPalAuthority />
  if (view === 'arctable') return <ArcTableAuthority />
  return <WeekAuthority />
}
