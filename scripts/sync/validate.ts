import type { Snapshot } from '../../src/data/types'

const RARITIES = ['Common', 'Rare', 'Epic', 'Exotic', 'Legendary']
const TIERS = ['Weak', 'Moderate', 'Strong', 'Max', 'Elite']

export function markerCount(s: Snapshot): number {
  return Object.values(s.markers).reduce((n, l) => n + l.length, 0)
}

export interface PrevCounts { miscrits: number; markers: number; perRegion?: Record<string, number> }

export const perRegionCounts = (s: Snapshot) => Object.fromEntries(Object.entries(s.markers).map(([r, l]) => [r, l.length]))

export function validateSnapshot(next: Snapshot, prev: PrevCounts | null): void {
  if (next.miscrits.length === 0) throw new Error('validation: no miscrits')
  for (const m of next.miscrits) {
    if (!Array.isArray(m.names) || m.names.length === 0) throw new Error(`validation: miscrit ${m.id} has no names`)
    if (!RARITIES.includes(m.rarity)) throw new Error(`validation: miscrit ${m.id} bad rarity ${m.rarity}`)
    for (const [k, v] of Object.entries(m.stats)) if (!TIERS.includes(v)) throw new Error(`validation: miscrit ${m.id} unknown ${k} tier ${v}`)
  }
  if (prev) {
    if (next.miscrits.length < prev.miscrits * 0.9) throw new Error(`validation: miscrits dropped ${prev.miscrits} → ${next.miscrits.length}`)
    const mk = markerCount(next)
    if (mk < prev.markers * 0.9) throw new Error(`validation: markers dropped ${prev.markers} → ${mk}`)
    for (const [region, before] of Object.entries(prev.perRegion ?? {}))
      if (before >= 3 && (next.markers[region]?.length ?? 0) === 0) throw new Error(`validation: all markers of ${region} vanished (${before} → 0)`)
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
