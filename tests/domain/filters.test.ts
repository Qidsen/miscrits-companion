import { expect, test } from 'vitest'
import { EMPTY_FILTER, filterMiscrits, filterToParams, paramsToFilter, type DexFilter } from '../../src/domain/filters'
import type { Miscrit } from '../../src/data/types'

const base: Omit<Miscrit, 'id' | 'names' | 'element' | 'rarity' | 'spawns'> = { stats: { hp: 'Weak', spd: 'Weak', ea: 'Weak', pa: 'Weak', ed: 'Weak', pd: 'Weak' }, abilities: [], descriptions: [], perfectStat: null, attackType: null, relicSet: null, shopInfo: null }
const list: Miscrit[] = [
  { ...base, id: 1, names: ['Flue', 'Afterburn'], element: 'Fire', rarity: 'Common', spawns: [{ region: 'Forest', zone: '1', days: 'all' }], stats: { ...base.stats, spd: 'Max' } },
  { ...base, id: 2, names: ['Breezy'], element: 'FireWind', rarity: 'Legendary', spawns: [{ region: 'Moon', zone: '1', days: [2] }] },
  { ...base, id: 3, names: ['Nessy'], element: 'Water', rarity: 'Rare', spawns: [] },
]
const ctx = { caught: new Set([3]), favorites: new Set([2]) }
const f = (over: Partial<DexFilter>) => ({ ...EMPTY_FILTER, ...over })
const ids = (x: Miscrit[]) => x.map(m => m.id)

test('no filter → all sorted by id', () => { expect(ids(filterMiscrits(list, EMPTY_FILTER, ctx))).toEqual([1, 2, 3]) })
test('search matches any evolution name, case-insensitive', () => { expect(ids(filterMiscrits(list, f({ q: 'after' }), ctx))).toEqual([1]) })
test('element filter matches dual elements', () => { expect(ids(filterMiscrits(list, f({ elements: ['Wind'] }), ctx))).toEqual([2]) })
test('rarity, region, day', () => {
  expect(ids(filterMiscrits(list, f({ rarities: ['Rare', 'Common'] }), ctx))).toEqual([1, 3])
  expect(ids(filterMiscrits(list, f({ region: 'Moon' }), ctx))).toEqual([2])
  expect(ids(filterMiscrits(list, f({ day: 2 }), ctx))).toEqual([1, 2])
  expect(ids(filterMiscrits(list, f({ day: 3 }), ctx))).toEqual([1])
})
test('status + favorites', () => {
  expect(ids(filterMiscrits(list, f({ status: 'caught' }), ctx))).toEqual([3])
  expect(ids(filterMiscrits(list, f({ status: 'uncaught' }), ctx))).toEqual([1, 2])
  expect(ids(filterMiscrits(list, f({ favorites: true }), ctx))).toEqual([2])
})
test('sorting', () => {
  expect(ids(filterMiscrits(list, f({ sort: 'rarity' }), ctx))).toEqual([2, 3, 1])
  expect(ids(filterMiscrits(list, f({ sort: 'name' }), ctx))).toEqual([2, 1, 3])
  expect(ids(filterMiscrits(list, f({ sort: 'spd' }), ctx))).toEqual([1, 2, 3])
})
test('URL round trip', () => {
  const x = f({ q: 'fl', elements: ['Fire', 'Wind'], rarities: ['Epic'], region: 'Moon', day: 0, status: 'caught', favorites: true, sort: 'hp' })
  expect(paramsToFilter(filterToParams(x))).toEqual(x)
  expect(filterToParams(EMPTY_FILTER).toString()).toBe('')
  expect(paramsToFilter(new URLSearchParams('day=abc&sort=bogus&status=x'))).toEqual(EMPTY_FILTER)
})
