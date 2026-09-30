import { expect, test } from 'vitest'
import { validateSnapshot } from '../../scripts/sync/validate'
import type { Miscrit, Snapshot } from '../../src/data/types'

const m = (id: number, over: Partial<Miscrit> = {}): Miscrit => ({
  id, names: ['A'], element: 'Fire', rarity: 'Common',
  stats: { hp: 'Weak', spd: 'Weak', ea: 'Weak', pa: 'Weak', ed: 'Weak', pd: 'Weak' },
  abilities: [], descriptions: [], spawns: [], perfectStat: null, attackType: null, relicSet: null, shopInfo: null, ...over,
})
const snap = (n: number, markers = 0): Snapshot => ({
  miscrits: Array.from({ length: n }, (_, i) => m(i + 1)), relics: [], regions: [],
  markers: { Forest: Array.from({ length: markers }, (_, i) => ({ id: `${i}`, region: 'Forest', x: 0, y: 0, name: 'A', miscritId: 1, rarity: 'Common', element: 'Fire', exactImg: null })) },
  warnings: [],
})

test('accepts a sane snapshot', () => { expect(() => validateSnapshot(snap(10, 5), { miscrits: 10, markers: 5 })).not.toThrow() })
test('rejects empty', () => { expect(() => validateSnapshot(snap(0), null)).toThrow(/no miscrits/) })
test('rejects bad rarity', () => {
  const s = snap(1); s.miscrits[0] = m(1, { rarity: 'Mythic' as never })
  expect(() => validateSnapshot(s, null)).toThrow(/rarity/)
})
test('rejects missing names', () => {
  const s = snap(1); s.miscrits[0] = m(1, { names: [] })
  expect(() => validateSnapshot(s, null)).toThrow(/names/)
})
test('rejects >10% drop', () => {
  expect(() => validateSnapshot(snap(89), { miscrits: 100, markers: 0 })).toThrow(/miscrits dropped/)
  expect(() => validateSnapshot(snap(100, 80), { miscrits: 100, markers: 100 })).toThrow(/markers dropped/)
  expect(() => validateSnapshot(snap(90), { miscrits: 100, markers: 0 })).not.toThrow()
})

import { checkRawShape } from '../../scripts/sync/validate'
test('checkRawShape rejects wrong source shapes with a clear message', () => {
  const ok = { game: [], organized: {}, areaNames: {}, relics: [], markers: { Forest: [] } }
  expect(() => checkRawShape(ok)).not.toThrow()
  expect(() => checkRawShape({ ...ok, relics: undefined })).toThrow(/relics/)
  expect(() => checkRawShape({ ...ok, markers: { Forest: undefined } })).toThrow(/markers Forest/)
  expect(() => checkRawShape({ ...ok, game: {} })).toThrow(/game/)
})
