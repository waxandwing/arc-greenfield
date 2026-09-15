#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { cwd } from 'node:process'

const INTEGRATION_BRANCH = 'cursor/arc-production-integration'
const MAIN_BRANCH = 'main'
const ALLOWED_BRANCHES = [MAIN_BRANCH, INTEGRATION_BRANCH]
const ORIGIN_INTEGRATION_REF = `origin/${INTEGRATION_BRANCH}`
const ORIGIN_MAIN_REF = `origin/${MAIN_BRANCH}`

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

let originIntegrationHead = null
let originMainHead = null
try {
  run(`git fetch origin ${INTEGRATION_BRANCH} ${MAIN_BRANCH}`)
  originIntegrationHead =
    runOptional(`git rev-parse ${ORIGIN_INTEGRATION_REF}`)
    ?? runOptional('git rev-parse FETCH_HEAD')
  originMainHead = runOptional(`git rev-parse ${ORIGIN_MAIN_REF}`)
} catch {
  console.error('[preview:desk] git fetch origin failed (network or missing remote).')
  console.error('  Fix network, then retry. Desk branches: main (default) or cursor/arc-production-integration.')
  process.exit(1)
}

const onAllowedBranch = ALLOWED_BRANCHES.includes(branch)
const matchesOriginIntegration = Boolean(
  headFull && originIntegrationHead && headFull === originIntegrationHead,
)
const matchesOriginMain = Boolean(headFull && originMainHead && headFull === originMainHead)

if (branch === MAIN_BRANCH) {
  if (originMainHead && headFull && headFull !== originMainHead) {
    console.log(
      yellow(
        `[preview:desk] On "${MAIN_BRANCH}" but commit ${sha} differs from ${ORIGIN_MAIN_REF} — continuing (pull origin main when you want the latest desk).`,
      ),
    )
    console.log('')
  }
} else if (!onAllowedBranch && !matchesOriginIntegration && !matchesOriginMain) {
  console.error(
    `[preview:desk] Wrong branch: expected "${MAIN_BRANCH}" or "${INTEGRATION_BRANCH}" (or same commit as origin), got "${branch}".`,
  )
  if (originIntegrationHead) {
    console.error(
      `  origin ${ORIGIN_INTEGRATION_REF} is at ${runOptional(`git rev-parse --short ${ORIGIN_INTEGRATION_REF}`) ?? originIntegrationHead.slice(0, 7)}; you are at ${sha}.`,
    )
  }
  if (originMainHead) {
    console.error(
      `  origin ${ORIGIN_MAIN_REF} is at ${runOptional(`git rev-parse --short ${ORIGIN_MAIN_REF}`) ?? originMainHead.slice(0, 7)}.`,
    )
  }
  console.error('  git pull origin main   # default desk lane')
  console.error('  git fetch origin && git checkout cursor/arc-production-integration && git pull')
  process.exit(1)
} else if (!onAllowedBranch && (matchesOriginIntegration || matchesOriginMain)) {
  const matchedRef = matchesOriginMain ? ORIGIN_MAIN_REF : ORIGIN_INTEGRATION_REF
  console.log(
    yellow(`[preview:desk] Branch name is "${branch}" but commit matches ${matchedRef} — continuing.`),
  )
  console.log('')
}
