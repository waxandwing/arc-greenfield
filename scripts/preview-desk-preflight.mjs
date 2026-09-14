#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { cwd } from 'node:process'

const REQUIRED_BRANCH = 'cursor/arc-production-integration'

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim()
}

const root = cwd()
let branch
try {
  branch = run('git rev-parse --abbrev-ref HEAD')
} catch {
  console.error('[preview:desk] Not a git repository.')
  console.error(`  cwd: ${root}`)
  console.error('  cd into the cloned arc-greenfield folder (the one with package.json), then retry.')
  process.exit(1)
}

let sha = 'unknown'
try {
  sha = run('git rev-parse --short HEAD')
} catch {
  /* optional */
}

console.log('')
console.log('Arc desk preview preflight')
console.log(`  cwd:    ${root}`)
console.log(`  branch: ${branch}`)
console.log(`  commit: ${sha}`)
console.log('  open:   http://127.0.0.1:4173/?demo=1&demoReset=1')
console.log('')

if (branch !== REQUIRED_BRANCH) {
  console.error(`[preview:desk] Wrong branch: expected "${REQUIRED_BRANCH}", got "${branch}".`)
  console.error('  git fetch origin && git checkout cursor/arc-production-integration && git pull')
  process.exit(1)
}
