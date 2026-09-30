import type { Miscrit } from '../data/types'
import { RARITY_ORDER } from './miscrit'

const byRarityThenName = (a: Miscrit, b: Miscrit) =>
  RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || a.names[0].localeCompare(b.names[0])

/** region → weekday → miscrits that spawn there only on some days (every-day spawns are left out). */
export function weekMatrix(miscrits: Miscrit[]): Map<string, Map<number, Miscrit[]>> {
  const out = new Map<string, Map<number, Miscrit[]>>()
  for (const m of miscrits) for (const s of m.spawns) {
    if (s.days === 'all') continue
    const days = out.get(s.region) ?? new Map<number, Miscrit[]>()
    for (const d of s.days) {
      const list = days.get(d) ?? []
      if (!list.includes(m)) list.push(m)
      days.set(d, list)
    }
    out.set(s.region, days)
  }
  for (const days of out.values()) for (const list of days.values()) list.sort(byRarityThenName)
  return out
}
