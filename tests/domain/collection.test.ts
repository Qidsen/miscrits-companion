import { expect, test } from 'vitest'
import { collectionStats, decodeIds, encodeIds, exportCollection, importCollection, parseNameList } from '../../src/domain/collection'
import type { Miscrit } from '../../src/data/types'

test('encode/decode round trip', () => {
  const ids = [1, 2, 20, 425, 520]
  expect(decodeIds(encodeIds(ids))).toEqual(ids)
  expect(encodeIds([])).toBe('')
  expect(decodeIds('')).toEqual([])
})
test('decodeIds rejects garbage and caps size', () => {
  expect(decodeIds('***')).toBeNull()
  expect(decodeIds('A'.repeat(100_000))).toBeNull() // longer than 20 000 chars
  expect(decodeIds(encodeIds([3, 5000]), 4096)).toEqual([3])
})
const ms = [
  { id: 1, names: ['Flue', 'Afterburn'], element: 'Fire', rarity: 'Common' },
  { id: 2, names: ['Breezy'], element: 'FireWind', rarity: 'Legendary' },
] as unknown as Miscrit[]
test('parseNameList', () => {
  expect(parseNameList('afterburn\n Breezy ; nope, FLUE', ms)).toEqual({ ids: [1, 2], unknown: ['nope'] })
  expect(parseNameList('', ms)).toEqual({ ids: [], unknown: [] })
})
test('collectionStats counts dual elements in both bases', () => {
  const s = collectionStats(ms, new Set([2]))
  expect(s).toMatchObject({ total: 2, caught: 1 })
  expect(s.byElement.Fire).toEqual({ total: 2, caught: 1 })
  expect(s.byElement.Wind).toEqual({ total: 1, caught: 1 })
  expect(s.byRarity.Legendary).toEqual({ total: 1, caught: 1 })
})
test('export/import', () => {
  expect(importCollection(exportCollection([1, 2], [2]))).toEqual({ caught: [1, 2], favorites: [2] })
  expect(importCollection('{"caught":"x"}')).toBeNull()
  expect(importCollection('not json')).toBeNull()
})
