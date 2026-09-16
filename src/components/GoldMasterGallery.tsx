import { useMemo, useState } from 'react'

type GoldView = 'week' | 'day' | 'month' | 'quarter' | 'year' | 'unit' | 'ideas' | 'connections' | 'arctable' | 'pocket' | 'settings' | 'onboarding' | 'trust'

type Lesson = {
  course: 'AP Art History' | '2D Art' | '3D Art'
  title: string
  unit: string
  time: string
  state?: 'done' | 'fixed' | 'continue'
}

const days = ['MON 20', 'TUE 21', 'WED 22', 'THU 23', 'FRI 24']
const lessonRows: Lesson[][] = [
  [
    { course: 'AP Art History', title: 'Renaissance Context', unit: 'Unit 3', time: '7:30', state: 'done' },
    { course: 'AP Art History', title: 'Early Renaissance', unit: 'Unit 3', time: '7:30' },
    { course: 'AP Art History', title: 'Northern Renaissance', unit: 'Unit 3', time: '7:30' },
    { course: 'AP Art History', title: 'Baroque Intro', unit: 'Unit 4', time: '7:30' },
    { course: 'AP Art History', title: 'Review + Synthesis', unit: 'Unit 4', time: '7:30', state: 'fixed' },
  ],
  [
    { course: '2D Art', title: 'Blind Contour Practice', unit: 'Unit 2', time: '8:30', state: 'done' },
    { course: '2D Art', title: 'Value Studies', unit: 'Unit 2', time: '8:30' },
    { course: '2D Art', title: 'Critique Prep', unit: 'Unit 2', time: '8:30' },
    { course: '2D Art', title: 'Mixed Media', unit: 'Unit 2', time: '8:30' },
    { course: '2D Art', title: 'Studio Work Time', unit: 'Unit 2', time: '8:30' },
  ],
  [
    { course: '3D Art', title: 'Planning Time', unit: 'Unit 1', time: '9:30' },
    { course: '3D Art', title: 'Clay Techniques', unit: 'Unit 1', time: '9:30' },
    { course: '3D Art', title: 'Work Day', unit: 'Unit 1', time: '9:30' },
    { course: '3D Art', title: 'Finish Pieces', unit: 'Unit 1', time: '9:30' },
    { course: '3D Art', title: 'Work Day', unit: 'Unit 1', time: '9:30' },
  ],
]

const laterRows: Lesson[][] = [
  [
    { course: 'AP Art History', title: 'Primary Source Analysis', unit: 'Unit 3', time: '12:30' },
    { course: 'AP Art History', title: 'Discussion', unit: 'Unit 3', time: '12:30' },
    { course: 'AP Art History', title: 'Comparative Analysis', unit: 'Unit 3', time: '12:30' },
    { course: 'AP Art History', title: 'Baroque in Context', unit: 'Unit 4', time: '12:30' },
    { course: 'AP Art History', title: 'Unit Quiz', unit: 'Unit 4', time: '12:30', state: 'fixed' },
  ],
  [
    { course: '2D Art', title: 'Charcoal Demo', unit: 'Unit 2', time: '1:30', state: 'done' },
    { course: '2D Art', title: 'Independent Work', unit: 'Unit 2', time: '1:30' },
    { course: '2D Art', title: 'Gallery Walk', unit: 'Unit 2', time: '1:30' },
    { course: '2D Art', title: 'Artist Research', unit: 'Unit 2', time: '1:30' },
    { course: '2D Art', title: 'Clean Up + Reflection', unit: 'Unit 2', time: '1:30' },
  ],
  [
    { course: '3D Art', title: 'Studio Work Time', unit: 'Unit 1', time: '2:30' },
    { course: '3D Art', title: 'Glaze Testing', unit: 'Unit 1', time: '2:30' },
    { course: '3D Art', title: 'Studio Work Time', unit: 'Unit 1', time: '2:30' },
    { course: '3D Art', title: 'Peer Critique', unit: 'Unit 1', time: '2:30' },
    { course: '3D Art', title: 'Portfolio Prep', unit: 'Unit 1', time: '2:30' },
  ],
]

const tasks = ['Grade sketchbooks', 'Prepare critique slides', 'Order clay', 'Finish report cards']
const ideas = ['Try gallery walk instead of full critique', 'Find contemporary artist for Unit 4', 'Sculpture installation idea', 'Student choice themes?']

