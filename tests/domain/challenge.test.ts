import { expect, test } from 'vitest'
import { CHALLENGE_SIZE, challengeScore, dailyChallenge, decodeResult, encodeResult, leaderboard } from '../../src/domain/challenge'
import type { Miscrit } from '../../src/data/types'

const pool = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, names: [`S${i}`, `M${i}`, `F${i}`] }) as unknown as Miscrit)

test('same date → identical questions for everyone; other dates differ', () => {
  const a = dailyChallenge(pool, '2026-09-30'), b = dailyChallenge([...pool].reverse(), '2026-09-30')
  expect(a).toEqual(b)
  expect(dailyChallenge(pool, '2026-10-01')).not.toEqual(a)
  expect(a).toHaveLength(CHALLENGE_SIZE)
  expect(a.filter(q => q.kind === 'sil')).toHaveLength(6)
  for (const q of a) expect(new Set(q.options as unknown[]).size).toBe(q.options.length)
  const silAnswers = a.flatMap(q => (q.kind === 'sil' ? [q.answer] : []))
  expect(new Set(silAnswers).size).toBe(silAnswers.length) // no repeated miscrit in one challenge
})
test('score rewards correctness first, then speed', () => {
  expect(challengeScore(10, 60_000)).toBe(1079)
  expect(challengeScore(9, 1000)).toBeLessThan(challengeScore(10, 299_000))
  expect(challengeScore(0, 999_999)).toBe(0)
})
test('result links round-trip and reject tampering', () => {
  const r = { date: '2026-09-30', name: 'Ярик <3', correct: 8, ms: 73_210 }
  const code = encodeResult(r)
  expect(decodeResult(code)).toEqual(r)
  const flipped = code.slice(0, 5) + (code[5] === 'A' ? 'B' : 'A') + code.slice(6)
  expect(decodeResult(flipped)).toBeNull()
  expect(decodeResult('garbage***')).toBeNull()
  expect(decodeResult(encodeResult({ ...r, correct: 11 }))).toBeNull()
  expect(decodeResult(encodeResult({ ...r, name: 'x'.repeat(40) }))!.name).toHaveLength(24)
})
test('leaderboard keeps the best result per name', () => {
  const b = leaderboard([
    { date: 'd', name: 'A', correct: 5, ms: 100_000 }, { date: 'd', name: 'A', correct: 9, ms: 100_000 },
    { date: 'd', name: 'B', correct: 9, ms: 50_000 },
  ])
  expect(b.map(x => [x.name, x.correct])).toEqual([['B', 9], ['A', 9]])
})
