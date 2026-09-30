import type { DayList, Miscrit, Rarity, Region } from '../../src/data/types'

/** Compact dataset for the bot: small enough to parse inside a 10 ms Worker CPU budget. */
export interface BotData {
  v: 1
  miscrits: { id: number; n: string; r: string; e: string; s: [string, string, DayList][] }[]
  zones: Record<string, Record<string, string>>
}

export function buildBotData(miscrits: Miscrit[], regions: Region[]): BotData {
  return {
    v: 1,
    miscrits: miscrits.map(m => ({ id: m.id, n: m.names[0], r: m.rarity, e: m.element, s: m.spawns.map(s => [s.region, s.zone, s.days]) })),
    zones: Object.fromEntries(regions.map(r => [r.name, r.zones])),
  }
}

/** Back to the shapes the shared domain code expects (only the fields the bot uses are filled). */
export function expandBotData(d: BotData): { miscrits: Miscrit[]; regions: Region[] } {
  return {
    miscrits: d.miscrits.map(m => ({
      id: m.id, names: [m.n], rarity: m.r as Rarity, element: m.e,
      spawns: m.s.map(([region, zone, days]) => ({ region, zone, days })),
    }) as unknown as Miscrit),
    regions: Object.entries(d.zones).map(([name, zones]) => ({ name, zones, map: null })),
  }
}
