import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import type { MapInfo, Marker, Miscrit, Region } from '../../src/data/types'

/** Square crop of the map around a marker (map pixels), clamped to the image, plus the marker inside it. */
export function mapCrop(map: MapInfo, pos: { x: number; y: number }, want: number) {
  const size = Math.min(want, map.width, map.height)
  const px = (pos.x / 100) * map.width, py = (pos.y / 100) * map.height
  const left = Math.round(Math.min(Math.max(px - size / 2, 0), map.width - size))
  const top = Math.round(Math.min(Math.max(py - size / 2, 0), map.height - size))
  return { left, top, size, mx: Math.round(px - left), my: Math.round(py - top) }
}

const TW = 360, TH = 240

/**
 * Small "where exactly" map thumbnails (data/locmap/<id>.jpg): a crop around the miscrit's marker with a ring.
 * Only for miscrits that have a marker. Regenerated when inputs change (hash index) so syncs don't churn the repo.
 */
export async function renderLocMaps(miscrits: Miscrit[], regions: Region[], markers: Record<string, Marker[]>, mapsDir: string, outDir: string): Promise<Set<number>> {
  mkdirSync(outDir, { recursive: true })
  const indexFile = join(outDir, 'index.json')
  const index: Record<string, string> = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')) : {}
  const done = new Set<number>()
  const regionBy = new Map(regions.map(r => [r.name, r]))
  for (const m of miscrits) {
    const marker = Object.values(markers).flat().find(x => x.miscritId === m.id)
    const map = marker ? regionBy.get(marker.region)?.map : null
    if (!marker || !map) continue
    const file = join(outDir, `${m.id}.jpg`)
    const hash = createHash('sha1').update(JSON.stringify([marker.x, marker.y, map, 2])).digest('hex').slice(0, 12)
    done.add(m.id)
    if (index[m.id] === hash && existsSync(file)) continue
    // wide crop keeps landmarks around the spot recognisable
    const c = mapCrop(map, marker, Math.round(Math.min(map.width, map.height) * 0.8))
    const cropH = Math.round(c.size * (TH / TW))
    const top = Math.min(Math.max(c.top + c.my - cropH / 2, 0), map.height - cropH)
    const mx = (c.mx / c.size) * TW, my = ((c.top + c.my - top) / cropH) * TH
    const ring = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}">
      <circle cx="${mx}" cy="${my}" r="30" fill="none" stroke="#0b0e15" stroke-opacity=".6" stroke-width="10"/>
      <circle cx="${mx}" cy="${my}" r="30" fill="none" stroke="#ffb547" stroke-width="5"/>
      <circle cx="${mx}" cy="${my}" r="6" fill="#ffb547"/></svg>`
    await sharp(join(mapsDir, map.file))
      .extract({ left: c.left, top: Math.round(top), width: c.size, height: cropH }).resize(TW, TH)
      .composite([{ input: Buffer.from(ring) }]).jpeg({ quality: 80 }).toFile(file)
    index[m.id] = hash
  }
  writeFileSync(indexFile, JSON.stringify(index))
  return done
}
