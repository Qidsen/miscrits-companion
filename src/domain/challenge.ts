import type { Miscrit } from '../data/types'
import { evolutionQuestion, silhouetteQuestion } from './games'
import { mulberry32 } from './rng'

export const CHALLENGE_SIZE = 10
const SIL = 6
const NAME_MAX = 24
// Not a secret (the site is public) — it only stops casual editing of scores in a link.
const SALT = 'miscrits-companion-challenge-v1'

function fnv(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}

export const daySeed = (date: string) => fnv(`challenge:${date}`)

export type ChallengeQ =
  | { kind: 'sil'; answer: number; options: number[] }
  | { kind: 'evo'; start: string; answer: string; options: string[] }

/** The same 10 questions for everyone on a game date (input order does not matter). */
export function dailyChallenge(miscrits: Miscrit[], date: string): ChallengeQ[] {
  const rnd = mulberry32(daySeed(date))
  const pool = [...miscrits].sort((a, b) => a.id - b.id)
  const used = new Set<number>()
  const out: ChallengeQ[] = []
  for (let i = 0; i < SIL; i++) {
    const q = silhouetteQuestion(pool.filter(m => !used.has(m.id)), rnd)
    if (!q) break
    used.add(q.answer.id)
    out.push({ kind: 'sil', answer: q.answer.id, options: q.options.map(o => o.id) })
  }
  while (out.length < CHALLENGE_SIZE) {
    const q = evolutionQuestion(pool.filter(m => !used.has(m.id)), rnd)
    if (!q) break
    const line = pool.find(m => m.names[0] === q.start)
    if (line) used.add(line.id)
    out.push({ kind: 'evo', ...q })
  }
  return out
}

/** Correct answers always dominate: the speed bonus (max 99, −1 per 3 s) can never outweigh one answer. */
export const challengeScore = (correct: number, ms: number) => correct * 100 + Math.max(0, 99 - Math.floor(ms / 3000))

export interface ChallengeResult { date: string; name: string; correct: number; ms: number }

const toB64u = (s: string) => {
  let bin = ''
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const fromB64u = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, c => c.charCodeAt(0)))
}
const cleanName = (n: string) => [...n.replace(/[|\n\r]/g, ' ').trim()].slice(0, NAME_MAX).join('')

export function encodeResult(r: ChallengeResult): string {
  const payload = [r.date, cleanName(r.name), r.correct, Math.round(r.ms)].join('|')
  return toB64u(`${payload}|${fnv(payload + SALT).toString(36)}`)
}

export function decodeResult(code: string): ChallengeResult | null {
  if (code.length > 400 || !/^[A-Za-z0-9_-]+$/.test(code)) return null
  let text: string
  try { text = fromB64u(code) } catch { return null }
  const parts = text.split('|')
  if (parts.length !== 5) return null
  const [date, name, c, ms, sum] = parts
  if (fnv(parts.slice(0, 4).join('|') + SALT).toString(36) !== sum) return null
  const correct = Number(c), time = Number(ms)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !name || [...name].length > NAME_MAX) return null
  if (!Number.isInteger(correct) || correct < 0 || correct > CHALLENGE_SIZE || !Number.isInteger(time) || time < 0 || time > 86_400_000) return null
  return { date, name, correct, ms: time }
}

export function leaderboard(results: ChallengeResult[]): (ChallengeResult & { score: number })[] {
  const best = new Map<string, ChallengeResult & { score: number }>()
  for (const r of results) {
    const s = { ...r, score: challengeScore(r.correct, r.ms) }
    const cur = best.get(r.name)
    if (!cur || s.score > cur.score) best.set(r.name, s)
  }
  return [...best.values()].sort((a, b) => b.score - a.score || a.ms - b.ms)
}
