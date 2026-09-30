import type { DayList, Spawn } from '../data/types'

export const RESET_TZ = 'Europe/Kyiv'
export const RESET_HOUR = 3
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: RESET_TZ, year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', hourCycle: 'h23',
})

/** Kyiv wall-clock date/hour for an instant. */
function kyivWall(date: Date) {
  const p = Object.fromEntries(fmt.formatToParts(date).map(x => [x.type, x.value]))
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour }
}

/** Game weekday (0 = Sunday): Kyiv calendar date, shifted back one day before 03:00. */
export function gameDay(now: Date): number {
  const w = kyivWall(now)
  const dayUtc = Date.UTC(w.y, w.m - 1, w.d) - (w.h < RESET_HOUR ? 86_400_000 : 0)
  return new Date(dayUtc).getUTCDay()
}

/** First instant after `now` where gameDay changes (binary search, 1 s precision). */
export function nextReset(now: Date): Date {
  const start = Math.floor(now.getTime() / 1000) * 1000
  const d0 = gameDay(new Date(start))
  let lo = start
  let hi = start + 27 * 3_600_000
  while (hi - lo > 1000) {
    const mid = lo + Math.floor((hi - lo) / 2000) * 1000
    if (gameDay(new Date(mid)) === d0) lo = mid
    else hi = mid
  }
  return new Date(hi)
}

export function isAvailable(spawns: Spawn[], day: number): boolean {
  return spawns.some(s => s.days === 'all' || s.days.includes(day))
}

export function spawnDays(spawns: Spawn[]): DayList {
  if (spawns.some(s => s.days === 'all')) return 'all'
  const set = new Set<number>()
  for (const s of spawns) for (const d of s.days as number[]) set.add(d)
  return [...set].sort((a, b) => a - b)
}

export function nextAvailableDay(spawns: Spawn[], now: Date): { day: number; inDays: number } | null {
  if (spawns.length === 0) return null
  const today = gameDay(now)
  for (let i = 0; i < 7; i++) {
    const day = (today + i) % 7
    if (isAvailable(spawns, day)) return { day, inDays: i }
  }
  return null
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

export function msUntilReset(now: Date): number {
  return nextReset(now).getTime() - now.getTime()
}

/** Stopwatch format: mm:ss, or h:mm:ss past an hour. */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  const h = Math.floor(s / 3600)
  return h ? `${h}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}
