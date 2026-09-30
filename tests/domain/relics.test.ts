import { expect, test } from 'vitest'
import { filterRelics, relicUsage } from '../../src/domain/relics'
import type { Miscrit, Relic } from '../../src/data/types'
test('relicUsage maps relics to miscrits', () => {
  const u = relicUsage([{ id: 1, relicSet: { name: 'A', relicIds: [10, 20] } }, { id: 2, relicSet: { name: 'A', relicIds: [10] } }, { id: 3, relicSet: null }] as unknown as Miscrit[])
  expect(u.get(10)).toEqual([1, 2]); expect(u.get(20)).toEqual([1])
})
test('filterRelics by level, stat, query', () => {
  const r = (id: number, level: number, name: string, effect: Record<string, number>) => ({ id, level, name, desc: '', effect, special: null, imageUrl: '' }) as Relic
  const list = [r(1, 20, 'B', { ea: 5 }), r(2, 10, 'A', { ea: -1, hp: 3 }), r(3, 10, 'C', { pd: 2 })]
  expect(filterRelics(list, { levels: [], stat: null, q: '' }).map(x => x.id)).toEqual([2, 3, 1])
  expect(filterRelics(list, { levels: [10], stat: null, q: '' }).map(x => x.id)).toEqual([2, 3])
  expect(filterRelics(list, { levels: [], stat: 'ea', q: '' }).map(x => x.id)).toEqual([1])
  expect(filterRelics(list, { levels: [], stat: null, q: 'c' }).map(x => x.id)).toEqual([3])
})
