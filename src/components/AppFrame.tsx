export function AppFrame() {
  return (
    <div className="arc-shell">
      <a className="skip-link" href="#calendar-stage">Skip to calendar</a>

      <header className="arc-header" aria-label="Arc application header">
        <div className="arc-identity" aria-label="Arc">
          <span className="arc-wordmark" aria-hidden="true">arc</span>
        </div>
        <div className="arc-header-space" aria-hidden="true" />
      </header>

      <div className="arc-layout">
        <aside className="arc-view-rail" aria-label="Calendar view navigation region">
          <span className="rail-marker" aria-hidden="true" />
        </aside>

        <main id="calendar-stage" className="arc-calendar-stage" tabIndex={-1}>
          <header className="calendar-stage-header">
            <p className="section-label">Calendar</p>
          </header>

          <section className="calendar-canvas" aria-label="Calendar workspace" />
        </main>

        <div className="arc-overlay-layer" aria-hidden="true" />
      </div>
    </div>
  )
}
