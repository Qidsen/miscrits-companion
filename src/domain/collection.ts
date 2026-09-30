import type { Miscrit } from '../data/types'
import { splitElement } from './miscrit'

const MAX_CODE = 20_000

/** Collection as a bitset (bit i = miscrit id i), base64url without padding — short enough for a link. */
export function encodeIds(ids: number[]): string {
  const valid = ids.filter(id => Number.isInteger(id) && id >= 0)
  if (!valid.length) return ''
  const bytes = new Uint8Array(Math.floor(Math.max(...valid) / 8) + 1)
  for (const id of valid) bytes[id >> 3] |= 1 << (id & 7)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeIds(s: string, maxId = 4096): number[] | null {
  if (s.length > MAX_CODE || !/^[A-Za-z0-9_-]*$/.test(s)) return null
  if (!s) return []
  let bin: string
  try { bin = atob(s.replace(/-/g, '+').replace(/_/g, '/')) } catch { return null }
  const ids: number[] = []
  for (let i = 0; i < bin.length; i++) {
    const b = bin.charCodeAt(i)
    for (let bit = 0; bit < 8; bit++) {
      const id = i * 8 + bit
      if (b & (1 << bit) && id <= maxId) ids.push(id)
    }
  }
  return ids
}

export function parseNameList(text: string, miscrits: Miscrit[]): { ids: number[]; unknown: string[] } {
  const index = new Map<string, number>()
  for (const m of miscrits) for (const n of m.names) index.set(n.toLowerCase(), m.id)
  const ids: number[] = []
  const unknown: string[] = []
  for (const raw of text.split(/[\n,;]+/)) {
    const name = raw.trim()
    if (!name) continue
    const id = index.get(name.toLowerCase())
    if (id === undefined) { if (!unknown.includes(name)) unknown.push(name) }
    else if (!ids.includes(id)) ids.push(id)
  }
  return { ids: ids.sort((a, b) => a - b), unknown }
}

type Tally = Record<string, { total: number; caught: number }>

export function collectionStats(miscrits: Miscrit[], caught: Set<number>) {
  const byElement: Tally = {}
  const byRarity: Tally = {}
  const add = (t: Tally, k: string, has: boolean) => {
    t[k] ??= { total: 0, caught: 0 }
    t[k].total++
    if (has) t[k].caught++
  }
  let n = 0
  for (const m of miscrits) {
    const has = caught.has(m.id)
    if (has) n++
    for (const e of splitElement(m.element)) add(byElement, e, has)
    add(byRarity, m.rarity, has)
  }
  return { total: miscrits.length, caught: n, byElement, byRarity }
}

const numbers = (v: unknown): number[] | null =>
  Array.isArray(v) && v.every(x => typeof x === 'number' && Number.isInteger(x)) ? v : null

export function exportCollection(caught: number[], favorites: number[]): string {
  return JSON.stringify({ version: 1, caught, favorites }, null, 2)
}

export function importCollection(json: string): { caught: number[]; favorites: number[] } | null {
  try {
    const o = JSON.parse(json) as Record<string, unknown>
    const caught = numbers(o?.caught)
    const favorites = o?.favorites === undefined ? [] : numbers(o.favorites)
    return caught && favorites ? { caught, favorites } : null
  } catch { return null }
}
