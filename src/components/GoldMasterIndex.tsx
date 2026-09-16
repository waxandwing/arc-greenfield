const routes = [
  ['week','Week / Gold Master','Primary planner authority. Monday-first, calendar dominant.'],
  ['week-edit','Week / Selected Lesson + Inline Add','Selected lesson context plus title-first creation.'],
  ['shift','Shift / Consequence Preview','Shows moves, fixed items, protected history, and explicit apply.'],
  ['day','Day / Teaching Companion','Current and next class with fast teaching outcomes.'],
  ['month','Month / Horizon','Compact pacing without shrinking Week cards into tiny boxes.'],
  ['quarter','Quarter / Pacing Map','Course lanes, units, breaks, and assessment horizon.'],
  ['year','Year / School Year','Instructional shape of the year without lesson noise.'],
  ['unit','Unit / Focus + Ideas','Big idea, sequence, loose thinking, and pacing.'],
  ['ideas','Ideas + To-Do','Creative capture plus Must / Should / Could.'],
  ['connections','Connections / More','Integrations remain connections, not dashboard modules.'],
  ['arctable','ArcTable / Live Teaching','Distinct live-teaching mode using the ArcTable identity.'],
  ['pocket','Arc Pocket / Today + Capture','Native mobile companion, not desktop squeezed smaller.'],
  ['settings','Settings / Quiet Admin','School year, classes, schedule, preferences, accessibility.'],
  ['onboarding','Onboarding / Fast Start','Classes first, exact schedule optional, planner quickly.'],
  ['trust','Trust / Empty + Error','Offline, conflict, delayed sync, and empty-state language.'],
]

export function GoldMasterIndex() {
  return <main className="gm-index">
    <header>
      <div><small>ARC FRONTEND GOLD MASTER</small><h1>23.3 interface × Greenfield brain</h1><p>Fixture-only surface review. No production planning data is changed from this index.</p></div>
      <a href="?gold=week">Open canonical Week →</a>
    </header>
    <section className="gm-index-rules"><b>Visual gate</b><span>Calendar first</span><span>Green never dominates</span><span>No floral ornament</span><span>No furniture dependency</span><span>No generic SaaS dashboard</span><span>Arc ≠ ArcTable identity</span></section>
    <div className="gm-index-grid">{routes.map(([route,title,description],i)=><a href={`?gold=${route}`} key={route}><small>{String(i+1).padStart(2,'0')}</small><h2>{title}</h2><p>{description}</p><span>Open state →</span></a>)}</div>
    <footer><b>Integration gate:</b> bind Greenfield behavior only after these surfaces pass visual, usability, accessibility, and parity review.</footer>
  </main>
}
