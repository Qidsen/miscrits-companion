import type { Miscrit } from '../data/types'
import { RARITY_ORDER, TIER_VALUE, splitElement } from './miscrit'
import { isAvailable } from './schedule'

export type SortKey = 'id' | 'name' | 'rarity' | 'spd' | 'hp'
export interface DexFilter {
  q: string; elements: string[]; rarities: string[]; region: string | null; day: number | null
  status: 'all' | 'caught' | 'uncaught'; favorites: boolean; sort: SortKey
}
export const EMPTY_FILTER: DexFilter = { q: '', elements: [], rarities: [], region: null, day: null, status: 'all', favorites: false, sort: 'id' }
const SORTS: SortKey[] = ['id', 'name', 'rarity', 'spd', 'hp']

const comparators: Record<SortKey, (a: Miscrit, b: Miscrit) => number> = {
  id: (a, b) => a.id - b.id,
  name: (a, b) => a.names[0].localeCompare(b.names[0]),
  rarity: (a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || a.id - b.id,
  spd: (a, b) => TIER_VALUE[b.stats.spd] - TIER_VALUE[a.stats.spd] || a.id - b.id,
  hp: (a, b) => TIER_VALUE[b.stats.hp] - TIER_VALUE[a.stats.hp] || a.id - b.id,
}

export function filterMiscrits(list: Miscrit[], f: DexFilter, ctx: { caught: Set<number>; favorites: Set<number> }): Miscrit[] {
  const q = f.q.trim().toLowerCase()
  return list.filter(m =>
    (!q || m.names.some(n => n.toLowerCase().includes(q)))
    && (f.elements.length === 0 || splitElement(m.element).some(e => f.elements.includes(e)))
    && (f.rarities.length === 0 || f.rarities.includes(m.rarity))
    && (!f.region || m.spawns.some(s => s.region === f.region))
    && (f.day === null || isAvailable(m.spawns, f.day))
    && (f.status === 'all' || (f.status === 'caught') === ctx.caught.has(m.id))
    && (!f.favorites || ctx.favorites.has(m.id)),
  ).sort(comparators[f.sort])
}

export function filterToParams(f: DexFilter): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.elements.length) p.set('el', f.elements.join(','))
  if (f.rarities.length) p.set('r', f.rarities.join(','))
  if (f.region) p.set('region', f.region)
  if (f.day !== null) p.set('day', String(f.day))
  if (f.status !== 'all') p.set('status', f.status)
  if (f.favorites) p.set('fav', '1')
  if (f.sort !== 'id') p.set('sort', f.sort)
  return p
}

export function paramsToFilter(p: URLSearchParams): DexFilter {
  const list = (k: string) => (p.get(k) ? p.get(k)!.split(',').filter(Boolean) : [])
  const day = p.get('day') !== null && /^[0-6]$/.test(p.get('day')!) ? Number(p.get('day')) : null
  const status = p.get('status')
  const sort = p.get('sort') as SortKey
  return {
    q: p.get('q') ?? '', elements: list('el'), rarities: list('r'), region: p.get('region'), day,
    status: status === 'caught' || status === 'uncaught' ? status : 'all',
    favorites: p.get('fav') === '1', sort: SORTS.includes(sort) ? sort : 'id',
  }
}