function courseClass(course: Lesson['course']) {
  return course === 'AP Art History' ? 'gm-apah' : course === '2D Art' ? 'gm-2d' : 'gm-3d'
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  return <div className={`gm-lesson ${courseClass(lesson.course)} ${lesson.state ? `gm-${lesson.state}` : ''}`}>
    <div className="gm-lesson-course">{lesson.course}</div>
    <strong>{lesson.title}</strong>
    <span>{lesson.unit}</span>
    {lesson.state === 'done' && <b className="gm-state">✓</b>}
    {lesson.state === 'fixed' && <b className="gm-state">●</b>}
  </div>
}

function ArcWordmark() {
  return <div className="gm-brand"><span className="gm-mark" aria-hidden="true"><i/><i/><i/><i/></span><span><b>Arc</b><small>Plan. Teach. Belong.</small></span></div>
}

function Header({ view, setView }: { view: GoldView, setView: (v: GoldView) => void }) {
  const nav: GoldView[] = ['day', 'week', 'month', 'quarter', 'year']
  return <header className="gm-header">
    <ArcWordmark />
    <nav className="gm-view-tabs" aria-label="Calendar view">
      {nav.map(v => <button key={v} className={view === v ? 'is-active' : ''} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
    </nav>
    <div className="gm-header-actions">
      <button className="gm-search">⌕ Search lessons, units, ideas…</button>
      <button className="gm-new">＋ New</button>
      <button>⇄ Shift</button>
      <button onClick={() => setView('connections')}>⌘ Connections</button>
      <button onClick={() => setView('arctable')}>▦ ArcTable</button>
      <button className="gm-avatar">JW</button>
    </div>
  </header>
}

function Rail({ view, setView }: { view: GoldView, setView: (v: GoldView) => void }) {
  return <aside className="gm-rail">
    <div className="gm-rail-title">CLASSES <button>＋</button></div>
    <button><i className="gm-dot gm-coral"/> AP Art History</button>
    <button><i className="gm-dot gm-mustard"/> 2D Art</button>
    <button><i className="gm-dot gm-blue"/> 3D Art</button>
    <hr/>
    <button className={['week','day','month','quarter','year'].includes(view) ? 'is-active' : ''}>▣ Calendar</button>
    <button onClick={() => setView('unit')} className={view === 'unit' ? 'is-active' : ''}>▤ Units</button>
    <button>▧ Lessons</button>
    <button onClick={() => setView('ideas')} className={view === 'ideas' ? 'is-active' : ''}>◉ Ideas + To-Do</button>
    <div className="gm-rail-spacer"/>
    <button onClick={() => setView('settings')} className={view === 'settings' ? 'is-active' : ''}>⚙ Settings</button>
  </aside>
}

function SidePad() {
  return <aside className="gm-sidepad">
    <section><h3>TO-DO <button>＋ Add</button></h3><div className="gm-priority"><b>Must 4</b><span>Should 3</span><span>Could 5</span></div>{tasks.map((t,i)=><label key={t}><input type="checkbox"/> <span>{t}</span><small>{['Tue','Wed','Fri','Oct 31'][i]}</small></label>)}</section>
    <section><h3>IDEAS <button>＋ Add</button></h3>{ideas.map(t=><label key={t}><input type="checkbox"/><span>{t}</span></label>)}</section>
    <div className="gm-note">Good teaching is a series of small decisions, held together by a bigger purpose.</div>
  </aside>
}

function WeekView() {
  return <div className="gm-content-grid">
    <main className="gm-main">
      <div className="gm-datebar"><button>‹</button><h1>October 20 – 24, 2025</h1><button>›</button><button className="gm-today">Today</button><span className="gm-scribble">Same plan. More possibility.</span></div>
      <div className="gm-week">
        <div className="gm-time-head">Time</div>{days.map(d=><div className="gm-day-head" key={d}>{d}</div>)}
        {lessonRows.map((row,ri)=><div className="gm-week-row" key={`r${ri}`}><div className="gm-time">{row[0].time}</div>{row.map((l,i)=><LessonCard key={`${l.title}-${i}`} lesson={l}/>)}</div>)}
        <div className="gm-week-row"><div className="gm-time">10:30</div>{days.map((_,i)=><div className="gm-neutral" key={i}>{i===1?'Department Meeting':i===3?'PLC Meeting':'Planning / Prep'}</div>)}</div>
        <div className="gm-week-row"><div className="gm-time">11:30</div>{days.map((_,i)=><div className="gm-lunch" key={i}>Lunch</div>)}</div>
        {laterRows.map((row,ri)=><div className="gm-week-row" key={`l${ri}`}><div className="gm-time">{row[0].time}</div>{row.map((l,i)=><LessonCard key={`${l.title}-${i}`} lesson={l}/>)}</div>)}
      </div>
      <section className="gm-detail"><div className="gm-detail-accent gm-coral-bg"/><div><small>AP Art History</small><h2>Renaissance Context</h2><p>Mon, Oct 20 · 7:30–8:30 AM · Unit 3</p><div className="gm-detail-tabs"><b>Plan</b><span>Materials</span><span>Resources</span><span>Standards</span><span>After Class</span></div><strong>Objective</strong><p>Students identify key characteristics of the Italian Renaissance and analyze works in historical context.</p></div><div className="gm-detail-actions"><button>↔ Move</button><button>▣ Shift</button><button>▢ Duplicate</button></div></section>
    </main>
    <SidePad />
  </div>
}

function DayView() {
  const today = [lessonRows[0][1], lessonRows[1][1], lessonRows[2][1], laterRows[0][1], laterRows[1][1], laterRows[2][1]]
  return <main className="gm-main gm-day-main"><div className="gm-datebar"><h1>Tuesday, October 21, 2025</h1><button className="gm-today">Today</button></div><div className="gm-day-list">{today.map((l,i)=><article className={`gm-day-card ${courseClass(l.course)} ${i===1?'is-current':''}`} key={l.title}><time>{l.time}</time><div><small>{l.course}</small><h2>{l.title}</h2><span>{l.unit}</span>{i===1&&<div className="gm-day-open"><div className="gm-detail-tabs"><b>Plan</b><span>Materials</span><span>Resources</span></div><p>Warm up: 5 min drawings · Demo contour technique · Studio time · Group reflection</p><button>Open Lesson</button><button className="gm-new">Teach in ArcTable</button></div>}</div><button>✓</button></article>)}</div></main>
}

function MonthView() {
  const dates=Array.from({length:35},(_,i)=>i-2)
  return <main className="gm-main"><div className="gm-datebar"><h1>October 2025</h1><button className="gm-today">Today</button></div><div className="gm-month-head">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><b key={d}>{d}</b>)}</div><div className="gm-month">{dates.map((d,i)=><div className={`gm-month-day ${d<1||d>31?'is-out':''}`} key={i}><b>{d<1?30+d:d>31?d-31:d}</b>{[5,10,13,18,22,26].includes(i)&&<span className={i%2?'gm-event-blue':'gm-event-mustard'}>{['Studio Walk','Field Trip','Paid Trip','End Unit 2','Art Show Prep','Dept Meeting'][i%6]}</span>}</div>)}</div></main>
}

