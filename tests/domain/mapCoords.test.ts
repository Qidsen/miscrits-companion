import { expect, test } from 'vitest'
import { markerVisible, toLatLng } from '../../src/domain/mapCoords'
import type { Marker, Miscrit } from '../../src/data/types'

const map = { file: 'f.webp', width: 1000, height: 500 }
test('toLatLng: top-left, center, bottom-right', () => {
  expect(toLatLng(0, 0, map)).toEqual([500, 0])
  expect(toLatLng(50, 50, map)).toEqual([250, 500])
  expect(toLatLng(100, 100, map)).toEqual([0, 1000])
})

const mk: Marker = { id: 'a', region: 'Forest', x: 1, y: 1, name: 'Flue', miscritId: 1, rarity: 'Common', element: 'Fire', exactImg: null }
const m = { id: 1, spawns: [{ region: 'Forest', zone: '1', days: [2] }], rarity: 'Common' } as unknown as Miscrit
const opts = { day: null, rarities: [], hideCaught: false, caught: new Set<number>() }

test('markerVisible', () => {
  expect(markerVisible(mk, m, opts)).toBe(true)
  expect(markerVisible(mk, m, { ...opts, day: 2 })).toBe(true)
  expect(markerVisible(mk, m, { ...opts, day: 3 })).toBe(false)
  expect(markerVisible(mk, m, { ...opts, rarities: ['Rare'] })).toBe(false)
  expect(markerVisible(mk, m, { ...opts, hideCaught: true, caught: new Set([1]) })).toBe(false)
})
test('unknown miscrit markers only filtered by rarity', () => {
  expect(markerVisible({ ...mk, miscritId: null }, undefined, { ...opts, day: 3 })).toBe(true)
})
test('day filter uses spawns in the marker region only', () => {
  const m2 = { ...m, spawns: [{ region: 'Moon', zone: '1', days: 'all' }, { region: 'Forest', zone: '1', days: [2] }] } as unknown as Miscrit
  expect(markerVisible(mk, m2, { ...opts, day: 3 })).toBe(false)
})
