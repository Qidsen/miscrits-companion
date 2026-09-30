import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Meta } from '../../src/data/types'
import { fetchJson } from './http'
import { syncMaps } from './maps'
import { normalize, type RawInput } from './normalize'
import { AREA_NAMES, GAME_JSON, MAP_FILES, ORGANIZED, RELICS, markersUrl } from './sources'
import { checkRawShape, markerCount, perRegionCounts, validateSnapshot } from './validate'

const ROOT = process.cwd()
const RAW = join(ROOT, 'data-raw')
const OUT = join(ROOT, 'public', 'data')
const forceMaps = process.argv.includes('--maps')

const readJson = <T>(p: string): T | null => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) as T : null)
const writeJson = (p: string, v: unknown) => writeFileSync(p, JSON.stringify(v) + '\n')

/** Fresh raw copies, written to data-raw only after the snapshot validates. */
const pendingRaw = new Map<string, unknown>()

/** Fetch a source; on failure fall back to the last committed raw copy. */
async function source<T>(name: string, url: string, warnings: string[], required: boolean): Promise<T> {
  const path = join(RAW, `${name}.json`)
  try {
    const data = await fetchJson<T>(url)
    pendingRaw.set(path, data)
    return data
  } catch (e) {
    const prev = readJson<T>(path)
    if (prev === null) throw new Error(`source ${name} failed${required ? ' (required)' : ''} and no fallback: ${(e as Error).message}`)
    warnings.push(`source ${name}: using previous copy (${(e as Error).message})`)
    return prev
  }
}

async function main() {
  mkdirSync(RAW, { recursive: true })
  mkdirSync(OUT, { recursive: true })
  const warnings: string[] = []

  const game = await source<RawInput['game']>('game-miscrits', GAME_JSON, warnings, true)
  const organized = await source<RawInput['organized']>('organized', ORGANIZED, warnings, false)
  const areaNames = await source<RawInput['areaNames']>('area-names', AREA_NAMES, warnings, false)
  const relics = (await source<{ relics: RawInput['relics'] }>('relics', RELICS, warnings, false))?.relics
  const markers: RawInput['markers'] = {}
  for (const region of Object.keys(MAP_FILES)) {
    const slug = region.toLowerCase().replace(/\s+/g, '-')
    markers[region] = (await source<{ markers: RawInput['markers'][string] }>(`markers-${slug}`, markersUrl(region), warnings, false))?.markers
  }
  checkRawShape({ game, organized, areaNames, relics, markers })
  const mapSizes = await syncMaps(join(OUT, 'maps'), forceMaps, warnings)

  const snap = normalize({ game, organized, areaNames, markers, relics, mapSizes })
  warnings.push(...snap.warnings)

  const prevMeta = readJson<Meta>(join(OUT, 'meta.json'))
  validateSnapshot(snap, prevMeta ? { miscrits: prevMeta.counts.miscrits, markers: prevMeta.counts.markers, perRegion: prevMeta.counts.perRegion } : null)

  const meta: Meta = {
    syncedAt: new Date().toISOString(),
    counts: { miscrits: snap.miscrits.length, markers: markerCount(snap), relics: snap.relics.length, perRegion: perRegionCounts(snap) },
    warnings,
  }
  for (const [path, data] of pendingRaw) writeJson(path, data)
  writeJson(join(OUT, 'miscrits.json'), snap.miscrits)
  writeJson(join(OUT, 'relics.json'), snap.relics)
  writeJson(join(OUT, 'regions.json'), snap.regions)
  writeJson(join(OUT, 'markers.json'), snap.markers)
  writeJson(join(OUT, 'meta.json'), meta)
  console.log(`sync ok: ${meta.counts.miscrits} miscrits, ${meta.counts.markers} markers, ${meta.counts.relics} relics, ${warnings.length} warnings`)
  for (const w of warnings) console.warn('  ! ' + w)
}

main().catch(e => { console.error(e); process.exit(1) })
