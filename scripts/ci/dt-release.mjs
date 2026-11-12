/* eslint-disable no-console */
/* global console, process */
// Keep the versions in the docs in step with package.json, and check them before a release.
//
// Usage:
//   node scripts/ci/dt-release.mjs update        rewrite the docs for the package.json and dt-puya versions
//   node scripts/ci/dt-release.mjs check [tag]   fail if the packages, the lockfiles, the docs, dt-puya or the tag disagree
//
// The two packages, @d13co/dt-puya-ts and @d13co/dt-algorand-typescript, are released together
// with one version, <puya-ts version>-dt.<x.y.z>. The docs name it in the install snippets
// (@d13co/dt-puya-ts@<version>) and name the dt-puya release the compiler downloads
// (Constants.targetedPuyaVersion in src/constants.ts) as `dt-puya <version>` and in links to its
// release (d13co/dt-puya/releases/tag/v<version>).
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = (file) => readFileSync(join(root, file), 'utf8')
const readJson = (file) => JSON.parse(read(file))

const PACKAGES = [
  { dir: '.', name: '@d13co/dt-puya-ts' },
  { dir: 'packages/algo-ts', name: '@d13co/dt-algorand-typescript' },
]
const PUYA_REPO = 'd13co/dt-puya'
const DOCS = ['README.md', 'DTPUYATS.md']
const FORMAT = '<puya-ts version>-dt.<x.y.z>'
const DT_VERSION = /\d+\.\d+\.\d+-dt\.\d+\.\d+\.\d+/.source
const VERSION_FORMAT = new RegExp(`^${DT_VERSION}$`)
// @d13co/dt-puya-ts@1.3.1-dt.1.0.0 and @d13co/dt-algorand-typescript@1.3.1-dt.1.0.0
const packageRef = new RegExp(`(@d13co/dt-(?:puya-ts|algorand-typescript))@(${DT_VERSION})(?![.\\d])`, 'g')
// `dt-puya 5.10.1-dt.1.0.0` and d13co/dt-puya/releases/tag/v5.10.1-dt.1.0.0
const puyaRef = new RegExp(`(dt-puya(?: |/releases/(?:tag|download)/v))(${DT_VERSION})(?![.\\d])`, 'g')

const constants = read('src/constants.ts')
const constant = (key) => new RegExp(`^\\s*${key}:\\s*'([^']*)'`, 'm').exec(constants)?.[1]
const puyaVersion = constant('targetedPuyaVersion')
const puyaRepo = constant('puyaGithubRepo')

const [mode, tag] = process.argv.slice(2)
const { version } = readJson('package.json')

const errors = []
if (!VERSION_FORMAT.test(version)) errors.push(`package.json version ${version} is not ${FORMAT}`)
if (!puyaVersion || !VERSION_FORMAT.test(puyaVersion))
  errors.push(`targetedPuyaVersion ${puyaVersion} in src/constants.ts is not a dt-puya release, <puya version>-dt.<x.y.z>`)
if (puyaRepo !== PUYA_REPO) errors.push(`puyaGithubRepo in src/constants.ts is ${puyaRepo}, not ${PUYA_REPO}`)

if (mode === 'update') {
  if (errors.length) fail()
  for (const file of DOCS) {
    const text = read(file)
    const updated = text.replace(packageRef, (_, name) => `${name}@${version}`).replace(puyaRef, (_, prefix) => `${prefix}${puyaVersion}`)
    writeFileSync(join(root, file), updated)
    console.log(`${file}: ${text === updated ? 'unchanged' : 'updated'}`)
  }
  console.log(`@d13co/dt-puya-ts ${version}, dt-puya ${puyaVersion}`)
} else if (mode === 'check') {
  for (const { dir, name } of PACKAGES) {
    const pkg = readJson(join(dir, 'package.json'))
    const lock = readJson(join(dir, 'package-lock.json'))
    if (pkg.name !== name) errors.push(`${dir}/package.json name is ${pkg.name}, not ${name}`)
    if (pkg.version !== version) errors.push(`${dir}/package.json version ${pkg.version} is not ${version}`)
    if (lock.name !== name || lock.packages?.['']?.name !== name) errors.push(`${dir}/package-lock.json name is ${lock.name}, not ${name}`)
    if (lock.version !== version || lock.packages?.['']?.version !== version)
      errors.push(`${dir}/package-lock.json version ${lock.version} is not ${version}`)
  }
  // The root lockfile records the version of the linked packages/algo-ts/dist
  const linked = readJson('package-lock.json').packages?.['packages/algo-ts/dist']
  if (linked?.name !== PACKAGES[1].name || linked?.version !== version)
    errors.push(`package-lock.json has packages/algo-ts/dist as ${linked?.name}@${linked?.version}, not ${PACKAGES[1].name}@${version}`)
  if (tag && tag !== `v${version}`) errors.push(`tag ${tag} is not v${version}`)
  for (const file of DOCS) {
    const text = read(file)
    for (const [ref, , found] of text.matchAll(packageRef)) if (found !== version) errors.push(`${file}: ${ref} is not ${version}`)
    for (const [ref, , found] of text.matchAll(puyaRef)) if (found !== puyaVersion) errors.push(`${file}: ${ref} is not ${puyaVersion}`)
  }
  if (errors.length) fail()
  console.log(`@d13co/dt-puya-ts ${version} (dt-puya ${puyaVersion}) is consistent${tag ? ` with ${tag}` : ''}`)
} else {
  console.error('Usage: dt-release.mjs update | check [tag]')
  process.exit(1)
}

function fail() {
  errors.forEach((e) => console.error(e))
  console.error('Set the versions, then run `node scripts/ci/dt-release.mjs update`')
  process.exit(1)
}
