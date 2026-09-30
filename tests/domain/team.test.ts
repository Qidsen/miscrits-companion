import { expect, test } from 'vitest'
import { controlSummary, decodeTeam, defenseWeakness, encodeTeam, offenseCoverage } from '../../src/domain/team'
import type { Miscrit } from '../../src/data/types'
test('encode/decode with sanitizing', () => {
  const known = new Set([1, 2, 3, 4, 5])
  expect(decodeTeam(encodeTeam([{ id: 1, level: 30 }, { id: 2, level: 35 }]), known)).toEqual([{ id: 1, level: 30 }, { id: 2, level: 35 }])
  expect(decodeTeam('1.30~1.20~99.10~2.80~3~4.5~5.5', known)).toEqual([{ id: 1, level: 30 }, { id: 2, level: 35 }, { id: 3, level: 30 }, { id: 4, level: 5 }])
  expect(decodeTeam('garbage', known)).toEqual([])
})
const m = (id: number, element: string, abilities: { element: string; type: string; ap?: number }[]) => ({ id, element, abilities }) as unknown as Miscrit
const team = [m(1, 'Fire', [{ element: 'Fire', type: 'Attack', ap: 10 }, { element: 'Misc', type: 'Sleep' }]), m(2, 'Water', [{ element: 'Physical', type: 'Attack', ap: 8 }, { element: 'Misc', type: 'Sleep' }, { element: 'Misc', type: 'Sleep' }])]
test('offenseCoverage takes best multiplier', () => {
  const c = offenseCoverage(team)
  expect(c.Nature).toBe(1.5); expect(c.Water).toBe(1); expect(c.Earth).toBe(1)
})
test('defenseWeakness counts members hit hard', () => {
  const w = defenseWeakness(team)
  expect(w.Water).toBe(1)
  expect(w.Nature).toBe(1)
  expect(w.Earth).toBe(0)
})
test('controlSummary counts unique per member', () => { expect(controlSummary(team).Sleep).toBe(2) })
