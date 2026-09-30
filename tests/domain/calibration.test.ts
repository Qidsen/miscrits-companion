import { expect, test } from 'vitest'
import { fitCalibration, predict, type Observation } from '../../src/domain/calibration'
import type { Miscrit } from '../../src/data/types'

const tiers = { hp: 'Strong', spd: 'Moderate', ea: 'Max', pa: 'Strong', ed: 'Moderate', pd: 'Moderate' }
const mc = (id: number, element: string) => ({
  id, element, names: [`M${id}`], stats: tiers,
  abilities: [{ id: 1, name: 'Burn', element: 'Fire', type: 'Attack', ap: 12, desc: '' }, { id: 2, name: 'Bash', element: 'Physical', type: 'Attack', ap: 15, desc: '' }],
}) as unknown as Miscrit
const byId = new Map([[1, mc(1, 'Fire')], [2, mc(2, 'Nature')], [3, mc(3, 'Earth')], [4, mc(4, 'Water')]])

const base: Observation = { attackerId: 1, attackerLevel: 30, abilityId: 1, defenderId: 3, defenderLevel: 25, damage: 0 }
const truth = { damageScale: 0.8, strong: 1.4, weak: 0.6 }
const obs = (): Observation[] => [
  { ...base }, { ...base, defenderLevel: 30 }, { ...base, abilityId: 2 }, { ...base, abilityId: 2, defenderLevel: 10 },
  { ...base, defenderId: 2 }, { ...base, defenderId: 2, defenderLevel: 12 },
  { ...base, defenderId: 4 }, { ...base, defenderId: 4, attackerLevel: 20 },
].map(o => ({ ...o, damage: Math.round(predict(o, byId, truth)!.value) }))

test('recovers scale and element multipliers from observed hits', () => {
  const cal = fitCalibration(obs(), byId)!
  expect(cal.damageScale).toBeCloseTo(0.8, 1)
  expect(cal.strong).toBeCloseTo(1.4, 1)
  expect(cal.weak).toBeCloseTo(0.6, 1)
  expect(cal.n).toBe(8)
  expect(cal.errorAfter).toBeLessThan(cal.errorBefore)
})
test('degenerate input never yields NaN', () => {
  expect(fitCalibration([], byId)).toBeNull()
  const zero = fitCalibration([{ ...base, damage: 0 }], byId)!
  expect(zero.damageScale).toBeGreaterThan(0); expect(zero.n).toBe(0)
  const outlier = fitCalibration([...obs(), { ...base, damage: 100_000 }], byId)!
  expect(outlier.damageScale).toBeCloseTo(0.8, 1)
  expect(predict({ ...base, attackerId: 999 }, byId)).toBeNull()
})
test('attack stat override is used when given', () => {
  const a = predict(base, byId)!.value, b = predict({ ...base, attackStat: 500 }, byId)!.value
  expect(b).toBeGreaterThan(a)
})
