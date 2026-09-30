import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import type { MapInfo } from '../../src/data/types'
import { fetchBuffer } from './http'
import { MAP_FILES, mapUrl } from './sources'

const MAX_WIDTH = 3200

export const mapSlug = (region: string) => region.toLowerCase().replace(/\s+/g, '_')

/** Download + compress each region map. Keeps the existing webp if download fails. */
export async function syncMaps(outDir: string, force: boolean, warnings: string[]): Promise<Record<string, MapInfo>> {
  mkdirSync(outDir, { recursive: true })
  const sizes: Record<string, MapInfo> = {}
  for (const [region, src] of Object.entries(MAP_FILES)) {
    const file = `${mapSlug(region)}.webp`
    const target = join(outDir, file)
    if (force || !existsSync(target)) {
      try {
        const buf = await fetchBuffer(mapUrl(src))
        await sharp(buf).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toFile(target)
        console.log(`map ${region}: ok`)
      } catch (e) {
        warnings.push(`map ${region}: ${(e as Error).message}`)
      }
    }
    if (existsSync(target)) {
      const meta = await sharp(target).metadata()
      sizes[region] = { file, width: meta.width!, height: meta.height! }
    }
  }
  return sizes
}
