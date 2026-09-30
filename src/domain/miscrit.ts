import type { Miscrit, Rarity, Tier } from '../data/types'

export const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Epic', 'Exotic', 'Legendary']
export const TIER_VALUE: Record<Tier, number> = { Weak: 1, Moderate: 2, Strong: 3, Max: 4, Elite: 5 }
export const BASE_ELEMENTS = ['Fire', 'Water', 'Nature', 'Earth', 'Wind', 'Lightning']
export const REGION_ORDER = ['Forest', 'Hidden Forest', 'Mount Gemma', 'Cave', 'Mansion', 'Shack',
  'Sunfall Shores', 'Moon', 'Miscrian Jungle', 'Temple', 'Monks Mountain', 'Emerald Isle']

export const splitElement = (el: string) => el.match(/[A-Z][a-z]+/g) ?? [el]
export const displayName = (m: Miscrit) => m.names[0]

export function sortRegions(names: string[]): string[] {
  const idx = (n: string) => { const i = REGION_ORDER.indexOf(n); return i === -1 ? Infinity : i }
  return [...names].sort((a, b) => idx(a) - idx(b) || a.localeCompare(b))
}
