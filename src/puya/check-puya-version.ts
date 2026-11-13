import { Constants } from '../constants'
import { logger } from '../logger'
import { runPuya } from './run-puya'
import type { SemVer } from './semver'
import { parseSemVer } from './semver'

enum VersionCompareVerdict {
  ExactMatch = 'ExactMatch',
  Inconclusive = 'Inconclusive',
  MajorMismatch = 'MajorMismatch',
  MinorMismatch = 'MinorMismatch',
  OlderRevision = 'OlderRevision',
  NewerRevision = 'NewerRevision',
  SuffixMismatch = 'SuffixMismatch',
  NotDtPuya = 'NotDtPuya',
  OlderDtRelease = 'OlderDtRelease',
  NewerDtRelease = 'NewerDtRelease',
}

/** The release of dt-puya in a version's suffix: -dt.1.0.0 is [1, 0, 0] */
function parseDtRelease(suffix: string): [number, number, number] | undefined {
  const matched = /^-dt\.(\d+)\.(\d+)\.(\d+)$/.exec(suffix)
  return matched ? [Number(matched[1]), Number(matched[2]), Number(matched[3])] : undefined
}

function compareReleases(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]
  return 0
}

async function comparePuyaVersion(puyaPath: string): Promise<{
  target: string
  found?: string
  verdict: VersionCompareVerdict
}> {
  const target = Constants.targetedPuyaVersion

  const versionParser = new VersionParser()
  await runPuya({
    command: puyaPath,
    args: ['--version'],
    onOutput: (line) => versionParser.receiveLine(line),
  })

  if (!versionParser.version) return { target, verdict: VersionCompareVerdict.Inconclusive }
  const ver = versionParser.version

  // Compare
  const { major, minor, rev, suffix } = parseSemVer(target)
  // dt-puya-ts targets a dt-puya release (5.10.1-dt.1.0.0): a puya that isn't dt-puya lacks the ops
  // dt-puya adds, whatever its version
  const targetDt = parseDtRelease(suffix)
  const foundDt = parseDtRelease(ver.suffix)
  if (targetDt && !foundDt) return { verdict: VersionCompareVerdict.NotDtPuya, target, found: ver.formatted }
  if (ver.major !== major) return { verdict: VersionCompareVerdict.MajorMismatch, target, found: ver.formatted }
  if (ver.minor !== minor) return { verdict: VersionCompareVerdict.MinorMismatch, target, found: ver.formatted }
  if (ver.rev < rev) return { verdict: VersionCompareVerdict.OlderRevision, target, found: ver.formatted }
  if (ver.rev > rev) return { verdict: VersionCompareVerdict.NewerRevision, target, found: ver.formatted }
  if (targetDt && foundDt) {
    const cmp = compareReleases(foundDt, targetDt)
    if (cmp < 0) return { verdict: VersionCompareVerdict.OlderDtRelease, target, found: ver.formatted }
    if (cmp > 0) return { verdict: VersionCompareVerdict.NewerDtRelease, target, found: ver.formatted }
  }
  if (ver.suffix !== suffix) return { verdict: VersionCompareVerdict.SuffixMismatch, target, found: ver.formatted }
  return { verdict: VersionCompareVerdict.ExactMatch, target, found: ver.formatted }
}

export async function checkPuyaVersion(puyaPath: string) {
  const result = await comparePuyaVersion(puyaPath)

  switch (result.verdict) {
    case VersionCompareVerdict.Inconclusive:
      logger.warn(undefined, `Unable to verify the version of Puya at ${puyaPath}.`)
      break
    case VersionCompareVerdict.MajorMismatch:
    case VersionCompareVerdict.MinorMismatch:
    case VersionCompareVerdict.SuffixMismatch:
      logger.warn(
        undefined,
        `Version of Puya at ${puyaPath} (${result.found}) does not match targeted version (${result.target}). There may be compatibility issues.`,
      )
      break
    case VersionCompareVerdict.NotDtPuya:
      logger.warn(
        undefined,
        `Puya at ${puyaPath} (${result.found}) is not dt-puya: the targeted version is ${result.target}. Contracts that use op.TimeTravel will not compile with it.`,
      )
      break
    case VersionCompareVerdict.OlderDtRelease:
      logger.warn(undefined, `dt-puya at ${puyaPath} (${result.found}) is an older release than the targeted one (${result.target})`)
      break
    case VersionCompareVerdict.NewerDtRelease:
      logger.debug(undefined, `dt-puya at ${puyaPath} (${result.found}) is a newer release than the targeted one (${result.target})`)
      break
    case VersionCompareVerdict.OlderRevision:
      logger.warn(undefined, `Revision of Puya at ${puyaPath} (${result.found}) is older than the targeted revision (${result.target})`)
      break
    case VersionCompareVerdict.NewerRevision:
      logger.debug(undefined, `Revision of Puya at ${puyaPath} (${result.found}) is newer than the targeted revision (${result.target})`)
      break
  }
}

class VersionParser {
  #ver: SemVer | undefined

  receiveLine(line: string): void {
    const matched = /^puya ((\d+)\.(\d+)\.(\d+)(-.*)?)$/.exec(line)
    if (!matched) {
      logger.debug(undefined, `'puya --version' command returned unexpected output: "${line}"`)
    } else {
      this.#ver = {
        formatted: matched[1],
        major: Number(matched[2]),
        minor: Number(matched[3]),
        rev: Number(matched[4]),
        suffix: matched[5] ?? '',
      }
    }
  }

  get version(): undefined | SemVer {
    return this.#ver
  }
}
