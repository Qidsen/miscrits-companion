import { expect, test } from 'vitest'
import { weekMatrix } from '../../src/domain/week'
import type { Miscrit } from '../../src/data/types'
const m = (id: number, rarity: string, spawns: unknown[]) => ({ id, names: [`M${id}`], rarity, spawns }) as unknown as Miscrit
test('weekMatrix lists only day-restricted spawns per region and day', () => {
  const w = weekMatrix([
    m(1, 'Common', [{ region: 'Forest', zone: '1', days: [1, 3] }]),
    m(2, 'Legendary', [{ region: 'Forest', zone: '2', days: [1] }]),
    m(3, 'Rare', [{ region: 'Forest', zone: '1', days: 'all' }]),
  ])
  expect(w.get('Forest')!.get(1)!.map(x => x.id)).toEqual([2, 1])
  expect(w.get('Forest')!.get(3)!.map(x => x.id)).toEqual([1])
  expect(w.get('Forest')!.get(2)).toBeUndefined()
})
