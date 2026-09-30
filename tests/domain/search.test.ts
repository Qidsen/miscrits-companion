import { expect, test } from 'vitest'
import { searchMiscrits } from '../../src/domain/search'
import type { Miscrit } from '../../src/data/types'

const m = (id: number, names: string[]) => ({ id, names }) as Miscrit
const list = [m(1, ['Flue', 'Afterburn']), m(2, ['Dark Flue']), m(3, ['Snowflue']), m(4, ['Flutter'])]

test('ranks exact > prefix > word prefix > substring', () => {
  expect(searchMiscrits(list, 'flue').map(r => r.m.id)).toEqual([1, 2, 3])
  expect(searchMiscrits(list, 'flu').map(r => r.m.id)).toEqual([1, 4, 2, 3])
})
test('reports which evolution name matched', () => {
  expect(searchMiscrits(list, 'after')[0]).toEqual({ m: list[0], matched: 'Afterburn' })
})
test('empty query → no results; limit respected', () => {
  expect(searchMiscrits(list, '  ')).toEqual([])
  expect(searchMiscrits(list, 'f', 2)).toHaveLength(2)
})
