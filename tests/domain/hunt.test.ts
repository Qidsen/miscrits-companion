import { expect, test } from 'vitest'
import { huntToday, huntWeek } from '../../src/domain/hunt'
import type { Miscrit } from '../../src/data/types'
const m = (id: number, name: string, spawns: unknown[]) => ({ id, names: [name], rarity: 'Common', spawns }) as unknown as Miscrit
const byId = new Map([[1, m(1, 'A', [{ region: 'Forest', zone: '1', days: [4] }])], [2, m(2, 'B', [{ region: 'Moon', zone: '1', days: 'all' }])], [3, m(3, 'C', [])]])
test('huntToday groups only hunted miscrits available today', () => {
  expect(huntToday([1, 2, 3], byId, 3).map(g => g.region)).toEqual(['Moon'])
})
test('huntWeek sorts by next availability', () => {
  const w = huntWeek([1, 2, 3, 77], byId, new Date('2026-09-30T12:00:00Z'))
  expect(w.map(x => [x.m.id, x.next?.inDays ?? null])).toEqual([[2, 0], [1, 1], [3, null]])
})
