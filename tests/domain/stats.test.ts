import { expect, test } from 'vitest'
import { statsAt, withRelics } from '../../src/domain/stats'
import { damage } from '../../src/domain/damage'
import type { Ability, Miscrit, Relic } from '../../src/data/types'
const mk = (tiers: Partial<Miscrit['stats']>, element = 'Fire') => ({ element, stats: { hp: 'Weak', spd: 'Weak', ea: 'Weak', pa: 'Weak', ed: 'Weak', pd: 'Weak', ...tiers } }) as unknown as Miscrit
test('statsAt grows with level and tier, capped at 35', () => {
  const weak = statsAt(mk({}), 10), elite = statsAt(mk({ ea: 'Elite' }), 10)
  expect(elite.ea).toBeGreaterThan(weak.ea)
  expect(statsAt(mk({}), 50)).toEqual(statsAt(mk({}), 35))
  expect(statsAt(mk({}), 1).ea).toBe(10)
})
test('withRelics adds numeric stat effects only', () => {
  const s = statsAt(mk({}), 1)
  const r = { effect: { ea: 5, CI: true, hp: -2 } } as unknown as Relic
  expect(withRelics(s, [r])).toMatchObject({ ea: s.ea + 5, hp: s.hp - 2 })
})
const ab = (over: Partial<Ability>): Ability => ({ id: 1, name: 'x', element: 'Fire', type: 'Attack', desc: '', ap: 10, ...over })
const att = { element: 'Fire', stats: statsAt(mk({ ea: 'Max', pa: 'Max' }), 20) }
const defNature = { element: 'Nature', stats: statsAt(mk({}, 'Nature'), 20) }
const defWater = { element: 'Water', stats: statsAt(mk({}, 'Water'), 20) }
test('element advantage increases damage; higher AP increases damage', () => {
  const strong = damage(ab({}), att, defNature)!, weak = damage(ab({}), att, defWater)!
  expect(strong.multiplier).toBe(1.5); expect(weak.multiplier).toBe(0.5)
  expect(strong.avg).toBeGreaterThan(weak.avg)
  expect(damage(ab({ ap: 20 }), att, defNature)!.avg).toBeGreaterThan(strong.avg)
  expect(strong.min).toBeLessThanOrEqual(strong.avg); expect(strong.max).toBeGreaterThanOrEqual(strong.avg)
  expect(strong.hitsToKo).toBe(Math.ceil(defNature.stats.hp / strong.avg))
})
test('non-damaging abilities → null; physical ignores element', () => {
  expect(damage(ab({ type: 'Buff' }), att, defNature)).toBeNull()
  expect(damage(ab({ ap: undefined }), att, defNature)).toBeNull()
  expect(damage(ab({ element: 'Physical' }), att, defWater)!.multiplier).toBe(1)
})
