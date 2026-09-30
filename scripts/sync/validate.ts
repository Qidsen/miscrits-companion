import type { Snapshot } from '../../src/data/types'

const RARITIES = ['Common', 'Rare', 'Epic', 'Exotic', 'Legendary']

export function markerCount(s: Snapshot): number {
  return Object.values(s.markers).reduce((n, l) => n + l.length, 0)
}

export function validateSnapshot(next: Snapshot, prev: { miscrits: number; markers: number } | null): void {
  if (next.miscrits.length === 0) throw new Error('validation: no miscrits')
  for (const m of next.miscrits) {
    if (!Array.isArray(m.names) || m.names.length === 0) throw new Error(`validation: miscrit ${m.id} has no names`)
    if (!RARITIES.includes(m.rarity)) throw new Error(`validation: miscrit ${m.id} bad rarity ${m.rarity}`)
  }
  if (prev) {
    if (next.miscrits.length < prev.miscrits * 0.9) throw new Error(`validation: miscrits dropped ${prev.miscrits} → ${next.miscrits.length}`)
    const mk = markerCount(next)
    if (mk < prev.markers * 0.9) throw new Error(`validation: markers dropped ${prev.markers} → ${mk}`)
  }
}

/** Fail early with a clear message when an upstream source changes shape. */
export function checkRawShape(raw: { game: unknown; organized: unknown; areaNames: unknown; relics: unknown; markers: unknown }): void {
  const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)
  if (!Array.isArray(raw.game)) throw new Error('shape: game miscrits is not an array')
  if (!isObj(raw.organized)) throw new Error('shape: organized is not an object')
  if (!isObj(raw.areaNames)) throw new Error('shape: area names is not an object')
  if (!Array.isArray(raw.relics)) throw new Error('shape: relics is not an array')
  if (!isObj(raw.markers)) throw new Error('shape: markers is not an object')
  for (const [region, list] of Object.entries(raw.markers as Record<string, unknown>))
    if (!Array.isArray(list)) throw new Error(`shape: markers ${region} is not an array`)
}
