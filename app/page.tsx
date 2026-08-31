const BUILD_ID = "ARC-GF-0001";

export default function HomePage() {
  const gitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    "local-uncommitted";

  return (
    <main className="shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Wax &amp; Wing</p>
          <h1>Arc</h1>
        </div>
        <div className="status" aria-label="Build verification">
          <span className="statusDot" aria-hidden="true" />
          Greenfield reset active
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <p className="kicker">Phase 0 · repository + deployment reset</p>
        <h2 id="hero-title">A clean Arc starts here.</h2>
        <p className="lede">
          This preview exists to prove that one Git repository produces one exact build.
          No prior Arc implementation code is part of this application.
        </p>
      </section>

      <section className="proof" aria-labelledby="proof-title">
        <div>
          <p className="sectionLabel">Build fingerprint</p>
          <h3 id="proof-title">Verify before reviewing anything else.</h3>
        </div>
        <dl>
          <div>
            <dt>Build</dt>
            <dd><code>{BUILD_ID}</code></dd>
          </div>
          <div>
            <dt>Git commit</dt>
            <dd><code>{gitSha}</code></dd>
          </div>
          <div>
            <dt>Repository</dt>
            <dd><code>waxandwing/arc-greenfield</code></dd>
          </div>
        </dl>
      </section>

      <section className="rules" aria-labelledby="rules-title">
        <p className="sectionLabel">Current authority</p>
        <h3 id="rules-title">What this build is allowed to become</h3>
        <div className="ruleGrid">
          <article>
            <h4>Teacher-first</h4>
            <p>The planning desk is home. Arc adapts to the teacher instead of forcing a form.</p>
          </article>
          <article>
            <h4>One source of truth</h4>
            <p>One plan model, one school calendar, one persistence layer, one navigation owner.</p>
          </article>
          <article>
            <h4>No fake behavior</h4>
            <p>No demo school data, inert controls, false save states, or pretend integrations.</p>
          </article>
          <article>
            <h4>Exact-build review</h4>
            <p>If the visible fingerprint and deployed commit do not match, the preview is invalid.</p>
          </article>
        </div>
      </section>

      <footer>
        <a href="https://github.com/waxandwing/arc-greenfield">GitHub repository</a>
        <span aria-hidden="true">·</span>
        <a href="https://docs.google.com/document/d/1SdC1jmvAeXCcrZriYRTnxoKmtQLjsbreBfYQHKlah7s/edit">Canonical product spec</a>
      </footer>
    </main>
  );
}
