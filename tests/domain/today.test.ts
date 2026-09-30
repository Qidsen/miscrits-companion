import { expect, test } from 'vitest'
import { exclusiveToday, groupAvailable, miscritOfTheDay } from '../../src/domain/today'
import type { Miscrit, Spawn } from '../../src/data/types'

const mk = (id: number, name: string, rarity: Miscrit['rarity'], spawns: Spawn[]): Miscrit => ({
  id, names: [name], element: 'Fire', rarity, stats: { hp: 'Weak', spd: 'Weak', ea: 'Weak', pa: 'Weak', ed: 'Weak', pd: 'Weak' },
  abilities: [], descriptions: [], spawns, perfectStat: null, attackType: null, relicSet: null, shopInfo: null,
})
const list = [
  mk(1, 'Bee', 'Common', [{ region: 'Moon', zone: '1', days: 'all' }]),
  mk(2, 'Ant', 'Legendary', [{ region: 'Forest', zone: '2', days: [3] }]),
  mk(3, 'Cat', 'Common', [{ region: 'Forest', zone: '2', days: 'all' }, { region: 'Forest', zone: '1', days: [4] }]),
  mk(4, 'Dog', 'Rare', []),
]

test('groupAvailable orders regions, zones, rarity desc', () => {
  expect(groupAvailable(list, 3)).toEqual([
    { region: 'Forest', zones: [{ zone: '2', miscrits: [list[1], list[2]] }] },
    { region: 'Moon', zones: [{ zone: '1', miscrits: [list[0]] }] },
  ])
})
test('exclusiveToday excludes every-day spawns', () => {
  expect(exclusiveToday(list, 3).map(m => m.id)).toEqual([2])
  expect(exclusiveToday(list, 4).map(m => m.id)).toEqual([]) // Cat is also every day elsewhere
})
test('miscritOfTheDay is stable within a game day and changes next day', () => {
  const a = miscritOfTheDay(list, new Date('2026-09-30T10:00:00Z'))
  expect(miscritOfTheDay(list, new Date('2026-09-30T20:00:00Z'))).toBe(a)
  const days = new Set([0, 1, 2, 3, 4, 5, 6].map(i => miscritOfTheDay(list, new Date(Date.UTC(2026, 9, 1 + i, 12))).id))
  expect(days.size).toBeGreaterThan(1)
})

import { rareAvailable } from '../../src/domain/today'
test('rareAvailable: Exotic/Legendary available that day, rarest first', () => {
  expect(rareAvailable(list, 3).map(m => m.id)).toEqual([2])
  expect(rareAvailable(list, 4).map(m => m.id)).toEqual([])
})
