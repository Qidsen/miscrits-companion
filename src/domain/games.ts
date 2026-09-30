import type { Miscrit } from '../data/types'
import { shuffle } from './rng'

export interface Question { answer: Miscrit; options: Miscrit[] }

const uniqueBy = <T>(list: T[], key: (x: T) => string) => [...new Map(list.map(x => [key(x), x])).values()]

/** "Who's that Miscrit?": n options with distinct display names; null when the pool is too small. */
export function silhouetteQuestion(pool: Miscrit[], rnd: () => number, n = 4): Question | null {
  const distinct = uniqueBy(pool, m => m.names[0])
  if (distinct.length < n) return null
  const [answer, ...rest] = shuffle(distinct, rnd)
  return { answer, options: shuffle([answer, ...rest.slice(0, n - 1)], rnd) }
}

export function evolutionQuestion(pool: Miscrit[], rnd: () => number, n = 4): { start: string; answer: string; options: string[] } | null {
  const lines = uniqueBy(pool.filter(m => m.names.length >= 2 && m.names[0] !== m.names[m.names.length - 1]), m => m.names[m.names.length - 1])
  if (lines.length < n) return null
  const [line, ...rest] = shuffle(lines, rnd)
  const final = (m: Miscrit) => m.names[m.names.length - 1]
  return { start: line.names[0], answer: final(line), options: shuffle([final(line), ...rest.slice(0, n - 1).map(final)], rnd) }
}

export interface MemoryCard { key: number; id: number; name: string }
export interface MemoryState { flipped: number[]; matched: number[]; moves: number }

export function memoryDeck(pool: Miscrit[], pairs: number, rnd: () => number): MemoryCard[] {
  const picked = shuffle(uniqueBy(pool, m => m.names[0]), rnd).slice(0, pairs)
  return shuffle(picked.flatMap(m => [m, m]).map((m, key) => ({ key, id: m.id, name: m.names[0] })), rnd).map((c, key) => ({ ...c, key }))
}

export function memoryFlip(deck: MemoryCard[], s: MemoryState, key: number): MemoryState {
  if (s.matched.includes(key) || !deck.some(c => c.key === key)) return s
  if (s.flipped.length === 2) return { ...s, flipped: [key] }
  if (s.flipped.length === 0) return { ...s, flipped: [key] }
  const [first] = s.flipped
  if (first === key) return s
  const a = deck.find(c => c.key === first)!, b = deck.find(c => c.key === key)!
  const moves = s.moves + 1
  return a.id === b.id ? { flipped: [], matched: [...s.matched, first, key], moves } : { ...s, flipped: [first, key], moves }
}
