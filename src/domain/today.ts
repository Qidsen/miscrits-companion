import type { Miscrit } from '../data/types'
import { RARITY_ORDER, sortRegions } from './miscrit'
import { nextReset } from './schedule'

const byRarityThenName = (a: Miscrit, b: Miscrit) =>
  RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || a.names[0].localeCompare(b.names[0])

export function groupAvailable(miscrits: Miscrit[], day: number) {
  const map = new Map<string, Map<string, Miscrit[]>>()
  for (const m of miscrits) for (const s of m.spawns) {
    if (s.days !== 'all' && !s.days.includes(day)) continue
    const zones = map.get(s.region) ?? new Map<string, Miscrit[]>()
    const list = zones.get(s.zone) ?? []
    if (!list.includes(m)) list.push(m)
    zones.set(s.zone, list)
    map.set(s.region, zones)
  }
  return sortRegions([...map.keys()]).map(region => ({
    region,
    zones: [...map.get(region)!.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([zone, list]) => ({ zone, miscrits: [...list].sort(byRarityThenName) })),
  }))
}

export function rareAvailable(miscrits: Miscrit[], day: number): Miscrit[] {
  return miscrits.filter(m => (m.rarity === 'Exotic' || m.rarity === 'Legendary') && m.spawns.some(s => s.days === 'all' || s.days.includes(day)))
    .sort(byRarityThenName)
}

export function exclusiveToday(miscrits: Miscrit[], day: number): Miscrit[] {
  return miscrits.filter(m => m.spawns.length > 0
    && m.spawns.every(s => s.days !== 'all')
    && m.spawns.some(s => s.days !== 'all' && s.days.includes(day))).sort(byRarityThenName)
}

/** Deterministic pick per game day: index from the day number of the next reset instant. */
export function miscritOfTheDay(miscrits: Miscrit[], now: Date): Miscrit {
  const dayIndex = Math.floor(nextReset(now).getTime() / 86_400_000)
  const hash = (dayIndex * 2654435761) >>> 0
  return miscrits[hash % miscrits.length]
}

/** Zones of one region with the miscrits that spawn there on `day` (null = any day). */
export function zoneGroups(miscrits: Miscrit[], region: string, day: number | null): { zone: string; miscrits: Miscrit[] }[] {
  const zones = new Map<string, Miscrit[]>()
  for (const m of miscrits) for (const s of m.spawns) {
    if (s.region !== region) continue
    if (day !== null && s.days !== 'all' && !s.days.includes(day)) continue
    const list = zones.get(s.zone) ?? []
    if (!list.includes(m)) list.push(m)
    zones.set(s.zone, list)
  }
  return [...zones.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([zone, list]) => ({ zone, miscrits: list.sort(byRarityThenName) }))
}
