declare const __ARC_BUILD_SHA__: string

const sha = __ARC_BUILD_SHA__ || 'local'
const shortSha = sha === 'local' ? 'local' : sha.slice(0, 8)

export function BuildFingerprint() {
  return (
    <aside className="build-fingerprint" aria-label="Arc build fingerprint">
      <span>Arc build {shortSha}</span>
      <code>{sha}</code>
    </aside>
  )
}
