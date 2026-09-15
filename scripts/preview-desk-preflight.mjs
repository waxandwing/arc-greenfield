#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { cwd } from 'node:process'

const REQUIRED_BRANCH = 'cursor/arc-production-integration'
const ORIGIN_REF = `origin/${REQUIRED_BRANCH}`

const yellow = (text) => `\x1b[33m${text}\x1b[0m`

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim()
}

function runOptional(command) {
  try {
    return run(command)
  } catch {
    return null
  }
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
let headFull = null
try {
  headFull = run('git rev-parse HEAD')
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

let originHead = null
try {
  // Remote may use a narrow fetch refspec; always fetch integration explicitly.
  run(`git fetch origin ${REQUIRED_BRANCH}`)
  originHead =
    runOptional(`git rev-parse ${ORIGIN_REF}`)
    ?? runOptional('git rev-parse FETCH_HEAD')
} catch {
  console.error('[preview:desk] git fetch origin failed (network or missing remote).')
  console.error('  Fix network, then retry. To create the integration branch locally:')
  console.error(
    '  git fetch origin && git switch -c cursor/arc-production-integration --track origin/cursor/arc-production-integration',
  )
  process.exit(1)
}

const onRequiredBranch = branch === REQUIRED_BRANCH
const matchesOrigin = Boolean(headFull && originHead && headFull === originHead)

if (!onRequiredBranch && !matchesOrigin) {
  console.error(`[preview:desk] Wrong branch: expected "${REQUIRED_BRANCH}" (or same commit as ${ORIGIN_REF}), got "${branch}".`)
  if (originHead) {
    console.error(`  origin ${ORIGIN_REF} is at ${runOptional(`git rev-parse --short ${ORIGIN_REF}`) ?? originHead.slice(0, 7)}; you are at ${sha}.`)
  }
  console.error('  git fetch origin && git checkout cursor/arc-production-integration && git pull')
  console.error(
    '  If checkout fails (no local branch): git fetch origin && git switch -c cursor/arc-production-integration --track origin/cursor/arc-production-integration',
  )
  process.exit(1)
}

if (!onRequiredBranch && matchesOrigin) {
  console.log(
    yellow(
      `[preview:desk] Branch name is "${branch}" (not "${REQUIRED_BRANCH}") but commit matches ${ORIGIN_REF} — continuing.`,
    ),
  )
  console.log('')
}