function QuarterView() {
  const lanes=[['AP Art History','Renaissance','Baroque','Neoclassicism'],['2D Art','Observation','Material Exploration','Portfolio'],['3D Art','Handbuilding','Surface + Form','Sculpture']]
  return <main className="gm-main"><div className="gm-datebar"><div><small>QUARTER 2</small><h1>Oct 13 – Dec 19, 2025</h1></div><button>Adjust Dates</button></div><div className="gm-quarter-ruler"><span>OCT</span><span>NOV</span><span>DEC</span></div><div className="gm-quarter">{lanes.map((lane,li)=><section key={lane[0]}><h3>{lane[0]}</h3><div className="gm-quarter-track">{lane.slice(1).map((u,ui)=><div className={`gm-unitbar gm-u${(li+ui)%4}`} style={{width:`${28+ui*5}%`}} key={u}><small>Unit {ui+1}</small><strong>{u}</strong><span>{ui===0?'Oct 13 – Oct 30':ui===1?'Oct 30 – Nov 24':'Nov 24 – Dec 19'}</span></div>)}</div></section>)}</div></main>
}

function YearView() {
  const months=['August','September','October','November','December','January','February','March','April','May','June']
  return <main className="gm-main"><div className="gm-datebar"><h1>2025 – 2026</h1><button>School Year⌄</button></div><div className="gm-year">{months.map((m,mi)=><section key={m}><h3>{m}</h3><div className="gm-mini"><b>M</b><b>T</b><b>W</b><b>T</b><b>F</b>{Array.from({length:25},(_,i)=><i className={(i+mi)%9===0?'is-no-school':(i+mi)%5===0?'is-event':''} key={i}/>)}</div></section>)}</div><div className="gm-year-key"><span>● Instructional day</span><span>● No school</span><span>● Testing</span><span>● Important event</span></div></main>
}

