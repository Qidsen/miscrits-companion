import { expect, test } from 'vitest'
import { mulberry32, shuffle } from '../../src/domain/rng'
import { evolutionQuestion, memoryDeck, memoryFlip, silhouetteQuestion } from '../../src/domain/games'
import type { Miscrit } from '../../src/data/types'
const m = (id: number, names: string[]) => ({ id, names }) as unknown as Miscrit
const pool = Array.from({ length: 10 }, (_, i) => m(i + 1, [`S${i}`, `F${i}`]))
test('rng is deterministic; shuffle keeps elements', () => {
  expect(mulberry32(1)()).toBe(mulberry32(1)())
  expect(shuffle([1, 2, 3, 4], mulberry32(2)).sort()).toEqual([1, 2, 3, 4])
})
test('silhouetteQuestion has n unique options including the answer', () => {
  for (let s = 0; s < 50; s++) {
    const q = silhouetteQuestion(pool, mulberry32(s))!
    expect(q.options).toHaveLength(4)
    expect(new Set(q.options.map(o => o.names[0])).size).toBe(4)
    expect(q.options).toContain(q.answer)
  }
})
test('silhouetteQuestion returns null for tiny pools and duplicate names', () => {
  expect(silhouetteQuestion(pool.slice(0, 3), mulberry32(1))).toBeNull()
  expect(silhouetteQuestion([m(1, ['A']), m(2, ['A']), m(3, ['A']), m(4, ['B'])], mulberry32(1))).toBeNull()
})
test('evolutionQuestion', () => {
  const q = evolutionQuestion(pool, mulberry32(3))!
  expect(q.options).toContain(q.answer)
  expect(q.start.startsWith('S')).toBe(true)
  expect(q.answer).toBe(`F${q.start.slice(1)}`)
  expect(evolutionQuestion([m(1, ['Solo'])], mulberry32(1))).toBeNull()
})
test('memory deck and flip logic', () => {
  const deck = memoryDeck(pool, 3, mulberry32(4))
  expect(deck).toHaveLength(6)
  const [a, b] = deck.filter(c => c.id === deck[0].id)
  const other = deck.find(c => c.id !== a.id)!
  let s = { flipped: [], matched: [], moves: 0 } as { flipped: number[]; matched: number[]; moves: number }
  s = memoryFlip(deck, s, a.key); s = memoryFlip(deck, s, other.key)
  expect(s.moves).toBe(1); expect(s.matched).toEqual([])
  s = memoryFlip(deck, s, a.key)
  expect(s.flipped).toEqual([a.key])
  s = memoryFlip(deck, s, b.key)
  expect(s.matched.sort()).toEqual([a.key, b.key].sort()); expect(s.moves).toBe(2)
  expect(memoryFlip(deck, s, a.key)).toEqual(s)
})
