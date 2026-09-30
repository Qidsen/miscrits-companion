import { describe, expect, test } from 'vitest'
import { formatDuration, gameDay, isAvailable, nextAvailableDay, nextReset, spawnDays } from '../../src/domain/schedule'
import type { Spawn } from '../../src/data/types'

const utc = (s: string) => new Date(s)

describe('gameDay (reset 03:00 Kyiv)', () => {
  // 2026-09-30 is Wednesday; Kyiv is UTC+3 (EEST) → reset at 00:00Z
  test('before reset is still previous day', () => {
    expect(gameDay(utc('2026-09-29T23:59:59Z'))).toBe(2) // Kyiv Wed 02:59 → Tue
  })
  test('at reset switches day', () => {
    expect(gameDay(utc('2026-09-30T00:00:00Z'))).toBe(3) // Kyiv Wed 03:00 → Wed
  })
  test('winter time: Kyiv UTC+2 → reset at 01:00Z', () => {
    expect(gameDay(utc('2026-12-02T00:59:59Z'))).toBe(2) // Tue
    expect(gameDay(utc('2026-12-02T01:00:00Z'))).toBe(3) // Wed
  })
  test('independent of viewer timezone (uses absolute instants)', () => {
    expect(gameDay(new Date(Date.UTC(2026, 8, 30, 12)))).toBe(3)
  })
})

describe('nextReset', () => {
  test('summer', () => {
    expect(nextReset(utc('2026-09-30T10:00:00Z')).toISOString()).toBe('2026-10-01T00:00:00.000Z')
  })
  test('just before reset', () => {
    expect(nextReset(utc('2026-09-29T23:59:00Z')).toISOString()).toBe('2026-09-30T00:00:00.000Z')
  })
  test('spring DST day 2026-03-29: 03:00 does not exist, reset at the jump (01:00Z)', () => {
    const r = nextReset(utc('2026-03-28T23:30:00Z'))
    expect(r.toISOString()).toBe('2026-03-29T01:00:00.000Z')
    expect(gameDay(new Date(r.getTime() - 1000))).toBe(6)
    expect(gameDay(r)).toBe(0)
  })
  test('autumn DST day 2026-10-25: reset at first 03:00 (00:00Z)', () => {
    const r = nextReset(utc('2026-10-24T23:30:00Z'))
    expect(r.toISOString()).toBe('2026-10-25T00:00:00.000Z')
    // exactly one reset that day
    expect(nextReset(r).toISOString()).toBe('2026-10-26T01:00:00.000Z')
  })
})

describe('availability', () => {
  const spawns: Spawn[] = [
    { region: 'Forest', zone: '1', days: [0, 1, 4] },
    { region: 'Moon', zone: '2', days: [4, 5] },
  ]
  test('isAvailable', () => {
    expect(isAvailable(spawns, 1)).toBe(true)
    expect(isAvailable(spawns, 2)).toBe(false)
    expect(isAvailable([{ region: 'Cave', zone: '1', days: 'all' }], 2)).toBe(true)
    expect(isAvailable([], 2)).toBe(false)
  })
  test('spawnDays union', () => {
    expect(spawnDays(spawns)).toEqual([0, 1, 4, 5])
    expect(spawnDays([...spawns, { region: 'Cave', zone: '1', days: 'all' }])).toBe('all')
  })
  test('nextAvailableDay', () => {
    // Wed 2026-09-30 12:00Z → game day 3; next is Thu (4), in 1 day
    expect(nextAvailableDay(spawns, utc('2026-09-30T12:00:00Z'))).toEqual({ day: 4, inDays: 1 })
    // Thu → available today
    expect(nextAvailableDay(spawns, utc('2026-10-01T12:00:00Z'))).toEqual({ day: 4, inDays: 0 })
    expect(nextAvailableDay([], utc('2026-10-01T12:00:00Z'))).toBeNull()
  })
})

test('formatDuration', () => {
  expect(formatDuration(3_723_000)).toBe('01:02:03')
  expect(formatDuration(-5)).toBe('00:00:00')
})

import { msUntilReset } from '../../src/domain/schedule'
test('msUntilReset', () => {
  expect(msUntilReset(new Date('2026-09-30T23:00:00Z'))).toBe(3_600_000)
  expect(msUntilReset(new Date('2026-10-01T00:00:00Z'))).toBe(86_400_000)
})