function UnitView() {
  return <main className="gm-main gm-unit"><div className="gm-datebar"><div><small>2D ART · UNIT 3</small><h1>Recycled Futures</h1><p>Nov 10 – Dec 19 · 12 lessons</p></div><div><button>Move</button><button>Adjust length</button><button>Duplicate</button></div></div><div className="gm-unit-grid"><section><h3>Big Idea</h3><p>How can discarded materials communicate identity?</p><h3>Essential Question</h3><p>What new meaning can art create from what we throw away?</p></section><section><h3>Lesson sequence</h3>{['Material testing','Armature','Surface exploration','Wearable structure','Critique'].map((x,i)=><div className="gm-sequence" key={x}><b>{i+1}</b><span>{x}</span><button>⋮</button></div>)}</section><section><h3>Loose ideas</h3>{ideas.slice(0,3).map((x,i)=><div className={`gm-idea gm-u${i}`} key={x}>{x}</div>)}<button>＋ Add idea</button></section></div></main>
}

function IdeasView() {
  return <main className="gm-main gm-thinking"><div className="gm-datebar"><h1>Ideas + To-Do</h1><button className="gm-new">＋ Capture</button></div><div className="gm-thinking-grid"><section><h2>Ideas</h2><div className="gm-idea-board">{ideas.map((x,i)=><div className={`gm-idea gm-u${i}`} key={x}>{x}<small>{i%2?'Unit idea':'Loose thought'}</small></div>)}</div></section><section><h2>To-Do</h2>{['Must','Should','Could'].map((p,pi)=><div className="gm-task-lane" key={p}><h3>{p}</h3>{tasks.slice(pi,pi+2).map(t=><label key={t}><input type="checkbox"/>{t}</label>)}</div>)}</section></div></main>
}

function ConnectionsView() {
  return <main className="gm-main"><div className="gm-datebar"><h1>Connections</h1><p>Services support the planner. They do not become the planner.</p></div><div className="gm-connections">{[['Google Drive','Connected','Saved to Arc + Drive'],['Google Calendar','Connected','Calendar connected'],['School Calendar','Ready','OCPS dates loaded'],['Arc Pocket','Synced','Pocket synced'],['ArcTable','Ready','ArcTable ready'],['Import + Reuse','Available','Bring in prior work']].map(([a,b,c],i)=><article key={a}><i className={`gm-connection-icon gm-u${i%4}`}/><div><h2>{a}</h2><p>{c}</p></div><button>{b}</button></article>)}</div></main>
}

function ArcTableView() {
  return <main className="gm-arctable"><div className="gm-livebar"><ArcWordmark/><b>ARCTABLE · LIVE</b><button>Close</button></div><div className="gm-live-content"><section><small>2D Art · Period 2</small><h1>Blind Contour Practice</h1><p>Unit 2</p><div className="gm-timer">12:00 <button>▶</button><button>Ⅱ</button></div>{['Warm up: 5 min drawings','Demo contour technique','Studio time','Group reflection'].map(x=><label key={x}><input type="checkbox"/> {x}</label>)}<div className="gm-live-actions"><button className="gm-end">End Class</button><button>Continue Next Time</button></div></section><aside><div className="gm-drawing">✍</div><div className="gm-live-note">Slower looking brings a fuller world.</div></aside></div></main>
}

function PocketView() {
  return <main className="gm-main"><div className="gm-datebar"><h1>Arc Pocket</h1><p>Today, capture, tasks, and ideas. Not desktop squeezed into a phone.</p></div><div className="gm-phone-row"><div className="gm-phone"><ArcWordmark/><small>Tuesday, October 21</small><h2>Good morning.</h2><h3>Today</h3>{[lessonRows[0][1],lessonRows[1][1],lessonRows[2][1]].map(l=><div className={`gm-pocket-lesson ${courseClass(l.course)}`} key={l.title}><small>{l.time}</small><b>{l.title}</b><span>{l.course}</span></div>)}<button className="gm-pocket-capture">＋ Capture</button></div><div className="gm-phone"><ArcWordmark/><h2>Capture it before it leaves.</h2><div className="gm-capture-box">What do you need to remember?<small>Idea · Task · Lesson · Note · Event</small></div><h3>Ideas</h3>{ideas.slice(0,3).map((x,i)=><div className={`gm-pocket-idea gm-u${i}`} key={x}>{x}</div>)}</div></div></main>
}

