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
