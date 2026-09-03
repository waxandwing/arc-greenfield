const views = ['Year', 'Quarter', 'Month', 'Week', 'Day'] as const

export function AppFrame() {
  return (
    <div className="arc-frame">
      <header className="arc-topbar">
        <button className="arc-wordmark" type="button" aria-label="Return to calendar">arc</button>
        <div className="topbar-context"><strong>September</strong><span>2026</span></div>
        <div className="topbar-actions">
          <button type="button">Search</button>
          <button type="button">Help</button>
          <button type="button">Profile</button>
        </div>
      </header>

      <div className="arc-body">
        <nav className="view-rail" aria-label="Calendar views">
          {views.map((view) => <button key={view} type="button" className={view === 'Month' ? 'is-current' : undefined}>{view}</button>)}
        </nav>

        <main className="calendar-workspace">
          <header className="workspace-header">
            <div><p className="eyebrow">Calendar</p><h1>September</h1></div>
            <div className="workspace-controls">
              <button type="button">Today</button>
              <button type="button" aria-label="Previous period">←</button>
              <button type="button" aria-label="Next period">→</button>
            </div>
          </header>
          <section className="calendar-frame" aria-label="Calendar workspace">
            <div className="calendar-note"><strong>Frame first.</strong><span>Calendar behavior comes next.</span></div>
          </section>
        </main>

        <aside className="ideas-dock" aria-label="Ideas">
          <header><div><p className="eyebrow">Capture</p><h2>Ideas</h2></div><button type="button" aria-label="Add idea">+</button></header>
          <p>Things can wait here before they have a date.</p>
        </aside>
      </div>
    </div>
  )
}