function SettingsView() {
  return <main className="gm-main"><div className="gm-datebar"><h1>Settings</h1><p>Administrative, quiet, and out of the way.</p></div><div className="gm-settings"><nav>{['My school year','Classes + sections','Schedule','Calendar','Planning preferences','Appearance','Accessibility','Data + import + reuse'].map((x,i)=><button className={i===0?'is-active':''} key={x}>{x}</button>)}</nav><section><h2>My school year</h2><label>School year <input value="2025–2026" readOnly/></label><label>Starts <input value="Aug 11, 2025" readOnly/></label><label>Ends <input value="May 28, 2026" readOnly/></label><h3>Quarter dates</h3><div className="gm-setting-row"><span>Quarter 1</span><b>Aug 11 – Oct 10</b></div><div className="gm-setting-row"><span>Quarter 2</span><b>Oct 13 – Dec 19</b></div><button>Manage no-school days</button></section></div></main>
}

function OnboardingView() {
  return <main className="gm-onboarding"><ArcWordmark/><div className="gm-onboard-card"><small>STEP 3 OF 4</small><h1>Add your classes.</h1><p>You can add periods and exact times now, or keep moving and do that later.</p>{['AP Art History','2D Art 1','3D Art 1'].map((x,i)=><div className="gm-class-add" key={x}><i className={`gm-dot ${['gm-coral','gm-mustard','gm-blue'][i]}`}/><b>{x}</b><button>×</button></div>)}<button>＋ Add another class</button><div className="gm-onboard-actions"><button>Back</button><button className="gm-new">Continue</button></div></div></main>
}

function TrustView() {
  return <main className="gm-main"><div className="gm-datebar"><h1>Trust states</h1><p>Nothing destructive happens silently.</p></div><div className="gm-trust-grid"><article><small>OFFLINE</small><h2>You’re working locally.</h2><p>Your plan is available. Changes will sync when the connection returns.</p><button>Keep working</button></article><article><small>SHIFT CONFLICT</small><h2>Friday’s quiz stays fixed.</h2><p>Two lessons move. The fixed assessment does not.</p><button>Review changes</button></article><article><small>SYNC DELAYED</small><h2>Drive is taking longer than usual.</h2><p>Your Arc copy is safe. We have not discarded anything.</p><button>Try again</button></article><article><small>EMPTY</small><h2>No ideas yet.</h2><p>Capture something when it occurs to you.</p><button>＋ Add idea</button></article></div></main>
}

function MainView({ view }: { view: GoldView }) {
  if (view === 'day') return <DayView />
  if (view === 'month') return <MonthView />
  if (view === 'quarter') return <QuarterView />
  if (view === 'year') return <YearView />
  if (view === 'unit') return <UnitView />
  if (view === 'ideas') return <IdeasView />
  if (view === 'connections') return <ConnectionsView />
  if (view === 'arctable') return <ArcTableView />
  if (view === 'pocket') return <PocketView />
  if (view === 'settings') return <SettingsView />
  if (view === 'onboarding') return <OnboardingView />
  if (view === 'trust') return <TrustView />
  return <WeekView />
}

export function GoldMasterGallery() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const initial = (params.get('gold') || 'week') as GoldView
  const [view, setViewState] = useState<GoldView>(initial)
  function setView(next: GoldView) {
    setViewState(next)
    const url = new URL(window.location.href)
    url.searchParams.set('gold', next)
    window.history.replaceState({}, '', url)
  }
  const standalone = ['arctable','pocket','onboarding'].includes(view)
  return <div className={`gm-app gm-view-${view}`}>
    {!standalone && <Header view={view} setView={setView} />}
    <div className={standalone ? 'gm-standalone' : 'gm-shell'}>
      {!standalone && <Rail view={view} setView={setView}/>}<MainView view={view}/>
    </div>
    <nav className="gm-qa-nav" aria-label="Gold master QA routes">{(['week','day','month','quarter','year','unit','ideas','connections','arctable','pocket','settings','onboarding','trust'] as GoldView[]).map(v=><button className={view===v?'is-active':''} onClick={()=>setView(v)} key={v}>{v}</button>)}</nav>
  </div>
}
