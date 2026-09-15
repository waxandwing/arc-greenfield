#!/usr/bin/env node
import { execSync } from 'node:child_process'

const PORT = 4173

function pidsOnPort() {
  try {
    const out = execSync(`lsof -ti :${PORT}`, { encoding: 'utf8' }).trim()
    if (!out) return []
    return [...new Set(out.split(/\s+/).filter(Boolean))]
  } catch {
    return []
  }
}

const pids = pidsOnPort()
if (pids.length === 0) {
  console.log(`[preview:desk:stop] Nothing is using port ${PORT} — no action needed.`)
  process.exit(0)
}

for (const pid of pids) {
  try {
    process.kill(Number(pid), 'SIGTERM')
    console.log(`[preview:desk:stop] Stopped process ${pid} on port ${PORT}.`)
  } catch (err) {
    console.warn(`[preview:desk:stop] Could not stop ${pid}: ${err.message}`)
  }
}
